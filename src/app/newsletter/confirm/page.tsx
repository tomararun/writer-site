import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import type { SearchParams } from "@/lib/index-params";

/** SPEC §5.4 / §6.12 — the confirm result page. noindex. */

export const metadata: Metadata = {
  title: "Confirmed",
  robots: { index: false, follow: false },
};

const STATES: Record<string, { heading: string; body: string }> = {
  ok: {
    heading: "You're on the list.",
    body: "The next letter lands in your inbox — every other Sunday, one click to leave, forever.",
  },
  expired: {
    heading: "That link has expired.",
    body: "Confirmation links work for 48 hours. Subscribe again below and a fresh one is on its way.",
  },
  invalid: {
    heading: "That link didn't work.",
    body: "It may have been used already, or got mangled by your email client. Subscribing again fixes it in one step.",
  },
};

export default async function ConfirmResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const stateParam = Array.isArray(params.state) ? params.state[0] : params.state;
  const state = STATES[stateParam ?? ""] ?? STATES.invalid!;

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-[44ch] text-center">
        <h1 className="font-display text-[var(--text-2xl)] font-semibold">{state.heading}</h1>
        <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">{state.body}</p>
        <p className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link
            href="/newsletter"
            className="font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
          >
            The newsletter →
          </Link>
          <Link
            href="/writing"
            className="font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
          >
            Read something meanwhile →
          </Link>
        </p>
      </div>
    </Container>
  );
}
