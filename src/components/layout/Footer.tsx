import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { SubscribeForm } from "@/components/modules/SubscribeForm";
import { colophon, site } from "@/site.config";

/**
 * SPEC §6.0 — four columns at lg, stacked at sm.
 * 1) name + description + subscribe  2) content  3) elsewhere  4) meta
 *
 * The subscribe field here is a placeholder until P6 builds the real
 * SubscribeForm with its three variants. It is rendered as a link rather than a
 * dead input, because a non-functional text field is a worse lie than a link.
 */
const contentLinks = [
  { label: "Writing", href: "/writing" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Journal", href: "/journal" },
  { label: "Projects", href: "/projects" },
  { label: "Newsletter", href: "/newsletter" },
];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LinkList({ items }: { items: ReadonlyArray<{ label: string; href: string }> }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-[var(--text-sm)] text-ink-muted no-underline transition-colors hover:text-ink"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="font-display text-[var(--text-sm)] font-semibold">{site.name}</p>
            <p className="mt-3 max-w-[28ch] text-[var(--text-sm)] leading-snug text-ink-muted">
              {site.newsletter.pitch}
            </p>
            {/* §6.12 — the footer variant of the real double-opt-in form (Phase 5). */}
            <div className="mt-4 max-w-xs">
              <SubscribeForm source="footer" variant="footer" />
            </div>
          </div>

          <Column title="Read">
            <LinkList items={contentLinks} />
          </Column>

          <Column title="Elsewhere">
            <ul className="space-y-2">
              {site.social.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[var(--text-sm)] text-ink-muted no-underline transition-colors hover:text-ink"
                    {...(item.href.startsWith("http")
                      ? { rel: "me noopener", target: "_blank" }
                      : {})}
                  >
                    {item.label}
                    {item.href.startsWith("http") ? (
                      <span className="sr-only"> (opens in a new tab)</span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="This site">
            <LinkList items={site.meta} />
          </Column>
        </div>

        <p className="mt-14 border-t border-rule pt-6 font-mono text-[var(--text-2xs)] leading-relaxed text-ink-muted">
          © {new Date().getFullYear()} {site.name} · Built with care in {site.location} · Set in{" "}
          {colophon.body} &amp; {colophon.display}
        </p>
      </Container>
    </footer>
  );
}
