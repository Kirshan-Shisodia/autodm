import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  DM_LIMIT,
  greeting,
  hoursAgo,
  startOfMonth,
  tokenExpiryDays,
  type Plan,
} from "@/lib/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import {
  AlertBanner,
  type AlertAccount,
} from "@/components/dashboard/alert-banner";
import { SafetyRow } from "@/components/dashboard/safety-row";
import {
  AccountHealthWidget,
  type AccountHealth,
} from "@/components/dashboard/account-health";
import {
  TopAutomationCard,
  type TopAutomation,
} from "@/components/dashboard/top-automation-card";
import {
  RecentActivity,
  type FeedRow,
} from "@/components/dashboard/recent-activity";

// Reads results from Supabase; never calls n8n or Meta directly (spec §0).
export const dynamic = "force-dynamic";

type DmLogRow = {
  id: string;
  recipient_username: string | null;
  recipient_ig_id: string | null;
  status: string;
  sent_at: string;
  automation_id: string | null;
  ig_account_id: string;
  automation: { name: string } | { name: string }[] | null;
};

function automationName(
  automation: DmLogRow["automation"],
): string {
  if (!automation) return "DM";
  const a = Array.isArray(automation) ? automation[0] : automation;
  return a?.name ?? "DM";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const monthStart = startOfMonth();
  const hourAgo = hoursAgo(1);

  const [
    { data: userRow },
    { count: activeAutomations },
    { count: totalAutomations },
    { data: recentDms },
    { data: accounts },
    { count: linkClicks },
    { data: hourlyLogs },
    { data: topAutomationRow },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("dm_logs")
      .select(
        "id, recipient_username, recipient_ig_id, status, sent_at, automation_id, ig_account_id, automation:automations(name)",
      )
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(10),
    supabase
      .from("instagram_accounts")
      .select("id, ig_username, token_expires_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("link_clicks")
      .select("id, short_links!inner(user_id)", {
        count: "exact",
        head: true,
      })
      .eq("short_links.user_id", user.id)
      .gte("clicked_at", monthStart),
    supabase
      .from("dm_logs")
      .select("ig_account_id")
      .eq("user_id", user.id)
      .eq("status", "sent")
      .gte("sent_at", hourAgo),
    supabase
      .from("automations")
      .select("id, name, type, total_dms_sent, total_clicks")
      .eq("user_id", user.id)
      .order("total_dms_sent", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const plan = (userRow?.plan ?? "free") as Plan;
  const dmCount = userRow?.dm_count_month ?? 0;
  const subscriptionStatus = userRow?.subscription_status ?? null;
  const firstName = (userRow?.full_name ?? user.email?.split("@")[0] ?? "there")
    .split(" ")[0];

  // Count this hour's sends per account for the rate-limit warning (spec §6).
  const hourlyByAccount = new Map<string, number>();
  for (const log of (hourlyLogs ?? []) as { ig_account_id: string }[]) {
    hourlyByAccount.set(
      log.ig_account_id,
      (hourlyByAccount.get(log.ig_account_id) ?? 0) + 1,
    );
  }

  const healthAccounts: AccountHealth[] = (
    (accounts ?? []) as {
      id: string;
      ig_username: string;
      token_expires_at: string | null;
    }[]
  ).map((a) => ({
    id: a.id,
    ig_username: a.ig_username,
    token_expires_at: a.token_expires_at,
    hourlySends: hourlyByAccount.get(a.id) ?? 0,
  }));

  // Total sends in the last hour across all accounts — feeds the capacity meter.
  const hourlySends = healthAccounts.reduce((sum, a) => sum + a.hourlySends, 0);

  const alertAccounts: AlertAccount[] = healthAccounts.map((a) => ({
    ig_username: a.ig_username,
    expiryDays: tokenExpiryDays(a.token_expires_at),
  }));

  const topAutomation = (topAutomationRow as TopAutomation | null) ?? null;

  const feedRows: FeedRow[] = ((recentDms ?? []) as DmLogRow[]).map((d) => ({
    id: d.id,
    recipient: d.recipient_username || d.recipient_ig_id || "someone",
    label: automationName(d.automation),
    status: d.status,
    sent_at: d.sent_at,
    automation_id: d.automation_id,
  }));

  return (
    <div className="space-y-8">
      <AlertBanner
        subscriptionStatus={subscriptionStatus}
        accounts={alertAccounts}
      />

      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--wz-text)] max-sm:text-[22px]">
          {greeting()}, {firstName}.
        </h1>
        <Link
          href="/automations/new"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-4 text-sm font-medium text-[var(--wz-text-dark)] transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-[var(--wz-accent-hover)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none max-sm:w-full max-sm:justify-center"
        >
          <Plus className="size-4" /> New Automation
        </Link>
      </div>

      <SafetyRow
        dmCount={dmCount}
        dmLimit={DM_LIMIT[plan]}
        hourlySends={hourlySends}
        accountCount={healthAccounts.length}
      />

      <KpiCards
        dmCount={dmCount}
        dmLimit={DM_LIMIT[plan]}
        activeAutomations={activeAutomations ?? 0}
        linkClicks={linkClicks ?? 0}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopAutomationCard automation={topAutomation} />
        <AccountHealthWidget accounts={healthAccounts} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RecentActivity
          userId={user.id}
          initialRows={feedRows}
          hasAutomations={(totalAutomations ?? 0) > 0}
        />
      </div>
    </div>
  );
}
