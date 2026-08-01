// Billing screen model. The /billing page is a thin server shell; everything it
// renders is derived here so the components stay presentational.
//
// What is real today: plan, subscription status, DM usage and the monthly reset
// date all come from `public.users`. What is not: invoice history, the saved
// card and extra-DM top-ups have no tables yet, so they live behind the STUB
// functions at the bottom of this file. Swapping in Razorpay is a one-file
// change — the components never see the difference.

import type { Database } from "@/types/database";
import type { Plan } from "@/lib/dashboard";
import { DM_LIMIT } from "@/lib/dashboard";

// ------------------------------------------------------------------
// Money — everything is INR minor units (paise) until the last moment.
// ------------------------------------------------------------------

/** GST charged on Indian SaaS subscriptions. Displayed as its own line. */
export const GST_RATE = 0.18;

/** ₹ with Indian digit grouping and two decimals: 353764 → "₹3,537.64". */
export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** ₹ with no decimals, for headline prices: 249900 → "₹2,499". */
export function formatINRWhole(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

// ------------------------------------------------------------------
// Plan catalog
// ------------------------------------------------------------------

export type PlanInfo = {
  id: Plan;
  /** Customer-facing name — the DB calls it "pro", the invoice says Professional. */
  name: string;
  /** Monthly price in paise, ex-GST. */
  pricePaise: number;
  /** Monthly DM allowance. Mirrors DM_LIMIT so the two can never drift. */
  dmLimit: number;
  blurb: string;
  features: string[];
};

export const PLANS: Record<Plan, PlanInfo> = {
  free: {
    id: "free",
    name: "Starter",
    pricePaise: 0,
    dmLimit: DM_LIMIT.free,
    blurb: "For creators testing the water with a single automation.",
    features: [
      "1,000 DMs per month",
      "1 Automation",
      "Basic Analytics",
      "Community Support",
    ],
  },
  pro: {
    id: "pro",
    name: "Professional",
    pricePaise: 249_900,
    dmLimit: DM_LIMIT.pro,
    blurb: "For growing businesses and creators who want to scale their DMs.",
    features: [
      "25,000 DMs per month",
      "Unlimited Automations",
      "Advanced Analytics",
      "Priority Support",
      "All Pro Features",
    ],
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    pricePaise: 999_900,
    dmLimit: DM_LIMIT.platinum,
    blurb: "For teams running high-volume campaigns across many accounts.",
    features: [
      "300,000 DMs per month",
      "Unlimited Automations",
      "White-label Branding",
      "Dedicated Success Manager",
      "All Platinum Features",
    ],
  },
};

/** Extra DMs are sold in blocks — one block, one price. */
export const EXTRA_DM_BLOCK = 5_000;
export const EXTRA_DM_BLOCK_PAISE = 49_900;

// ------------------------------------------------------------------
// Row shapes
// ------------------------------------------------------------------

/** Mirrors the DB check constraint — never widen this by hand. */
export type SubscriptionStatus = NonNullable<
  Database["public"]["Tables"]["users"]["Row"]["subscription_status"]
>;

/** The columns /billing selects from `users`. */
export type BillingUserRow = {
  plan: Plan;
  subscription_status: SubscriptionStatus | null;
  dm_count_month: number;
  dm_count_month_reset_at: string;
  created_at: string;
};

export type InvoiceStatus = "paid" | "due" | "failed" | "refunded";

export type Invoice = {
  id: string;
  /** ISO date the invoice was issued. */
  date: string;
  /** Total charged, in paise, inclusive of GST. */
  amountPaise: number;
  status: InvoiceStatus;
  /** Where the PDF lives. Null until the Razorpay wiring lands. */
  downloadUrl: string | null;
};

export type PaymentMethod = {
  brand: string;
  last4: string;
  /** "MM/YY" as printed on the card. */
  expiry: string;
};

/** Everything the page needs, in one shape. */
export type BillingSummary = {
  plan: PlanInfo;
  status: SubscriptionStatus;
  /** True while the subscription is in good standing. */
  active: boolean;
  usage: DmUsage;
  /** ISO date the next invoice is raised — same day the allowance resets. */
  nextBillingDate: string;
  /** Whole days until that date; 0 once it is today or past. */
  daysRemaining: number;
  charges: ChargeLine[];
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
};

export type DmUsage = {
  used: number;
  limit: number;
  /** 0–100, clamped — a mid-month downgrade can leave `used` above `limit`. */
  percent: number;
  /** Amber at 80, red at 95. Matches the sidebar meter thresholds. */
  tone: "normal" | "near" | "critical";
  resetAt: string;
};

export type ChargeLine = {
  label: string;
  amountPaise: number;
};

// ------------------------------------------------------------------
// Derivation
// ------------------------------------------------------------------

const DAY_MS = 86_400_000;

export function dmUsage(row: BillingUserRow): DmUsage {
  const limit = PLANS[row.plan].dmLimit;
  const used = row.dm_count_month;
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return {
    used,
    limit,
    percent,
    tone: percent >= 95 ? "critical" : percent >= 80 ? "near" : "normal",
    resetAt: row.dm_count_month_reset_at,
  };
}

/** Whole days between now and an ISO date; never negative. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS),
  );
}

/** "Jul 22, 2024" — the one date format this screen uses. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The current billing summary. `extraDmBlocks` is the number of 5,000-DM
 * top-ups bought this cycle — zero until top-ups have somewhere to live.
 */
export function billingSummary(
  row: BillingUserRow,
  extraDmBlocks = 0,
  now: Date = new Date(),
): BillingSummary {
  const plan = PLANS[row.plan];
  // A free account has no subscription row, so a null status is normal there.
  const status: SubscriptionStatus =
    row.subscription_status ?? (row.plan === "free" ? "active" : "incomplete");

  const charges: ChargeLine[] = [
    { label: `${plan.name} Plan`, amountPaise: plan.pricePaise },
  ];
  if (extraDmBlocks > 0) {
    charges.push({
      label: `Extra DMs (${(extraDmBlocks * EXTRA_DM_BLOCK).toLocaleString("en-IN")})`,
      amountPaise: extraDmBlocks * EXTRA_DM_BLOCK_PAISE,
    });
  }

  const subtotalPaise = charges.reduce((sum, c) => sum + c.amountPaise, 0);
  // Round once, on the tax line — rounding each charge drifts from the invoice.
  const gstPaise = Math.round(subtotalPaise * GST_RATE);

  return {
    plan,
    status,
    active: status === "active" || status === "trialing",
    usage: dmUsage(row),
    nextBillingDate: row.dm_count_month_reset_at,
    daysRemaining: daysUntil(row.dm_count_month_reset_at, now),
    charges,
    subtotalPaise,
    gstPaise,
    totalPaise: subtotalPaise + gstPaise,
  };
}

/** Human label for the status chip next to the plan name. */
export function statusLabel(status: SubscriptionStatus): string {
  return {
    active: "Active",
    trialing: "Trial",
    past_due: "Past due",
    canceled: "Canceled",
    incomplete: "Incomplete",
  }[status];
}

/** The plan a user would move up to, or null at the top of the ladder. */
export function nextPlanUp(plan: Plan): PlanInfo | null {
  if (plan === "free") return PLANS.pro;
  if (plan === "pro") return PLANS.platinum;
  return null;
}

// ------------------------------------------------------------------
// STUB — no tables behind these yet.
//
// TODO(razorpay): replace with reads from `invoices` / `payment_methods`
// populated by the Razorpay webhook. Signatures already return what the
// components consume, so only these two bodies change.
// ------------------------------------------------------------------

/**
 * Past invoices, newest first. Generated backwards from the next billing date
 * so the dates line up with the real subscription, and truncated at the account
 * creation date so a week-old account doesn't show a year of history.
 */
export function stubInvoices(
  summary: BillingSummary,
  createdAt: string,
  count = 5,
): Invoice[] {
  const anchor = new Date(summary.nextBillingDate);
  const created = new Date(createdAt).getTime();
  const invoices: Invoice[] = [];

  for (let i = 1; i <= count; i += 1) {
    const date = new Date(anchor);
    date.setMonth(date.getMonth() - i);
    if (date.getTime() < created) break;

    invoices.push({
      id: `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`,
      date: date.toISOString(),
      amountPaise: summary.totalPaise,
      status: "paid",
      downloadUrl: null,
    });
  }

  return invoices;
}

/**
 * Extra-DM top-ups bought this cycle, in blocks of EXTRA_DM_BLOCK. Paid plans
 * show one so the charge line is exercised; free plans can't top up.
 */
export function stubExtraDmBlocks(plan: Plan): number {
  return plan === "free" ? 0 : 1;
}

/** The card on file. Null means "nothing saved yet" and the UI asks for one. */
export function stubPaymentMethod(
  summary: BillingSummary,
): PaymentMethod | null {
  if (summary.plan.pricePaise === 0) return null;
  return { brand: "Visa", last4: "4242", expiry: "08/26" };
}
