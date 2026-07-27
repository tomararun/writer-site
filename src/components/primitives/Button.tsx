import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * §4.5: radius 0 on cards, 2px on inputs and chips. Buttons are chip-family.
 * No shadow, no gradient, no scale-on-hover.
 *
 * Copy rule (frontend guidance): a control says exactly what happens.
 * "Send message", not "Submit".
 */
type Variant = "primary" | "secondary" | "quiet";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-accent",
  secondary: "border border-ink text-ink hover:border-accent hover:text-accent",
  quiet: "text-ink-muted hover:text-ink underline decoration-1 underline-offset-4",
};

const base =
  "inline-flex items-center justify-center gap-2 font-display text-[var(--text-sm)] " +
  "font-semibold rounded-[var(--radius-xs)] transition-colors duration-150 " +
  "min-h-11 px-4 disabled:opacity-50 disabled:cursor-not-allowed";

const quietBase =
  "inline-flex items-center gap-1 font-display text-[var(--text-sm)] font-semibold " +
  "transition-colors duration-150";

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(variant === "quiet" ? quietBase : base, variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(variant === "quiet" ? quietBase : base, variants[variant], className)}
    >
      {children}
    </Link>
  );
}
