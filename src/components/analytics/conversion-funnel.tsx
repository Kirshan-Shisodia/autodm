// Conversion Funnel — trigger to lead, one row per stage, with a quiet amber
// bar behind each number showing its share of the top tracked stage.
//
// "Comments received" is deliberately empty: dm_logs only gets a row once a
// trigger matches, so upstream comment volume genuinely isn't in the database.
// Showing the gap is more useful than inventing a plausible number.

import { formatCount, formatPercent, type FunnelStage } from "@/lib/analytics/model";
import { AnalyticsCard, StubChip } from "./card";

export function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <AnalyticsCard title="Conversion Funnel">
      <ol className="space-y-1">
        {stages.map((stage) => (
          <li key={stage.label} className="relative">
            {/* Share bar sits behind the row rather than beside it, so the
                numbers stay on one baseline down the column. */}
            {!stage.stub && stage.pct > 0 && (
              <span
                className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-hover-bg"
                style={{ width: `${Math.max(2, Math.min(100, stage.pct))}%` }}
                aria-hidden
              />
            )}
            <div className="relative flex items-center justify-between gap-3 px-2 py-2.5">
              <span className="text-[13px] text-ink-secondary">{stage.label}</span>
              {stage.stub ? (
                <StubChip />
              ) : (
                <span className="flex items-baseline gap-2">
                  <span className="wz-font-mono text-[14px] font-semibold text-ink">
                    {formatCount(stage.value)}
                  </span>
                  <span className="wz-font-mono w-[52px] text-right text-[11px] text-ink-muted">
                    {formatPercent(stage.pct)}
                  </span>
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 border-t border-border-subtle pt-3 text-[11px] leading-[16px] text-ink-muted">
        Comment volume isn&rsquo;t stored yet — the funnel starts at the moment a
        trigger matches.
      </p>
    </AnalyticsCard>
  );
}
