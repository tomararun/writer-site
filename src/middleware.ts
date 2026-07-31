import { NextResponse, type NextRequest } from "next/server";
import { themeScript } from "@/lib/theme-script";

/**
 * SPEC §5.8 / §4.7 — two jobs:
 *
 * 1. A nonce-based CSP (no unsafe-inline for scripts). Next.js reads the
 *    nonce from the request's CSP header and applies it to its own scripts —
 *    which forces dynamic rendering, so the policy is gated behind
 *    ENABLE_CSP=true: the §4.3 static-first default stands until the owner
 *    flips it in production (tradeoff documented in PHASE-7-NOTES). The one
 *    deliberate inline script (the theme bootstrap) is allowed by hash, not
 *    nonce, so the layout never needs request data.
 *
 * 2. The redirect fallback for `redirect` documents created after the last
 *    build (build-time ones live in next.config). The list is fetched from
 *    the Sanity CDN and cached in-memory for 60s per edge isolate.
 */

const CSP_ENABLED = process.env.ENABLE_CSP === "true";

/* ── Theme-script hash (computed once per isolate) ────────────────────── */

let themeScriptHashPromise: Promise<string> | null = null;

function themeScriptHash(): Promise<string> {
  themeScriptHashPromise ??= (async () => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(themeScript));
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return `'sha256-${base64}'`;
  })();
  return themeScriptHashPromise;
}

function buildCsp(nonce: string, scriptHash: string): string {
  return [
    `default-src 'self'`,
    // Plausible + Turnstile are the only third-party scripts (§5.8).
    `script-src 'self' 'nonce-${nonce}' ${scriptHash} https://plausible.io https://challenges.cloudflare.com https://va.vercel-scripts.com`,
    // Inline styles: styled-jsx/next inject them; hashes are impractical here.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https://cdn.sanity.io data:`,
    `font-src 'self'`,
    `connect-src 'self' https://plausible.io https://*.sanity.io wss://*.sanity.io`,
    `frame-src https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

/* ── Redirect fallback ────────────────────────────────────────────────── */

type CmsRedirect = { from?: string; to?: string; permanent?: boolean };

let redirectCache: { at: number; map: Map<string, { to: string; permanent: boolean }> } | null =
  null;

async function lookupRedirect(pathname: string) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return null;

  if (!redirectCache || Date.now() - redirectCache.at > 60_000) {
    try {
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "development";
      const query = encodeURIComponent(`*[_type == "redirect"]{from, to, permanent}`);
      const response = await fetch(
        `https://${projectId}.apicdn.sanity.io/v2024-10-01/data/query/${dataset}?query=${query}`,
      );
      if (!response.ok) return redirectCache?.map.get(pathname) ?? null;
      const { result } = (await response.json()) as { result: CmsRedirect[] };
      const map = new Map<string, { to: string; permanent: boolean }>();
      for (const doc of result ?? []) {
        if (doc.from?.startsWith("/") && doc.to) {
          map.set(doc.from, { to: doc.to, permanent: doc.permanent !== false });
        }
      }
      redirectCache = { at: Date.now(), map };
    } catch {
      // Network hiccup: serve from the stale cache if there is one.
    }
  }
  return redirectCache?.map.get(pathname) ?? null;
}

/* ── The middleware ───────────────────────────────────────────────────── */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Redirect fallback (GET page navigations only). */
  if (request.method === "GET") {
    const target = await lookupRedirect(pathname);
    if (target) {
      const destination = target.to.startsWith("/")
        ? new URL(target.to, request.url)
        : new URL(target.to);
      return NextResponse.redirect(destination, target.permanent ? 308 : 307);
    }
  }

  /* Nonce CSP — pages only, never the Studio (it needs its own world). */
  if (!CSP_ENABLED || pathname.startsWith("/studio")) {
    return NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, await themeScriptHash());

  const requestHeaders = new Headers(request.headers);
  // Next reads the nonce from this header and applies it to its scripts.
  requestHeaders.set("content-security-policy", csp);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Pages only: skip Next internals, static files (anything with a dot —
  // rss.xml, llms.txt, images) and the API.
  matcher: ["/((?!_next/static|_next/image|api/|.*\\..*).*)"],
};
