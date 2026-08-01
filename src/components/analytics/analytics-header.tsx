"use client";

// Page header: title, date range, filters, export. All three controls are real.
//
// State lives in the URL rather than React, so the server component refetches,
// the browser back button works, and a filtered view is a shareable link. The
// export route reads the exact same params — the CSV always matches the screen.

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Download, Loader2, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ANALYTICS_RANGES,
  DM_STATUSES,
  activeFilterCount,
  parseFilters,
  parseRange,
  rangeLabel,
  type AnalyticsFilters,
  type RangeKey,
} from "@/lib/analytics/model";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Option = { id: string; label: string };

const TRIGGER =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50";

export function AnalyticsHeader({
  accounts,
  automations,
}: {
  accounts: Option[];
  automations: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const range = parseRange(searchParams.get("range"));
  const filters = useMemo(
    () =>
      parseFilters({
        accounts: searchParams.get("accounts"),
        automations: searchParams.get("automations"),
        statuses: searchParams.get("statuses"),
      }),
    [searchParams],
  );

  const filterCount = activeFilterCount(filters);

  /** Rewrite one param and navigate. Empty values are removed, not blanked. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleIn = useCallback(
    (key: keyof AnalyticsFilters, id: string) => {
      const current = filters[key];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      setParam(key, next.length ? next.join(",") : null);
    },
    [filters, setParam],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("accounts");
    next.delete("automations");
    next.delete("statuses");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  /**
   * Fetch rather than a plain link so a failed export surfaces as an error
   * instead of navigating the user to a blank tab.
   */
  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/analytics/export?${searchParams.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatpilott-analytics-${range}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const { toast } = await import("sonner");
      toast.error("Couldn't export right now. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  }, [range, searchParams]);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[22px]">
          Analytics
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Track performance and growth of your Instagram automations.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* ---- Date range ---- */}
        <DropdownMenu>
          <DropdownMenuTrigger className={TRIGGER}>
            <CalendarDays className="size-4 text-ink-muted" aria-hidden />
            {rangeLabel(range)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={range}
              onValueChange={(v) =>
                setParam("range", v === "30d" ? null : (v as RangeKey))
              }
            >
              {ANALYTICS_RANGES.map((r) => (
                <DropdownMenuRadioItem key={r.value} value={r.value}>
                  {r.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ---- Filters ---- */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              TRIGGER,
              filterCount > 0 && "border-brand/45 bg-hover-bg text-ink",
            )}
          >
            <SlidersHorizontal className="size-4 text-ink-muted" aria-hidden />
            Filters
            {filterCount > 0 && (
              <span className="wz-font-mono rounded-full bg-brand px-1.5 text-[10px] leading-[16px] font-semibold text-ink-inverse">
                {filterCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[70vh] w-72 overflow-y-auto"
          >
            <FilterGroup
              label="Instagram account"
              options={accounts}
              selected={filters.accounts}
              onToggle={(id) => toggleIn("accounts", id)}
            />
            <DropdownMenuSeparator />
            <FilterGroup
              label="Automation"
              options={automations}
              selected={filters.automations}
              onToggle={(id) => toggleIn("automations", id)}
            />
            <DropdownMenuSeparator />
            <FilterGroup
              label="DM status"
              options={DM_STATUSES.map((s) => ({ id: s.value, label: s.label }))}
              selected={filters.statuses}
              onToggle={(id) => toggleIn("statuses", id)}
            />
            <p className="px-2 pt-1 pb-1.5 text-[11px] leading-[15px] text-ink-muted">
              Narrows DMs and link clicks. Leads have no status, so they stay
              unfiltered.
            </p>
            {filterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-hover-bg"
                >
                  <X className="size-3.5" aria-hidden />
                  Clear all filters
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ---- Export ---- */}
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className={TRIGGER}
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin text-ink-muted" aria-hidden />
          ) : (
            <Download className="size-4 text-ink-muted" aria-hidden />
          )}
          Export
        </button>

        {isPending && (
          <span className="sr-only" role="status">
            Updating analytics
          </span>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <DropdownMenuLabel className="text-[11px] font-semibold tracking-[0.055em] text-ink-muted uppercase">
        {label}
      </DropdownMenuLabel>
      {options.length === 0 ? (
        <p className="px-2 py-1.5 text-[12px] text-ink-muted">Nothing to filter yet.</p>
      ) : (
        options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={selected.includes(o.id)}
            onCheckedChange={() => onToggle(o.id)}
            onSelect={(e) => e.preventDefault()}
            className="text-[13px]"
          >
            <span className="truncate">{o.label}</span>
          </DropdownMenuCheckboxItem>
        ))
      )}
    </>
  );
}

/** Chips under the header summarising what's currently filtered out. */
export function ActiveFilterChips({
  accounts,
  automations,
}: {
  accounts: Option[];
  automations: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = parseFilters({
    accounts: searchParams.get("accounts"),
    automations: searchParams.get("automations"),
    statuses: searchParams.get("statuses"),
  });

  const labelFor = (key: keyof AnalyticsFilters, id: string) => {
    if (key === "accounts") return accounts.find((a) => a.id === id)?.label ?? id;
    if (key === "automations")
      return automations.find((a) => a.id === id)?.label ?? id;
    return DM_STATUSES.find((s) => s.value === id)?.label ?? id;
  };

  const remove = (key: keyof AnalyticsFilters, id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const rest = filters[key].filter((v) => v !== id);
    if (rest.length) next.set(key, rest.join(","));
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const entries = (["accounts", "automations", "statuses"] as const).flatMap(
    (key) => filters[key].map((id) => ({ key, id })),
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Check className="size-3.5 text-ink-muted" aria-hidden />
      {entries.map(({ key, id }) => (
        <button
          key={`${key}-${id}`}
          type="button"
          onClick={() => remove(key, id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-card py-1 pr-2 pl-2.5 text-[12px] text-ink-secondary transition-colors duration-100 hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <span className="max-w-[180px] truncate">{labelFor(key, id)}</span>
          <X className="size-3 text-ink-muted" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
    </div>
  );
}
