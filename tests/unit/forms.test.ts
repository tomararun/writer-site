import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors, subscribeSchema } from "@/lib/validators";
import {
  confirmExpiry,
  hashIp,
  isExpired,
  newToken,
  requestIp,
  userAgentFamily,
} from "@/lib/form-security";

describe("subscribeSchema", () => {
  it("accepts a normal subscription", () => {
    const result = subscribeSchema.safeParse({
      email: "reader@example.com",
      source: "post:the-66-character-rule",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing or malformed email with the §6.11 copy", () => {
    const missing = subscribeSchema.safeParse({ email: "", website: "" });
    expect(missing.success).toBe(false);
    expect(fieldErrors(missing.error!).email).toBe("Add your email so I can reply.");
    const malformed = subscribeSchema.safeParse({ email: "not-an-email", website: "" });
    expect(malformed.success).toBe(false);
  });

  it("flags a filled honeypot", () => {
    const bot = subscribeSchema.safeParse({ email: "a@b.co", website: "http://spam" });
    expect(bot.success).toBe(false);
    expect(fieldErrors(bot.error!).website).toBeDefined();
  });

  it("defaults and validates source", () => {
    const parsed = subscribeSchema.parse({ email: "a@b.co", website: "" });
    expect(parsed.source).toBe("newsletter-page");
    expect(subscribeSchema.safeParse({ email: "a@b.co", source: "<img>" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Alex",
    email: "alex@example.com",
    topic: "collaboration",
    message: "I am building a reading app and would like help with typography.",
    website: "",
  };

  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("enforces the §6.11 message minimum with its exact copy", () => {
    const short = contactSchema.safeParse({ ...valid, message: "hi" });
    expect(short.success).toBe(false);
    expect(fieldErrors(short.error!).message).toBe(
      "Your message needs a bit more detail — 20 characters minimum.",
    );
  });

  it("bounds name length and topic enum", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, topic: "sales" }).success).toBe(false);
  });
});

describe("form-security", () => {
  it("hashes IPs deterministically with the salt, never storing the raw value", () => {
    const a = hashIp("203.0.113.9", "salt-1");
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).toBe(hashIp("203.0.113.9", "salt-1"));
    expect(a).not.toBe(hashIp("203.0.113.9", "salt-2"));
    expect(a).not.toContain("203");
  });

  it("takes the first forwarded hop", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(requestIp(headers)).toBe("203.0.113.9");
    expect(requestIp(new Headers())).toBe("unknown");
  });

  it("reduces user agents to a family", () => {
    expect(
      userAgentFamily(new Headers({ "user-agent": "Mozilla/5.0 ... Chrome/126.0 Safari/537" })),
    ).toBe("Chrome");
    expect(userAgentFamily(new Headers())).toBeNull();
  });

  it("generates unique hex tokens and 48h expiries", () => {
    const token = newToken();
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(token).not.toBe(newToken());

    const from = new Date("2026-01-01T00:00:00Z");
    const expiry = confirmExpiry(from);
    expect(expiry.toISOString()).toBe("2026-01-03T00:00:00.000Z");
    expect(isExpired(expiry, new Date("2026-01-02T00:00:00Z"))).toBe(false);
    expect(isExpired(expiry, new Date("2026-01-04T00:00:00Z"))).toBe(true);
    expect(isExpired(null)).toBe(true);
  });
});
