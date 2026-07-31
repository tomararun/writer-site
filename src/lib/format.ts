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

/** "Mar 2025" — §3.3 timeframe endpoints. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** §3.3 — "Mar 2025 – Aug 2025", or "Mar 2025 – ongoing". */
export function formatTimeframe(
  timeframe:
    { start?: string | null; end?: string | null; ongoing?: boolean | null } | null | undefined,
): string {
  if (!timeframe?.start) return "";
  const start = formatMonthYear(timeframe.start);
  const end = timeframe.ongoing ? "ongoing" : formatMonthYear(timeframe.end);
  return end ? `${start} – ${end}` : start;
}

/** The `datetime` attribute value for <time>. */
export function isoDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 10);
}
