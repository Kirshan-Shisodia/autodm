"use client";

// Tabs and the list/grid toggle. Search used to live here too; it moved to the
// page header, where it sits with the other controls that narrow the whole
// dataset rather than the visible bucket.
//
// Like the header, everything writes to the URL — the tab you're on survives a
// reload and travels with a copied link.

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  LEAD_TABS,
  formatCount,
  parseTab,
  parseView,
  type TabKey,
} from "@/lib/leads/model";

export function LeadsToolbar({ counts }: { counts: Record<TabKey, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tab = parseTab(searchParams.get("tab"));
  const view = parseView(searchParams.get("view"));

  const push = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      // Switching bucket or view resets paging: page 9 of "Converted" is not
      // page 9 of "All Leads".
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-default px-1">
      <nav
        className="-mb-px flex items-center gap-1 overflow-x-auto"
        aria-label="Lead status"
      >
        {LEAD_TABS.map((t) => {
          const active = t.value === tab;
          return (
            <button
              key={t.value}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() =>
                push((p) => {
                  if (t.value === "all") p.delete("tab");
                  else p.set("tab", t.value);
                })
              }
              className={cn(
                "relative shrink-0 rounded-t-md px-3 pt-1 pb-2.5 text-[13px] font-medium whitespace-nowrap",
                "transition-colors duration-100 [transition-timing-function:var(--ease-standard)]",
                "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                active
                  ? "text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand"
                  : "text-ink-tertiary hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "wz-font-mono ml-1.5 text-[11px] tabular-nums",
                  active ? "text-ink-tertiary" : "text-ink-muted",
                )}
              >
                {formatCount(counts[t.value])}
              </span>
            </button>
          );
        })}
      </nav>

      <div
        className="mb-2 flex shrink-0 items-center rounded-lg border border-border-default bg-surface-card p-0.5"
        role="group"
        aria-label="View mode"
      >
        <ViewButton
          active={view === "grid"}
          label="Card view"
          onClick={() => push((p) => p.set("view", "grid"))}
        >
          <LayoutGrid className="size-4" aria-hidden />
        </ViewButton>
        <ViewButton
          active={view === "list"}
          label="Table view"
          onClick={() => push((p) => p.delete("view"))}
        >
          <List className="size-4" aria-hidden />
        </ViewButton>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex size-7 items-center justify-center rounded-md",
        "transition-colors duration-100 [transition-timing-function:var(--ease-standard)]",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        active
          ? "bg-selected-bg text-ink"
          : "text-ink-tertiary hover:bg-hover-bg hover:text-ink",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
