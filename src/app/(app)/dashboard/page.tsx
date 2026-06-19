import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  DM_LIMIT,
  greeting,
  hoursAgo,
  startOfMonth,
  type Plan,
} from "@/lib/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PastDueBanner } from "@/components/dashboard/past-due-banner";
import {
  AccountHealthWidget,
  type AccountHealth,
} from "@/components/dashboard/account-health";
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
      {subscriptionStatus === "past_due" && <PastDueBanner />}

      <h1 className="text-[28px] font-semibold tracking-tight text-[var(--wz-text)] max-sm:text-[22px]">
        {greeting()}, {firstName}.
      </h1>

      <KpiCards
        dmCount={dmCount}
        dmLimit={DM_LIMIT[plan]}
        activeAutomations={activeAutomations ?? 0}
        linkClicks={linkClicks ?? 0}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccountHealthWidget accounts={healthAccounts} />
        <RecentActivity
          userId={user.id}
          initialRows={feedRows}
          hasAutomations={(totalAutomations ?? 0) > 0}
        />
      </div>
    </div>
  );
}
