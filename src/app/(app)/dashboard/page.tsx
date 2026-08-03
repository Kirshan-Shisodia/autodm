import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/dashboard";
import { loadDashboard } from "@/lib/dashboard/query";
import { parseRange } from "@/lib/analytics/model";
import { AnalyticsQueryError } from "@/lib/analytics/query";
import { KpiStrip } from "@/components/analytics/kpi-strip";
import { PerformanceOverview } from "@/components/analytics/performance-overview";
import { TopAutomations } from "@/components/analytics/top-automations";
import { ConversionFunnel } from "@/components/analytics/conversion-funnel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { InsightBanner } from "@/components/dashboard/insight-banner";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AccountHealth } from "@/components/dashboard/account-health";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { HelpCard } from "@/components/dashboard/help-card";

// Reads results from Supabase; never calls n8n or Meta directly (spec §0).
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { range: rangeParam } = await searchParams;

  let data;
  try {
    data = await loadDashboard({
      supabase,
      userId: user.id,
      rangeKey: parseRange(rangeParam),
      fallbackName: user.email?.split("@")[0] ?? "there",
    });
  } catch (error) {
    // A failed read renders as a failure, not as a confident set of zeroes.
    if (!(error instanceof AnalyticsQueryError)) throw error;
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-border-default bg-danger-bg px-5 py-4">
        <p className="flex items-center gap-2 text-[14px] font-medium text-danger">
          <TriangleAlert className="size-4" aria-hidden />
          Couldn&rsquo;t load your dashboard
        </p>
        <p className="text-[13px] text-ink-secondary">{error.message}</p>
      </div>
    );
  }

  // The bell counts things that need a human: anything not green or idle.
  const alertCount = data.health.filter(
    (t) => t.tone === "warn" || t.tone === "bad",
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <DashboardHeader
        greeting={greeting()}
        name={data.greetingName}
        alertCount={alertCount}
      />

      <KpiStrip metrics={data.kpis} comparisonLabel={data.range.comparisonLabel} />

      <InsightBanner insight={data.insight} />

      {data.truncated && (
        <p className="text-[12px] text-ink-muted">
          This account has more activity than one page can read — the numbers
          above are a lower bound.
        </p>
      )}

      {/* Chart carries the width; the feed rides alongside it at 1/3. Both
          cards stretch to a shared height and each fills it from the inside —
          the chart holds 248px whether or not it has data, and the feed grows
          into whatever is left and scrolls past it. */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <PerformanceOverview
          title="Activity Overview"
          data={data.chart}
          unit={data.range.unit}
          className="xl:col-span-2"
        />
        <RecentActivity
          userId={user.id}
          rows={data.activity}
          hasAutomations={data.hasAutomations}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <TopAutomations rows={data.topAutomations} showRevenue />
        <ConversionFunnel stages={data.funnel} />
        <AccountHealth tiles={data.health} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <QuickActions className="xl:col-span-2" />
        <HelpCard />
      </div>
    </div>
  );
}
