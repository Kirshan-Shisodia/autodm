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
  "py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted";
const HEAD_NUM = `${HEAD} text-right whitespace-nowrap`;

// Under `table-fixed` the browser takes these widths literally, and any column
// left unsized splits what remains. So the numbers are pinned and the name gets
// the leftover — which is what makes `truncate` inside it work. (Sizing the
// *name* column instead was the bug: `w-full` under fixed layout means "take
// the entire table", and every numeric column got pushed past the card edge.)
const W_DMS = "w-[72px]";
const W_CLICKS = "w-[60px]";
const W_CONV = "w-[82px]";
const W_REVENUE = "w-[78px]";

/** Numeric cells carry tighter padding — they're pinned to a known width. */
const NUM_CELL =
  "wz-font-mono px-2 py-2.5 text-right text-[13px] whitespace-nowrap";

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
      bodyClassName="flex flex-col px-2 pb-3"
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
        // Container queries, not viewport breakpoints. This card is one third
        // of a row on the dashboard and two thirds of one on Analytics, so its
        // width has almost nothing to do with the window's. `sm:`/`md:` were
        // reading the viewport and rendering five columns into a ~450px card,
        // which pushed the last header out past the card's right border.
        // `flex-1` + `h-full` on the table: this card sits beside a taller
        // funnel, and three rows left the bottom third of it empty. The surplus
        // now goes to the rows themselves — a table treats height:100% as a
        // floor, so they only ever grow.
        <div className="@container flex flex-1 flex-col">
          <table className="h-full w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className={cn(HEAD, "px-3")}>Automation</th>
                <th className={cn(HEAD_NUM, "px-2", W_DMS)}>DMs sent</th>
                <th
                  className={cn(HEAD_NUM, "hidden px-2 @sm:table-cell", W_CLICKS)}
                >
                  Clicks
                </th>
                <th className={cn(HEAD_NUM, "px-2", W_CONV)}>Conv. rate</th>
                {showRevenue && (
                  <th
                    className={cn(
                      HEAD_NUM,
                      "hidden px-2 @xl:table-cell",
                      W_REVENUE,
                    )}
                  >
                    Revenue
                  </th>
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
                          <span
                            className="block truncate text-[13px] font-medium text-ink"
                            title={row.name}
                          >
                            {row.name}
                          </span>
                          <span className="block truncate text-[11px] text-ink-muted">
                            {label}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className={cn(NUM_CELL, "text-ink-secondary")}>
                      {formatCount(row.dmsSent)}
                    </td>
                    <td
                      className={cn(
                        NUM_CELL,
                        "hidden text-ink-secondary @sm:table-cell",
                      )}
                    >
                      {formatCount(row.linkClicks)}
                    </td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">
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
                      <td
                        className={cn(
                          NUM_CELL,
                          "hidden font-medium text-ink @xl:table-cell",
                        )}
                      >
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
        </div>
      )}
    </AnalyticsCard>
  );
}
