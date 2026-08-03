"use client";

// Footer: the "showing X to Y of Z" readout, the page window, and per-page.
// Page number lives in the URL like everything else on this screen, so a
// deep-linked page 7 of a filtered view opens exactly where it was left.

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  formatCount,
  pageWindow,
  type PageInfo,
} from "@/lib/leads/model";

const PAGE_BUTTON =
  "flex size-8 items-center justify-center rounded-lg border border-border-default bg-surface-card text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

export function LeadsPagination({ info }: { info: PageInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const go = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const setPage = (page: number) =>
    go((p) => {
      if (page <= 1) p.delete("page");
      else p.set("page", String(page));
    });

  const windowed = pageWindow(info.page, info.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border-default px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-[12px] text-ink-tertiary">
        Showing{" "}
        <span className="wz-font-mono text-ink-secondary tabular-nums">
          {formatCount(info.from)}
        </span>{" "}
        to{" "}
        <span className="wz-font-mono text-ink-secondary tabular-nums">
          {formatCount(info.to)}
        </span>{" "}
        of{" "}
        <span className="wz-font-mono text-ink-secondary tabular-nums">
          {formatCount(info.total)}
        </span>{" "}
        leads
      </p>

      <div className="flex items-center gap-2" aria-busy={isPending}>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className={PAGE_BUTTON}
            disabled={info.page <= 1}
            onClick={() => setPage(info.page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span className="sr-only">Previous page</span>
          </button>

          {windowed.map((n, i) =>
            n === null ? (
              <span
                key={`gap-${i}`}
                className="flex size-8 items-center justify-center text-[13px] text-ink-muted"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === info.page ? "page" : undefined}
                onClick={() => setPage(n)}
                className={cn(
                  PAGE_BUTTON,
                  "wz-font-mono tabular-nums",
                  n === info.page &&
                    "border-selected-bg bg-selected-bg text-ink hover:bg-selected-bg",
                )}
              >
                {n}
              </button>
            ),
          )}

          <button
            type="button"
            className={PAGE_BUTTON}
            disabled={info.page >= info.totalPages}
            onClick={() => setPage(info.page + 1)}
          >
            <ChevronRight className="size-4" aria-hidden />
            <span className="sr-only">Next page</span>
          </button>
        </nav>

        <label className="flex items-center">
          <span className="sr-only">Leads per page</span>
          <select
            value={info.perPage}
            onChange={(e) =>
              // Changing the page size invalidates the page number: page 9 at
              // ten per page is page 1 at a hundred.
              go((p) => {
                const v = Number(e.target.value);
                if (v === DEFAULT_PER_PAGE) p.delete("perPage");
                else p.set("perPage", String(v));
                p.delete("page");
              })
            }
            className="h-8 rounded-lg border border-border-default bg-surface-card px-2 text-[12px] text-ink-secondary focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
