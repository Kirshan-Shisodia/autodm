// The bottom escape hatch: a warm banner for people the articles didn't reach.
// This is the one dark-ink CTA on the page — HALO Rule 4, one primary action
// per surface, so every other button here stays a hairline ghost.

import Link from "next/link";
import { ArrowRight, Headset } from "lucide-react";

export function StillNeedHelp() {
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border border-brand/20 bg-warning-bg p-6 sm:flex-row sm:items-center">
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-selected-bg text-brand"
        aria-hidden
      >
        <Headset className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-semibold text-ink">
          Still need help?
        </h2>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Our support team is here for you. Get personalized assistance whenever
          you need it.
        </p>
      </div>

      <Link
        href="/help/contact"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-brand-hover active:bg-brand-pressed focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Contact Support
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
