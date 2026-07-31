/**
 * SPEC §5.7 — server-side error reporting to Sentry, sampled, with zero
 * client JavaScript (the browser SDK would blow the §1.8 article budget; if
 * client errors are ever wanted, swap in @sentry/nextjs and re-measure).
 *
 * Hand-rolled envelope POST: no dependency, inert without SENTRY_DSN.
 */

const SAMPLE_RATE = 0.5;

export function register(): void {
  // Nothing to initialise — onRequestError below is the whole integration.
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || Math.random() > SAMPLE_RATE) return;

  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace("/", "");
    const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/?sentry_key=${parsed.username}`;

    const err = error instanceof Error ? error : new Error(String(error));
    const event = {
      timestamp: Date.now() / 1000,
      platform: "node",
      level: "error",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      exception: {
        values: [
          {
            type: err.name,
            value: err.message,
            stacktrace: err.stack
              ? { frames: [{ filename: err.stack.split("\n")[1]?.trim() ?? "unknown" }] }
              : undefined,
          },
        ],
      },
      tags: {
        route: context.routePath,
        routerKind: context.routerKind,
        routeType: context.routeType,
        method: request.method,
      },
      request: { url: request.path },
    };

    const envelope = [
      JSON.stringify({ sent_at: new Date().toISOString() }),
      JSON.stringify({ type: "event" }),
      JSON.stringify(event),
    ].join("\n");

    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope" },
      body: envelope,
    });
  } catch {
    // The error reporter must never throw.
  }
}
