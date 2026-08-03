"use client";

// Page header: title, date range, filters, export. All three controls are real.
//
// State lives in the URL rather than React, so the server component refetches,
// the back button works, and a filtered view is a shareable link. The export
// route reads the exact same params — the CSV always matches the screen.

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  Download,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  LEAD_RANGES,
  PRIMARY_SOURCES,
  SOURCE_LABEL,
  activeFilterCount,
  parseFilters,
  parseRange,
  rangeLabel,
  type LeadFilters,
} from "@/lib/leads/model";
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
import { LeadsSearch } from "./leads-search";

type Option = { id: string; label: string };

const TRIGGER =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50";

/** Every filter key this header owns. Clearing means clearing all of them. */
const FILTER_KEYS = ["accounts", "automations", "sources", "tags"] as const;

export function LeadsHeader({
  accounts,
  automations,
  tags,
}: {
  accounts: Option[];
  automations: Option[];
  tags: Option[];
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
        sources: searchParams.get("sources"),
        tags: searchParams.get("tags"),
      }),
    [searchParams],
  );

  const filterCount = activeFilterCount(filters);

  /**
   * Rewrite one param and navigate. Any change to the result set sends the
   * table back to page 1 — page 9 of a 3-page result is an empty screen that
   * looks like a bug.
   */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleIn = useCallback(
    (key: keyof LeadFilters, id: string) => {
      const current = filters[key] as string[];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      setParam(key, next.length ? next.join(",") : null);
    },
    [filters, setParam],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  /**
   * Fetch rather than a plain link, so a failed export surfaces as a stuck
   * button the user can retry instead of navigating them to a blank tab.
   */
  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/leads/export?${searchParams.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chatpilott-leads-${range}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Nothing downloaded; the button simply returns to rest.
    } finally {
      setExporting(false);
    }
  }, [range, searchParams]);

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[34px] font-bold tracking-[-0.5px] text-ink">
          Leads
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Track, manage and engage with all your leads in one place.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <LeadsSearch />

        {/* Date range */}
        <DropdownMenu>
          <DropdownMenuTrigger className={TRIGGER} disabled={isPending}>
            <CalendarDays className="size-3.5" aria-hidden />
            {rangeLabel(range)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Date range</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={range}
              onValueChange={(v) => setParam("range", v === "30d" ? null : v)}
            >
              {LEAD_RANGES.map((r) => (
                <DropdownMenuRadioItem key={r.value} value={r.value}>
                  {r.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger className={TRIGGER} disabled={isPending}>
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Filters
            {filterCount > 0 && (
              <span className="wz-font-mono flex size-4.5 items-center justify-center rounded-full bg-selected-bg text-[10px] font-semibold text-ink">
                {filterCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[70vh] w-64 overflow-y-auto"
          >
            <DropdownMenuLabel>Source</DropdownMenuLabel>
            {PRIMARY_SOURCES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={filters.sources.includes(s)}
                onCheckedChange={() => toggleIn("sources", s)}
                onSelect={(e) => e.preventDefault()}
              >
                {SOURCE_LABEL[s]}
              </DropdownMenuCheckboxItem>
            ))}

            {accounts.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                {accounts.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a.id}
                    checked={filters.accounts.includes(a.id)}
                    onCheckedChange={() => toggleIn("accounts", a.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {a.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {automations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Automation</DropdownMenuLabel>
                {automations.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a.id}
                    checked={filters.automations.includes(a.id)}
                    onCheckedChange={() => toggleIn("automations", a.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{a.label}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {tags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tag</DropdownMenuLabel>
                {tags.slice(0, 20).map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t.id}
                    checked={filters.tags.includes(t.id)}
                    onCheckedChange={() => toggleIn("tags", t.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {t.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {filterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-ink-secondary hover:bg-hover-bg hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden />
                  Clear all filters
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className={TRIGGER}
        >
          {exporting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-3.5" aria-hidden />
          )}
          Export
        </button>
      </div>
    </header>
  );
}

/**
 * The removable chips under the header. They exist so an active filter is
 * visible without opening the menu — a filtered page that looks unfiltered is
 * how people conclude their leads have vanished.
 */
export function ActiveFilterChips({
  accounts,
  automations,
  tags,
}: {
  accounts: Option[];
  automations: Option[];
  tags: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () =>
      parseFilters({
        accounts: searchParams.get("accounts"),
        automations: searchParams.get("automations"),
        sources: searchParams.get("sources"),
        tags: searchParams.get("tags"),
      }),
    [searchParams],
  );

  if (activeFilterCount(filters) === 0) return null;

  const remove = (key: keyof LeadFilters, id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const rest = (filters[key] as string[]).filter((v) => v !== id);
    if (rest.length) next.set(key, rest.join(","));
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const chips: { key: keyof LeadFilters; id: string; label: string }[] = [
    ...filters.sources.map((s) => ({
      key: "sources" as const,
      id: s,
      label: SOURCE_LABEL[s],
    })),
    ...filters.accounts.map((id) => ({
      key: "accounts" as const,
      id,
      label: accounts.find((a) => a.id === id)?.label ?? "Account",
    })),
    ...filters.automations.map((id) => ({
      key: "automations" as const,
      id,
      label: automations.find((a) => a.id === id)?.label ?? "Automation",
    })),
    ...filters.tags.map((id) => ({
      key: "tags" as const,
      id,
      label: tags.find((t) => t.id === id)?.label ?? id,
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.id}`}
          type="button"
          onClick={() => remove(chip.key, chip.id)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-full border border-border-default bg-surface-card pr-2 pl-2.5 text-[12px] text-ink-secondary",
            "transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink",
          )}
        >
          <span className="max-w-[180px] truncate">{chip.label}</span>
          <X className="size-3 shrink-0" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="ml-1 inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] font-medium text-ink-tertiary hover:text-ink"
      >
        <Check className="size-3" aria-hidden />
        Clear all
      </button>
    </div>
  );
}
