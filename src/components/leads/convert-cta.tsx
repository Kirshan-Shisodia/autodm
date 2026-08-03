// The rail's closing card. Every other surface on this page describes what
// already happened; this one is the only thing on screen that changes what
// happens next, so it gets the page's single filled button.

import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

export function ConvertCta({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border-default bg-surface-card px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.16px] text-ink">
          Turn more leads into customers
        </h2>
        <p className="mt-1 text-[12px] leading-[18px] text-ink-tertiary">
          Create automations that engage your leads and boost conversions.
        </p>
        <Link
          href="/automations/new"
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-[12px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Create Automation
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-tertiary max-sm:hidden"
        aria-hidden
      >
        <Workflow className="size-6" />
      </span>
    </section>
  );
}
