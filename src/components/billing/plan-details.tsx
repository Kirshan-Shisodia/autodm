// "Your Plan Details" — three columns on desktop: what the plan is, what it
// includes, and how much of the DM allowance is gone. The allowance column sits
// behind a hairline divider because it's the only live number on the card.

import Link from "next/link";
import { ArrowRight, Check, Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/dashboard";
import { formatDate, type BillingSummary } from "@/lib/billing";

function UsageMeter({ usage }: { usage: BillingSummary["usage"] }) {
  const pct = Math.round(usage.percent);

  return (
    <div>
      <p className="text-[12px] font-medium text-ink-tertiary">DMs Usage</p>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="wz-font-mono text-[26px] leading-none font-semibold tracking-[-0.4px] text-ink">
          {formatCount(usage.used)}
          <span className="ml-1 text-[15px] font-medium text-ink-muted">
            / {formatCount(usage.limit)}
          </span>
        </p>
        <span
          className={cn(
            "wz-font-mono text-[13px] font-semibold",
            usage.tone === "critical"
              ? "text-danger"
              : usage.tone === "near"
                ? "text-warning-text"
                : "text-ink-tertiary",
          )}
        >
          {pct}%
        </span>
      </div>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly DM allowance used"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 [transition-timing-function:var(--ease-decelerate)]",
            usage.tone === "critical" ? "bg-danger" : "bg-brand",
          )}
          style={{ width: `${Math.max(2, Math.min(100, usage.percent))}%` }}
        />
      </div>

      <p className="mt-2.5 text-[11px] text-ink-muted">
        Resets on {formatDate(usage.resetAt)}
      </p>

      <Link
        href="/billing/extra-dms"
        className="mt-4 inline-flex h-8 items-center rounded-lg border border-border-default bg-surface-card px-3 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        Buy More DMs
      </Link>
    </div>
  );
}

export function PlanDetails({ summary }: { summary: BillingSummary }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <header className="border-b border-border-default px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">Your Plan Details</h2>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* ---- Identity ---- */}
        <div>
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-warning-bg text-warning-text"
            aria-hidden
          >
            <Crown className="size-5" />
          </span>
          <h3 className="mt-4 text-[19px] leading-tight font-semibold tracking-[-0.4px] text-ink">
            {summary.plan.name} Plan
          </h3>
          <p className="mt-1.5 max-w-[34ch] text-[13px] text-ink-tertiary">
            {summary.plan.blurb}
          </p>
          <Link
            href="/billing/plans"
            className="mt-5 inline-flex h-9 items-center rounded-lg border border-border-default bg-surface-card px-3.5 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            Change Plan
          </Link>
        </div>

        {/* ---- Features ---- */}
        <div className="lg:border-l lg:border-border-default lg:pl-6">
          <ul className="space-y-2.5">
            {summary.plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span
                  className="flex size-4 shrink-0 items-center justify-center rounded-[5px] bg-success-bg text-success"
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-[13px] text-ink-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/billing/plans"
            className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            View all features
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {/* ---- Allowance ---- */}
        <div className="xl:border-l xl:border-border-default xl:pl-6">
          <UsageMeter usage={summary.usage} />
        </div>
      </div>
    </section>
  );
}
