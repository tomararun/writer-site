import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { FocusHeading } from "@/components/modules/FocusHeading";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/sanity/lib/fetch";
import { homeQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.14 — the 404. No illustration, no "oops"; its one job is getting
 * the reader to content in one click. Next's not-found.tsx returns a real
 * HTTP 404. The h1 carries the human message (the number is aria-hidden)
 * and receives focus on mount so screen readers hear what happened.
 */

export const metadata: Metadata = {
  title: "That page isn't here",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const recent = await sanityFetch({
    query: homeQuery,
    tags: ["post"],
  })
    .then((data) => data.latestPosts.slice(0, 3))
    .catch(() => []);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-[52ch]">
        <p
          aria-hidden="true"
          className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
        >
          404
        </p>
        <FocusHeading className="mt-3 font-display text-[var(--text-2xl)] font-semibold">
          That page isn&rsquo;t here.
        </FocusHeading>
        <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">
          It may have moved, or the link may be wrong. Two things usually work:
        </p>

        {/* Search: a plain GET form — works without JavaScript. */}
        <form role="search" action="/search" method="get" className="mt-8">
          <label
            htmlFor="notfound-search"
            className="mb-1 block font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
          >
            Search for what you were after
          </label>
          <input
            id="notfound-search"
            name="q"
            type="search"
            placeholder="Search essays, case studies and journal entries…"
            className="w-full min-h-11 rounded-[var(--radius-xs)] border border-rule bg-paper px-3 text-[var(--text-sm)] text-ink"
          />
        </form>

        {recent.length > 0 ? (
          <div className="mt-10">
            <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
              Or read something recent
            </h2>
            <ol className="mt-2">
              {recent.map((post) => (
                <li key={post._id} className="group relative">
                  <div className="flex flex-wrap items-baseline gap-x-3 border-t border-rule py-3">
                    <span className="shrink-0 font-mono text-[var(--text-2xs)] text-ink-muted">
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="min-w-0 flex-1 font-display text-[var(--text-sm)] font-medium">
                      <Link
                        href={`/writing/${post.slug}`}
                        className="no-underline after:absolute after:inset-0"
                      >
                        <span className="card-rule">{post.title}</span>
                      </Link>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <p className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-rule pt-5">
          {[
            { label: "Writing", href: "/writing" },
            { label: "Case studies", href: "/case-studies" },
            { label: "Journal", href: "/journal" },
            { label: "Archive", href: "/archive" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
            >
              {link.label}
            </Link>
          ))}
        </p>

        <p className="mt-6 text-[var(--text-xs)] text-ink-muted">
          If a link on this site sent you here,{" "}
          <a href={`mailto:${site.email}`} className="text-accent">
            tell me
          </a>{" "}
          — I&rsquo;d like to fix it.
        </p>
      </div>
    </Container>
  );
}
