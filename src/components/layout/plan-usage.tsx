// Plan usage meter, pinned above the profile chip. Running out of DMs stops
// every automation at once, so this is the one metric that earns permanent
// chrome. It turns amber at 80% and red at 95% — early enough to act on, late
// enough not to be noise.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/dashboard";
import type { ShellUsage, ShellUser } from "./types";

export function PlanUsage({
  usage,
  plan,
}: {
  usage: ShellUsage;
  plan: ShellUser["plan"];
}) {
  const critical = usage.pct >= 95;
  const near = usage.pct >= 80;

  return (
    <div className="mx-3 mb-3 rounded-xl border border-border-default bg-surface-app px-3.5 py-3">
      <p className="text-[11px] font-semibold tracking-[0.055em] text-ink-tertiary uppercase">
        Plan Usage
      </p>
      <p className="text-[11px] text-ink-muted">This month</p>

      <p
        className={cn(
          "wz-font-mono mt-2 text-[26px] leading-none font-semibold tracking-[-0.4px]",
          critical ? "text-danger" : near ? "text-warning-text" : "text-ink",
        )}
      >
        {Math.round(usage.pct)}%
      </p>

      <p className="mt-1.5 text-[11px] text-ink-muted">
        {formatCount(usage.used)} / {formatCount(usage.limit)} DMs used
      </p>

      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={Math.round(usage.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Monthly DM allowance used"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 [transition-timing-function:var(--ease-decelerate)]",
            critical ? "bg-danger" : "bg-brand",
          )}
          style={{ width: `${Math.max(2, Math.min(100, usage.pct))}%` }}
        />
      </div>

      {/* Platinum has nowhere left to upgrade to, so it gets no dead button. */}
      {plan !== "platinum" && (
        <Link
          href="/billing?upgrade=pro"
          className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Upgrade Plan
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
