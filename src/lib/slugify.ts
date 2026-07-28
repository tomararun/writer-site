/**
 * SPEC §3.5 — heading anchors: "extracted h2/h3 with anchors".
 *
 * One slugifier for the whole site: heading anchors in the Portable Text
 * renderer must produce the same ids as the `headings[]` derived field, or the
 * margin rail (Phase 2) will point at anchors that don't exist.
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      // Strip diacritics: é → e. The combining marks land in U+0300–U+036F.
      .replace(/[̀-ͯ]/g, "")
      .replace(/['’]/g, "")
      // ß has no NFKD decomposition; transliterate rather than drop it.
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
