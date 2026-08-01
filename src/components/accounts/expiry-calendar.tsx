// Token Expiry Calendar. The same expiry data as the table, sorted by urgency
// rather than by account — this is the panel you scan when something is about
// to break.

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  expiryLabel,
  expiryTone,
  formatDate,
  type ConnectionItem,
} from "@/lib/accounts";

export function ExpiryCalendar({ items }: { items: ConnectionItem[] }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3.5">
        <h2 className="text-[13px] font-semibold text-ink">
          Token Expiry Calendar
        </h2>
        <Link
          href="/accounts?view=calendar"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand transition-colors hover:text-brand-hover"
        >
          View calendar
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-ink-tertiary">
          No tokens with an expiry date on record.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-tertiary"
                aria-hidden
              >
                <CalendarDays className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">
                  {item.title}
                </div>
                <div className="truncate text-[12px] text-ink-muted">
                  {item.platformLabel} {item.subtitle}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="wz-font-mono text-[12px] text-ink-secondary">
                  {formatDate(item.tokenExpiresAt)}
                </div>
                <span
                  className={cn(
                    "wz-font-mono mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                    expiryTone(item.daysLeft),
                  )}
                >
                  {expiryLabel(item.daysLeft)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
