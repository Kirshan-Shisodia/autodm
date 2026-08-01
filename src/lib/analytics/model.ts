// Pure helpers for the Analytics screen. Framework-free so the server page,
// the client cards, the CSV export route and the tests all share one definition
// of "what a metric is" and "how a number is written".
//
// Design language: HALO v4 (halo-tokensv4.json). Colour decisions live here as
// token-backed utility class strings so the JSX stays about layout.

// ------------------------------------------------------------------
// Date range
// ------------------------------------------------------------------

export const ANALYTICS_RANGES = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type RangeKey = (typeof ANALYTICS_RANGES)[number]["value"];

export const DEFAULT_RANGE: RangeKey = "30d";

/** The floor for "all time" — the product did not exist before this. */
const ALL_TIME_FLOOR = new Date("2024-01-01T00:00:00.000Z");

export function isRangeKey(value: string | null | undefined): value is RangeKey {
  return ANALYTICS_RANGES.some((r) => r.value === value);
}

export function parseRange(value: string | null | undefined): RangeKey {
  return isRangeKey(value) ? value : DEFAULT_RANGE;
}

export function rangeLabel(key: RangeKey): string {
  return ANALYTICS_RANGES.find((r) => r.value === key)!.label;
}

export type ResolvedRange = {
  key: RangeKey;
  label: string;
  /** Inclusive lower bound of the window. */
  start: Date;
  /** Inclusive upper bound — "now". */
  end: Date;
  /** Start of the comparison window, or null when there's no baseline. */
  prevStart: Date | null;
  /**
   * End of the comparison window. It is `end` shifted back a whole window, not
   * `start` — otherwise the baseline covers N whole days while the current
   * window covers N-1 days plus however much of today has elapsed, and every
   * delta on the page carries a built-in negative bias that shrinks as the day
   * goes on.
   */
  prevEnd: Date | null;
  /** Earliest instant we need rows for (covers the comparison window too). */
  fetchFrom: Date;
  /** Chart granularity — long windows collapse to weeks so bars stay legible. */
  unit: "day" | "week";
  /** Human copy for the delta line, e.g. "vs previous 30 days". */
  comparisonLabel: string;
};

/** Midnight local time on the day `date` falls in. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Calendar-day arithmetic, not millisecond arithmetic. Adding 86,400,000ms
 * across a DST boundary lands on 23:00 or 01:00, which drifts every downstream
 * bucket by an hour and can silently drop the final bucket from the chart.
 */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Same clock time, `days` earlier. Used to shift a whole window backwards. */
function shiftBackDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() - days);
  return out;
}

export function resolveRange(
  key: RangeKey,
  now: Date = new Date(),
): ResolvedRange {
  const end = now;
  const spec = ANALYTICS_RANGES.find((r) => r.value === key)!;

  if (spec.days === null) {
    return {
      key,
      label: spec.label,
      start: ALL_TIME_FLOOR,
      end,
      prevStart: null,
      prevEnd: null,
      fetchFrom: ALL_TIME_FLOOR,
      unit: "week",
      comparisonLabel: "all time",
    };
  }

  // Windows are day-aligned so "last 30 days" always means 30 whole buckets.
  const start = addDays(startOfDay(end), -(spec.days - 1));
  const prevStart = addDays(start, -spec.days);
  const prevEnd = shiftBackDays(end, spec.days);

  return {
    key,
    label: spec.label,
    start,
    end,
    prevStart,
    prevEnd,
    fetchFrom: prevStart,
    unit: spec.days > 60 ? "week" : "day",
    comparisonLabel: `vs previous ${spec.days} days`,
  };
}

// ------------------------------------------------------------------
// Bucketing
// ------------------------------------------------------------------

export type SeriesPoint = {
  /** Bucket start as a real instant — parses back correctly for tooltips. */
  t: string;
  /**
   * Bucket start as a local calendar date, `YYYY-MM-DD`. The CSV uses this
   * rather than slicing `t`: `t` is local midnight serialised to UTC, so east
   * of Greenwich its date component is the *previous* day and the export would
   * disagree with the axis tick beside it.
   */
  date: string;
  /** Axis tick, e.g. "May 18". */
  label: string;
  value: number;
};

