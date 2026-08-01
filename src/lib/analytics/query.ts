// Server-side data assembly for the Analytics screen. Everything reads from
// Supabase results only — never n8n, never Meta (dashboard spec §0).
//
// Shared by the page (server component) and the CSV export route so the file
// the user downloads is byte-for-byte the numbers they were looking at.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  NO_DELTA,
  buildEngagement,
  buildFunnel,
  countInPrevWindow,
  countInWindow,
  formatCount,
  formatCurrency,
  formatPercent,
  percentChange,
  pointChange,
  share,
  toHeatmap,
  toSeries,
  type ActivityRow,
  type AnalyticsFilters,
  type Delta,
  type EngagementSlice,
  type FunnelStage,
  type Heatmap,
  type Metric,
  type ResolvedRange,
  type SeriesPoint,
} from "./model";

// PostgREST caps a single response (1000 rows on hosted Supabase), so every
// row fetch pages until it runs dry. 50 pages is a generous ceiling that keeps
// a runaway account from hanging the request.
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

type AnyQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>;
};

/** Thrown so the page can render an error state instead of a confident zero. */
export class AnalyticsQueryError extends Error {
  constructor(what: string, cause: string) {
    super(`Couldn't read ${what}: ${cause}`);
    this.name = "AnalyticsQueryError";
  }
}

