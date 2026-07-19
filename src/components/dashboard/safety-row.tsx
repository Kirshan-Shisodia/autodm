// Safety row (spec §5.4) — "am I within limits?". Plan usage + hourly send
// capacity, each a labelled meter with mono numerals. Thresholds flip the fill
// to warning at ≥80% and danger at ≥95%/at-cap. Non-chart (the Recharts gauge
// is deferred with the rest of the data-viz palette, spec §2.7); a bar reads
// the same signal without an unsanctioned colour.

import Link from "next/link";

import { formatCount } from "@/lib/dashboard";
import { HOURLY_DM_CAP } from "@/components/dashboard/account-health";

function tone(pct: number): "normal" | "warning" | "danger" {
  if (pct >= 95) return "danger";
  if (pct >= 80) return "warning";
  return "normal";
}

// warning indicator == brand amber (#a96b24); danger uses the HALO danger ink.
const FILL: Record<"normal" | "warning" | "danger", string> = {
  normal: "bg-brand",
  warning: "bg-brand",
  danger: "bg-danger",
};

const LABEL: Record<"normal" | "warning" | "danger", string> = {
  normal: "text-ink-tertiary",
  warning: "text-warning-text",
  danger: "text-danger",
};

function Meter({
  title,
  used,
  limit,
  hint,
  action,
}: {
  title: string;
  used: number;
  limit: number;
  hint: string;
  action?: { href: string; label: string };
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const t = tone(pct);

  return (
    <section className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)] p-5 transition-colors duration-200 [transition-timing-function:var(--ease-standard)] hover:border-border-strong">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium tracking-[0.055em] text-ink-tertiary uppercase">
          {title}
        </h2>
        {t !== "normal" && action && (
          <Link
            href={action.href}
            className="text-xs font-medium text-brand hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>

      <div className="mt-3 wz-font-mono text-[28px] leading-none font-medium text-[var(--wz-text)]">
        {formatCount(used)}
        <span className={`text-base ${LABEL[t]}`}> / {formatCount(limit)}</span>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--wz-surface)]"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div
          className={`h-full rounded-full ${FILL[t]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-ink-tertiary">{hint}</p>
    </section>
  );
}

export function SafetyRow({
  dmCount,
  dmLimit,
  hourlySends,
  accountCount,
}: {
  dmCount: number;
  dmLimit: number;
  hourlySends: number;
  accountCount: number;
}) {
  const hourlyCap = Math.max(1, accountCount) * HOURLY_DM_CAP;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Meter
        title="Plan usage this month"
        used={dmCount}
        limit={dmLimit}
        hint="DMs sent against your monthly allowance."
        action={{ href: "/billing", label: "Upgrade" }}
      />
      <Meter
        title="Hourly capacity"
        used={hourlySends}
        limit={hourlyCap}
        hint={
          accountCount > 0
            ? "Sends in the last hour across your accounts."
            : "Connect an account to start sending."
        }
      />
    </div>
  );
}
