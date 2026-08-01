// Metrics Overview — this period against the last one, in a table. The same
// numbers as the KPI strip, but side by side with their baseline, because
// "2,481" only means something next to "2,099".

import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  deltaTone,
  formatDelta,
  isFlat,
  type Delta,
} from "@/lib/analytics/model";
import type { MetricsTableRow } from "@/lib/analytics/query";
import { AnalyticsCard, StubChip } from "./card";
import { Sparkline } from "./sparkline";

const HEAD =
  "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted";
const HEAD_NUM = `${HEAD} text-right`;

export function MetricsOverview({
  rows,
  currentLabel,
  previousLabel,
  className,
}: {
  rows: MetricsTableRow[];
  currentLabel: string;
  previousLabel: string;
  className?: string;
}) {
  return (
    <AnalyticsCard
      title="Metrics Overview"
      bodyClassName="px-2 pb-3"
      className={className}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className={HEAD}>Metric</th>
            <th className={HEAD_NUM}>{currentLabel}</th>
            <th className={cn(HEAD_NUM, "hidden sm:table-cell")}>
              {previousLabel}
            </th>
            <th className={HEAD_NUM}>Change</th>
            <th className={cn(HEAD_NUM, "hidden md:table-cell w-[120px]")}>
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-hover-bg"
            >
              <td className="px-3 py-3 text-[13px] font-medium text-ink">
                {row.label}
              </td>
              <td
                className={cn(
                  "wz-font-mono px-3 py-3 text-right text-[13px] font-semibold",
                  row.stub ? "text-ink-muted" : "text-ink",
                )}
              >
                {row.current}
              </td>
              <td className="wz-font-mono hidden px-3 py-3 text-right text-[13px] text-ink-tertiary sm:table-cell">
                {row.previous}
              </td>
              <td className="px-3 py-3 text-right">
                {row.stub ? <StubChip /> : <Change delta={row.delta} />}
              </td>
              <td className="hidden px-3 py-3 md:table-cell">
                {row.series.length > 0 && !row.stub ? (
                  <Sparkline
                    values={row.series}
                    tone={row.key === "conversion_rate" ? "success" : "brand"}
                    filled={false}
                    className="h-6"
                  />
                ) : (
                  <span className="block text-right text-[12px] text-ink-muted">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AnalyticsCard>
  );
}

function Change({ delta }: { delta: Delta }) {
  if (delta.kind === "none")
    return <span className="text-[12px] text-ink-muted">—</span>;

  const flat = delta.kind === "value" && isFlat(delta);
  const Icon = delta.kind === "new" || delta.value > 0 ? ArrowUp : ArrowDown;

  return (
    <span className="inline-flex items-center justify-end gap-1">
      {!flat && <Icon className={cn("size-3", deltaTone(delta))} aria-hidden />}
      <span
        className={cn("wz-font-mono text-[13px] font-medium", deltaTone(delta))}
      >
        {formatDelta(delta)}
      </span>
    </span>
  );
}
