// KPI row (spec §5). Four cards, white fill, 1px border, no shadow.
// Every number renders in mono, tabular figures — the brand touch on this screen.

import { Info } from "lucide-react";

import { formatCount } from "@/lib/dashboard";

function Card({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)] p-5 transition-colors duration-200 [transition-timing-function:var(--ease-standard)] hover:border-border-strong">
      <div className="text-xs font-medium tracking-[0.055em] text-ink-tertiary uppercase">
        {label}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function KpiCards({
  dmCount,
  dmLimit,
  activeAutomations,
  linkClicks,
}: {
  dmCount: number;
  dmLimit: number;
  activeAutomations: number;
  linkClicks: number;
}) {
  const pct = dmLimit > 0 ? Math.min(100, (dmCount / dmLimit) * 100) : 0;
  const nearLimit = pct >= 90;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* DMs this month */}
      <Card label="DMs this month">
        <div className="wz-font-mono text-[28px] leading-none font-medium text-[var(--wz-text)]">
          {formatCount(dmCount)}
          <span className="text-base text-[var(--wz-text-muted)]">
            {" "}
            / {formatCount(dmLimit)}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--wz-surface)]"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly DM usage"
        >
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${pct}%`,
              backgroundColor: nearLimit
                ? "var(--wz-accent-pop)"
                : "var(--wz-accent)",
            }}
          />
        </div>
      </Card>

      {/* Active automations */}
      <Card label="Active automations">
        <div className="wz-font-mono text-[28px] leading-none font-medium text-[var(--wz-text)]">
          {formatCount(activeAutomations)}
        </div>
        <div className="mt-3 text-xs text-[var(--wz-text-muted)]">
          currently running
        </div>
      </Card>

      {/* Link clicks this month */}
      <Card label="Link clicks">
        <div className="wz-font-mono text-[28px] leading-none font-medium text-[var(--wz-text)]">
          {formatCount(linkClicks)}
        </div>
        <div className="mt-3 text-xs text-[var(--wz-text-muted)]">this month</div>
      </Card>

      {/* Open rate — not reportable */}
      <Card
        label={
          <span className="inline-flex items-center gap-1.5">
            Open rate
            <span
              className="inline-flex cursor-help text-[var(--wz-text-muted)]"
              title="Instagram doesn't report DM opens."
              aria-label="Instagram doesn't report DM opens."
            >
              <Info className="size-3.5" />
            </span>
          </span>
        }
      >
        <div className="wz-font-mono text-[28px] leading-none font-medium text-[var(--wz-text-muted)]">
          N/A
        </div>
        <div className="mt-3 text-xs text-[var(--wz-text-muted)]">
          not reported by Instagram
        </div>
      </Card>
    </div>
  );
}
