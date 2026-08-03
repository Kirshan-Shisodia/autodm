// Pure helpers for the Leads screen. Framework-free so the server page, the
// client table, the CSV export route and the tests all share one definition of
// "what a lead is", "which bucket it's in", and "how a number is written".
//
// Design language: HALO v4 (halo-tokensv4.json). Colour decisions live here as
// token-backed utility class strings so the JSX stays about layout. No hex
// literals anywhere in this feature — every colour resolves through the
// @theme block in globals.css.

// ------------------------------------------------------------------
// Status — the funnel bucket, and the tabs
// ------------------------------------------------------------------

export const LEAD_STATUSES = [
  "new",
  "engaged",
  "converted",
  "archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: string | null | undefined): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value ?? "");
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  engaged: "Engaged",
  converted: "Converted",
  archived: "Archived",
};

/**
 * Badge fills. HALO ships no data-viz series (the tokens are explicit TODOs),
 * so the four buckets borrow the *status* palette, which is specified:
 * running/purple for untouched, success/green for in conversation, brand/amber
 * for won, neutral for filed away. Amber rather than a second green for
 * "converted" — two greens on one row makes the win indistinguishable at a
 * glance from mere engagement.
 */
export const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-running-bg text-running",
  engaged: "bg-success-bg text-success",
  converted: "bg-warning-bg text-warning-text",
  archived: "bg-surface-muted text-ink-secondary",
};

/** Solid dots — donut segments, legend swatches, the activity pip. */
export const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-running",
  engaged: "bg-success",
  converted: "bg-brand",
  archived: "bg-border-strong",
};

/** Same four, as CSS colours, for the SVG donut. */
export const STATUS_STROKE: Record<LeadStatus, string> = {
  new: "var(--color-running)",
  engaged: "var(--color-success)",
  converted: "var(--color-brand)",
  archived: "var(--color-border-strong)",
};

export const LEAD_TABS = [
  { value: "all", label: "All Leads" },
  { value: "new", label: "New" },
  { value: "engaged", label: "Engaged" },
  { value: "converted", label: "Converted" },
  { value: "archived", label: "Archived" },
] as const;

export type TabKey = (typeof LEAD_TABS)[number]["value"];

export function parseTab(value: string | null | undefined): TabKey {
  return LEAD_TABS.some((t) => t.value === value) ? (value as TabKey) : "all";
}

// ------------------------------------------------------------------
// Source — where the lead came from
// ------------------------------------------------------------------

export const LEAD_SOURCES = [
  "post_comment",
  "reel_comment",
  "story_reply",
  "story_mention",
  "inbox_keyword",
  "ad",
  "facebook_post",
  "dm_conversation",
  "manual",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export function isLeadSource(value: string | null | undefined): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value ?? "");
}

export const SOURCE_LABEL: Record<LeadSource, string> = {
  post_comment: "Post Comments",
  reel_comment: "Reel Comments",
  story_reply: "Story Reply",
  story_mention: "Story Mention",
  inbox_keyword: "Inbox Keyword",
  ad: "Ad Comments",
  facebook_post: "Facebook Post",
  dm_conversation: "DM Conversation",
  manual: "Added Manually",
};

/**
 * The five sources the "Leads by Source" card always lists, in the order it
 * lists them. Anything outside this set still renders in the table — it just
 * doesn't get a permanent slot in the breakdown.
 */
export const PRIMARY_SOURCES: LeadSource[] = [
  "post_comment",
  "reel_comment",
  "story_reply",
  "story_mention",
  "inbox_keyword",
];

export function sourceLabel(source: string): string {
  return isLeadSource(source) ? SOURCE_LABEL[source] : "Other";
}

// ------------------------------------------------------------------
// Conversion — a reading of the tags, not a stored column
// ------------------------------------------------------------------

export const CONVERSIONS = ["customer", "support", "interested", "new"] as const;
export type Conversion = (typeof CONVERSIONS)[number];

export const CONVERSION_LABEL: Record<Conversion, string> = {
  customer: "Customer",
  support: "Support",
  interested: "Interested",
  new: "New",
};

export const CONVERSION_DOT: Record<Conversion, string> = {
  customer: "bg-success",
  support: "bg-running",
  interested: "bg-brand",
  new: "bg-border-strong",
};

/**
 * First match wins, most-committed first: someone tagged both `customer` and
 * `interested` is a customer. Falling through to "New" is correct rather than
 * lazy — an untagged lead genuinely hasn't declared anything yet.
 */
export function conversionOf(tags: string[]): Conversion {
  if (tags.includes("customer")) return "customer";
  if (tags.includes("support")) return "support";
  if (tags.includes("interested")) return "interested";
  return "new";
}

// ------------------------------------------------------------------
// Tags
// ------------------------------------------------------------------

/** Offered by the row menu. Free-form tags from elsewhere still render. */
export const SUGGESTED_TAGS = [
  "interested",
  "price",
  "discount",
  "support",
  "customer",
  "premium",
  "loyal",
] as const;

export function normaliseTag(raw: string): string {
  return raw.trim().toLowerCase();
}