/** Beyond this the chart is noise, not information. */
const MAX_BUCKETS = 120;

function bucketStarts(range: ResolvedRange): Date[] {
  const stepDays = range.unit === "week" ? 7 : 1;
  const last = startOfDay(range.end);
  const out: Date[] = [];

  for (
    let d = startOfDay(range.start);
    d.getTime() <= last.getTime();
    d = addDays(d, stepDays)
  ) {
    out.push(d);
  }

  if (out.length === 0) return [startOfDay(range.start)];
  // Keep the *most recent* buckets. Truncating the head would silently drop
  // today from an all-time chart while the KPI above it still counted today.
  return out.length > MAX_BUCKETS ? out.slice(out.length - MAX_BUCKETS) : out;
}

function tickLabel(date: Date, unit: "day" | "week"): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: unit === "week" ? "numeric" : "2-digit",
  });
}

function localDate(date: Date): string {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Drop a list of timestamps into day (or week) buckets across the window.
 *
 * Buckets are located by binary search rather than division: DST makes them
 * unequal in milliseconds, and the list may start later than `range.start`
 * once the bucket cap kicks in.
 */
export function toSeries(
  timestamps: string[],
  range: ResolvedRange,
): SeriesPoint[] {
  const starts = bucketStarts(range);
  const startsMs = starts.map((d) => d.getTime());
  const counts = new Array<number>(starts.length).fill(0);
  const endMs = range.end.getTime();

  for (const iso of timestamps) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t) || t < startsMs[0] || t > endMs) continue;
    // Rightmost bucket whose start is still <= t.
    let lo = 0;
    let hi = startsMs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (startsMs[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    counts[lo] += 1;
  }

  return starts.map((d, i) => ({
    t: d.toISOString(),
    date: localDate(d),
    label: tickLabel(d, range.unit),
    value: counts[i],
  }));
}

/** Rows that landed inside the current window. */
export function countInWindow(timestamps: string[], range: ResolvedRange): number {
  const from = range.start.getTime();
  const to = range.end.getTime();
  let n = 0;
  for (const iso of timestamps) {
    const t = new Date(iso).getTime();
    if (t >= from && t <= to) n += 1;
  }
  return n;
}

/**
 * Rows that landed in the comparison window — the current window shifted back
 * whole, so the two cover the same amount of elapsed time. Null when there's
 * no baseline (all-time).
 */
export function countInPrevWindow(
  timestamps: string[],
  range: ResolvedRange,
): number | null {
  if (!range.prevStart || !range.prevEnd) return null;
  const from = range.prevStart.getTime();
  const to = range.prevEnd.getTime();
  let n = 0;
  for (const iso of timestamps) {
    const t = new Date(iso).getTime();
    if (t >= from && t <= to) n += 1;
  }
  return n;
}

// ------------------------------------------------------------------
// Hour-of-week heatmap
// ------------------------------------------------------------------

/** 8 rows of three hours each; labels land on every other row (12AM/6AM/…). */
export const HEATMAP_ROWS = 8;
export const HEATMAP_HOURS_PER_ROW = 24 / HEATMAP_ROWS;

