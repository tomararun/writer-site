/**
 * SPEC §6.6 — the canonical sections, their anchors and their numbering.
 *
 * One pure model drives the sticky SectionNav, the "Jump to" select and the
 * numbered eyebrows ("01 — BACKGROUND"), so they can never disagree about
 * which sections exist on a given case study. Only sections with content are
 * present; numbering runs over the NUMBERED narrative sections in order.
 */

export type CaseStudySectionId =
  | "background"
  | "problem"
  | "constraints"
  | "process"
  | "implementation"
  | "outcomes"
  | "metrics"
  | "learnings"
  | "gallery";

export type CaseStudySection = {
  id: CaseStudySectionId;
  /** Nav label. */
  label: string;
  /** "01" … for numbered narrative sections; null for metrics/gallery. */
  number: string | null;
  /** Eyebrow text — "01 — Background", or "Measured" for the metrics band. */
  eyebrow: string;
};

const SECTION_DEFS: {
  id: CaseStudySectionId;
  label: string;
  numbered: boolean;
  eyebrow?: string;
}[] = [
  { id: "background", label: "Background", numbered: true },
  { id: "problem", label: "Problem", numbered: true },
  { id: "constraints", label: "Constraints", numbered: true },
  { id: "process", label: "Process", numbered: true },
  { id: "implementation", label: "Implementation", numbered: true },
  { id: "outcomes", label: "Outcomes", numbered: true },
  { id: "metrics", label: "Metrics", numbered: false, eyebrow: "Measured" },
  { id: "learnings", label: "What I'd change", numbered: true },
  { id: "gallery", label: "Gallery", numbered: false, eyebrow: "Gallery" },
];

export type CaseStudyContentFlags = Partial<Record<CaseStudySectionId, boolean>>;

export function caseStudySections(present: CaseStudyContentFlags): CaseStudySection[] {
  let counter = 0;
  const sections: CaseStudySection[] = [];
  for (const def of SECTION_DEFS) {
    if (!present[def.id]) continue;
    if (def.numbered) {
      counter += 1;
      const number = String(counter).padStart(2, "0");
      sections.push({
        id: def.id,
        label: def.label,
        number,
        eyebrow: `${number} — ${def.label}`,
      });
    } else {
      sections.push({
        id: def.id,
        label: def.label,
        number: null,
        eyebrow: def.eyebrow ?? def.label,
      });
    }
  }
  return sections;
}
