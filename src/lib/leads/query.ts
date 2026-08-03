// Server-side data assembly for the Leads screen. Reads Supabase results only
// — never n8n, never Meta (spec §0).
//
// Shared by the page (a server component) and the CSV export route, so the file
// the user downloads is the same set of people they were looking at.
//
// One fetch, then everything is derived in memory. The alternative — a counted
// `.range()` for the table plus separate aggregate queries for the KPI strip
// and the three rail cards — is five round trips that can disagree with each
// other, and the tag histogram needs every row unnested regardless.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  EMPTY_FILTERS,
  LEAD_STATUSES,
  NO_DELTA,
  activityTone,
  conversionOf,
  displayName,
  formatCount,
  formatPercent,
  initialsOf,
  isLeadSource,
  isLeadStatus,
  pageInfo,
  percentChange,
  pointChange,
  relativeTime,
  share,
  sourceBreakdown,
  sourceLabel,
  statusBreakdown,
  topTags,
  type Lead,
  type LeadFilters,
  type LeadSource,
  type LeadStatus,
  type Metric,
  type PageInfo,
  type ResolvedRange,
  type Slice,
  type TabKey,
} from "./model";

// PostgREST caps a single response at 1000 rows on hosted Supabase, so the
// fetch pages until it runs dry. 50 pages is a generous ceiling that keeps a
// runaway account from hanging the request.
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

/** Thrown so the page can render a failure instead of a confident zero. */
export class LeadsQueryError extends Error {
  constructor(cause: string) {
    super(`Couldn't read your leads: ${cause}`);
    this.name = "LeadsQueryError";
  }
}

type AutomationRef = { id: string; name: string; type: string };

type LeadRow = {
  id: string;
  email: string;
  ig_username: string | null;
  ig_account_id: string;
  automation_id: string | null;
  source: string;
  status: string;
  tags: string[] | null;
  revenue_amount: number;
  created_at: string;
  last_activity_at: string;
  /** PostgREST returns an object for a to-one join, but an array under some
   *  schema-cache states — normalise both through `automationOf`. */
  automations: AutomationRef | AutomationRef[] | null;
};

function automationOf(row: LeadRow): AutomationRef | null {
  const rel = row.automations;
  if (!rel) return null;
  return (Array.isArray(rel) ? (rel[0] ?? null) : rel) ?? null;
}

export type Option = { id: string; label: string };

export type LeadsData = {
  /** The page of rows the table renders. */
  rows: Lead[];
  /** Every row matching range + filters + search, ignoring the tab. */
  allInScope: Lead[];
  metrics: Metric[];
  statusSlices: (Slice & { status: LeadStatus })[];
  sourceSlices: Slice[];
  tagSlices: Slice[];
  /** Tab counts, so the tab strip can show them without a second query. */
  tabCounts: Record<TabKey, number>;
  page: PageInfo;
  options: { accounts: Option[]; automations: Option[]; tags: Option[] };
  totalInScope: number;
  /** True when the row cap was hit — every total is then a lower bound. */
  truncated: boolean;
  comparisonLabel: string;
};

