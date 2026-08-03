// Leads. Lives inside the (app) shell so it gets the sidebar; auth is already
// enforced by that layout, and re-checked here because this file reads rows
// scoped to a user id and must never guess at one.
//
// Every control on the screen writes to the URL, so the page is a pure
// function of its search params: the server re-runs on each change, the back
// button works, and a filtered view is a link someone can send.

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  activeFilterCount,
  parseFilters,
  parsePage,
  parsePerPage,
  parseRange,
  parseSearch,
  parseTab,
  parseView,
  resolveRange,
} from "@/lib/leads/model";
import { LeadsQueryError, loadLeads } from "@/lib/leads/query";
import {
  ActiveFilterChips,
  LeadsHeader,
} from "@/components/leads/leads-header";
import { LeadStatCards } from "@/components/leads/stat-cards";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsGrid } from "@/components/leads/leads-grid";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import { LeadsOverview } from "@/components/leads/leads-overview";
import { LeadsBySource, TopTags } from "@/components/leads/leads-rail";
import { ConvertCta } from "@/components/leads/convert-cta";
import { LeadsEmpty } from "@/components/leads/empty-state";

// Reads results from Supabase; never calls n8n or Meta directly (spec §0).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leads · ChatPilott",
  description: "Track, manage and engage with all your leads in one place.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const range = resolveRange(parseRange(first(params.range)));
  const filters = parseFilters({
    accounts: first(params.accounts),
    automations: first(params.automations),
    sources: first(params.sources),
    tags: first(params.tags),
  });
  const tab = parseTab(first(params.tab));
  const view = parseView(first(params.view));
  const search = parseSearch(first(params.q));
  const perPage = parsePerPage(first(params.perPage));
  const page = parsePage(first(params.page));

  // A read failure must not render as a page full of confident zeros — a leads
  // screen that quietly reports "no leads" during an outage is worse than one
  // that admits it couldn't load.
  let data: Awaited<ReturnType<typeof loadLeads>>;
  try {
    data = await loadLeads({
      supabase,
      userId: user.id,
      range,
      filters,
      tab,
      search,
      page,
      perPage,
    });
  } catch (error) {
    return (
      <LoadFailed
        detail={
          error instanceof LeadsQueryError
            ? error.message
            : "Something went wrong reading your leads."
        }
      />
    );
  }

  const narrowed = activeFilterCount(filters) > 0 || search.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<HeaderFallback />}>
        <LeadsHeader
          accounts={data.options.accounts}
          automations={data.options.automations}
          tags={data.options.tags}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ActiveFilterChips
          accounts={data.options.accounts}
          automations={data.options.automations}
          tags={data.options.tags}
        />
      </Suspense>

      {data.truncated && (
        <p className="rounded-lg border border-border-default bg-warning-bg px-4 py-2.5 text-[12px] text-warning-text">
          You have more leads than this page can read at once. Totals below are a
          lower bound — narrow the date range for exact numbers.
        </p>
      )}

      <LeadStatCards
        metrics={data.metrics}
        comparisonLabel={data.comparisonLabel}
      />

      {/* Table and rail. The rail drops beneath the table below 1440px rather
          than squeezing: at that width the donut legend starts truncating and
          the source bars stop being comparable.

          The two columns stretch to a shared height (no `items-start`), so the
          table card and the CTA card end on the same line whichever side is
          taller. Each column then needs one element to absorb the slack —
          inside the table that's the rows area, in the rail it's the gap above
          the CTA. Without that the shorter column's *card* stretches and you
          get a panel with a pool of dead white space in the middle of it. */}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col overflow-hidden rounded-xl border border-border-default bg-surface-card">
          <div className="px-4 pt-3">
            <Suspense fallback={<div className="h-12" />}>
              <LeadsToolbar counts={data.tabCounts} />
            </Suspense>
          </div>

          <div className="flex flex-1 flex-col">
            {data.rows.length === 0 ? (
              <Suspense fallback={null}>
                <LeadsEmpty filtered={narrowed || tab !== "all"} />
              </Suspense>
            ) : view === "grid" ? (
              <LeadsGrid rows={data.rows} />
            ) : (
              <LeadsTable rows={data.rows} />
            )}
          </div>

          {data.page.total > 0 && (
            <Suspense fallback={null}>
              <LeadsPagination info={data.page} />
            </Suspense>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <LeadsOverview slices={data.statusSlices} total={data.totalInScope} />
          <Suspense fallback={null}>
            <LeadsBySource slices={data.sourceSlices} />
          </Suspense>
          <Suspense fallback={null}>
            <TopTags slices={data.tagSlices} />
          </Suspense>
          {/* mt-auto, not flex-1: the CTA keeps its natural height and drops to
              the bottom edge. Growing it instead would leave the button
              floating in the middle of an over-tall card. */}
          <ConvertCta className="mt-auto" />
        </aside>
      </div>
    </div>
  );
}

function HeaderFallback() {
  return (
    <div className="flex flex-col gap-1">
      <div className="h-[34px] w-32 rounded-md bg-surface-muted" />
      <div className="h-4 w-72 rounded-md bg-surface-muted" />
    </div>
  );
}

function LoadFailed({ detail }: { detail: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-border-default bg-danger-bg px-5 py-4">
      <p className="flex items-center gap-2 text-[14px] font-medium text-danger">
        <TriangleAlert className="size-4" aria-hidden />
        Couldn&rsquo;t load your leads
      </p>
      <p className="text-[13px] text-ink-secondary">{detail}</p>
    </div>
  );
}
