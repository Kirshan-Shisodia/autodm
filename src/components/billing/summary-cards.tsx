// The four-card strip at the top of Billing: plan, price, next charge, card on
// file. Flat cards, hairline borders, mono numerals — HALO Rule 2: data
// surfaces don't float.

import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Crown,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDate,
  formatINRWhole,
  statusLabel,
  type BillingSummary,
  type PaymentMethod,
} from "@/lib/billing";

function Shell({
  icon: Icon,
  tile,
  label,
  children,
}: {
  icon: LucideIcon;
  tile: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-card px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            tile,
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <span className="text-[12px] font-medium text-ink-tertiary">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function BillingSummaryCards({
  summary,
  method,
}: {
  summary: BillingSummary;
  method: PaymentMethod | null;
}) {
  const free = summary.plan.pricePaise === 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* ---- Current plan ---- */}
      <Shell
        icon={Crown}
        tile="bg-warning-bg text-warning-text"
        label="Current Plan"
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[22px] leading-none font-semibold tracking-[-0.4px] text-ink">
            {summary.plan.name}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              summary.active
                ? "bg-success-bg text-success"
                : "bg-danger-bg text-danger",
            )}
          >
            {statusLabel(summary.status)}
          </span>
        </div>
        <p className="mt-2.5 text-[11px] text-ink-muted">
          {free
            ? "No renewal — this plan is free"
            : `Renews on ${formatDate(summary.nextBillingDate)}`}
        </p>
      </Shell>

      {/* ---- Monthly price ---- */}
      <Shell
        icon={IndianRupee}
        tile="bg-success-bg text-success"
        label="Monthly Price"
      >
        <div className="wz-font-mono mt-3 text-[30px] leading-none font-semibold tracking-[-0.4px] text-ink">
          {free ? "₹0" : formatINRWhole(summary.plan.pricePaise)}
        </div>
        <p className="mt-2.5 text-[11px] text-ink-muted">
          {free ? "Free forever" : "Billed monthly"}
        </p>
      </Shell>

      {/* ---- Next billing date ---- */}
      <Shell
        icon={CalendarDays}
        tile="bg-selected-bg text-brand"
        label={free ? "Allowance Resets" : "Next Billing Date"}
      >
        <div className="mt-3 text-[22px] leading-none font-semibold tracking-[-0.4px] text-ink">
          {formatDate(summary.nextBillingDate)}
        </div>
        <p className="mt-2.5 text-[11px] text-ink-muted">
          {summary.daysRemaining === 0
            ? "Due today"
            : `${summary.daysRemaining} day${summary.daysRemaining === 1 ? "" : "s"} remaining`}
        </p>
      </Shell>

      {/* ---- Payment method ---- */}
      <Shell
        icon={CreditCard}
        tile="bg-surface-muted text-ink-secondary"
        label="Payment Method"
      >
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[22px] leading-none font-semibold tracking-[-0.4px] text-ink">
              {method ? (
                <>
                  {method.brand}{" "}
                  <span className="wz-font-mono text-ink-tertiary">••••</span>{" "}
                  <span className="wz-font-mono">{method.last4}</span>
                </>
              ) : (
                "None"
              )}
            </div>
            <p className="mt-2.5 text-[11px] text-ink-muted">
              {method ? `Expires ${method.expiry}` : "No card on file"}
            </p>
          </div>
          <Link
            href="/billing/payment-methods"
            className="shrink-0 rounded-lg border border-border-default bg-surface-card px-2.5 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            {method ? "Update" : "Add"}
          </Link>
        </div>
      </Shell>
    </div>
  );
}