export async function loadLeads({
  supabase,
  userId,
  range,
  filters = EMPTY_FILTERS,
  tab = "all",
  search = "",
  page = 1,
  perPage = 10,
  now = new Date(),
}: {
  supabase: SupabaseClient;
  userId: string;
  range: ResolvedRange;
  filters?: LeadFilters;
  tab?: TabKey;
  search?: string;
  page?: number;
  perPage?: number;
  now?: Date;
}): Promise<LeadsData> {
  // Filters that the database can apply are applied there. Search is the one
  // exception: it spans a computed display name, so it runs in memory below —
  // an `or(ilike)` over email and handle would miss "Priya Singh" typed with
  // the space that the raw columns don't contain.
  const build = () => {
    let q = supabase
      .from("leads")
      .select(
        "id, email, ig_username, ig_account_id, automation_id, source, status, tags, revenue_amount, created_at, last_activity_at, automations:automation_id(id, name, type)",
      )
      .eq("user_id", userId)
      .gte("created_at", range.fetchFrom.toISOString())
      .order("last_activity_at", { ascending: false });

    if (filters.accounts.length) q = q.in("ig_account_id", filters.accounts);
    if (filters.automations.length) q = q.in("automation_id", filters.automations);
    if (filters.sources.length) q = q.in("source", filters.sources);
    if (filters.tags.length) q = q.overlaps("tags", filters.tags);

    return q;
  };

  const raw: LeadRow[] = [];
  let truncated = true;
  for (let p = 0; p < MAX_PAGES; p += 1) {
    const from = p * PAGE_SIZE;
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    // Swallowing this would turn a timeout into "you have no leads", which is
    // the worst possible way for this page to fail.
    if (error) throw new LeadsQueryError(error.message);
    const batch = (data ?? []) as unknown as LeadRow[];
    raw.push(...batch);
    if (batch.length < PAGE_SIZE) {
      truncated = false;
      break;
    }
  }

  // Filter options come from everything fetched, including rows outside the
  // current window — otherwise selecting a filter can remove the very option
  // you selected, and the menu shrinks as you use it.
  const accountIds = new Set<string>();
  const automationOptions = new Map<string, string>();
  const tagUniverse = new Set<string>();
  for (const r of raw) {
    accountIds.add(r.ig_account_id);
    const auto = automationOf(r);
    if (auto) automationOptions.set(auto.id, auto.name);
    for (const t of r.tags ?? []) tagUniverse.add(t);
  }

  const { data: accountRows } = await supabase
    .from("instagram_accounts")
    .select("id, ig_username")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const options = {
    accounts: (accountRows ?? []).map((a: { id: string; ig_username: string }) => ({
      id: a.id,
      label: `@${a.ig_username}`,
    })),
    automations: [...automationOptions.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    tags: [...tagUniverse].sort().map((t) => ({ id: t, label: t })),
  };

  // ----------------------------------------------------------------
  // Window split. Rows outside the current window still matter: they are
  // the baseline every delta on the KPI strip is measured against.
  // ----------------------------------------------------------------
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const prevStartMs = range.prevStart?.getTime() ?? null;
  const prevEndMs = range.prevEnd?.getTime() ?? null;

  const inWindow: LeadRow[] = [];
  const inPrevWindow: LeadRow[] = [];
  for (const r of raw) {
    const t = new Date(r.created_at).getTime();
    if (t >= startMs && t <= endMs) inWindow.push(r);
    else if (
      prevStartMs !== null &&
      prevEndMs !== null &&
      t >= prevStartMs &&
      t < prevEndMs
    ) {
      inPrevWindow.push(r);
    }
  }

  const toLead = (r: LeadRow): Lead => {
    const auto = automationOf(r);
    const name = displayName(r.ig_username, r.email);
    const tags = r.tags ?? [];
    const src: LeadSource = isLeadSource(r.source) ? r.source : "dm_conversation";
    return {
      id: r.id,
      name,
      handle: r.ig_username,
      email: r.email,
      initials: initialsOf(name),
      source: src,
      sourceLabel: sourceLabel(src),
      automationName: auto?.name ?? null,
      status: isLeadStatus(r.status) ? r.status : "new",
      tags,
      conversion: conversionOf(tags),
      lastActivity: r.last_activity_at,
      lastActivityLabel: relativeTime(r.last_activity_at, now),
      activityTone: activityTone(r.last_activity_at, now),
      createdAt: r.created_at,
      revenue: Number(r.revenue_amount ?? 0),
    };
  };

  let scoped = inWindow.map(toLead);

  const needle = search.trim().toLowerCase();
  if (needle) {
    scoped = scoped.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        l.email.toLowerCase().includes(needle) ||
        (l.handle ?? "").toLowerCase().includes(needle) ||
        l.tags.some((t) => t.includes(needle)),
    );
  }

  // ----------------------------------------------------------------
  // Aggregates describe the filtered set, not the visible tab. Clicking
  // "Converted" should not redraw the donut as 100% converted — the rail
  // is the context the tab is being read against.
  // ----------------------------------------------------------------
  const countByStatus = (rows: { status: LeadStatus }[]) => {
    const out = { new: 0, engaged: 0, converted: 0, archived: 0 } as Record<
      LeadStatus,
      number
    >;
    for (const r of rows) out[r.status] += 1;
    return out;
  };

  const statusCounts = countByStatus(scoped);
  const total = scoped.length;

  const prevLeads = inPrevWindow.map(toLead);
  const prevStatusCounts = countByStatus(prevLeads);
  const prevTotal = range.prevStart === null ? null : prevLeads.length;

  const rate = share(statusCounts.converted, total);
  const prevRate =
    prevTotal === null ? null : share(prevStatusCounts.converted, prevTotal);

  const metrics: Metric[] = [
    {
      key: "total",
      label: "Total Leads",
      display: formatCount(total),
      delta: percentChange(total, prevTotal),
    },
    {
      key: "new",
      label: "New Leads",
      display: formatCount(statusCounts.new),
      delta: percentChange(
        statusCounts.new,
        prevTotal === null ? null : prevStatusCounts.new,
      ),
    },
    {
      key: "engaged",
      label: "Engaged Leads",
      display: formatCount(statusCounts.engaged),
      delta: percentChange(
        statusCounts.engaged,
        prevTotal === null ? null : prevStatusCounts.engaged,
      ),
    },
    {
      key: "converted",
      label: "Converted Leads",
      display: formatCount(statusCounts.converted),
      delta: percentChange(
        statusCounts.converted,
        prevTotal === null ? null : prevStatusCounts.converted,
      ),
    },
    {
      key: "conversion_rate",
      label: "Conversion Rate",
      display: total === 0 ? "—" : formatPercent(rate),
      delta: total === 0 ? NO_DELTA : pointChange(rate, prevRate),
    },
  ];

  const sourceCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  for (const l of scoped) {
    sourceCounts[l.source] = (sourceCounts[l.source] ?? 0) + 1;
    for (const t of l.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }

  const tabCounts: Record<TabKey, number> = {
    all: total,
    new: statusCounts.new,
    engaged: statusCounts.engaged,
    converted: statusCounts.converted,
    archived: statusCounts.archived,
  };

  // ----------------------------------------------------------------
  // The visible page
  // ----------------------------------------------------------------
  const tabbed =
    tab === "all" ? scoped : scoped.filter((l) => l.status === tab);

  const info = pageInfo(page, perPage, tabbed.length);
  const rows = tabbed.slice((info.page - 1) * perPage, info.page * perPage);

  return {
    rows,
    allInScope: tabbed,
    metrics,
    statusSlices: statusBreakdown(statusCounts, total),
    sourceSlices: sourceBreakdown(sourceCounts, total),
    tagSlices: topTags(tagCounts),
    tabCounts,
    page: info,
    options,
    totalInScope: total,
    truncated,
    comparisonLabel: range.comparisonLabel,
  };
}

/** Re-exported so callers don't need to reach into model.ts for the enum. */
export { LEAD_STATUSES };
