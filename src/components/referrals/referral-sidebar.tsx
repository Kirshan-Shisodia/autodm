// The right rail: where you are on the ladder, what the tier pays, and the
// four-step explainer. Flat cards, one accent per card — HALO Rule 4 keeps the
// single dark-ink CTA on the page for the share panel, so everything here is a
// quiet secondary link.

import Link from "next/link";
import { ArrowRight, Award, Gift, Sparkles } from "lucide-react";

import {
  HOW_IT_WORKS,
  rewardLines,
  type TierProgress,
} from "@/lib/referrals";

function TierCard({ progress }: { progress: TierProgress }) {
  const { current, next, remaining, pct } = progress;

  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Referral Progress</h2>
        <Link
          href="/referrals/tiers"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-2.5 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View Tiers
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-selected-bg text-brand"
          aria-hidden
        >
          <Award className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink">{current.name}</p>
          <p className="mt-0.5 text-[12px] text-ink-tertiary">{current.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={
            next
              ? `${pct}% of the way to ${next.name}`
              : "Top tier reached"
          }
        >
          <span
            className="block h-full rounded-full bg-brand"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="wz-font-mono text-[12px] font-medium text-ink">
          {pct}%
        </span>
      </div>

      <p className="mt-3 text-center text-[12px] text-ink-tertiary">
        {next ? (
          <>
            Refer{" "}
            <span className="wz-font-mono font-medium text-ink">
              {remaining}
            </span>{" "}
            more {remaining === 1 ? "user" : "users"} to unlock{" "}
            <span className="font-semibold text-ink">
              {next.name.replace(" Tier", "")}
            </span>{" "}
            tier
          </>
        ) : (
          "You're at the top tier — rewards are at their best."
        )}
      </p>
    </section>
  );
}

function RewardsCard({ progress }: { progress: TierProgress }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">Rewards</h2>

      <ul className="mt-4 space-y-2.5">
        {rewardLines(progress.current).map((line) => (
          <li
            key={line.label}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="flex items-center gap-2 text-[13px] text-ink-secondary">
              <span
                className="size-1.5 shrink-0 rounded-full bg-brand"
                aria-hidden
              />
              {line.label}
            </span>
            <span className="wz-font-mono text-[13px] font-medium text-ink">
              {line.value}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/help/referral-rewards"
        className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-brand/25 bg-warning-bg text-[13px] font-medium text-warning-text transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-selected-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Sparkles className="size-4" aria-hidden />
        How Rewards Work
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

function HowItWorksCard() {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">How It Works</h2>

      <ol className="mt-4 space-y-3">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5">
            <span
              className="wz-font-mono mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-ink-secondary"
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="text-[13px] leading-snug text-ink-secondary">
              {step}
            </span>
          </li>
        ))}
      </ol>

      <Link
        href="/help/referral-program"
        className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-card text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <Gift className="size-4 text-ink-muted" aria-hidden />
        Learn More
      </Link>
    </section>
  );
}

export function ReferralSidebar({ progress }: { progress: TierProgress }) {
  return (
    <div className="space-y-4">
      <TierCard progress={progress} />
      <RewardsCard progress={progress} />
      <HowItWorksCard />
    </div>
  );
}