async function fetchAllPages<T>(
  what: string,
  build: () => AnyQuery,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    // Swallowing this would turn a timeout into "you had no activity", which
    // is the worst possible way for an analytics page to fail.
    if (error) throw new AnalyticsQueryError(what, error.message);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

// ------------------------------------------------------------------
// Row shapes
// ------------------------------------------------------------------

type DmLogRow = {
  id: string;
  status: string;
  sent_at: string;
  automation_id: string | null;
  ig_account_id: string;
  recipient_username: string | null;
  recipient_ig_id: string | null;
};

type ShortLinkRef = { automation_id: string | null };

type LinkClickRow = {
  id: string;
  clicked_at: string;
  dm_log_id: string | null;
  /** PostgREST returns an object for a to-one join, but an array under some
   *  schema-cache states — normalise both through `automationIdOf`. */
  short_links: ShortLinkRef | ShortLinkRef[] | null;
};

function automationIdOf(row: LinkClickRow): string | null {
  const rel = row.short_links;
  if (!rel) return null;
  return (Array.isArray(rel) ? rel[0]?.automation_id : rel.automation_id) ?? null;
}

type LeadRow = {
  id: string;
  created_at: string;
  email: string;
  ig_username: string | null;
  automation_id: string | null;
  ig_account_id: string;
};

type AutomationRow = {
  id: string;
  name: string;
  type: string;
  ig_account_id: string;
  updated_at: string;
};

type AccountRow = { id: string; ig_username: string };

// ------------------------------------------------------------------
// Public shape
// ------------------------------------------------------------------

export type TopAutomationRow = {
  id: string;
  name: string;
  type: string;
  dmsSent: number;
  linkClicks: number;
  /** Null when there were no in-window sends to divide by. */
  conversionRate: number | null;
};

export type MetricsTableRow = {
  key: string;
  label: string;
  current: string;
  previous: string;
  delta: Delta;
  series: number[];
  stub?: boolean;
};

export type AnalyticsData = {
  range: ResolvedRange;
  filters: AnalyticsFilters;
  /** True when a row fetch hit the page ceiling — numbers are a lower bound. */
  truncated: boolean;
  /**
   * True when a DM-status filter is active. Clicks are scoped exactly (they
   * carry a dm_log FK); leads are not, because nothing links a lead back to
   * the DM that produced it. The page surfaces that caveat rather than
   * quietly mixing a filtered numerator with an unfiltered denominator.
   */
  statusScoped: boolean;

  kpis: Metric[];
  chart: { dmsSent: SeriesPoint[]; linkClicks: SeriesPoint[] };
  topAutomations: TopAutomationRow[];
  funnel: FunnelStage[];
  engagement: { overall: number; slices: EngagementSlice[] };
  heatmap: Heatmap;
  metricsTable: MetricsTableRow[];
  activity: ActivityRow[];

  /** Populates the filter menu. */
  options: {
    accounts: { id: string; label: string }[];
    automations: { id: string; label: string }[];
  };
};

// Monthly DM allowance per plan (PRD §10.5.3), mirrored from lib/dashboard.
const DM_LIMIT: Record<string, number> = {
  free: 1000,
  pro: 25000,
  platinum: 300000,
};

// ------------------------------------------------------------------
// Assembly
// ------------------------------------------------------------------

export async function loadAnalytics({
  supabase,
  userId,
  range,
  filters,
  now = new Date(),
}: {
  supabase: SupabaseClient;
  userId: string;
  range: ResolvedRange;
  filters: AnalyticsFilters;
  now?: Date;
}): Promise<AnalyticsData> {
  const fromIso = range.fetchFrom.toISOString();

  // Automations and accounts come first: they drive the filter menu *and* let
  // us translate an account filter into the automation ids that link clicks
  // (which only know about automations) can actually be filtered by.
  const [{ data: automationsData }, { data: accountsData }, { data: userRow }] =
    await Promise.all([
      supabase
        .from("automations")
        .select("id, name, type, ig_account_id, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("instagram_accounts")
        .select("id, ig_username")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("plan, dm_count_month")
        .eq("id", userId)
        .single(),
    ]);

  const automations = (automationsData ?? []) as AutomationRow[];
  const accounts = (accountsData ?? []) as AccountRow[];

  const allowedAutomationIds = resolveAutomationScope(automations, filters);

  const [dmLogs, rawLinkClicks, leads] = await Promise.all([
    // `.order("id")` is a tiebreaker, not a preference: paging on a timestamp
    // alone lets rows sharing a `sent_at` shuffle between calls, which
    // duplicates or drops rows across a page boundary.
    fetchAllPages<DmLogRow>("DM logs", () => {
      let q = supabase
        .from("dm_logs")
        .select(
          "id, status, sent_at, automation_id, ig_account_id, recipient_username, recipient_ig_id",
        )
        .eq("user_id", userId)
        .gte("sent_at", fromIso)
        .order("sent_at", { ascending: false })
        .order("id", { ascending: true });
      if (filters.accounts.length) q = q.in("ig_account_id", filters.accounts);
      if (filters.automations.length)
        q = q.in("automation_id", filters.automations);
      if (filters.statuses.length) q = q.in("status", filters.statuses);
      return q as unknown as AnyQuery;
    }),

    fetchAllPages<LinkClickRow>("link clicks", () => {
      let q = supabase
        .from("link_clicks")
        .select(
          "id, clicked_at, dm_log_id, short_links!inner(user_id, automation_id)",
        )
        .eq("short_links.user_id", userId)
        .gte("clicked_at", fromIso)
        .order("clicked_at", { ascending: false })
        .order("id", { ascending: true });
      if (allowedAutomationIds)
        q = q.in("short_links.automation_id", allowedAutomationIds);
      return q as unknown as AnyQuery;
    }),

    fetchAllPages<LeadRow>("leads", () => {
      let q = supabase
        .from("leads")
        .select("id, created_at, email, ig_username, automation_id, ig_account_id")
        .eq("user_id", userId)
        .gte("created_at", fromIso)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
      if (filters.accounts.length) q = q.in("ig_account_id", filters.accounts);
      if (filters.automations.length)
        q = q.in("automation_id", filters.automations);
      return q as unknown as AnyQuery;
    }),
  ]);

  const truncated =
    dmLogs.truncated || rawLinkClicks.truncated || leads.truncated;

  /**
   * A DM-status filter has to reach the click table too, or filtering to
   * `failed` returns zero DMs sitting next to hundreds of clicks. link_clicks
   * carries a real FK to the log row, so the scoping is exact rather than
   * inferred. Clicks with no log reference drop out, which is the conservative
   * reading of "only clicks from DMs matching this status".
   */
  const statusScoped = filters.statuses.length > 0;
  const keptLogIds = statusScoped
    ? new Set(dmLogs.rows.map((r) => r.id))
    : null;
  const linkClicks = {
    truncated: rawLinkClicks.truncated,
    rows: keptLogIds
      ? rawLinkClicks.rows.filter(
          (r) => r.dm_log_id !== null && keptLogIds.has(r.dm_log_id),
        )
      : rawLinkClicks.rows,
  };

  // ---- timestamp lists, one per series -----------------------------------
  const sentLogs = dmLogs.rows.filter((r) => r.status === "sent");
  const sentAt = sentLogs.map((r) => r.sent_at);
  const triggerAt = dmLogs.rows.map((r) => r.sent_at);
  const clickAt = linkClicks.rows.map((r) => r.clicked_at);
  const leadAt = leads.rows.map((r) => r.created_at);

  const dmsSent = countInWindow(sentAt, range);
  const dmsSentPrev = countInPrevWindow(sentAt, range);
  const triggers = countInWindow(triggerAt, range);
  const clicks = countInWindow(clickAt, range);
  const clicksPrev = countInPrevWindow(clickAt, range);
  const newLeads = countInWindow(leadAt, range);
  const newLeadsPrev = countInPrevWindow(leadAt, range);

  // With no delivered DMs there is no rate — 0.0% would read as "nobody
  // converted" when the truth is "nothing was sent to convert".
  const hasRate = dmsSent > 0;
  const conversion = share(newLeads, dmsSent);
  const conversionPrev =
    dmsSentPrev === null || newLeadsPrev === null || dmsSentPrev === 0
      ? null
      : share(newLeadsPrev, dmsSentPrev);
  const conversionDisplay = hasRate ? formatPercent(conversion) : "—";
  const conversionDelta = hasRate ? pointChange(conversion, conversionPrev) : NO_DELTA;

  const dmsSeries = toSeries(sentAt, range);
  const clicksSeries = toSeries(clickAt, range);
  const leadsSeries = toSeries(leadAt, range);
  const conversionSeries = dmsSeries.map((p, i) =>
    p.value > 0 ? (leadsSeries[i].value / p.value) * 100 : 0,
  );

  // ---- plan usage ---------------------------------------------------------
  const plan = (userRow?.plan as string) ?? "free";
  const used = (userRow?.dm_count_month as number) ?? 0;
  const limit = DM_LIMIT[plan] ?? DM_LIMIT.free;

  const kpis: Metric[] = [
    {
      key: "dms_sent",
      label: "DMs Sent",
      display: formatCount(dmsSent),
      delta: percentChange(dmsSent, dmsSentPrev),
      series: dmsSeries.map((p) => p.value),
    },
    {
      key: "link_clicks",
      label: "Link Clicks",
      display: formatCount(clicks),
      delta: percentChange(clicks, clicksPrev),
      series: clicksSeries.map((p) => p.value),
    },
    {
      key: "new_leads",
      label: "New Leads",
      display: formatCount(newLeads),
      delta: percentChange(newLeads, newLeadsPrev),
      series: leadsSeries.map((p) => p.value),
    },
    {
      key: "conversion_rate",
      label: "Conversion Rate",
      display: conversionDisplay,
      delta: conversionDelta,
      series: conversionSeries,
    },
    {
      key: "revenue",
      label: "Revenue Earned",
      display: formatCurrency(0),
      delta: NO_DELTA,
      series: [],
      stub: true,
    },
    {
      key: "plan_usage",
      label: "Plan Usage",
      display: formatPercent(share(used, limit), 0),
      delta: NO_DELTA,
      series: [],
      footnote: `${formatCount(used)} / ${formatCount(limit)} DMs`,
      progress: Math.min(100, share(used, limit)),
    },
  ];

  // ---- top automations ----------------------------------------------------
  const nameById = new Map(automations.map((a) => [a.id, a]));
  const perAutomation = new Map<string, { dms: number; clicks: number }>();

  for (const row of sentLogs) {
    if (!row.automation_id || !inWindow(row.sent_at, range)) continue;
    const bucket = ensure(perAutomation, row.automation_id);
    bucket.dms += 1;
  }
  for (const row of linkClicks.rows) {
    const id = automationIdOf(row);
    if (!id || !inWindow(row.clicked_at, range)) continue;
    ensure(perAutomation, id).clicks += 1;
  }

  const topAutomations: TopAutomationRow[] = [...perAutomation.entries()]
    .map(([id, v]) => ({
      id,
      name: nameById.get(id)?.name ?? "Deleted automation",
      type: nameById.get(id)?.type ?? "post",
      dmsSent: v.dms,
      linkClicks: v.clicks,
      // Null, not zero: an automation with clicks but no in-window sends has
      // an undefined rate, and "0.0%" beside "40 clicks" reads as a failure.
      conversionRate: v.dms > 0 ? share(v.clicks, v.dms) : null,
    }))
    .sort((a, b) => b.dmsSent - a.dmsSent || b.linkClicks - a.linkClicks)
    .slice(0, 5);

  // ---- funnel + engagement ------------------------------------------------
  const funnel = buildFunnel({
    triggersMatched: triggers,
    dmsDelivered: dmsSent,
    linkClicks: clicks,
    leads: newLeads,
  });

  const engagement = buildEngagement({
    dmsDelivered: dmsSent,
    linkClicks: clicks,
    leads: newLeads,
  });

  // ---- metrics table ------------------------------------------------------
  const metricsTable: MetricsTableRow[] = [
    {
      key: "dms_sent",
      label: "DMs Sent",
      current: formatCount(dmsSent),
      previous: dmsSentPrev === null ? "—" : formatCount(dmsSentPrev),
      delta: percentChange(dmsSent, dmsSentPrev),
      series: dmsSeries.map((p) => p.value),
    },
    {
      key: "link_clicks",
      label: "Link Clicks",
      current: formatCount(clicks),
      previous: clicksPrev === null ? "—" : formatCount(clicksPrev),
      delta: percentChange(clicks, clicksPrev),
      series: clicksSeries.map((p) => p.value),
    },
    {
      key: "new_leads",
      label: "New Leads",
      current: formatCount(newLeads),
      previous: newLeadsPrev === null ? "—" : formatCount(newLeadsPrev),
      delta: percentChange(newLeads, newLeadsPrev),
      series: leadsSeries.map((p) => p.value),
    },
    {
      key: "conversion_rate",
      label: "Conversion Rate",
      current: conversionDisplay,
      previous: conversionPrev === null ? "—" : formatPercent(conversionPrev),
      delta: conversionDelta,
      series: conversionSeries,
    },
    {
      key: "revenue",
      label: "Revenue Earned",
      current: "—",
      previous: "—",
      delta: NO_DELTA,
      series: [],
      stub: true,
    },
  ];

  return {
    range,
    filters,
    truncated,
    statusScoped,
    kpis,
    chart: { dmsSent: dmsSeries, linkClicks: clicksSeries },
    topAutomations,
    funnel,
    engagement,
    heatmap: toHeatmap(sentAt, range),
    metricsTable,
    activity: buildActivity({
      dmLogs: dmLogs.rows,
      linkClicks: linkClicks.rows,
      leads: leads.rows,
      // Edits are the one activity type not already narrowed by the query, so
      // scope them here — otherwise a filtered feed still surfaces edits to
      // automations the filter excludes.
      automations: allowedAutomationIds
        ? automations.filter((a) => allowedAutomationIds.includes(a.id))
        : automations,
      nameById,
      range,
      now,
    }),
    options: {
      accounts: accounts.map((a) => ({ id: a.id, label: `@${a.ig_username}` })),
      automations: automations.map((a) => ({ id: a.id, label: a.name })),
    },
  };
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function inWindow(iso: string, range: ResolvedRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function ensure(
  map: Map<string, { dms: number; clicks: number }>,
  key: string,
): { dms: number; clicks: number } {
  let v = map.get(key);
  if (!v) {
    v = { dms: 0, clicks: 0 };
    map.set(key, v);
  }
  return v;
}

/**
 * An account filter has to be pushed down to link clicks via automations,
 * since short_links has no account column. Returns null when no scoping is
 * needed (i.e. don't add an `.in()` at all).
 */
function resolveAutomationScope(
  automations: AutomationRow[],
  filters: AnalyticsFilters,
): string[] | null {
  if (!filters.accounts.length && !filters.automations.length) return null;

  const byAccount = filters.accounts.length
    ? automations
        .filter((a) => filters.accounts.includes(a.ig_account_id))
        .map((a) => a.id)
    : null;

  const explicit = filters.automations.length ? filters.automations : null;

  if (byAccount && explicit)
    return explicit.filter((id) => byAccount.includes(id));
  const scope = byAccount ?? explicit ?? [];
  // An empty `.in()` matches nothing, which is the correct answer here.
  return scope;
}

function buildActivity({
  dmLogs,
  linkClicks,
  leads,
  automations,
  nameById,
  range,
  now,
}: {
  dmLogs: DmLogRow[];
  linkClicks: LinkClickRow[];
  leads: LeadRow[];
  automations: AutomationRow[];
  nameById: Map<string, AutomationRow>;
  range: ResolvedRange;
  now: Date;
}): ActivityRow[] {
  const rows: ActivityRow[] = [];

  for (const r of dmLogs.slice(0, 40)) {
    if (!inWindow(r.sent_at, range)) continue;
    const who = r.recipient_username
      ? `@${r.recipient_username}`
      : (r.recipient_ig_id ?? "someone");
    rows.push({
      id: `dm-${r.id}`,
      kind: r.status === "sent" ? "dm_sent" : "dm_failed",
      title:
        r.status === "sent" ? `DM sent to ${who}` : `DM to ${who} didn't send`,
      at: r.sent_at,
    });
  }

  for (const r of linkClicks.slice(0, 20)) {
    if (!inWindow(r.clicked_at, range)) continue;
    const automationId = automationIdOf(r);
    const name = automationId ? nameById.get(automationId)?.name : null;
    rows.push({
      id: `click-${r.id}`,
      kind: "link_click",
      title: name ? `Link clicked in "${name}"` : "Link clicked",
      at: r.clicked_at,
    });
  }

  for (const r of leads.slice(0, 20)) {
    if (!inWindow(r.created_at, range)) continue;
    rows.push({
      id: `lead-${r.id}`,
      kind: "lead",
      title: `New lead captured — ${r.ig_username ? `@${r.ig_username}` : r.email}`,
      at: r.created_at,
    });
  }

  for (const a of automations.slice(0, 10)) {
    if (!inWindow(a.updated_at, range)) continue;
    rows.push({
      id: `auto-${a.id}`,
      kind: "automation_edited",
      title: `Automation "${a.name}" edited`,
      at: a.updated_at,
    });
  }

  return rows
    .filter((r) => new Date(r.at).getTime() <= now.getTime() + 60_000)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
}
