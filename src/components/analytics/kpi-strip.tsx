// The six-card KPI strip. Flat cards, hairline borders, mono numerals, and one
// sparkline apiece — the strip is the page's answer to "how are we doing?"
// before anyone scrolls.

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Gauge,
  IndianRupee,
  Link2,
  Send,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  deltaTone,
  formatDelta,
  isFlat,
  type Delta,
  type Metric,
  type MetricKey,
} from "@/lib/analytics/model";
import { Sparkline } from "./sparkline";
import { StubChip } from "./card";

const ICONS: Record<MetricKey, LucideIcon> = {
  dms_sent: Send,
  link_clicks: Link2,
  new_leads: UserPlus,
  conversion_rate: TrendingUp,
  revenue: IndianRupee,
  plan_usage: Gauge,
};

const FALLBACK_ICON = BarChart3;

export function KpiStrip({
  metrics,
  comparisonLabel,
}: {
  metrics: Metric[];
  comparisonLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((m) => (
        <KpiCard key={m.key} metric={m} comparisonLabel={comparisonLabel} />
      ))}
    </div>
  );
}

function KpiCard({
  metric,
  comparisonLabel,
}: {
  metric: Metric;
  comparisonLabel: string;
}) {
  const Icon = ICONS[metric.key] ?? FALLBACK_ICON;
  const isRate = metric.key === "conversion_rate";

  return (
    <article className="flex flex-col rounded-xl border border-border-default bg-surface-card px-4 pt-3.5 pb-3">
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-secondary"
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-[12px] font-medium text-ink-tertiary">
          {metric.label}
        </span>
      </div>

      <div
        className={cn(
          "wz-font-mono mt-2.5 text-[28px] leading-none font-semibold tracking-[-0.4px]",
          metric.stub ? "text-ink-muted" : "text-ink",
        )}
      >
        {metric.stub ? "—" : metric.display}
      </div>

      {metric.stub ? (
        <div className="mt-2.5">
          <StubChip />
        </div>
      ) : metric.progress !== undefined ? (
        <PlanBar progress={metric.progress} footnote={metric.footnote} />
      ) : (
        <DeltaLine delta={metric.delta} label={comparisonLabel} />
      )}

      {metric.series.length > 0 && !metric.stub && (
        <div className="-mx-1 mt-2">
          <Sparkline
            values={metric.series}
            tone={isRate ? "success" : "brand"}
          />
        </div>
      )}
    </article>
  );
}

/**
 * Movement against the previous window. Three cases worth distinguishing:
 * a real change, a metric that had no baseline at all ("New" — the most
 * interesting delta there is), and no comparison window to speak of.
 *
 * Rate metrics move in *points*, not percent; the unit rides on the delta so
 * "conversion up 3.7%" can't be printed when it actually went 23.7 → 24.6.
 */
function DeltaLine({ delta, label }: { delta: Delta; label: string }) {
  if (delta.kind === "none") {
    return (
      <p className="mt-2.5 text-[11px] text-ink-muted">No prior period to compare</p>
    );
  }

  if (delta.kind === "new") {
    return (
      <p className="mt-2.5 flex items-center gap-1 text-[11px]">
        <ArrowUp className="size-3 text-success" aria-hidden />
        <span className="font-medium text-success">New</span>
        <span className="truncate text-ink-muted">{label}</span>
      </p>
    );
  }

  const flat = isFlat(delta);
  const Icon = delta.value > 0 ? ArrowUp : ArrowDown;

  return (
    <p className="mt-2.5 flex items-center gap-1 text-[11px]">
      {flat ? (
        <span className="text-ink-muted" aria-hidden>
          —
        </span>
      ) : (
        <Icon className={cn("size-3", deltaTone(delta))} aria-hidden />
      )}
      <span className={cn("wz-font-mono font-medium", deltaTone(delta))}>
        {formatDelta(delta)}
      </span>
      <span className="truncate text-ink-muted">{label}</span>
    </p>
  );
}

function PlanBar({
  progress,
  footnote,
}: {
  progress: number;
  footnote?: string;
}) {
  const near = progress >= 80;
  return (
    <div className="mt-2.5">
      <p className="text-[11px] text-ink-muted">{footnote}</p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly DM allowance used"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 [transition-timing-function:var(--ease-decelerate)]",
            near ? "bg-danger" : "bg-brand",
          )}
          style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}
