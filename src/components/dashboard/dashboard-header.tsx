"use client";

// The page header: greeting, date range, notifications, primary action.
//
// The range lives in the URL rather than React state, so the server component
// refetches on change, the back button works, and "last 90 days" is a link the
// user can bookmark. Same contract the Analytics header uses.

import { useCallback, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, CalendarDays, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ANALYTICS_RANGES,
  DEFAULT_RANGE,
  parseRange,
  rangeLabel,
} from "@/lib/analytics/model";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CONTROL =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";

export function DashboardHeader({
  greeting,
  name,
  /** Count of things worth a look — health warnings, mostly. 0 hides the dot. */
  alertCount,
}: {
  greeting: string;
  name: string;
  alertCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const range = parseRange(searchParams.get("range"));

  const setRange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      // The default is the absence of the param, not the param set to its
      // default — otherwise every dashboard link carries `?range=30d`.
      if (value === DEFAULT_RANGE) next.delete("range");
      else next.set("range", value);
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-[26px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[21px]">
          {greeting}, {name}!
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Here&rsquo;s what&rsquo;s happening with your automations today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className={CONTROL}>
            <CalendarDays className="size-4 text-ink-muted" aria-hidden />
            {rangeLabel(range)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={range}
              onValueChange={(v: string) => setRange(v)}
            >
              {ANALYTICS_RANGES.map((r) => (
                <DropdownMenuRadioItem key={r.value} value={r.value}>
                  {r.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          href="/accounts"
          aria-label={
            alertCount > 0
              ? `${alertCount} account issues need attention`
              : "Account health"
          }
          className={cn(CONTROL, "relative w-9 justify-center px-0")}
        >
          <Bell className="size-4" aria-hidden />
          {alertCount > 0 && (
            <span className="wz-font-mono absolute -top-1.5 -right-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-[18px] font-semibold text-ink-inverse">
              {alertCount}
            </span>
          )}
        </Link>

        <Link
          href="/automations/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-action px-3.5 text-[13px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Plus className="size-4" aria-hidden />
          New Automation
        </Link>

        {isPending && (
          <span className="sr-only" role="status">
            Updating dashboard
          </span>
        )}
      </div>
    </div>
  );
}
