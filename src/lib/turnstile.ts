/**
 * SPEC §5.8 — Cloudflare Turnstile, server-side verification. The widget is
 * the non-interactive variant; the documented fallback (§6.11) is that when
 * no keys are configured the check is skipped — honeypot and rate limits
 * still stand — so local dev and the pre-credentials deploy keep working.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: "unconfigured" };
  if (!token) return { ok: false, reason: "missing-token" };

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, reason: "failed" };
  } catch (error) {
    console.error("Turnstile verification errored (rejecting):", error);
    return { ok: false, reason: "error" };
  }
}
