// The five-card strip at the top of Referrals. Flat cards, hairline borders,
// mono numerals — HALO Rule 2: data surfaces don't float. Deltas are never
// colour-only; the arrow glyph carries the direction too.

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  Gift,
  TrendingUp,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatReward, type ReferralSummary } from "@/lib/referrals";

function Delta({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <p className="mt-3 text-[11px] text-ink-muted">No change vs last period</p>
    );
  }

  const up = pct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <p className="mt-3 flex items-center gap-1 text-[11px] text-ink-muted">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          up ? "text-success" : "text-danger",
        )}
      >
        <Icon className="size-3" aria-hidden />
        <span className="wz-font-mono">{Math.abs(pct)}%</span>
      </span>
      vs last 30 days
    </p>
  );
}

function Card({
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

const VALUE =
  "wz-font-mono mt-3 text-[30px] leading-none font-semibold tracking-[-0.4px] text-ink";

export function ReferralStatCards({
  summary,
  trends,
}: {
  summary: ReferralSummary;
  trends: { total: number; successful: number; earned: number; conversion: number };
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Card
        icon={UserPlus}
        tile="bg-surface-muted text-ink-secondary"
        label="Total Referrals"
      >
        <div className={VALUE}>{summary.total}</div>
        <Delta pct={trends.total} />
      </Card>

      <Card
        icon={CircleCheck}
        tile="bg-success-bg text-success"
        label="Successful Referrals"
      >
        <div className={VALUE}>{summary.successful}</div>
        <Delta pct={trends.successful} />
      </Card>

      <Card icon={Gift} tile="bg-selected-bg text-brand" label="Rewards Earned">
        <div className={VALUE}>{formatReward(summary.earnedPaise)}</div>
        <Delta pct={trends.earned} />
      </Card>

      <Card
        icon={Wallet}
        tile="bg-warning-bg text-warning-text"
        label="Reward Balance"
      >
        <div className={VALUE}>{formatReward(summary.balancePaise)}</div>
        <div className="mt-3">
          {summary.balancePaise > 0 ? (
            <Link
              href="/billing/rewards"
              className="inline-flex h-7 items-center rounded-lg border border-brand/25 bg-warning-bg px-2.5 text-[12px] font-medium text-warning-text transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-selected-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              Redeem Now
            </Link>
          ) : (
            <p className="text-[11px] text-ink-muted">Nothing to redeem yet</p>
          )}
        </div>
      </Card>

      <Card
        icon={TrendingUp}
        tile="bg-running-bg text-running"
        label="Conversion Rate"
      >
        <div className={VALUE}>{summary.conversionRate}%</div>
        <Delta pct={trends.conversion} />
      </Card>
    </div>
  );
}
