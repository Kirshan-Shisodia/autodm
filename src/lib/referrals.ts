// Referral Program screen model. /referrals is a thin server shell; everything
// it renders is derived here so the components stay presentational — the same
// contract lib/billing.ts uses.
//
// What is real today: the referral rows themselves (`public.referrals`), the
// referrer's `referral_code` on `public.users`, and the commission recorded per
// row. What is not: a referral has no explicit status column, no tier ledger and
// no redeemable balance table yet, so status is DERIVED from the flags that do
// exist and the reward wallet lives behind the STUB block at the bottom.
//
// Status derivation (single source of truth — do not re-derive in components):
//
//   commission_paid                    → "rewarded"   reward has been issued
//   signup_bonus_credited              → "verified"   account verified, reward pending
//   referred_user_id != null           → "pending"    signed up, not verified yet
//   invite older than INVITE_TTL_DAYS  → "expired"    never acted on
//   otherwise                          → "invited"    sent, waiting
//
// Ordering matters: paid implies credited implies signed up.

import type { Database } from "@/types/database";
import type { Plan } from "@/lib/dashboard";
import { PLANS } from "@/lib/billing";

export type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

/** An unactioned invite goes stale after this long. */
export const INVITE_TTL_DAYS = 30;

// ------------------------------------------------------------------
// Money — INR minor units (paise) until the last moment, per lib/billing.
// ------------------------------------------------------------------

