import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import type {
  ShellAccount,
  ShellUsage,
  ShellUser,
} from "@/components/layout/types";
import { DM_LIMIT, type Plan } from "@/lib/dashboard";

// Shell for every authenticated app page (Dashboard and on). Auth + the data
// the chrome needs (profile, connected accounts) loads once here; pages below
// fetch their own content. The full-screen Automation Wizard intentionally
// lives outside this group so it keeps its dark-plate, no-sidebar layout.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, avatar_url, plan, dm_count_month")
      .eq("id", user.id)
      .single(),
    supabase
      .from("instagram_accounts")
      .select("id, ig_username")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const shellUser: ShellUser = {
    id: user.id,
    name: profile?.full_name || user.email?.split("@")[0] || "there",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    plan: (profile?.plan ?? "free") as Plan,
  };

  const shellAccounts: ShellAccount[] = (accounts ?? []) as ShellAccount[];

  const used = profile?.dm_count_month ?? 0;
  const limit = DM_LIMIT[shellUser.plan] ?? DM_LIMIT.free;
  const usage: ShellUsage = {
    used,
    limit,
    // Clamped here rather than in the meter: a plan change mid-month can leave
    // `used` above the new limit, and a 140%-wide bar overflows its track.
    pct: limit > 0 ? Math.min(100, (used / limit) * 100) : 0,
  };

  return (
    <AppShell user={shellUser} accounts={shellAccounts} usage={usage}>
      {children}
    </AppShell>
  );
}
