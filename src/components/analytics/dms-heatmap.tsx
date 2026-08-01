// DMs Sent Over Time — an hour-of-week heatmap. Seven columns (Mon-first),
// eight three-hour rows. Answers the one scheduling question the line chart
// can't: when is this audience actually awake?

import {
  HEATMAP_COL_LABELS,
  HEATMAP_HOURS_PER_ROW,
  HEATMAP_ROW_LABELS,
  formatCount,
  heatColor,
  type Heatmap,
} from "@/lib/analytics/model";
import { AnalyticsCard, CardEmpty } from "./card";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DmsHeatmap({ heatmap }: { heatmap: Heatmap }) {
  if (heatmap.max === 0) {
    return (
      <AnalyticsCard title="DMs Sent Over Time">
        <CardEmpty>No sends to plot in this period.</CardEmpty>
      </AnalyticsCard>
    );
  }

  return (
    <AnalyticsCard title="DMs Sent Over Time">
      <div className="flex gap-2">
        {/* Row labels — every other row, so the column reads 12AM / 6AM / … */}
        <div className="flex w-[40px] shrink-0 flex-col gap-1 pt-[18px]">
          {HEATMAP_ROW_LABELS.map((label, i) => (
            <span
              key={i}
              className="flex h-4 items-center text-[10px] text-ink-muted"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 grid grid-cols-7 gap-1">
            {HEATMAP_COL_LABELS.map((label, i) => (
              <span
                key={i}
                className="text-center text-[10px] font-medium text-ink-muted"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {heatmap.cells.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-7 gap-1">
                {row.map((value, colIndex) => (
                  <span
                    key={colIndex}
                    title={`${DAY_NAMES[colIndex]} ${hourRange(rowIndex)} — ${formatCount(value)} DMs`}
                    className="h-4 rounded-[3px] ring-1 ring-border-subtle ring-inset"
                    style={{ backgroundColor: heatColor(value, heatmap.max) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
        <p className="text-[11px] text-ink-tertiary">
          Most active:{" "}
          <span className="font-semibold text-ink">{heatmap.peak}</span>
        </p>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="text-[10px] text-ink-muted">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((step) => (
            <span
              key={step}
              className="size-2.5 rounded-[2px] ring-1 ring-border-subtle ring-inset"
              style={{ backgroundColor: heatColor(step, 1) }}
            />
          ))}
          <span className="text-[10px] text-ink-muted">More</span>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function hourRange(rowIndex: number): string {
  const start = rowIndex * HEATMAP_HOURS_PER_ROW;
  const end = start + HEATMAP_HOURS_PER_ROW;
  return `${label(start)}–${label(end % 24)}`;
}

function label(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}
