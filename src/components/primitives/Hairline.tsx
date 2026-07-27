import { cn } from "@/lib/cn";

/**
 * The site's only divider. §4.5 refuses shadows and borders heavier than 1px,
 * so structural separation is carried entirely by these.
 *
 * Decorative by default — a horizontal rule between sections conveys nothing to
 * a screen reader, so it is hidden from the accessibility tree unless you pass
 * `semantic` to mark a genuine thematic break.
 */
export function Hairline({
  className,
  semantic = false,
}: {
  className?: string;
  semantic?: boolean;
}) {
  return (
    <hr
      aria-hidden={semantic ? undefined : true}
      role={semantic ? undefined : "presentation"}
      className={cn("border-t border-rule", className)}
    />
  );
}
