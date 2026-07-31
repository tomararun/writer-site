import Link from "next/link";

/**
 * The small shared chrome of every index page: header with promise,
 * section headers with eyebrow + link (§6.1), and the designed empty state
 * with two escape routes (P4).
 */

export function PageHeader({ title, promise }: { title: string; promise?: React.ReactNode }) {
  return (
    <header className="max-w-[60ch]">
      <h1 className="font-display text-[var(--text-3xl)] font-semibold">{title}</h1>
      {promise ? (
        <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">{promise}</p>
      ) : null}
    </header>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  link,
}: {
  id: string;
  eyebrow: string;
  link?: { label: string; href: string };
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-4">
      <h2
        id={id}
        className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
      >
        {eyebrow}
      </h2>
      {link ? (
        <Link
          href={link.href}
          className="shrink-0 font-display text-[var(--text-xs)] font-semibold text-accent no-underline"
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

/** P4 — "every index has a designed empty state with two escape routes". */
export function EmptyState({
  message,
  routes,
}: {
  message: string;
  routes: [{ label: string; href: string }, { label: string; href: string }];
}) {
  return (
    <div className="border border-rule bg-surface p-8 text-center">
      <p className="text-[var(--text-md)] leading-snug text-ink-muted">{message}</p>
      <p className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="font-display text-[var(--text-sm)] font-semibold text-accent no-underline"
          >
            {route.label} →
          </Link>
        ))}
      </p>
    </div>
  );
}
