// The shared Analytics card shell. Flat, white, hairline border — HALO Rule 2:
// data surfaces don't float. Every card on the page is one of these, so the
// grid reads as a single material rather than a pile of widgets.

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

export function AnalyticsCard({
  title,
  hint,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  /** Small tooltip glyph next to the title, for a definition the number needs. */
  hint?: string;
  /** Right-aligned control — a toggle, a "View all" link, a menu. */
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border-default bg-surface-card",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex min-h-[52px] items-center justify-between gap-3 px-5 pt-4 pb-1">
          {title && (
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.16px] text-ink">
              {title}
              {hint && (
                <span title={hint} className="text-ink-muted">
                  <Info className="size-3.5" aria-hidden />
                  <span className="sr-only">{hint}</span>
                </span>
              )}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className={cn("flex-1 px-5 pt-2 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * Marks a surface the schema can't fill yet. Honest beats invented — an empty
 * state here is a product gap, not a loading state, and says so.
 */
export function NotTracked({
  label,
  detail,
  className,
}: {
  label: string;
  detail: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border border-dashed border-border-strong bg-surface-app px-3.5 py-3",
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.055em] text-ink-tertiary uppercase">
        {label}
      </span>
      <span className="text-[12px] leading-[18px] text-ink-muted">{detail}</span>
    </div>
  );
}

/** Inline "not tracked yet" chip for a single row inside an otherwise live card. */
export function StubChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-border-strong px-1.5 py-0.5 text-[10px] font-medium tracking-[0.03em] text-ink-muted uppercase",
        className,
      )}
    >
      Not tracked
    </span>
  );
}

export function CardEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-[13px] text-ink-muted">{children}</p>
  );
}
