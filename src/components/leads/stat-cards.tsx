// The five-card KPI strip. Flat cards, hairline borders, mono numerals — the
// strip answers "how is the funnel doing?" before anyone reads a single row.

import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Users,
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
} from "@/lib/leads/model";

const ICONS: Record<MetricKey, LucideIcon> = {
  total: Users,
  new: UserPlus,
  engaged: MessageSquare,
  converted: CircleCheck,
  conversion_rate: TrendingUp,
};

export function LeadStatCards({
  metrics,
  comparisonLabel,
}: {
  metrics: Metric[];
  comparisonLabel: string;
}) {
  // Five across from xl up. Below that the sidebar leaves the content column
  // under ~1000px, and a fifth track would take each card to ~180px — narrower
  // than "Conversion Rate" plus its icon, so the label would truncate on the one
  // card whose name can't be guessed from its number.
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((m) => (
        <StatCard key={m.key} metric={m} comparisonLabel={comparisonLabel} />
      ))}
    </div>
  );
}

function StatCard({
  metric,
  comparisonLabel,
}: {
  metric: Metric;
  comparisonLabel: string;
}) {
  const Icon = ICONS[metric.key];

  return (
    <article className="flex flex-col rounded-xl border border-border-default bg-surface-card px-4 pt-3.5 pb-3.5">
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

      <div className="wz-font-mono mt-3 text-[30px] leading-none font-semibold tracking-[-0.6px] text-ink">
        {metric.display}
      </div>

      <DeltaLine delta={metric.delta} label={comparisonLabel} />
    </article>
  );
}

/**
 * Movement against the previous window. Three cases worth distinguishing: a
 * real change, a metric with no baseline at all ("New" — the most interesting
 * delta there is), and no comparison window to speak of.
 */
function DeltaLine({ delta, label }: { delta: Delta; label: string }) {
  if (delta.kind === "none") {
    return (
      <p className="mt-2.5 text-[11px] text-ink-muted">
        No prior period to compare
      </p>
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
