// Leads Overview — the funnel as one donut plus a legend.
//
// Hand-rolled SVG rather than Recharts: four static arcs need no axis, no
// tooltip and no resize observer, and this keeps the card a server component
// with nothing to hydrate.

import {
  STATUS_DOT,
  STATUS_STROKE,
  formatCount,
  formatPercent,
  type LeadStatus,
  type Slice,
} from "@/lib/leads/model";
import { CardEmpty, LeadsCard } from "./card";

const SIZE = 132;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A hair of background between arcs, so adjacent segments stay countable. */
const GAP = 1.5;

export function LeadsOverview({
  slices,
  total,
}: {
  slices: (Slice & { status: LeadStatus })[];
  total: number;
}) {
  const drawn = slices.filter((s) => s.count > 0);

  return (
    <LeadsCard title="Leads Overview">
      {total === 0 ? (
        <CardEmpty>No leads in this period yet.</CardEmpty>
      ) : (
        <div className="flex items-center gap-5">
          <Donut slices={drawn} total={total} />

          <ul className="min-w-0 flex-1 space-y-2">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-[12px]">
                <span
                  className={`size-2 shrink-0 rounded-full ${STATUS_DOT[s.status]}`}
                  aria-hidden
                />
                <span className="flex-1 truncate text-ink-secondary">{s.label}</span>
                <span className="wz-font-mono shrink-0 text-ink tabular-nums">
                  {formatCount(s.count)}
                </span>
                <span className="wz-font-mono w-[42px] shrink-0 text-right text-ink-muted tabular-nums">
                  ({formatPercent(s.pct, 0)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </LeadsCard>
  );
}

type Arc = {
  slice: Slice & { status: LeadStatus };
  length: number;
  offset: number;
};

/**
 * Arc geometry, resolved outside the component. Each segment starts where the
 * previous one ended, which is a running total — and a variable mutated across
 * a render pass is exactly what the React compiler refuses to reason about.
 * Lifting it to a module-level pure function keeps the accumulator legal and
 * the component a straight map over data.
 */
function toArcs(slices: (Slice & { status: LeadStatus })[]): Arc[] {
  const arcs: Arc[] = [];
  let running = 0;
  for (const slice of slices) {
    const length = (slice.pct / 100) * CIRCUMFERENCE;
    arcs.push({ slice, length, offset: running });
    running += length;
  }
  return arcs;
}

function Donut({
  slices,
  total,
}: {
  slices: (Slice & { status: LeadStatus })[];
  total: number;
}) {
  const arcs = toArcs(slices);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${formatCount(total)} leads by status`}
        // Start the first arc at twelve o'clock rather than three.
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-muted)"
          strokeWidth={STROKE}
        />
        {arcs.map(({ slice, length, offset }) => {
          // A one-lead slice still deserves a visible mark, but it must never
          // be wider than the gap logic can subtract from.
          const drawn = Math.max(0, length - GAP);
          return (
            <circle
              key={slice.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={STATUS_STROKE[slice.status]}
              strokeWidth={STROKE}
              strokeDasharray={`${drawn} ${CIRCUMFERENCE - drawn}`}
              strokeDashoffset={-offset}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="wz-font-mono text-[20px] leading-none font-semibold tracking-[-0.4px] text-ink">
          {formatCount(total)}
        </span>
        <span className="mt-1 text-[10px] text-ink-muted">Total Leads</span>
      </div>
    </div>
  );
}
