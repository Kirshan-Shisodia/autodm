// Top Automations — the five automations doing the most work in this window,
// ranked by DMs sent. Conversion is the only coloured number in the table.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { conversionTone, typeMeta } from "@/lib/automations/list";
import {
  formatCount,
  formatCurrency,
  formatPercent,
} from "@/lib/analytics/model";
import type { TopAutomationRow } from "@/lib/analytics/query";
import { AnalyticsCard, CardEmpty } from "./card";

const HEAD =
  "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted";
const HEAD_NUM = `${HEAD} text-right`;

export function TopAutomations({
  rows,
  /** The dashboard shows the money column; Analytics has a revenue card already. */
  showRevenue = false,
  className,
}: {
  rows: TopAutomationRow[];
  showRevenue?: boolean;
  className?: string;
}) {
  return (
    <AnalyticsCard
      title="Top Automations"
      className={className}
      bodyClassName="px-2 pb-3"
      action={
        <Link
          href="/automations"
          className="inline-flex items-center gap-1 rounded-sm text-[12px] font-medium text-brand transition-colors duration-100 hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <CardEmpty>No automation activity in this period.</CardEmpty>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className={HEAD}>Automation</th>
              <th className={HEAD_NUM}>DMs sent</th>
              <th className={cn(HEAD_NUM, "hidden sm:table-cell")}>Clicks</th>
              <th className={HEAD_NUM}>Conv. rate</th>
              {showRevenue && (
                <th className={cn(HEAD_NUM, "hidden md:table-cell")}>Revenue</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { label, icon: Icon } = typeMeta(row.type);
              return (
                <tr
                  key={row.id}
                  className="border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-hover-bg"
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/automations/${row.id}`}
                      className="flex items-center gap-2.5 rounded-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary"
                        aria-hidden
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {row.name}
                        </span>
                        <span className="block text-[11px] text-ink-muted">
                          {label}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="wz-font-mono px-3 py-2.5 text-right text-[13px] text-ink-secondary">
                    {formatCount(row.dmsSent)}
                  </td>
                  <td className="wz-font-mono hidden px-3 py-2.5 text-right text-[13px] text-ink-secondary sm:table-cell">
                    {formatCount(row.linkClicks)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.conversionRate === null ? (
                      <span className="text-[12px] text-ink-muted">—</span>
                    ) : (
                      <span
                        className={cn(
                          "wz-font-mono inline-block rounded-md px-1.5 py-0.5 text-[12px] font-medium",
                          conversionTone(row.conversionRate),
                        )}
                      >
                        {formatPercent(row.conversionRate)}
                      </span>
                    )}
                  </td>
                  {showRevenue && (
                    <td className="wz-font-mono hidden px-3 py-2.5 text-right text-[13px] font-medium text-ink md:table-cell">
                      {row.revenue > 0 ? (
                        formatCurrency(row.revenue)
                      ) : (
                        <span className="font-normal text-ink-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AnalyticsCard>
  );
}
