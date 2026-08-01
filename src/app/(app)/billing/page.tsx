// Billing. Lives inside the (app) shell so it gets the sidebar; auth is already
// enforced by that layout. Everything on screen is derived in lib/billing.ts —
// this file only fetches and arranges.

import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleHelp, CreditCard, ReceiptText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/dashboard";
import {
  billingSummary,
  nextPlanUp,
  statusLabel,
  stubExtraDmBlocks,
  stubInvoices,
  stubPaymentMethod,
  type BillingUserRow,
} from "@/lib/billing";
import { BillingSummaryCards } from "@/components/billing/summary-cards";
import { PlanDetails } from "@/components/billing/plan-details";
import { InvoiceHistory } from "@/components/billing/invoice-history";
import { BillingSidebar } from "@/components/billing/billing-sidebar";

const SELECT =
  "plan, subscription_status, dm_count_month, dm_count_month_reset_at, created_at";

export const metadata = {
  title: "Billing · ChatPilott",
  description: "Manage your subscription, payments and invoices.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const { upgrade } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(SELECT)
    .eq("id", user.id)
    .single();

  const row: BillingUserRow = {
    plan: (profile?.plan ?? "free") as Plan,
    subscription_status: profile?.subscription_status ?? null,
    dm_count_month: profile?.dm_count_month ?? 0,
    dm_count_month_reset_at:
      profile?.dm_count_month_reset_at ?? new Date().toISOString(),
    created_at: profile?.created_at ?? new Date().toISOString(),
  };

  const summary = billingSummary(row, stubExtraDmBlocks(row.plan));
  const invoices = stubInvoices(summary, row.created_at);
  const method = stubPaymentMethod(summary);
  const upsell = nextPlanUp(row.plan);

  return (
    <div className="space-y-5">
      {/* ---------------- Page header ---------------- */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[22px]">
            Billing
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Manage your subscription, payments and invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HeaderLink href="/billing/invoices" icon={ReceiptText}>
            Billing History
          </HeaderLink>
          <HeaderLink href="/billing/payment-methods" icon={CreditCard}>
            Payment Methods
          </HeaderLink>
          <HeaderLink href="/help" icon={CircleHelp}>
            Help
          </HeaderLink>
        </div>
      </div>

      {/* Arriving from a Pro nav item or the sidebar meter. */}
      {upgrade && upsell && (
        <Banner tone="brand">
          <span>
            <strong className="font-semibold">{upsell.name}</strong> unlocks that
            feature, along with{" "}
            {upsell.dmLimit.toLocaleString("en-IN")} DMs a month.
          </span>
          <Link
            href="/billing/plans"
            className="shrink-0 font-medium underline underline-offset-2"
          >
            Compare plans
          </Link>
        </Banner>
      )}

      {!summary.active && (
        <Banner tone="danger">
          <span>
            Your subscription is {statusLabel(summary.status).toLowerCase()}.
            Automations stop running until payment succeeds.
          </span>
          <Link
            href="/billing/payment-methods"
            className="shrink-0 font-medium underline underline-offset-2"
          >
            Update payment method
          </Link>
        </Banner>
      )}

      {/* ---------------- Summary strip ---------------- */}
      <BillingSummaryCards summary={summary} method={method} />

      {/* ---------------- Plan + invoices, with the charges rail ---------------- */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <PlanDetails summary={summary} />
          <InvoiceHistory invoices={invoices} />
        </div>

        <BillingSidebar summary={summary} />
      </div>
    </div>
  );
}

function HeaderLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof CreditCard;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
    >
      <Icon className="size-4 text-ink-muted" aria-hidden />
      {children}
    </Link>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "brand" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    brand: "border-brand/25 bg-warning-bg text-warning-text",
    danger: "border-danger/25 bg-danger-bg text-danger",
  }[tone];

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[13px] ${styles}`}
    >
      {children}
    </div>
  );
}
