import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { parseFilters, parseRange, resolveRange } from "@/lib/analytics/model";
import { AnalyticsQueryError, loadAnalytics } from "@/lib/analytics/query";
import {
  ActiveFilterChips,
  AnalyticsHeader,
} from "@/components/analytics/analytics-header";
import { KpiStrip } from "@/components/analytics/kpi-strip";
import { PerformanceOverview } from "@/components/analytics/performance-overview";
import { TopAutomations } from "@/components/analytics/top-automations";
import { ConversionFunnel } from "@/components/analytics/conversion-funnel";
import { EngagementRate } from "@/components/analytics/engagement-rate";
import { DmsHeatmap } from "@/components/analytics/dms-heatmap";
import { AudienceInsights } from "@/components/analytics/audience-insights";
import { MetricsOverview } from "@/components/analytics/metrics-overview";
import { ActivityFeed } from "@/components/analytics/activity-feed";

// Every number on this page is read from Supabase results — never n8n, never
// Meta (spec §0). Range and filters live in the URL, so the page re-runs on the
// server whenever they change and a filtered view is a shareable link.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const rangeKey = parseRange(first(params.range));
  const range = resolveRange(rangeKey);
  const filters = parseFilters({
    accounts: first(params.accounts),
    automations: first(params.automations),
    statuses: first(params.statuses),
  });

  // A read failure must not render as a page full of confident zeros — an
  // analytics screen that quietly reports "no activity" during an outage is
  // worse than one that admits it couldn't load.
  let data: Awaited<ReturnType<typeof loadAnalytics>>;
  try {
    data = await loadAnalytics({ supabase, userId: user.id, range, filters });
  } catch (error) {
    return (
      <LoadFailed
        detail={
          error instanceof AnalyticsQueryError
            ? error.message
            : "Something went wrong reading your analytics."
        }
      />
    );
  }

  const previousLabel =
    range.prevStart === null
      ? "Previous"
      : `Previous ${range.label.replace("Last ", "")}`;

  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <AnalyticsHeader
          accounts={data.options.accounts}
          automations={data.options.automations}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ActiveFilterChips
          accounts={data.options.accounts}
          automations={data.options.automations}
        />
      </Suspense>

      {data.truncated && (
        <Notice>
          This period has more activity than we chart in one pass — totals below
          are a lower bound. Narrow the range or add a filter for exact numbers.
        </Notice>
      )}

      {data.statusScoped && (
        <Notice>
          The DM-status filter narrows DMs and link clicks. Leads carry no
          status of their own, so lead and conversion figures stay unfiltered.
        </Notice>
      )}

      <KpiStrip metrics={data.kpis} comparisonLabel={range.comparisonLabel} />

      {/* Chart takes two thirds; the ranked table rides alongside it. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PerformanceOverview
          data={data.chart}
          unit={range.unit}
          className="xl:col-span-2"
        />
        <TopAutomations rows={data.topAutomations} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ConversionFunnel stages={data.funnel} />
        <EngagementRate
          overall={data.engagement.overall}
          slices={data.engagement.slices}
        />
        <DmsHeatmap heatmap={data.heatmap} />
        <AudienceInsights />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MetricsOverview
          rows={data.metricsTable}
          currentLabel={range.label.replace("Last ", "This ")}
          previousLabel={previousLabel}
          className="xl:col-span-2"
        />
        <ActivityFeed rows={data.activity} />
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-border-default bg-warning-bg px-3.5 py-2.5 text-[12px] leading-[18px] text-warning-text">
      <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

function LoadFailed({ detail }: { detail: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[22px]">
          Analytics
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Track performance and growth of your Instagram automations.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 rounded-xl border border-border-default bg-danger-bg px-5 py-4">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-danger">
          <TriangleAlert className="size-4" aria-hidden />
          Couldn&rsquo;t load your analytics
        </span>
        <p className="text-[12px] leading-[18px] text-ink-secondary">{detail}</p>
        <p className="text-[12px] text-ink-muted">
          Refresh to try again, or narrow the date range if this period is very
          large.
        </p>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-surface-muted" />
        <div className="h-4 w-72 rounded bg-surface-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-32 rounded-lg bg-surface-muted" />
        <div className="h-9 w-24 rounded-lg bg-surface-muted" />
        <div className="h-9 w-24 rounded-lg bg-surface-muted" />
      </div>
    </div>
  );
}
