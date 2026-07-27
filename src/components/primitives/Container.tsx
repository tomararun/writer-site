import { cn } from "@/lib/cn";

/**
 * SPEC §6.1 responsive: "≥ 2xl: max content width 1280px, gutters grow, type does not."
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
}) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        "max-w-[var(--width-container)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
