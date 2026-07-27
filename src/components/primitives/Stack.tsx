import { cn } from "@/lib/cn";

const gaps = {
  xs: "space-y-2",
  sm: "space-y-3",
  md: "space-y-5",
  lg: "space-y-8",
  xl: "space-y-14",
  "2xl": "space-y-24",
} as const;

export function Stack({
  children,
  gap = "md",
  className,
}: {
  children: React.ReactNode;
  gap?: keyof typeof gaps;
  className?: string;
}) {
  return <div className={cn(gaps[gap], className)}>{children}</div>;
}
