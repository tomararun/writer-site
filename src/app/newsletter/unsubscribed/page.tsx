import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";

/** SPEC §5.4 — the unsubscribe result. No guilt screen, no "are you sure". */

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false, follow: false },
};

export default function UnsubscribedPage() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-[44ch] text-center">
        <h1 className="font-display text-[var(--text-2xl)] font-semibold">You&rsquo;re out.</h1>
        <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">
          No more emails. The writing stays free to read whenever you want it — no inbox
          required.
        </p>
        <p className="mt-8">
          <Link
            href="/writing"
            className="font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
          >
            The writing →
          </Link>
        </p>
      </div>
    </Container>
  );
}
