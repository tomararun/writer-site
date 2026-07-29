import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { Hairline } from "@/components/primitives/Hairline";
import { ButtonLink } from "@/components/primitives/Button";
import { site } from "@/site.config";

/**
 * PHASE 0 PLACEHOLDER — this is a type specimen, not the home page.
 *
 * The Phase 0 exit criterion is: "a static page renders correct type in both
 * themes at 3 widths, Lighthouse a11y = 100, no layout shift." This page exists
 * to make that criterion checkable by eye rather than by faith.
 *
 * Phase 3 (P4) replaces this file with the real home page from §6.1:
 * statement → currently → selected writing → case studies → journal → subscribe.
 */

export const metadata: Metadata = {
  title: "Type specimen",
  description: "Phase 0 verification page. Replaced by the real home page in Phase 3.",
  robots: { index: false, follow: false },
};

const SCALE = [
  { token: "--text-4xl", px: "44 → 76", role: "Home statement", face: "display" },
  { token: "--text-3xl", px: "40 → 58", role: "Page titles", face: "display" },
  { token: "--text-2xl", px: "34 → 44", role: "Article h1, metric values", face: "display" },
  { token: "--text-xl", px: "27 → 34", role: "Section headings (h2)", face: "display" },
  { token: "--text-lg", px: "22 → 27", role: "Sub-headings (h3)", face: "display" },
  { token: "--text-md", px: "22", role: "Deck / lead-in", face: "body" },
  { token: "--text-base", px: "19", role: "Body copy", face: "body" },
  { token: "--text-sm", px: "16", role: "UI labels, cards", face: "display" },
  { token: "--text-xs", px: "14", role: "Nav, captions, metadata", face: "mono" },
  { token: "--text-2xs", px: "12", role: "Eyebrows, footer meta", face: "mono" },
] as const;

const COLOURS = [
  { token: "--paper", role: "Page ground" },
  { token: "--surface", role: "Cards, raised blocks" },
  { token: "--ink", role: "Body text, headings" },
  { token: "--ink-muted", role: "Metadata, captions" },
  { token: "--rule", role: "Hairlines" },
  { token: "--accent", role: "Links, active state" },
  { token: "--highlight", role: "The one loud element" },
] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
      {children}
    </p>
  );
}

