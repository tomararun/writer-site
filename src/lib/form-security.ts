import { createHash, randomBytes } from "node:crypto";

/**
 * SPEC §5.8 / P6 — the small primitives every form handler shares.
 * Raw IPs are never stored: only sha256(ip + IP_HASH_SALT).
 */

export function hashIp(ip: string, salt: string = process.env.IP_HASH_SALT ?? ""): string {
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex");
}

/** First hop of x-forwarded-for, or a stable placeholder. */
export function requestIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Browser family only — enough for the §5.2 column, nothing fingerprintable. */
export function userAgentFamily(headers: Headers): string | null {
  const ua = headers.get("user-agent") ?? "";
  if (!ua) return null;
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}

export function newToken(): string {
  return randomBytes(24).toString("hex");
}

export const CONFIRM_TOKEN_TTL_HOURS = 48;

export function confirmExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + CONFIRM_TOKEN_TTL_HOURS * 60 * 60 * 1000);
}

export function isExpired(expiresAt: Date | null | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < now.getTime();
}
