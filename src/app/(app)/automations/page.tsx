import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { FREE_AUTOMATION_LIMIT, type Plan } from "@/lib/dashboard";
import {
  startOfToday,
  type AutomationListItem,
} from "@/lib/automations/list";
import { AutomationsTable } from "@/components/automations/list/automations-table";
import { Button } from "@/components/ui/button";

// Reads the automations table + a per-automation "DMs today" count; the only
// writes (toggle/duplicate/delete) go through Server Actions (list spec §0, §8).
export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayStart = startOfToday();

  const [{ data: profile }, { data: rows }, { data: todayLogs }] =
    await Promise.all([
      supabase.from("users").select("plan").eq("id", user.id).single(),
      supabase
        .from("automations")
        .select("id, name, type, is_active, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      // One grouped pass for "DMs today" — fetch the day's sends and tally per
      // automation client-side, avoiding an N+1 (spec §8).
      supabase
        .from("dm_logs")
        .select("automation_id")
        .eq("user_id", user.id)
        .gte("sent_at", todayStart),
    ]);

  const plan = (profile?.plan ?? "free") as Plan;

  const dmsToday = new Map<string, number>();
  for (const log of (todayLogs ?? []) as { automation_id: string | null }[]) {
    if (!log.automation_id) continue;
    dmsToday.set(log.automation_id, (dmsToday.get(log.automation_id) ?? 0) + 1);
  }

  const automations: AutomationListItem[] = (
    (rows ?? []) as Omit<AutomationListItem, "dms_today">[]
  ).map((a) => ({
    ...a,
    dms_today: dmsToday.get(a.id) ?? 0,
  }));

  // Free plan allows a single automation; at the limit, New routes to upgrade
  // instead of the wizard (spec §7). Server-side create enforces this for real.
  const atFreeLimit =
    plan === "free" && automations.length >= FREE_AUTOMATION_LIMIT;
  const newHref = atFreeLimit
    ? "/billing?upgrade=pro&feature=automations"
    : "/automations/new";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--wz-text)] max-sm:text-[22px]">
          Automations
        </h1>
        <Button
          asChild
          className="bg-[var(--wz-accent)] text-white hover:bg-[var(--wz-accent-hover)] max-sm:w-full"
        >
          <Link href={newHref}>
            <Plus className="size-4" />
            New automation
          </Link>
        </Button>
      </div>

      <AutomationsTable automations={automations} />
    </div>
  );
}
