// The one sentence that summarises the period, on a warm wash so it reads as
// commentary rather than another metric card. Renders nothing when there is
// nothing true to say — see buildInsight.

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { Insight } from "@/lib/dashboard/query";

export function InsightBanner({ insight }: { insight: Insight | null }) {
  if (!insight) return null;

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-xl border border-border-default bg-warning-bg px-4 py-3.5">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-card text-brand"
        aria-hidden
      >
        <Sparkles className="size-4" />
      </span>

      <div className="min-w-[220px] flex-1">
        <p className="text-[13px] font-medium text-ink">{insight.headline}</p>
        {insight.detail && (
          <p className="mt-0.5 text-[12px] text-warning-text">
            {insight.detail}
          </p>
        )}
      </div>

      <Link
        href="/analytics"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        View Insights
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}
