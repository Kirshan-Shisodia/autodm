// Integration Usage. Three meters against their published quotas. Bars fill in
// brand amber and only turn red once a quota is genuinely at risk — alarm is
// reserved for the moment it means something.
//
// NOTE: the numbers here are stubs derived in lib/accounts.ts. See the TODO on
// `integrationUsage` before treating these as real.

import { Link2, Webhook } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount, percentOf, type IntegrationUsageRow } from "@/lib/accounts";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "./platform-icon";

export function IntegrationUsage({ rows }: { rows: IntegrationUsageRow[] }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <h2 className="border-b border-border-default px-4 py-3.5 text-[13px] font-semibold text-ink">
        Integration Usage
      </h2>

      <ul className="divide-y divide-border-subtle">
        {rows.map((row) => {
          const pct = percentOf(row);
          const bar =
            pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning-text" : "bg-brand";

          return (
            <li
              key={row.key}
              className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:gap-4"
            >
              <div className="flex min-w-0 items-center gap-2.5 lg:w-56 lg:shrink-0">
                {row.platform === "webhook" ? (
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-tertiary"
                    aria-hidden
                  >
                    <Webhook className="size-3.5" />
                  </span>
                ) : (
                  <PlatformIcon platform={row.platform} size="sm" />
                )}
                <span className="truncate text-[13px] text-ink">
                  {row.label}
                </span>
              </div>

              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${row.label} quota used`}
              >
                <div
                  className={cn("h-full rounded-full", bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <span className="text-[12px] text-ink-muted">
                  <span className="wz-font-mono font-medium text-ink-secondary">
                    {pct}%
                  </span>{" "}
                  used
                </span>
                <span className="wz-font-mono text-[12px] text-ink-muted lg:w-36 lg:text-right">
                  {formatCount(row.used)} / {formatCount(row.limit)} calls
                </span>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border-default bg-surface-card text-[12px] text-ink-secondary hover:bg-hover-bg"
                >
                  <a href="/analytics">
                    <Link2 className="size-3.5" />
                    View Usage
                  </a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
