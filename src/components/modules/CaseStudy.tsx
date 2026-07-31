import Link from "next/link";
import { Figure, type FigureValue } from "@/components/content/Figure";
import { formatTimeframe } from "@/lib/format";
import type { CaseStudySection } from "@/lib/case-study-sections";

/**
 * SPEC §6.6 — the case study's own furniture: hero, at-a-glance <dl>,
 * numbered section wrapper, metrics band, learnings groups, testimonial and
 * the closing CTA. The page composes these in the 14-section order.
 */

export function CaseStudyHero({
  title,
  outcome,
  client,
  year,
  role,
  stack,
  heroMedia,
}: {
  title: string;
  /** §6.6 — the one-line outcome; the excerpt carries it. */
  outcome?: string | null;
  client?: string | null;
  year?: string | null;
  role?: string[] | null;
  stack?: string[] | null;
  heroMedia?: FigureValue | null;
}) {
  const facts = [client, year, ...(role ?? [])].filter(Boolean);
  return (
    <header>
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        Case study{facts.length > 0 ? ` · ${facts.join(" · ")}` : null}
      </p>
      <h1 className="mt-4 max-w-[24ch] font-display text-[var(--text-2xl)] font-semibold">
        {title}
      </h1>
      {outcome ? (
        <p className="mt-5 max-w-[52ch] text-[var(--text-md)] leading-snug text-ink-muted">
          {outcome}
        </p>
      ) : null}
      {stack?.length ? (
        <p className="mt-4 font-mono text-[var(--text-2xs)] text-ink-muted">
          {stack.join(" · ")}
        </p>
      ) : null}
      {heroMedia?.asset ? (
        <div className="mt-10">
          <Figure value={{ ...heroMedia, layout: heroMedia.layout ?? "wide" }} />
        </div>
      ) : null}
    </header>
  );
}

