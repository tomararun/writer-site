import { describe, expect, it } from "vitest";
import { caseStudySections } from "@/lib/case-study-sections";
import { caseStudyJsonLd } from "@/lib/jsonld";
import { formatTimeframe } from "@/lib/format";

describe("caseStudySections", () => {
  it("numbers only the narrative sections, in §6.6 order", () => {
    const sections = caseStudySections({
      background: true,
      problem: true,
      constraints: true,
      process: true,
      implementation: true,
      outcomes: true,
      metrics: true,
      learnings: true,
      gallery: true,
    });
    expect(sections.map((s) => [s.id, s.number])).toEqual([
      ["background", "01"],
      ["problem", "02"],
      ["constraints", "03"],
      ["process", "04"],
      ["implementation", "05"],
      ["outcomes", "06"],
      ["metrics", null],
      ["learnings", "07"],
      ["gallery", null],
    ]);
    expect(sections[0]?.eyebrow).toBe("01 — Background");
    expect(sections.find((s) => s.id === "metrics")?.eyebrow).toBe("Measured");
  });

  it("renumbers contiguously when sections are absent", () => {
    const sections = caseStudySections({ problem: true, outcomes: true, gallery: true });
    expect(sections.map((s) => [s.id, s.number])).toEqual([
      ["problem", "01"],
      ["outcomes", "02"],
      ["gallery", null],
    ]);
  });

  it("returns nothing for an empty document", () => {
    expect(caseStudySections({})).toEqual([]);
  });
});

describe("formatTimeframe", () => {
  it("renders start – end, and ongoing", () => {
    expect(formatTimeframe({ start: "2025-03-01", end: "2025-08-01" })).toBe(
      "Mar 2025 – Aug 2025",
    );
    expect(formatTimeframe({ start: "2026-06-01", ongoing: true })).toBe("Jun 2026 – ongoing");
    expect(formatTimeframe({ start: "2026-06-01" })).toBe("Jun 2026");
    expect(formatTimeframe(null)).toBe("");
  });
});

describe("caseStudyJsonLd", () => {
  it("emits Article + CreativeWork with about and gallery ImageObjects", () => {
    const [article, work] = caseStudyJsonLd({
      url: "https://example.com/case-studies/x",
      headline: "X",
      description: "Outcome line.",
      authorName: "Alex",
      about: ["Personal project", "Next.js", null],
      images: [{ url: "https://cdn/img.jpg", caption: "The first version." }],
    });
    expect(article!["@type"]).toBe("Article");
    expect(article!.author).toEqual({ "@type": "Person", name: "Alex" });
    expect(work!["@type"]).toBe("CreativeWork");
    expect(work!.about).toEqual(["Personal project", "Next.js"]);
    expect(work!.image).toEqual([
      {
        "@type": "ImageObject",
        contentUrl: "https://cdn/img.jpg",
        caption: "The first version.",
      },
    ]);
  });
});
