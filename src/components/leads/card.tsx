// The shared Leads card shell — same material as the Analytics cards. Flat,
// white, hairline border (HALO Rule 2: data surfaces don't float), so the rail
// and the table read as one page rather than a pile of widgets.

import { cn } from "@/lib/utils";

export function LeadsCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  /** Right-aligned control — a "View all" link, a menu. */
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
            <h2 className="text-[15px] font-semibold tracking-[-0.16px] text-ink">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className={cn("flex-1 px-5 pt-2 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function CardEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-[13px] text-ink-muted">{children}</p>
  );
}

/** A labelled proportion bar. Used by both Leads by Source and Top Tags. */
export function MeterRow({
  label,
  value,
  pct,
  tone = "brand",
}: {
  label: React.ReactNode;
  /** Right-aligned readout — "521 (41%)" for sources, "512" for tags. */
  value: React.ReactNode;
  /** 0–100. */
  pct: number;
  tone?: "brand" | "muted";
}) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <div className="min-w-0 flex-1">{label}</div>
      <div
        className="hidden h-1.5 w-[110px] shrink-0 overflow-hidden rounded-full bg-surface-muted sm:block"
        role="presentation"
      >
        <div
          className={cn(
            "h-full rounded-full",
            tone === "brand" ? "bg-brand" : "bg-border-strong",
          )}
          // A 0% bar and a 1% bar should look different; 2% is the floor at
          // which the rounded cap is still visible.
          style={{ width: `${pct === 0 ? 0 : Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
      <span className="wz-font-mono w-[78px] shrink-0 text-right text-[12px] text-ink-secondary tabular-nums">
        {value}
      </span>
    </li>
  );
}
