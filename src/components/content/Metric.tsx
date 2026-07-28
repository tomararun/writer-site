export type MetricValue = {
  label?: string | null;
  value?: string | null;
  delta?: string | null;
  unit?: string | null;
  note?: string | null;
  source?: string | null;
};

/**
 * SPEC §3.2 — one metric in a case study's metrics band (§6.6). Numbers are
 * always mono; the source renders small because it must exist, not shout.
 */
export function Metric({ value }: { value: MetricValue }) {
  if (!value.label || !value.value) return null;

  return (
    <div className="border-t border-rule pt-4">
      <p className="font-display text-[var(--text-2xl)] font-semibold leading-none">
        <span className="font-mono">{value.value}</span>
        {value.unit ? (
          <span className="ml-1 font-mono text-[var(--text-sm)] text-ink-muted">
            {value.unit}
          </span>
        ) : null}
        {value.delta ? (
          <span className="ml-2 font-mono text-[var(--text-sm)] text-accent">
            {value.delta}
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-[var(--text-sm)] text-ink">{value.label}</p>
      {value.note ? (
        <p className="mt-1 text-[var(--text-xs)] text-ink-muted">{value.note}</p>
      ) : null}
      {value.source ? (
        <p className="mt-1 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          {value.source}
        </p>
      ) : null}
    </div>
  );
}
