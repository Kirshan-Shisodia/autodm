// Settings. Lives inside the (app) shell so it gets the sidebar; auth is
// already enforced by that layout, and re-checked here because every section
// below is scoped to the session user.
//
// All ten sections load in one pass (see lib/settings/query.ts) and the tab
// strip is client-side, so switching tabs never hits the server. That trade is
// deliberate: the whole payload is a few kilobytes of preferences, and the
// alternative — ten routes, ten round-trips — makes a settings screen feel
// slower than the app it configures.

import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings/query";
import { isSectionId, type SectionId } from "@/lib/settings/model";
import { SettingsShell } from "@/components/settings/settings-shell";

export const metadata = {
  title: "Settings · ChatPilott",
  description: "Manage your account, preferences and workspace settings.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await loadSettings(supabase, user.id, user.email ?? "");
  const initial: SectionId = isSectionId(section) ? section : "general";

  return (
    // SettingsShell reads `?section=` via useSearchParams, which opts the tree
    // into client-side bailout without a Suspense boundary.
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsShell data={data} initialSection={initial} />
    </Suspense>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-14 w-64 animate-pulse rounded-lg bg-surface-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-surface-muted" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="h-96 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    </div>
  );
}
