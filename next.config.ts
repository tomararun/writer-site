import type { NextConfig } from "next";

/**
 * §4.7 — `redirect` documents become real next.config redirects at build.
 * Ones added after the build are caught by the middleware fallback until
 * the next deploy. Plain fetch (no src imports — this file compiles outside
 * the app's alias graph); any failure means simply "no CMS redirects yet".
 */
async function fetchCmsRedirects(): Promise<
  { source: string; destination: string; permanent: boolean }[]
> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "development";
  if (!projectId) return [];
  try {
    const query = encodeURIComponent(`*[_type == "redirect"]{from, to, permanent}`);
    const response = await fetch(
      `https://${projectId}.apicdn.sanity.io/v2024-10-01/data/query/${dataset}?query=${query}`,
    );
    if (!response.ok) return [];
    const { result } = (await response.json()) as {
      result: { from?: string; to?: string; permanent?: boolean }[];
    };
    return (result ?? [])
      .filter((doc) => doc.from?.startsWith("/") && doc.to)
      .map((doc) => ({
        source: doc.from!,
        destination: doc.to!,
        permanent: doc.permanent !== false,
      }));
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,

  // §5.6 — images are served from the Sanity CDN via a custom loader (Phase 1).
  // Registered now so Phase 1 has nothing to reconfigure.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return fetchCmsRedirects();
  },

  // §5.8 — security headers. The nonce CSP lives in middleware (Phase 7);
  // these are the static ones that carry no build-order dependency.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        // §5.8 — the Studio never appears in search results.
        source: "/studio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
