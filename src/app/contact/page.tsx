import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { ContactForm } from "@/components/modules/ContactForm";
import { PageHeader } from "@/components/modules/IndexChrome";
import { site } from "@/site.config";

/**
 * SPEC §6.11 — two columns at ≥lg: the form left (60%), context right.
 * Below lg the collaboration note moves ABOVE the form — it saves both
 * sides time. Deliberately calm; no map, no stock photo.
 */

export const metadata: Metadata = {
  title: "Contact",
  description: "The fastest way to reach me — a form I actually read, or plain email.",
  alternates: { canonical: "/contact" },
};

function CollaborationNote() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          What I&rsquo;m open to
        </h2>
        <p className="mt-2 text-[var(--text-sm)] leading-relaxed">{site.contact.openTo}</p>
      </div>
      <div>
        <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          What I&rsquo;ll probably decline
        </h2>
        <p className="mt-2 text-[var(--text-sm)] leading-relaxed text-ink-muted">
          {site.contact.decline}
        </p>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact",
    url: `${site.url}/contact`,
  };

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="Contact"
        promise={
          <>
            The fastest way to reach me is this form or{" "}
            <a href={`mailto:${site.email}`} className="text-accent">
              {site.email}
            </a>
            . I read everything.
          </>
        }
      />

      <div className="mt-10 grid gap-12 lg:grid-cols-[3fr_2fr]">
        <div className="max-lg:order-2">
          <ContactForm />
          <p className="mt-6 text-[var(--text-xs)] leading-relaxed text-ink-muted">
            {site.contact.responseTime}
          </p>
        </div>

        <aside className="max-lg:order-1">
          <CollaborationNote />

          <div className="mt-8 border-t border-rule pt-5">
            <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
              Elsewhere
            </h2>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {site.social.map((entry) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  className="font-mono text-[var(--text-xs)] text-ink-muted no-underline transition-colors hover:text-ink"
                  {...(entry.href.startsWith("http")
                    ? { rel: "me noopener", target: "_blank" }
                    : {})}
                >
                  {entry.label}
                  {entry.href.startsWith("http") ? (
                    <span className="sr-only"> (opens in a new tab)</span>
                  ) : null}
                </a>
              ))}
            </p>
          </div>

          <div className="mt-8 border-t border-rule pt-5">
            <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
              Not a message, just curiosity?
            </h2>
            <p className="mt-2 text-[var(--text-sm)] text-ink-muted">
              The{" "}
              <Link href="/newsletter" className="text-accent no-underline">
                newsletter
              </Link>{" "}
              is the low-commitment option.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
