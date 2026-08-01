"use client";

// Performance Overview — the page's one large chart. A single amber area on a
// white field: HALO keeps colour scarce so the trend, not the styling, is what
// you notice. The series toggle swaps the data rather than stacking two lines,
// because DMs and clicks live on different scales.

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { formatCompact, formatCount, type SeriesPoint } from "@/lib/analytics/model";
import { AnalyticsCard, CardEmpty } from "./card";

type SeriesKey = "dmsSent" | "linkClicks";

const SERIES: { key: SeriesKey; label: string }[] = [
  { key: "dmsSent", label: "DMs Sent" },
  { key: "linkClicks", label: "Link Clicks" },
];

export function PerformanceOverview({
  data,
  unit,
  className,
  /** The dashboard calls this same chart "Activity Overview". */
  title = "Performance Overview",
}: {
  data: { dmsSent: SeriesPoint[]; linkClicks: SeriesPoint[] };
  unit: "day" | "week";
  className?: string;
  title?: string;
}) {
  const [active, setActive] = useState<SeriesKey>("dmsSent");
  const points = data[active];

  const hasData = useMemo(() => points.some((p) => p.value > 0), [points]);

  // Show roughly six ticks regardless of window length.
  const tickInterval = Math.max(0, Math.ceil(points.length / 6) - 1);

  return (
    <AnalyticsCard
      title={title}
      className={className}
      action={
        <div
          role="tablist"
          aria-label="Chart series"
          className="flex items-center gap-1 rounded-lg bg-surface-muted p-0.5"
        >
          {SERIES.map((s) => (
            <button
              key={s.key}
              role="tab"
              type="button"
              aria-selected={active === s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                active === s.key
                  ? "border border-border-default bg-surface-card text-ink"
                  : "border border-transparent text-ink-tertiary hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      {!hasData ? (
        <CardEmpty>
          No {active === "dmsSent" ? "DMs" : "link clicks"} in this period yet.
        </CardEmpty>
      ) : (
        <div className="h-[248px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
              <defs>
                <linearGradient id="perf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a96b24" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#a96b24" stopOpacity="0" />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#f1eee8"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                interval={tickInterval}
                tickLine={false}
                axisLine={{ stroke: "#e7e2da" }}
                tick={{ fill: "#9a948d", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#9a948d", fontSize: 11 }}
                tickFormatter={(v: number) => formatCompact(v)}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: "#d7d0c5", strokeWidth: 1 }}
                content={<ChartTooltip unit={unit} />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#a96b24"
                strokeWidth={2}
                fill="url(#perf-fill)"
                activeDot={{
                  r: 4,
                  fill: "#a96b24",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalyticsCard>
  );
}

type TooltipPayload = { payload?: SeriesPoint }[];

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  unit: "day" | "week";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const date = new Date(point.t);
  const when =
    unit === "week"
      ? `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div className="rounded-lg border border-border-default bg-surface-card px-3 py-2 shadow-floating">
      <p className="wz-font-mono text-[15px] leading-none font-semibold text-ink">
        {formatCount(point.value)}
      </p>
      <p className="mt-1 text-[11px] text-ink-tertiary">{when}</p>
    </div>
  );
}
