"use client";

import { useEffect, useRef } from "react";

/**
 * §6.14 a11y — the error pages' h1 takes focus on mount, so screen-reader
 * users immediately hear what happened.
 */
export function FocusHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <h1 ref={ref} tabIndex={-1} className={`${className ?? ""} focus-visible:outline-none`}>
      {children}
    </h1>
  );
}
