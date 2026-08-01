// Pure helpers for the Automations list screen. Everything here is
// framework-free so the server page, the client screen and the tests can all
// share one definition of "what a row is" and "how a number is written".
//
// Design language: HALO v4 (halo-tokensv4.json). Colour decisions live here as
// token-backed utility class strings so the JSX stays about layout.

import {
  Image as ImageIcon,
  Film,
  MessageCircle,
  AtSign,
  Inbox,
  Megaphone,
  Square,
  type LucideIcon,
} from "lucide-react";

// ------------------------------------------------------------------
// Shape
// ------------------------------------------------------------------

export const AUTOMATION_STATUSES = [
  "active",
  "paused",
  "completed",
  "draft",
] as const;

export type AutomationStatus = (typeof AUTOMATION_STATUSES)[number];

export type AutomationListItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: AutomationStatus;
  triggers: number;
  dms_sent: number;
  link_clicks: number;
  created_at: string;
};

/** The tab bar. `all` is a pseudo-status that matches everything. */
export const LIST_TABS = [
  { value: "all", label: "All Automations" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Drafts" },
] as const;

export type ListTab = (typeof LIST_TABS)[number]["value"];

export const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name (A–Z)" },
  { value: "triggers", label: "Most triggers" },
  { value: "dms", label: "Most DMs sent" },
  { value: "conversion", label: "Best conversion" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZES = [10, 25, 50] as const;

// ------------------------------------------------------------------
// Presentational metadata
// ------------------------------------------------------------------

/** Friendly label + icon per automation type. Never render the raw enum. */
const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  post: { label: "Post", icon: ImageIcon },
  reel: { label: "Reel", icon: Film },
  story_reply: { label: "Story reply", icon: MessageCircle },
  story_mention: { label: "Story mention", icon: AtSign },
  inbox: { label: "Inbox", icon: Inbox },
  ad: { label: "Ad", icon: Megaphone },
  facebook_post: { label: "Facebook post", icon: Square },
};

export function typeMeta(type: string): { label: string; icon: LucideIcon } {
  return TYPE_META[type] ?? { label: type, icon: Square };
}

/**
 * Status chip styling, straight off the HALO status tokens
 * (status.success / status.warning / status.neutral + border.strong).
 */
export const STATUS_META: Record<
  AutomationStatus,
  { label: string; chip: string; dot: string }
> = {
  active: {
    label: "Active",
    chip: "bg-success-bg text-success",
    dot: "bg-[#3eaa83]",
  },
  paused: {
    label: "Paused",
    chip: "bg-warning-bg text-warning-text",
    dot: "bg-brand",
  },
  completed: {
    label: "Completed",
    chip: "bg-surface-muted text-ink-secondary",
    dot: "bg-ink-muted",
  },
  draft: {
    label: "Draft",
    chip: "border border-border-strong bg-transparent text-ink-tertiary",
    dot: "bg-border-strong",
  },
};

/**
 * Conversion is the one number worth colouring: clicks per DM sent. Thresholds
 * are deliberately generous — 40%+ is a strong link-in-DM funnel.
 */
export function conversionTone(rate: number): string {
  if (rate >= 40) return "bg-success-bg text-success";
  if (rate >= 30) return "bg-warning-bg text-warning-text";
  return "bg-danger-bg text-danger";
}

// ------------------------------------------------------------------
// Derived numbers
// ------------------------------------------------------------------

/** Clicks ÷ DMs sent, as a percentage. Zero sends means zero, not NaN. */
export function conversionRate(item: AutomationListItem): number {
  if (item.dms_sent <= 0) return 0;
  return (item.link_clicks / item.dms_sent) * 100;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/** "May 28, 2024" — the first line of the Created cell. */
export function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** "10:30 AM" — the second, quieter line. */
export function formatCreatedTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

/** ISO timestamp for 00:00 today, local time. */
export function startOfToday(now: Date = new Date()): string {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
}

// ------------------------------------------------------------------
// Stats strip
// ------------------------------------------------------------------

export type StatCounts = Record<ListTab, number>;

/** Counts for the five cards, keyed the same way as the tabs. */
export function countByStatus(items: AutomationListItem[]): StatCounts {
  const counts: StatCounts = {
    all: items.length,
    active: 0,
    paused: 0,
    completed: 0,
    draft: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/**
 * Net change over the last 30 days — rows created inside the window, which is
 * all the schema can honestly tell us (we don't keep a status history).
 */
export function countCreatedSince(
  items: AutomationListItem[],
  days = 30,
  now: Date = new Date(),
): StatCounts {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const recent = items.filter((i) => new Date(i.created_at).getTime() >= cutoff);
  return countByStatus(recent);
}

// ------------------------------------------------------------------
// Filter / sort / paginate — one pass, all client-side over the page's rows
// ------------------------------------------------------------------

export type ListFilters = {
  types: string[];
  createdWithinDays: number | null;
};

export const EMPTY_FILTERS: ListFilters = { types: [], createdWithinDays: null };

export function filterAutomations(
  items: AutomationListItem[],
  {
    tab,
    query,
    filters,
  }: { tab: ListTab; query: string; filters: ListFilters },
  now: Date = new Date(),
): AutomationListItem[] {
  const q = query.trim().toLowerCase();
  const cutoff =
    filters.createdWithinDays === null
      ? null
      : now.getTime() - filters.createdWithinDays * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    if (tab !== "all" && item.status !== tab) return false;
    if (filters.types.length > 0 && !filters.types.includes(item.type))
      return false;
    if (cutoff !== null && new Date(item.created_at).getTime() < cutoff)
      return false;
    if (q) {
      const haystack =
        `${item.name} ${item.description ?? ""} ${typeMeta(item.type).label}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function sortAutomations(
  items: AutomationListItem[],
  key: SortKey,
): AutomationListItem[] {
  const sorted = [...items];
  switch (key) {
    case "oldest":
      return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "triggers":
      return sorted.sort((a, b) => b.triggers - a.triggers);
    case "dms":
      return sorted.sort((a, b) => b.dms_sent - a.dms_sent);
    case "conversion":
      return sorted.sort((a, b) => conversionRate(b) - conversionRate(a));
    case "recent":
    default:
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export type PageInfo = {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
};

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { rows: T[]; info: PageInfo } {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);
  return {
    rows,
    info: {
      page: safePage,
      pageCount,
      total,
      from: total === 0 ? 0 : start + 1,
      to: start + rows.length,
    },
  };
}