// ------------------------------------------------------------------
// Date range
// ------------------------------------------------------------------

export const LEAD_RANGES = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type RangeKey = (typeof LEAD_RANGES)[number]["value"];

export const DEFAULT_RANGE: RangeKey = "30d";

const ALL_TIME_FLOOR = new Date("2024-01-01T00:00:00.000Z");

export function parseRange(value: string | null | undefined): RangeKey {
  return LEAD_RANGES.some((r) => r.value === value)
    ? (value as RangeKey)
    : DEFAULT_RANGE;
}

export function rangeLabel(key: RangeKey): string {
  return LEAD_RANGES.find((r) => r.value === key)!.label;
}

export type ResolvedRange = {
  key: RangeKey;
  label: string;
  start: Date;
  end: Date;
  /** Start of the comparison window, or null when there's no baseline. */
  prevStart: Date | null;
  prevEnd: Date | null;
  /** Earliest instant we need rows for — covers the comparison window too. */
  fetchFrom: Date;
  /** Copy for the delta line, e.g. "vs last 30 days". */
  comparisonLabel: string;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Calendar-day arithmetic — adding 86,400,000ms drifts across a DST boundary. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function resolveRange(key: RangeKey, now: Date = new Date()): ResolvedRange {
  const spec = LEAD_RANGES.find((r) => r.value === key)!;

  if (spec.days === null) {
    return {
      key,
      label: spec.label,
      start: ALL_TIME_FLOOR,
      end: now,
      prevStart: null,
      prevEnd: null,
      fetchFrom: ALL_TIME_FLOOR,
      comparisonLabel: "all time",
    };
  }

  const start = addDays(startOfDay(now), -(spec.days - 1));
  const prevStart = addDays(start, -spec.days);
  // `end` shifted back a whole window, not `start` — otherwise the baseline
  // covers N whole days against N-1 days plus part of today, and every delta
  // carries a built-in negative bias that shrinks as the day goes on.
  const prevEnd = new Date(now);
  prevEnd.setDate(prevEnd.getDate() - spec.days);

  return {
    key,
    label: spec.label,
    start,
    end: now,
    prevStart,
    prevEnd,
    fetchFrom: prevStart,
    comparisonLabel: `vs last ${spec.days} days`,
  };
}

// ------------------------------------------------------------------
// Filters + URL state
// ------------------------------------------------------------------

export type LeadFilters = {
  /** Instagram account ids. */
  accounts: string[];
  /** Automation ids. */
  automations: string[];
  sources: LeadSource[];
  tags: string[];
};

export const EMPTY_FILTERS: LeadFilters = {
  accounts: [],
  automations: [],
  sources: [],
  tags: [],
};

function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseFilters(raw: {
  accounts?: string | null;
  automations?: string | null;
  sources?: string | null;
  tags?: string | null;
}): LeadFilters {
  return {
    accounts: splitCsv(raw.accounts),
    automations: splitCsv(raw.automations),
    sources: splitCsv(raw.sources).filter(isLeadSource),
    tags: splitCsv(raw.tags).map(normaliseTag),
  };
}

export function activeFilterCount(f: LeadFilters): number {
  return (
    f.accounts.length + f.automations.length + f.sources.length + f.tags.length
  );
}

export const VIEWS = ["list", "grid"] as const;
export type ViewMode = (typeof VIEWS)[number];

export function parseView(value: string | null | undefined): ViewMode {
  return value === "grid" ? "grid" : "list";
}

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 10;

export function parsePerPage(value: string | null | undefined): number {
  const n = Number(value);
  return (PER_PAGE_OPTIONS as readonly number[]).includes(n)
    ? n
    : DEFAULT_PER_PAGE;
}

export function parsePage(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parseSearch(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, 120);
}

// ------------------------------------------------------------------
// The row the screen renders
// ------------------------------------------------------------------

export type Lead = {
  id: string;
  name: string;
  handle: string | null;
  email: string;
  initials: string;
  source: LeadSource;
  sourceLabel: string;
  /** The automation that produced the lead — the SOURCE cell's subtitle. */
  automationName: string | null;
  status: LeadStatus;
  tags: string[];
  conversion: Conversion;
  lastActivity: string;
  lastActivityLabel: string;
  /** Precomputed pip class — see activityTone on why it isn't derived in JSX. */
  activityTone: string;
  createdAt: string;
  revenue: number;
};

/**
 * A display name, from whatever the row actually has. Handles are the common
 * case; email local-parts are the fallback, and "priya.love" reads better as
 * "Priya Love" than as itself.
 */
export function displayName(handle: string | null, email: string): string {
  const base = handle?.trim() || email.split("@")[0] || "Unknown";
  return base
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function initialsOf(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ------------------------------------------------------------------
// Formatting
// ------------------------------------------------------------------

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "2 minutes ago". Rendered on the server and never re-ticked on the client —
 * a relative clock that updates would fight React hydration for no real gain
 * on a page the user reloads to refresh anyway.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";

  const diff = Math.max(0, now.getTime() - then);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

/**
 * Freshness pip beside the activity cell: today, this week, older.
 *
 * `now` is required rather than defaulted. A default would read the clock at
 * render time, which means the server and the client compute it a beat apart
 * and a lead sitting on a boundary hydrates with a different coloured dot than
 * it was sent with. The one clock reading happens in the query layer.
 */
export function activityTone(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < DAY) return "bg-success";
  if (diff < 7 * DAY) return "bg-brand";
  return "bg-border-strong";
}

// ------------------------------------------------------------------
// Deltas
// ------------------------------------------------------------------

export type Delta =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "change"; value: number; unit: "percent" | "points" };

export const NO_DELTA: Delta = { kind: "none" };

export function percentChange(current: number, previous: number | null): Delta {
  if (previous === null) return NO_DELTA;
  if (previous === 0) return current > 0 ? { kind: "new" } : NO_DELTA;
  return {
    kind: "change",
    value: ((current - previous) / previous) * 100,
    unit: "percent",
  };
}

/** Rates move in *points*. "Conversion up 3.7%" is wrong when 23.7 → 24.6. */
export function pointChange(current: number, previous: number | null): Delta {
  if (previous === null) return NO_DELTA;
  if (previous === 0) return current > 0 ? { kind: "new" } : NO_DELTA;
  return { kind: "change", value: current - previous, unit: "points" };
}

/** Sub-0.05 movement rounds to "0.0%", which shouldn't wear an arrow. */
export function isFlat(delta: Delta): boolean {
  return delta.kind === "change" && Math.abs(delta.value) < 0.05;
}

export function formatDelta(delta: Delta): string {
  if (delta.kind === "none") return "—";
  if (delta.kind === "new") return "New";
  const sign = delta.value > 0 ? "↑" : delta.value < 0 ? "↓" : "";
  const unit = delta.unit === "points" ? "pts" : "%";
  return `${sign}${Math.abs(delta.value).toFixed(1)}${unit}`;
}

/** Signed and glyph-free — for the CSV, where an arrow is noise. */
export function formatDeltaSigned(delta: Delta): string {
  if (delta.kind === "none") return "";
  if (delta.kind === "new") return "new";
  const unit = delta.unit === "points" ? "pts" : "%";
  return `${delta.value >= 0 ? "+" : ""}${delta.value.toFixed(1)}${unit}`;
}

export function deltaTone(delta: Delta): string {
  if (delta.kind !== "change" || isFlat(delta)) return "text-ink-muted";
  return delta.value > 0 ? "text-success" : "text-danger";
}

// ------------------------------------------------------------------
// KPI strip
// ------------------------------------------------------------------

export type MetricKey =
  | "total"
  | "new"
  | "engaged"
  | "converted"
  | "conversion_rate";

export type Metric = {
  key: MetricKey;
  label: string;
  display: string;
  delta: Delta;
};

export function share(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

// ------------------------------------------------------------------
// Breakdowns
// ------------------------------------------------------------------

export type Slice = {
  key: string;
  label: string;
  count: number;
  /** 0–100. */
  pct: number;
};

export function statusBreakdown(
  counts: Record<LeadStatus, number>,
  total: number,
): (Slice & { status: LeadStatus })[] {
  return LEAD_STATUSES.map((status) => ({
    key: status,
    status,
    label: STATUS_LABEL[status],
    count: counts[status],
    pct: share(counts[status], total),
  }));
}

export function sourceBreakdown(
  counts: Record<string, number>,
  total: number,
): Slice[] {
  const known = new Set<string>(PRIMARY_SOURCES);
  const other = Object.entries(counts)
    .filter(([k]) => !known.has(k))
    .reduce((sum, [, v]) => sum + v, 0);

  const rows: Slice[] = PRIMARY_SOURCES.map((s) => ({
    key: s,
    label: SOURCE_LABEL[s],
    count: counts[s] ?? 0,
    pct: share(counts[s] ?? 0, total),
  }));

  if (other > 0) {
    rows.push({
      key: "other",
      label: "Other",
      count: other,
      pct: share(other, total),
    });
  }

  // Descending, so the card reads as a ranking rather than a fixed menu.
  return rows.sort((a, b) => b.count - a.count);
}

export function topTags(counts: Record<string, number>, limit = 5): Slice[] {
  const max = Math.max(1, ...Object.values(counts));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({
      key: tag,
      label: tag,
      count,
      // Relative to the leader, not to the total — five tags that each appear
      // on a third of the leads would otherwise render as five stubs.
      pct: share(count, max),
    }));
}

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------

export type PageInfo = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
};

export function pageInfo(page: number, perPage: number, total: number): PageInfo {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(total, safePage * perPage);
  return { page: safePage, perPage, total, totalPages, from, to };
}

/**
 * The numbers to render, with `null` for each gap. Always shows first, last,
 * current and its neighbours — so the control has a stable width instead of
 * reflowing as the user walks through 125 pages.
 */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const out: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) out.push(null);
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < totalPages - 1) out.push(null);
  out.push(totalPages);

  return out;
}

// ------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------

/** RFC 4180 quoting. A tag list containing a comma must not split a column. */
export function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRows(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
