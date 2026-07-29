import Link from "next/link";
import { PortableText } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";
import { formatDate, isoDate } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * SPEC §6.4 — the small post-body sections, in spec order: update note,
 * tags, author strip, series nav, related, subscribe, prev/next. Each is its
 * own component; the page composes them.
 */

export function UpdateNote({
  updatedAt,
  revisionNote,
}: {
  updatedAt?: string | null;
  revisionNote?: string | null;
}) {
  if (!updatedAt || !revisionNote) return null;
  return (
    <aside
      data-variant="update"
      className="mt-12 border border-accent bg-surface p-5 text-[var(--text-sm)]"
    >
      <p>
        <span className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          Updated <time dateTime={isoDate(updatedAt)}>{formatDate(updatedAt)}</time>
        </span>{" "}
        — {revisionNote}
      </p>
    </aside>
  );
}

export function TagList({
  tags,
  basePath = "/writing/tag",
  label = "Filed under",
}: {
  tags: { title: string | null; slug: string | null }[] | null | undefined;
  basePath?: string;
  label?: string;
}) {
  const usable = (tags ?? []).filter((tag) => tag.title && tag.slug);
  if (usable.length === 0) return null;
  return (
    <div className="mt-12 flex flex-wrap items-baseline gap-x-3 gap-y-2">
      <span className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {label}
      </span>
      {usable.map((tag) => (
        <Link
          key={tag.slug}
          href={`${basePath}/${tag.slug}`}
          className="rounded-[var(--radius-xs)] border border-rule px-2 py-0.5 font-mono text-[var(--text-2xs)] text-ink-muted no-underline transition-colors hover:border-accent hover:text-accent"
        >
          {tag.title}
        </Link>
      ))}
    </div>
  );
}

export function AuthorStrip({
  name,
  bio,
}: {
  name?: string | null;
  bio?: PortableTextBlock[] | null;
}) {
  if (!name) return null;
  return (
    <aside className="mt-12 border-t border-rule pt-6">
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        About the author
      </p>
      <div className="mt-3 max-w-[60ch] text-[var(--text-sm)] leading-relaxed text-ink-muted [&_p]:inline">
        <span className="font-display font-semibold text-ink">{name}</span>{" "}
        {bio ? <PortableText value={bio} /> : null}{" "}
        <Link href="/about" className="whitespace-nowrap text-accent no-underline">
          More about me →
        </Link>
      </div>
    </aside>
  );
}

export type SeriesInfo = {
  order?: number | null;
  series?: {
    title: string | null;
    slug: string | null;
    posts?: { title: string | null; slug: string | null; order?: number | null }[] | null;
  } | null;
};

export function SeriesNav({
  series,
  currentSlug,
}: {
  series?: SeriesInfo | null;
  currentSlug: string;
}) {
  const info = series?.series;
  const posts = (info?.posts ?? []).filter((p) => p.slug && p.title);
  if (!info?.title || posts.length < 2) return null;

  const index = posts.findIndex((p) => p.slug === currentSlug);
  const previous = index > 0 ? posts[index - 1] : null;
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;

  return (
    <nav aria-label="Series" className="mt-12 border border-rule bg-surface p-5">
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        Part {index + 1} of {posts.length} in “{info.title}”
      </p>
      <div className="mt-3 flex flex-col gap-2 text-[var(--text-sm)] sm:flex-row sm:justify-between">
        {previous ? (
          <Link
            href={`/writing/${previous.slug}`}
            className="no-underline text-ink transition-colors hover:text-accent"
          >
            ← Previous: {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/writing/${next.slug}`}
            className="no-underline text-ink transition-colors hover:text-accent sm:text-right"
          >
            Next: {next.title} →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export type RelatedItem = {
  _id: string;
  title: string | null;
  slug: string | null;
  kind?: string | null;
  excerpt?: string | null;
  readingTime?: number | null;
};

export function RelatedGrid({
  items,
  heading = "If you liked this",
  basePath = "/writing",
}: {
  items: RelatedItem[];
  heading?: string;
  basePath?: string;
}) {
  const usable = items.filter((item) => item.slug && item.title);
  if (usable.length === 0) return null;
  return (
    <aside className="mt-14">
      <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {heading}
      </h2>
      <ul className="mt-4 grid gap-6 sm:grid-cols-3">
        {usable.map((item) => (
          <li key={item._id}>
            <Link
              href={`${basePath}/${item.slug}`}
              className="card-link group block no-underline"
            >
              <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                {[item.kind, item.readingTime ? `${item.readingTime} min` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="card-rule mt-2 font-display text-[var(--text-sm)] font-semibold">
                {item.title}
              </p>
              {item.excerpt ? (
                <p className="mt-2 text-[var(--text-xs)] leading-relaxed text-ink-muted">
                  {item.excerpt}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function SubscribeBlock() {
  return (
    <aside className="mt-14 border-t border-rule pt-6">
      <p className="font-display text-[var(--text-md)] font-semibold">
        Get the next one by email.
      </p>
      <Link
        href="/newsletter"
        className="mt-2 inline-block font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
      >
        Subscribe →
      </Link>
    </aside>
  );
}

export function PrevNext({
  previous,
  next,
  labels = { previous: "Older", next: "Newer" },
  basePath = "/writing",
}: {
  previous?: { title: string | null; slug: string | null } | null;
  next?: { title: string | null; slug: string | null } | null;
  labels?: { previous: string; next: string };
  basePath?: string;
}) {
  if (!previous?.slug && !next?.slug) return null;
  const itemClass = "group block min-w-0 no-underline";
  return (
    <nav
      aria-label="More writing"
      className="mt-14 grid gap-6 border-t border-rule pt-6 sm:grid-cols-2"
    >
      {previous?.slug ? (
        <Link href={`${basePath}/${previous.slug}`} className={itemClass}>
          <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
            ← {labels.previous}
          </p>
          <p className="card-rule mt-1 font-display text-[var(--text-sm)] font-semibold">
            {previous.title}
          </p>
        </Link>
      ) : (
        <span />
      )}
      {next?.slug ? (
        <Link href={`${basePath}/${next.slug}`} className={cn(itemClass, "sm:text-right")}>
          <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
            {labels.next} →
          </p>
          <p className="card-rule mt-1 font-display text-[var(--text-sm)] font-semibold">
            {next.title}
          </p>
        </Link>
      ) : null}
    </nav>
  );
}

export function ArchivedNotice() {
  return (
    <aside className="mb-10 border border-rule bg-surface p-4 text-[var(--text-sm)] text-ink-muted">
      <p>
        <span className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)]">
          Archived
        </span>{" "}
        — this is an old piece I no longer fully agree with. It stays online because links
        should keep working.
      </p>
    </aside>
  );
}
