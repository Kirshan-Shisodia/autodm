"use client";

// The search field. Lives in the page header alongside range/filters/export,
// because it is the same kind of control they are: it narrows the whole
// dataset, not just the visible tab. Keeping it in the tab strip implied it
// searched within "All Leads" only, which was never what it did.
//
// Its own file rather than part of the header so the header stays about
// filters, and so the debounce logic has one obvious home.

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function LeadsSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";

  // Controlled locally and debounced into the URL: navigating on every
  // keystroke would re-run the server query five times for one word.
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  // Keep in step when the URL changes from *elsewhere* — a cleared filter chip,
  // the back button, a tag clicked in the rail. Adjusting state during render
  // rather than in an effect: an effect would paint the stale value first and
  // then immediately re-render, which is the cascading update React warns about.
  //
  // The inner guard is what stops this from fighting the debounce below: when
  // our own timer writes the term we just typed, the URL and the input already
  // agree and there is nothing to reset.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (urlQuery !== query.trim()) setQuery(urlQuery);
  }

  const commit = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      // A new result set invalidates the page number: page 9 of a 2-page
      // result is an empty screen that reads as a bug.
      next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (query === urlQuery) return;
    const id = setTimeout(() => commit(query), 300);
    return () => clearTimeout(id);
  }, [query, urlQuery, commit]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search leads..."
        aria-label="Search leads by name, handle, email or tag"
        className={cn(
          "h-9 w-full rounded-lg border border-border-default bg-surface-card pr-8 pl-8.5 text-[13px] text-ink lg:w-[220px]",
          "placeholder:text-ink-muted",
          "focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none",
          // Safari draws its own clear glyph on type=search, which would sit
          // on top of ours.
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {isPending ? (
        <Loader2
          className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-ink-muted"
          aria-hidden
        />
      ) : (
        query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              commit("");
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-ink-muted hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">Clear search</span>
          </button>
        )
      )}
    </div>
  );
}