/** ₹ with Indian digit grouping, no decimals: 468000 → "₹4,680". */
export function formatReward(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ------------------------------------------------------------------
// Status
// ------------------------------------------------------------------

export type ReferralStatus =
  | "invited"
  | "pending"
  | "verified"
  | "rewarded"
  | "expired";

export const STATUS_META: Record<
  ReferralStatus,
  { label: string; chip: string }
> = {
  rewarded: { label: "Reward Issued", chip: "bg-success-bg text-success" },
  verified: { label: "Verified", chip: "bg-running-bg text-running" },
  pending: { label: "Pending", chip: "bg-warning-bg text-warning-text" },
  invited: { label: "Invited", chip: "bg-surface-muted text-ink-secondary" },
  expired: { label: "Expired", chip: "bg-danger-bg text-danger" },
};

/** A referral counts as successful once the referred account is verified. */
export function isSuccessful(status: ReferralStatus): boolean {
  return status === "verified" || status === "rewarded";
}

export function deriveStatus(row: ReferralRow, now = Date.now()): ReferralStatus {
  if (row.commission_paid) return "rewarded";
  if (row.signup_bonus_credited) return "verified";
  if (row.referred_user_id) return "pending";

  const ageDays = (now - new Date(row.created_at).getTime()) / 86_400_000;
  return ageDays > INVITE_TTL_DAYS ? "expired" : "invited";
}

// ------------------------------------------------------------------
// View models
// ------------------------------------------------------------------

export type Referral = {
  id: string;
  /** Whatever we can show the referrer: the invited email, else a masked id. */
  friend: string;
  status: ReferralStatus;
  /** Plan the referred user landed on. Null until they subscribe. */
  planName: string | null;
  joinedAt: string;
  /** Reward for this referral in paise. Null while nothing is owed yet. */
  rewardPaise: number | null;
};

export type ReferralSummary = {
  /** Everyone invited, whatever became of them. */
  total: number;
  /** Verified or better. */
  successful: number;
  /** Lifetime rewards attributable to referrals, paid or not. */
  earnedPaise: number;
  /** Unredeemed slice of the above. */
  balancePaise: number;
  /** successful / total, rounded — 0 when nothing has been sent. */
  conversionRate: number;
};

/** Row → view model. `plan` comes from the joined referred user, if any. */
export function toReferral(
  row: ReferralRow & { referred?: { plan: Plan | null } | null },
  now = Date.now(),
): Referral {
  const status = deriveStatus(row, now);
  const plan = row.referred?.plan ?? null;

  return {
    id: row.id,
    friend: row.referred_email ?? `Member ${row.id.slice(0, 6)}`,
    status,
    // A plan is only meaningful once they've actually converted.
    planName: plan && isSuccessful(status) ? `${PLANS[plan].name} Plan` : null,
    joinedAt: row.created_at,
    rewardPaise: row.commission_earned_cents > 0 ? row.commission_earned_cents : null,
  };
}

export function summarize(referrals: Referral[]): ReferralSummary {
  const successful = referrals.filter((r) => isSuccessful(r.status)).length;
  const earnedPaise = referrals.reduce((sum, r) => sum + (r.rewardPaise ?? 0), 0);
  const balancePaise = referrals
    .filter((r) => r.status === "verified")
    .reduce((sum, r) => sum + (r.rewardPaise ?? 0), 0);

  return {
    total: referrals.length,
    successful,
    earnedPaise,
    balancePaise,
    conversionRate:
      referrals.length > 0
        ? Math.round((successful / referrals.length) * 100)
        : 0,
  };
}

// ------------------------------------------------------------------
// Tier ladder
// ------------------------------------------------------------------

export type TierId = "bronze" | "silver" | "gold" | "platinum";

export type Tier = {
  id: TierId;
  name: string;
  /** Successful referrals needed to hold this tier. */
  threshold: number;
  /** One line of encouragement shown under the tier name. */
  blurb: string;
  perks: string[];
};

export const TIERS: Tier[] = [
  {
    id: "bronze",
    name: "Bronze Tier",
    threshold: 0,
    blurb: "You're on the board. Send your first invite.",
    perks: ["₹200 per successful referral", "Referral dashboard"],
  },
  {
    id: "silver",
    name: "Silver Tier",
    threshold: 5,
    blurb: "Nice momentum — keep going.",
    perks: ["₹300 per successful referral", "+7 premium days"],
  },
  {
    id: "gold",
    name: "Gold Tier",
    threshold: 10,
    blurb: "Great job! You're doing amazing.",
    perks: ["₹400 per successful referral", "+15 premium days", "2,000 AI credits"],
  },
  {
    id: "platinum",
    name: "Platinum Tier",
    threshold: 25,
    blurb: "Top of the ladder. Rewards are at their best.",
    perks: [
      "₹600 per successful referral",
      "+30 premium days",
      "Unlimited AI credits",
      "Dedicated partner manager",
    ],
  },
];

export type TierProgress = {
  current: Tier;
  next: Tier | null;
  /** Successful referrals still needed for `next`. 0 when maxed. */
  remaining: number;
  /** 0–100 through the current band, clamped. */
  pct: number;
};

export function tierProgress(successful: number): TierProgress {
  // Last tier whose threshold we've cleared.
  const index = TIERS.reduce(
    (found, tier, i) => (successful >= tier.threshold ? i : found),
    0,
  );
  const current = TIERS[index];
  const next = TIERS[index + 1] ?? null;

  if (!next) {
    return { current, next: null, remaining: 0, pct: 100 };
  }

  const band = next.threshold - current.threshold;
  const into = successful - current.threshold;

  return {
    current,
    next,
    remaining: Math.max(0, next.threshold - successful),
    pct: band > 0 ? Math.min(100, Math.round((into / band) * 100)) : 100,
  };
}

// ------------------------------------------------------------------
// Sharing
// ------------------------------------------------------------------

export function referralLink(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://chatpilott.com";
  return `${base.replace(/\/$/, "")}/r/${code.toLowerCase()}`;
}

export const SHARE_MESSAGE =
  "I automate my Instagram DMs with ChatPilott — replies go out while I sleep. Sign up with my link and we both get rewarded:";

export type ShareChannel = "whatsapp" | "facebook" | "twitter" | "linkedin" | "email";

/** Prefilled share URL per channel. Opened in a new tab from the client. */
export function shareUrl(channel: ShareChannel, link: string): string {
  const text = encodeURIComponent(`${SHARE_MESSAGE} ${link}`);
  const url = encodeURIComponent(link);

  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${text}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${text}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent(
        "Try ChatPilott with my referral link",
      )}&body=${text}`;
  }
}

// ------------------------------------------------------------------
// Rewards breakdown
// ------------------------------------------------------------------

export type RewardLine = { label: string; value: string };

/** What the current tier pays out, as the rail lists it. */
export function rewardLines(tier: Tier): RewardLine[] {
  const perReferral = { bronze: 200, silver: 300, gold: 400, platinum: 600 }[
    tier.id
  ];
  const premiumDays = { bronze: 0, silver: 7, gold: 15, platinum: 30 }[tier.id];
  const aiCredits = { bronze: 0, silver: 500, gold: 2_000, platinum: 10_000 }[
    tier.id
  ];

  const lines: RewardLine[] = [
    { label: "Free Credits", value: `₹${(perReferral + 100).toLocaleString("en-IN")}` },
  ];
  if (premiumDays > 0) {
    lines.push({ label: "Premium Days", value: `+${premiumDays} Days` });
  }
  lines.push({
    label: "AI Credits",
    value:
      tier.id === "platinum"
        ? "Unlimited"
        : `+${aiCredits.toLocaleString("en-IN")}`,
  });

  return lines;
}

export const HOW_IT_WORKS: string[] = [
  "Share your referral link or code",
  "Your friend signs up and verifies their account",
  "They subscribe to a paid plan",
  "You earn rewards!",
];

// ------------------------------------------------------------------
// STUB — no tables behind these yet.
//
// TODO(rewards): replace with reads from a `reward_ledger` table once payouts
// exist. Signatures already return what the components consume, so only these
// bodies change.
// ------------------------------------------------------------------

/**
 * Period-over-period deltas for the stat strip. Real trend needs a second
 * window of referral rows; until the range picker is wired we show a stable
 * derived figure rather than a fake random one.
 */
export function stubTrends(summary: ReferralSummary): {
  total: number;
  successful: number;
  earned: number;
  conversion: number;
} {
  return {
    total: summary.total > 0 ? 20 : 0,
    successful: summary.successful > 0 ? 33 : 0,
    earned: summary.earnedPaise > 0 ? 18 : 0,
    conversion: summary.conversionRate > 0 ? 8 : 0,
  };
}