/** §6.6 §2 — "At a glance": a real <dl>. */
export function AtAGlance({
  role,
  timeframe,
  stack,
  links,
}: {
  role?: string[] | null;
  timeframe?: { start?: string | null; end?: string | null; ongoing?: boolean | null } | null;
  stack?: string[] | null;
  links?: { label?: string | null; href?: string | null }[] | null;
}) {
  const timeframeLabel = formatTimeframe(timeframe);
  const usableLinks = (links ?? []).filter((link) => link.href && link.label);
  const rows: { label: string; value: React.ReactNode }[] = [
    ...(role?.length ? [{ label: "Role", value: role.join(", ") }] : []),
    ...(timeframeLabel ? [{ label: "Timeframe", value: timeframeLabel }] : []),
    ...(stack?.length ? [{ label: "Stack", value: stack.join(", ") }] : []),
    ...(usableLinks.length
      ? [
          {
            label: "Links",
            value: (
              <span className="flex flex-wrap gap-x-4 gap-y-1">
                {usableLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href!}
                    rel="noopener"
                    target="_blank"
                    className="text-accent no-underline"
                  >
                    {link.label} ↗<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </span>
            ),
          },
        ]
      : []),
  ];
  if (rows.length === 0) return null;

  return (
    <section aria-label="At a glance" className="mt-12 border-y border-rule py-6">
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <dt className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
              {row.label}
            </dt>
            <dd className="text-[var(--text-sm)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** §6.6 §3 — numbered eyebrow + deep-linkable anchor around each section. */
export function NumberedSection({
  section,
  children,
}: {
  section: CaseStudySection;
  children: React.ReactNode;
}) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className="mt-16 scroll-mt-28"
    >
      <h2
        id={`${section.id}-heading`}
        className="border-t border-rule pt-4 font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
      >
        {section.eyebrow}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export type MetricEntry = {
  label?: string | null;
  value?: string | null;
  delta?: string | null;
  unit?: string | null;
  note?: string | null;
  source?: string | null;
};

/**
 * §6.6 §9 — the metrics band: full-bleed on --surface, each metric a
 * <dt>/<dd> pair so the number is never orphaned from its label; numbers in
 * real text at display size (never below 34px → --text-2xl); source as a
 * footnote per metric.
 */
export function MetricsBand({ metrics }: { metrics: MetricEntry[] }) {
  const usable = metrics.filter((metric) => metric.label && metric.value);
  if (usable.length === 0) return null;

  return (
    <div className="bg-surface px-6 py-8 sm:px-8">
      <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {usable.map((metric) => (
          <div key={metric.label}>
            <dt className="text-[var(--text-sm)] text-ink">{metric.label}</dt>
            <dd className="mt-2">
              <span className="font-mono text-[var(--text-2xl)] font-semibold leading-none">
                {metric.value}
              </span>
              {metric.unit ? (
                <span className="ml-1 font-mono text-[var(--text-sm)] text-ink-muted">
                  {metric.unit}
                </span>
              ) : null}
              {metric.delta ? (
                <span className="ml-2 font-mono text-[var(--text-sm)] text-accent">
                  {metric.delta}
                </span>
              ) : null}
              {metric.note ? (
                <span className="mt-2 block text-[var(--text-xs)] text-ink-muted">
                  {metric.note}
                </span>
              ) : null}
              {metric.source ? (
                <span className="mt-1 block font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                  {metric.source}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type LearningEntry = {
  title?: string | null;
  body?: string | null;
  sentiment?: string | null;
};

/**
 * §6.6 §10 — learnings grouped by sentiment. Differentiated by heading text
 * plus a shape glyph — never colour alone.
 */
const LEARNING_GROUPS: { sentiment: string; heading: string; shape: string }[] = [
  { sentiment: "worked", heading: "What worked", shape: "●" },
  { sentiment: "didntWork", heading: "What didn't", shape: "✕" },
  { sentiment: "wouldChange", heading: "What I'd do differently", shape: "◆" },
];

export function LearningsGroups({ learnings }: { learnings: LearningEntry[] }) {
  const groups = LEARNING_GROUPS.map((group) => ({
    ...group,
    items: learnings.filter((l) => l.sentiment === group.sentiment && l.title),
  })).filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {groups.map((group) => (
        <section key={group.sentiment} aria-label={group.heading}>
          <h3 className="font-display text-[var(--text-sm)] font-semibold">
            <span aria-hidden="true" className="mr-2 font-mono text-ink-muted">
              {group.shape}
            </span>
            {group.heading}
          </h3>
          <ul className="mt-4 space-y-4">
            {group.items.map((item) => (
              <li key={item.title} className="border-t border-rule pt-3">
                <p className="text-[var(--text-sm)] font-medium">{item.title}</p>
                {item.body ? (
                  <p className="mt-1 text-[var(--text-xs)] leading-relaxed text-ink-muted">
                    {item.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function TestimonialBlock({
  testimonial,
}: {
  testimonial?: { quote?: string | null; name?: string | null; role?: string | null } | null;
}) {
  if (!testimonial?.quote || !testimonial.name) return null;
  return (
    <figure className="mt-16 border-l-2 border-accent bg-surface p-6 sm:p-8">
      <blockquote className="max-w-[52ch] text-[var(--text-md)] italic leading-snug">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-4 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {testimonial.name}
        {testimonial.role ? ` · ${testimonial.role}` : null}
      </figcaption>
    </figure>
  );
}

/** §6.6 §14 — the closing CTA, honest about capacity. */
export function ContactCTA() {
  return (
    <aside className="mt-16 border-t border-rule pt-8">
      <p className="max-w-[40ch] font-display text-[var(--text-lg)] font-semibold">
        I take on this kind of work a few times a year.
      </p>
      <Link
        href="/contact"
        className="mt-3 inline-block font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
      >
        Get in touch →
      </Link>
    </aside>
  );
}
