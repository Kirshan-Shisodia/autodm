// Need Help? — the support exit. Sits at the very bottom because that's where
// people land when the rest of the page didn't answer their question.

import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";

export function HelpCard({ className }: { className?: string }) {
  return (
    <section
      className={`flex items-center gap-4 rounded-xl border border-border-default bg-surface-card px-5 py-4 ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-semibold tracking-[-0.16px] text-ink">
          Need Help?
        </h2>
        <p className="mt-0.5 text-[12px] text-ink-tertiary">
          Check our help docs or contact support.
        </p>
        <Link
          href="/help"
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-default px-3 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Visit Help Center
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-tertiary max-sm:hidden"
        aria-hidden
      >
        <Headphones className="size-6" />
      </span>
    </section>
  );
}
