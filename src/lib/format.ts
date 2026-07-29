/**
 * Date formatting for the meta lines. One locale, applied at build/render on
 * the server, so output never depends on a visitor's machine.
 */

/** "4 March 2026" — §6.4 meta line and update notes (mono uppercases via CSS). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "11 Mar" — §6.8 prev/next journal links. */
export function formatDayMonth(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/** The `datetime` attribute value for <time>. */
export function isoDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 10);
}
