// Referral Program. Lives inside the (app) shell so it gets the sidebar; auth
// is already enforced by that layout. Everything on screen is derived in
// lib/referrals.ts — this file only fetches and arranges.

import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  referralLink,
  stubTrends,
  summarize,
  tierProgress,
  toReferral,
  type ReferralRow,
} from "@/lib/referrals";
import type { Plan } from "@/lib/dashboard";
import { ReferralHeader } from "@/components/referrals/referral-header";
import { ReferralStatCards } from "@/components/referrals/stat-cards";
import { ShareCard } from "@/components/referrals/share-card";
import { ReferralActivity } from "@/components/referrals/referral-activity";
import { ReferralSidebar } from "@/components/referrals/referral-sidebar";

// Reads results from Supabase; never calls n8n or Meta directly (spec §0).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Referral Program · ChatPilott",
  description: "Refer friends, earn rewards and climb the reward tiers.",
};

/** The joined shape: the referral row plus the referred user's plan, if any. */
type ReferralWithPlan = ReferralRow & { referred: { plan: Plan | null } | null };

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: rows, error }] = await Promise.all([
    supabase
      .from("users")
      .select("referral_code, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("referrals")
      // The join gives us the plan the referred account actually landed on;
      // the referrals table itself has no plan column.
      .select("*, referred:referred_user_id(plan)")
      .eq("referrer_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // A failed read renders as a failure, not as a confident set of zeroes.
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-border-default bg-danger-bg px-5 py-4">
        <p className="flex items-center gap-2 text-[14px] font-medium text-danger">
          <TriangleAlert className="size-4" aria-hidden />
          Couldn&rsquo;t load your referrals
        </p>
        <p className="text-[13px] text-ink-secondary">{error.message}</p>
      </div>
    );
  }

  const referrals = ((rows ?? []) as unknown as ReferralWithPlan[]).map((row) =>
    toReferral(row),
  );

  const summary = summarize(referrals);
  const progress = tierProgress(summary.successful);

  // Every account gets a code at signup (handle_new_user), but an account
  // created before that trigger — or by an admin insert — may not have one.
  const code = (
    profile?.referral_code ?? user.id.replace(/-/g, "").slice(0, 8)
  ).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <ReferralHeader alertCount={0} />

      <ReferralStatCards summary={summary} trends={stubTrends(summary)} />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ShareCard link={referralLink(code)} code={code} />
          {/* Newest first, trimmed to a readable page — "View All" has the rest. */}
          <ReferralActivity referrals={referrals.slice(0, 5)} />
        </div>

        <ReferralSidebar progress={progress} />
      </div>
    </div>
  );
}
