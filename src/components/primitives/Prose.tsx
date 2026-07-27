import { cn } from "@/lib/cn";

/**
 * Wraps long-form content. The `.prose` class in src/styles/typography.css does
 * the work; this component exists only to pick a measure (§6.4 / §6.6 / §6.8).
 */
export function Prose({
  children,
  measure = "default",
  className,
}: {
  children: React.ReactNode;
  measure?: "default" | "narrow" | "wide";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose",
        measure === "narrow" && "prose--narrow",
        measure === "wide" && "prose--wide",
        className,
      )}
    >
      {children}
    </div>
  );
}
