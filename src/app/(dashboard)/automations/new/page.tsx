import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AutomationWizard } from "@/components/automations/wizard/automation-wizard";
import type { Plan } from "@/lib/automations/wizard";

// The wizard fetches live media client-side, so this page must not be static.
export const dynamic = "force-dynamic";

export default async function NewAutomationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // First active Instagram account owned by this user (RLS scopes to auth.uid()).
  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("id, ig_username")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-medium">Connect Instagram first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need a connected Instagram Business account before you can create
          an automation.
        </p>
        <Link
          href="/accounts"
          className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Connect an account
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan ?? "free") as Plan;

  return (
    <AutomationWizard
      igAccountId={account.id}
      igUsername={account.ig_username}
      plan={plan}
    />
  );
}
