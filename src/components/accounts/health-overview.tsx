// Account Health Overview. A single ring carries the headline number; the
// checks beside it say what the ring is made of, so the figure is never a
// number without a reason.

import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HealthCheck } from "@/lib/accounts";

const R = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function HealthOverview({
  percent,
  checks,
}: {
  percent: number;
  checks: HealthCheck[];
}) {
  const tone =
    percent >= 100
      ? "text-success"
      : percent >= 70
        ? "text-warning-text"
        : "text-danger";

  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <h2 className="border-b border-border-default px-4 py-3.5 text-[13px] font-semibold text-ink">
        Account Health Overview
      </h2>

      <div className="flex flex-col items-center gap-6 px-4 py-5 sm:flex-row sm:items-center">
        <Ring percent={percent} tone={tone} />

        <ul className="w-full flex-1 space-y-3">
          {checks.map((check) => {
            const ok = check.total > 0 && check.passed === check.total;
            return (
              <li key={check.key} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full",
                    ok
                      ? "bg-success-bg text-success"
                      : "bg-warning-bg text-warning-text",
                  )}
                  aria-hidden
                >
                  {ok ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <span className="flex-1 text-[13px] text-ink-secondary">
                  {check.label}
                </span>
                <span className="wz-font-mono shrink-0 text-[12px] text-ink-muted">
                  {check.passed}/{check.total} accounts
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-border-default px-4 py-3">
        <Link
          href="/settings#health"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand transition-colors hover:text-brand-hover"
        >
          View health details
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Ring({ percent, tone }: { percent: number; tone: string }) {
  const dash = (Math.min(100, Math.max(0, percent)) / 100) * CIRCUMFERENCE;

  return (
    <div className="relative shrink-0">
      <svg
        viewBox="0 0 104 104"
        className="size-[104px] -rotate-90"
        role="img"
        aria-label={`${percent}% of health checks passing`}
      >
        <circle
          cx="52"
          cy="52"
          r={R}
          fill="none"
          strokeWidth="10"
          className="stroke-surface-muted"
        />
        <circle
          cx="52"
          cy="52"
          r={R}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className={cn("stroke-current", tone)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "wz-font-mono text-[20px] leading-none font-semibold",
            tone,
          )}
        >
          {percent}%
        </span>
        <span className="mt-1 text-[11px] text-ink-muted">Healthy</span>
      </div>
    </div>
  );
}
