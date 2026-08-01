// Engagement Rate — what happened after a DM landed. Three mutually exclusive
// outcomes so the ring always closes, drawn as plain SVG arcs (no chart lib:
// it renders on the server and can't drift from the HALO amber ramp).

import {
  formatCount,
  formatPercent,
  type EngagementSlice,
} from "@/lib/analytics/model";
import { AnalyticsCard, CardEmpty } from "./card";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function EngagementRate({
  overall,
  slices,
}: {
  overall: number;
  slices: EngagementSlice[];
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <AnalyticsCard
      title="Engagement Rate"
      hint="Share of delivered DMs that led to a link click or a captured lead."
    >
      {total === 0 ? (
        <CardEmpty>No delivered DMs in this period.</CardEmpty>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <Donut overall={overall} slices={slices} total={total} />

          <ul className="min-w-[140px] flex-1 space-y-2.5">
            {slices.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-[12px]">
                <span
                  className="size-2 shrink-0 rounded-full ring-1 ring-border-default"
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-ink-secondary">
                  {s.label}
                </span>
                <span className="wz-font-mono font-medium text-ink">
                  {formatPercent(s.pct)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnalyticsCard>
  );
}

function Donut({
  overall,
  slices,
  total,
}: {
  overall: number;
  slices: EngagementSlice[];
  total: number;
}) {
  // Lay the arcs out before rendering: each slice's dash offset is the sum of
  // everything drawn before it, so the ring closes without mutating in a map.
  const arcs: { slice: EngagementSlice; length: number; offset: number }[] = [];
  let cursor = 0;
  for (const slice of slices) {
    const length = (total > 0 ? slice.value / total : 0) * CIRCUMFERENCE;
    arcs.push({ slice, length, offset: -cursor });
    cursor += length;
  }

  return (
    <div className="relative size-[132px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="#f1eee8"
          strokeWidth="13"
        />
        {arcs.map(({ slice, length, offset }) =>
          length <= 0 ? null : (
            <circle
              key={slice.label}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth="13"
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={offset}
            />
          ),
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="wz-font-mono text-[20px] leading-none font-semibold text-ink">
          {formatPercent(overall)}
        </span>
        <span className="mt-1 text-[10px] tracking-[0.055em] text-ink-muted uppercase">
          Engaged
        </span>
      </div>

      <span className="sr-only">
        {formatPercent(overall)} of {formatCount(total)} delivered DMs engaged.
      </span>
    </div>
  );
}
