"use client";

// The lower two rail cards. Both are interactive: clicking a source or a tag
// applies it as a filter, so the breakdown is a way *into* the list rather
// than a read-only summary sitting beside it.

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  formatCount,
  formatPercent,
  isLeadSource,
  parseFilters,
  type Slice,
} from "@/lib/leads/model";
import { LeadsCard, CardEmpty, MeterRow } from "./card";
import { SOURCE_ICON } from "./lead-bits";

/** Toggle one value in a comma-separated filter param and navigate. */
function useToggleFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (key: "sources" | "tags", value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const after = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (after.length) next.set(key, after.join(","));
      else next.delete(key);
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}

function useActiveFilters() {
  const searchParams = useSearchParams();
  return parseFilters({
    sources: searchParams.get("sources"),
    tags: searchParams.get("tags"),
  });
}

export function LeadsBySource({ slices }: { slices: Slice[] }) {
  const toggle = useToggleFilter();
  const active = useActiveFilters();
  const hasAny = slices.some((s) => s.count > 0);

  return (
    <LeadsCard title="Leads by Source">
      {!hasAny ? (
        <CardEmpty>Nothing to break down yet.</CardEmpty>
      ) : (
        <ul>
          {slices.map((s) => {
            // The "Other" bucket is a rollup of several real sources, so it
            // has no icon and nothing coherent to filter by — it renders as a
            // plain, inert row rather than a button that would lie.
            const source = isLeadSource(s.key) ? s.key : null;
            const Icon = source ? SOURCE_ICON[source] : null;
            const on = source !== null && active.sources.includes(source);

            return (
              <MeterRow
                key={s.key}
                pct={s.pct}
                value={
                  <>
                    {formatCount(s.count)}{" "}
                    <span className="text-ink-muted">
                      ({formatPercent(s.pct, 0)})
                    </span>
                  </>
                }
                label={
                  <button
                    type="button"
                    disabled={source === null}
                    onClick={() => source && toggle("sources", source)}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-2 rounded-md py-0.5 text-left",
                      source
                        ? "transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-ink"
                        : "cursor-default",
                      on ? "text-ink" : "text-ink-secondary",
                    )}
                    aria-pressed={source ? on : undefined}
                  >
                    {Icon && (
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md",
                          on
                            ? "bg-selected-bg text-ink"
                            : "bg-surface-muted text-ink-secondary",
                        )}
                        aria-hidden
                      >
                        <Icon className="size-3" />
                      </span>
                    )}
                    <span className="truncate text-[12px]">{s.label}</span>
                  </button>
                }
              />
            );
          })}
        </ul>
      )}
    </LeadsCard>
  );
}

export function TopTags({ slices }: { slices: Slice[] }) {
  const toggle = useToggleFilter();
  const active = useActiveFilters();

  return (
    <LeadsCard title="Top Tags">
      {slices.length === 0 ? (
        <CardEmpty>No tags on these leads yet.</CardEmpty>
      ) : (
        <ul>
          {slices.map((s) => {
            const on = active.tags.includes(s.key);
            return (
              <MeterRow
                key={s.key}
                pct={s.pct}
                value={formatCount(s.count)}
                tone={on ? "brand" : "muted"}
                label={
                  <button
                    type="button"
                    onClick={() => toggle("tags", s.key)}
                    aria-pressed={on}
                    className={cn(
                      "inline-flex h-[22px] max-w-full items-center truncate rounded-md px-2 text-[11px]",
                      "transition-colors duration-100 [transition-timing-function:var(--ease-standard)]",
                      on
                        ? "bg-selected-bg text-ink"
                        : "bg-surface-muted text-ink-secondary hover:bg-hover-bg hover:text-ink",
                    )}
                  >
                    {s.label}
                  </button>
                }
              />
            );
          })}
        </ul>
      )}
    </LeadsCard>
  );
}
