import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FREE_AUTOMATION_LIMIT, type Plan } from "@/lib/dashboard";
import type { AutomationListItem } from "@/lib/automations/list";
import { AutomationsScreen } from "@/components/automations/list/automations-screen";

// Reads every automation the user owns in one pass; searching, filtering,
// sorting and paging all happen client-side over that set. Writes (status,
// duplicate, delete, bulk) go through Server Actions in ./actions.ts.
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: AutomationListItem["status"];
  total_triggers: number;
  total_dms_sent: number;
  total_clicks: number;
  created_at: string;
};

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("users").select("plan").eq("id", user.id).single(),
    supabase
      .from("automations")
      .select(
        "id, name, description, type, status, total_triggers, total_dms_sent, total_clicks, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const plan = (profile?.plan ?? "free") as Plan;

  const automations: AutomationListItem[] = ((rows ?? []) as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type,
    status: r.status,
    // Triggers can't be below the sends they produced — guard against rows
    // written before the counter existed.
    triggers: Math.max(r.total_triggers ?? 0, r.total_dms_sent ?? 0),
    dms_sent: r.total_dms_sent ?? 0,
    link_clicks: r.total_clicks ?? 0,
    created_at: r.created_at,
  }));

  // Free plan allows a single automation; at the limit, New routes to upgrade
  // instead of the wizard. Server-side create enforces this for real.
  const atFreeLimit =
    plan === "free" && automations.length >= FREE_AUTOMATION_LIMIT;
  const newHref = atFreeLimit
    ? "/billing?upgrade=pro&feature=automations"
    : "/automations/new";

  return <AutomationsScreen automations={automations} newHref={newHref} />;
}
