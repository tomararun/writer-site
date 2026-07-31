import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * SPEC §5.4 — sliding-window rate limits per hashed IP:
 * subscribe 5/10min · contact 3/hr · confirm 20/hr.
 *
 * Without Upstash credentials (local dev, CI) limits are OPEN and a warning
 * is logged once — forms stay testable, and production deploys are expected
 * to set the env (documented in PHASE-5-NOTES).
 */

type LimiterName = "subscribe" | "contact" | "confirm";

const WINDOWS: Record<LimiterName, { limit: number; window: `${number} ${"s" | "m" | "h"}` }> =
  {
    subscribe: { limit: 5, window: "10 m" },
    contact: { limit: 3, window: "1 h" },
    confirm: { limit: 20, window: "1 h" },
  };

let warned = false;
const limiters = new Map<LimiterName, Ratelimit>();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!warned) {
      console.warn("Upstash env not set — rate limits are OPEN (dev mode).");
      warned = true;
    }
    return null;
  }
  let limiter = limiters.get(name);
  if (!limiter) {
    const config = WINDOWS[name];
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(config.limit, config.window),
      prefix: `writer-site:${name}`,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

/** True = allowed to proceed. */
export async function checkRateLimit(name: LimiterName, key: string): Promise<boolean> {
  const limiter = getLimiter(name);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (error) {
    // A broken limiter must not take the forms down with it.
    console.error("Rate limit check failed (allowing request):", error);
    return true;
  }
}
