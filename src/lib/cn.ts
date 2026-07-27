/**
 * Minimal class joiner. Deliberately not `clsx` + `tailwind-merge`:
 * this site has no component library and no conflicting utility overrides,
 * so 12 lines beats 8 KB of dependency.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