export const HEATMAP_ROW_LABELS = ["12 AM", "", "6 AM", "", "12 PM", "", "6 PM", ""];
export const HEATMAP_COL_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export type Heatmap = {
  /** [row][col] — row is a 3-hour block, col is Monday-first day of week. */
  cells: number[][];
  max: number;
  /** "Wed 8 PM", or null when there's nothing to peak at. */
  peak: string | null;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toHeatmap(timestamps: string[], range: ResolvedRange): Heatmap {
  const cells: number[][] = Array.from({ length: HEATMAP_ROWS }, () =>
    new Array<number>(7).fill(0),
  );
  const from = range.start.getTime();
  const to = range.end.getTime();

  let max = 0;
  let peakRow = -1;
  let peakCol = -1;

  for (const iso of timestamps) {
    const d = new Date(iso);
    const t = d.getTime();
    if (Number.isNaN(t) || t < from || t > to) continue;
    const col = (d.getDay() + 6) % 7; // JS Sunday=0 → Monday-first
    const row = Math.floor(d.getHours() / HEATMAP_HOURS_PER_ROW);
    const next = (cells[row][col] += 1);
    if (next > max) {
      max = next;
      peakRow = row;
      peakCol = col;
    }
  }

  return {
    cells,
    max,
    peak:
      max > 0
        ? `${DAY_NAMES[peakCol]} ${formatHour(peakRow * HEATMAP_HOURS_PER_ROW)}`
        : null,
  };
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

/**
 * HALO v4 leaves `color.data-viz.series.*` explicitly null (deferred to Phase
 * 2), so there is no sanctioned ramp to reach for. This one is derived rather
 * than invented: it interpolates the two endpoints the token file *does*
 * define — surface.app (#F7F4EF) up to text.brand (#A96B24) — in five steps.
 * Swap the middles out wholesale once the series tokens land.
 *
 * Returned as hex so `style` can set it without a Tailwind safelist.
 */
const HEAT_STEPS = ["#f7f4ef", "#f5e6d3", "#eccfa9", "#dcab6f", "#c08340", "#a96b24"];

export function heatColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return HEAT_STEPS[0];
  const step = Math.ceil((value / max) * (HEAT_STEPS.length - 1));
  return HEAT_STEPS[Math.min(step, HEAT_STEPS.length - 1)];
}

// ------------------------------------------------------------------
// Numbers
// ------------------------------------------------------------------

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** 12480 → "12.5K". Used where the full number would break the layout. */
export function formatCompact(n: number): string {
  if (Math.abs(n) < 1000) return `${n}`;
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(rate: number, digits = 1): string {
  return `${rate.toFixed(digits)}%`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * A change against a baseline. "New" is kept distinct from "none": going
 * 0 → 500 is the most interesting movement on the page, and collapsing it into
 * the same null as "there is no previous period" hides it.
 */
export type Delta =
  | { kind: "value"; value: number; unit: "percent" | "points" }
  | { kind: "new" }
  | { kind: "none" };

export const NO_DELTA: Delta = { kind: "none" };

/** Signed percentage change between two counts. */
export function percentChange(current: number, previous: number | null): Delta {
  if (previous === null) return NO_DELTA;
  if (previous === 0) {
    return current === 0
      ? { kind: "value", value: 0, unit: "percent" }
      : { kind: "new" };
  }
  return {
    kind: "value",
    value: ((current - previous) / previous) * 100,
    unit: "percent",
  };
}

/** Difference between two rates, in percentage *points* — never percent. */
export function pointChange(current: number, previous: number | null): Delta {
  if (previous === null) return NO_DELTA;
  return { kind: "value", value: current - previous, unit: "points" };
}

/** True when a delta rounds to nothing at one decimal place. */
export function isFlat(delta: Delta): boolean {
  return delta.kind === "value" && Math.abs(delta.value) < 0.05;
}

/** "↑ 18.2%" / "↑ 0.9 pts" / "New". Empty string when there's nothing to say. */
export function formatDelta(delta: Delta): string {
  if (delta.kind === "none") return "";
  if (delta.kind === "new") return "New";
  if (isFlat(delta)) return "0";
  return `${Math.abs(delta.value).toFixed(1)}${
    delta.unit === "points" ? " pts" : "%"
  }`;
}

/** Signed form for the CSV, where there are no arrow glyphs to lean on. */
export function formatDeltaSigned(delta: Delta): string {
  if (delta.kind === "none") return "";
  if (delta.kind === "new") return "new";
  return `${delta.value > 0 ? "+" : ""}${delta.value.toFixed(1)}${
    delta.unit === "points" ? " pts" : "%"
  }`;
}

/** Share of `total`, guarded against divide-by-zero. */
export function share(part: number, total: number): number {
  return total <= 0 ? 0 : (part / total) * 100;
}

/** Positive is success, negative is danger, flat/absent is muted. */
export function deltaTone(delta: Delta): string {
  if (delta.kind === "none") return "text-ink-muted";
  if (delta.kind === "new") return "text-success";
  if (isFlat(delta)) return "text-ink-muted";
  return delta.value > 0 ? "text-success" : "text-danger";
}

// ------------------------------------------------------------------
// Metric definitions
// ------------------------------------------------------------------

export type MetricKey =
  | "dms_sent"
  | "link_clicks"
  | "new_leads"
  | "conversion_rate"
  | "revenue"
  | "plan_usage";

export type Metric = {
  key: MetricKey;
  label: string;
  /** Formatted headline value. */
  display: string;
  /** Movement vs the comparison window. */
  delta: Delta;
  /** Sparkline data. Empty for metrics with no meaningful series. */
  series: number[];
  /** Set when the metric has no data source yet (spec gap, not a bug). */
  stub?: boolean;
  /** Second line for the plan-usage card, which shows a bar not a delta. */
  footnote?: string;
  /** 0–100, only for plan usage. */
  progress?: number;
};

// ------------------------------------------------------------------
// Conversion funnel
// ------------------------------------------------------------------

export type FunnelStage = {
  label: string;
  value: number;
  /** Percent of the first *tracked* stage. */
  pct: number;
  stub?: boolean;
};

/**
 * Comments Received is the one stage the schema can't answer — we only persist
 * a row once a trigger matches, so upstream comment volume is invisible. It's
 * rendered as an explicit gap rather than an invented number.
 */
export function buildFunnel({
  triggersMatched,
  dmsDelivered,
  linkClicks,
  leads,
}: {
  triggersMatched: number;
  dmsDelivered: number;
  linkClicks: number;
  leads: number;
}): FunnelStage[] {
  const base = triggersMatched;
  return [
    { label: "Comments received", value: 0, pct: 0, stub: true },
    { label: "Triggers matched", value: triggersMatched, pct: base > 0 ? 100 : 0 },
    { label: "DMs delivered", value: dmsDelivered, pct: share(dmsDelivered, base) },
    { label: "Link clicks", value: linkClicks, pct: share(linkClicks, base) },
    { label: "Leads / conversions", value: leads, pct: share(leads, base) },
  ];
}

// ------------------------------------------------------------------
// Engagement mix (the donut)
// ------------------------------------------------------------------

export type EngagementSlice = {
  label: string;
  value: number;
  pct: number;
  color: string;
};

/**
 * What happened after a DM landed. Three mutually exclusive outcomes, so the
 * ring always closes: converted to a lead, clicked only, or went quiet.
 */
export function buildEngagement({
  dmsDelivered,
  linkClicks,
  leads,
}: {
  dmsDelivered: number;
  linkClicks: number;
  leads: number;
}): { overall: number; slices: EngagementSlice[] } {
  const converted = Math.min(leads, dmsDelivered);
  const clickedOnly = Math.max(0, Math.min(linkClicks, dmsDelivered) - converted);
  const quiet = Math.max(0, dmsDelivered - converted - clickedOnly);

  return {
    overall: share(converted + clickedOnly, dmsDelivered),
    slices: [
      {
        label: "Converted to lead",
        value: converted,
        pct: share(converted, dmsDelivered),
        color: "#a96b24",
      },
      {
        label: "Clicked link only",
        value: clickedOnly,
        pct: share(clickedOnly, dmsDelivered),
        color: "#dcab6f",
      },
      {
        label: "No action",
        value: quiet,
        pct: share(quiet, dmsDelivered),
        color: "#f1eee8",
      },
    ],
  };
}

// ------------------------------------------------------------------
// Sparkline geometry
// ------------------------------------------------------------------

/**
 * An SVG path across a fixed 100×32 viewBox. Pure geometry so the same helper
 * serves the KPI strip and the metrics table.
 */
export function sparklinePath(
  values: number[],
  width = 100,
  height = 32,
): { line: string; area: string } {
  if (values.length === 0) return { line: "", area: "" };

  const max = Math.max(...values);
  const min = Math.min(...values);

  // A flat series is drawn down the middle, not pinned to the floor — bottoming
  // it out would make "steady at 500" look identical to "flat at zero", and
  // would disagree with the single-point case sitting right beside it.
  if (values.length === 1 || max === min) {
    const y = height / 2;
    return {
      line: `M0 ${y} L${width} ${y}`,
      area: `M0 ${y} L${width} ${y} L${width} ${height} L0 ${height} Z`,
    };
  }

  const span = max - min;
  const stepX = width / (values.length - 1);
  // 2px of breathing room top and bottom so peaks aren't clipped by the border.
  const pad = 2;
  const usable = height - pad * 2;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = pad + usable - ((v - min) / span) * usable;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const line = `M${points.join(" L")}`;
  return {
    line,
    area: `${line} L${width} ${height} L0 ${height} Z`,
  };
}

// ------------------------------------------------------------------
// Recent activity
// ------------------------------------------------------------------

export const ACTIVITY_KINDS = [
  "dm_sent",
  "dm_failed",
  "link_click",
  "lead",
  "automation_edited",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type ActivityRow = {
  id: string;
  kind: ActivityKind;
  /** Primary line, e.g. "DM sent to @user123". */
  title: string;
  at: string;
};

export const ACTIVITY_META: Record<
  ActivityKind,
  { badge: string; chip: string }
> = {
  dm_sent: { badge: "DM sent", chip: "bg-surface-muted text-ink-secondary" },
  dm_failed: { badge: "Failed", chip: "bg-danger-bg text-danger" },
  link_click: { badge: "Link click", chip: "bg-warning-bg text-warning-text" },
  lead: { badge: "Lead", chip: "bg-success-bg text-success" },
  automation_edited: {
    badge: "Edited",
    chip: "border border-border-strong bg-transparent text-ink-tertiary",
  },
};

/** Compact relative time: "2m ago", "4h ago", "3d ago". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ------------------------------------------------------------------
// Filters
// ------------------------------------------------------------------

export const DM_STATUSES = [
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "queued", label: "Queued" },
  { value: "duplicate_skipped", label: "Duplicate skipped" },
  { value: "rate_limit_skipped", label: "Rate-limit skipped" },
] as const;

export type AnalyticsFilters = {
  /** instagram_accounts.id */
  accounts: string[];
  /** automations.id */
  automations: string[];
  /** dm_logs.status */
  statuses: string[];
};

export const EMPTY_FILTERS: AnalyticsFilters = {
  accounts: [],
  automations: [],
  statuses: [],
};

/** Comma-separated search params → a filter object. Empty means "everything". */
export function parseFilters(params: {
  accounts?: string | null;
  automations?: string | null;
  statuses?: string | null;
}): AnalyticsFilters {
  const split = (v: string | null | undefined) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const statuses = split(params.statuses).filter((s) =>
    DM_STATUSES.some((d) => d.value === s),
  );

  return {
    accounts: split(params.accounts),
    automations: split(params.automations),
    statuses,
  };
}

export function serializeFilters(filters: AnalyticsFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.accounts.length) params.set("accounts", filters.accounts.join(","));
  if (filters.automations.length)
    params.set("automations", filters.automations.join(","));
  if (filters.statuses.length) params.set("statuses", filters.statuses.join(","));
  return params;
}

export function activeFilterCount(filters: AnalyticsFilters): number {
  return (
    filters.accounts.length + filters.automations.length + filters.statuses.length
  );
}

// ------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------

/** RFC-4180-ish escaping: quote anything containing a comma, quote or newline. */
export function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRows(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
