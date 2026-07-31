"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * SPEC P4 — filters are URL state. Chips are toggle buttons with
 * aria-pressed; every combination is shareable and restores on reload
 * because the ONLY state is the query string. Changing any filter resets
 * pagination. The result count is a polite live region so screen-reader
 * users hear the list change.
 *
 * §6.3 responsive — chips scroll horizontally below md (visible chips teach
 * the taxonomy; never a dropdown-only pattern).
 */

export type FilterGroup = {
  /** Query param name — also the accessible group label. */
  param: string;
  label: string;
  allLabel: string;
  options: { label: string; value: string }[];
};

export type SortConfig = {
  param: string;
  label: string;
  defaultValue: string;
  options: { label: string; value: string }[];
};

export function FilterBar({
  groups,
  sort,
  summary,
}: {
  groups: FilterGroup[];
  sort?: SortConfig;
  /** "Showing 8 essays tagged “attention”" — rendered aria-live. */
  summary: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortId = useId();

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page"); // filters reset pagination
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(param: string, value: string | null) {
    navigate((params) => {
      if (value === null || params.get(param) === value) {
        params.delete(param);
      } else {
        params.set(param, value);
      }
    });
  }

  const hasActiveFilters =
    groups.some((group) => searchParams.get(group.param)) ||
    (sort ? Boolean(searchParams.get(sort.param)) : false);

  const chipClass = (pressed: boolean) =>
    cn(
      "min-h-8 shrink-0 rounded-[var(--radius-xs)] border px-3 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] transition-colors",
      pressed
        ? "border-ink bg-ink text-paper"
        : "border-rule text-ink-muted hover:border-ink hover:text-ink",
    );

  return (
    <div className="border-y border-rule py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {groups.map((group) => {
          const active = searchParams.get(group.param);
          return (
            <div
              key={group.param}
              role="group"
              aria-label={group.label}
              className="-mx-1 flex max-w-full items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                type="button"
                aria-pressed={active === null}
                onClick={() => toggle(group.param, null)}
                className={chipClass(active === null)}
              >
                {group.allLabel}
              </button>
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active === option.value}
                  onClick={() => toggle(group.param, option.value)}
                  className={chipClass(active === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          );
        })}

        {sort ? (
          <div className="ml-auto flex items-center gap-2">
            <label
              htmlFor={sortId}
              className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
            >
              {sort.label}
            </label>
            <select
              id={sortId}
              value={searchParams.get(sort.param) ?? sort.defaultValue}
              onChange={(event) =>
                navigate((params) => {
                  if (event.target.value === sort.defaultValue) {
                    params.delete(sort.param);
                  } else {
                    params.set(sort.param, event.target.value);
                  }
                })
              }
              className="min-h-8 rounded-[var(--radius-xs)] border border-rule bg-paper px-2 font-mono text-[var(--text-2xs)] text-ink"
            >
              {sort.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <p
        aria-live="polite"
        className="mt-3 flex flex-wrap items-baseline gap-x-3 font-mono text-[var(--text-2xs)] text-ink-muted"
      >
        {summary}
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() =>
              navigate((params) => {
                for (const group of groups) params.delete(group.param);
                if (sort) params.delete(sort.param);
              })
            }
            className="underline decoration-1 underline-offset-2 hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </p>
    </div>
  );
}