export default function TypeSpecimenPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="border border-accent bg-surface p-4 text-[var(--text-sm)]">
        <p className="font-display font-semibold">Phase 0 verification page</p>
        <p className="mt-1 text-ink-muted">
          Not the home page. Check the type scale in both themes at 320px, 768px and 1440px,
          then run Lighthouse. Phase 3 replaces this file with the real home page.{" "}
          <Link href="/writing/the-66-character-rule" className="text-accent underline">
            The article template is here → (needs the seeded dataset)
          </Link>
        </p>
      </div>

      {/* ── The statement, at its real size ───────────────────────────────── */}
      <section aria-labelledby="statement" className="mt-16">
        <Eyebrow>The statement — --text-4xl, display face</Eyebrow>
        <h1
          id="statement"
          className="mt-5 max-w-[24ch] font-display text-[var(--text-4xl)] font-semibold"
        >
          {site.statement}
        </h1>
        <p className="mt-6 max-w-[52ch] text-[var(--text-md)] leading-snug text-ink-muted">
          {site.intro}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/writing">Read the writing</ButtonLink>
          <ButtonLink href="/newsletter" variant="secondary">
            Subscribe
          </ButtonLink>
        </div>
      </section>

      <Hairline className="mt-20" />

      {/* ── Type scale ────────────────────────────────────────────────────── */}
      <section aria-labelledby="scale" className="mt-14">
        <Eyebrow>Type scale</Eyebrow>
        <h2 id="scale" className="mt-3 font-display text-[var(--text-xl)]">
          Ten sizes, three faces
        </h2>
        <p className="mt-4 max-w-[60ch] text-[var(--text-sm)] text-ink-muted">
          Prose uses base and md only. Display never appears inside body copy. Mono carries
          every date, duration, tag and number on the site.
        </p>

        <ul className="mt-10 space-y-8">
          {SCALE.map((step) => (
            <li key={step.token} className="border-t border-rule pt-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <code className="font-mono text-[var(--text-2xs)] text-ink-muted">
                  {step.token}
                </code>
                <span className="font-mono text-[var(--text-2xs)] text-ink-muted">
                  {step.px}px · {step.face}
                </span>
                <span className="font-mono text-[var(--text-2xs)] text-ink-muted">
                  {step.role}
                </span>
              </div>
              <p
                className={
                  step.face === "display"
                    ? "mt-2 font-display font-semibold"
                    : step.face === "mono"
                      ? "mt-2 font-mono"
                      : "mt-2 font-body"
                }
                style={{ fontSize: `var(${step.token})`, lineHeight: 1.15 }}
              >
                The margin holds what the sentence cannot.
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Hairline className="mt-20" />

      {/* ── Colour ────────────────────────────────────────────────────────── */}
      <section aria-labelledby="colour" className="mt-14">
        <Eyebrow>Palette</Eyebrow>
        <h2 id="colour" className="mt-3 font-display text-[var(--text-xl)]">
          Seven tokens, one of them loud
        </h2>
        <p className="mt-4 max-w-[60ch] text-[var(--text-sm)] text-ink-muted">
          Toggle the theme in the header — every swatch below is a live custom property, so
          nothing here is hardcoded. Contrast ratios are documented in globals.css.
        </p>

        <dl className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {COLOURS.map((colour) => (
            <div key={colour.token} className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="size-12 shrink-0 border border-rule"
                style={{ backgroundColor: `var(${colour.token})` }}
              />
              <div className="min-w-0">
                <dt className="font-mono text-[var(--text-xs)]">{colour.token}</dt>
                <dd className="text-[var(--text-xs)] text-ink-muted">{colour.role}</dd>
              </div>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-[60ch] text-[var(--text-sm)]">
          The highlighter appears in exactly five places and nowhere else. Two of them are live
          on this page: <mark>this is a search match</mark>, and selecting any text on this page
          shows the third.
        </p>
      </section>

      <Hairline className="mt-20" />

      {/* ── Prose specimen ───────────────────────────────────────────────── */}
      <section aria-labelledby="prose" className="mt-14">
        <Eyebrow>Prose — every element Portable Text can emit</Eyebrow>
        <h2 id="prose" className="mt-3 font-display text-[var(--text-xl)]">
          The .prose class
        </h2>

        <div className="prose mt-10">
          <p>
            Body copy is set in Literata at 19 pixels over a 66-character measure, with a line
            height of 1.62. That measure is fixed: it does not grow with the viewport, because a
            longer line is harder to read, not more generous.
          </p>
          <p>
            Inline styles are all present — <strong>bold</strong>, <em>italic</em>,{" "}
            <a href="#prose">a link</a>, <code>inline code</code>, <kbd>⌘K</kbd>, and a footnote
            reference
            <sup>
              <a href="#prose">1</a>
            </sup>
            .
          </p>

          <h3>A third-level heading</h3>
          <p>Followed by a list, using em dashes rather than bullets:</p>
          <ul>
            <li>The first item in an unordered list</li>
            <li>
              A second item, long enough to wrap onto a second line so the hanging indent is
              visible and can be checked against the measure
            </li>
          </ul>
          <ol>
            <li>An ordered list, whose markers are set in mono</li>
            <li>Because numbers on this site are always mono</li>
          </ol>

          <blockquote>
            <p>
              A quotation, set slightly muted with a hairline rule rather than a large
              decorative glyph.
            </p>
            <cite>Someone worth quoting</cite>
          </blockquote>

          <pre>
            <code>{`export function readingTime(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / 220));
}`}</code>
          </pre>

          <table>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Promise</th>
                <th scope="col">Cadence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Writing</td>
                <td>A finished argument</td>
                <td>Fortnightly</td>
              </tr>
              <tr>
                <td>Journal</td>
                <td>An unfinished thought, dated</td>
                <td>Twice weekly</td>
              </tr>
            </tbody>
          </table>

          <details>
            <summary>A disclosure, used for footnotes below 1024px</summary>
            <p>
              On wide screens this content lives in the margin track instead. Same content, two
              presentations — which is why the footnote component needs both.
            </p>
          </details>

          <hr />

          <figure>
            <div
              aria-hidden="true"
              className="flex h-48 items-center justify-center border border-rule bg-surface font-mono text-[var(--text-xs)] text-ink-muted"
            >
              figure placeholder
            </div>
            <figcaption>
              A caption, set in mono at 14 pixels.
              <span className="credit">Credit line, slightly quieter.</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </Container>
  );
}
