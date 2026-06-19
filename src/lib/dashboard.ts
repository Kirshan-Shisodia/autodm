// Dashboard helpers (spec §5, §7, §11). Pure functions shared by the server
// page and the client realtime feed — no DB words leak into copy here.

import type { Database } from "@/types/database";

export type Plan = Database["public"]["Tables"]["users"]["Row"]["plan"];

// Monthly DM allowance per plan (PRD §10.5.3 / spec §5).
export const DM_LIMIT: Record<Plan, number> = {
  free: 1000,
  pro: 25000,
  platinum: 300000,
};

// Free plan allows a single automation — surfaced as context on the dashboard,
// enforced for real on create.
export const FREE_AUTOMATION_LIMIT = 1;

/** ISO timestamp for 00:00 on the first of the current month, local time. */
export function startOfMonth(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** ISO timestamp for `hours` ago — used for the per-hour rate-limit window. */
export function hoursAgo(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

/** "Good morning / afternoon / evening" by local hour. */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Compact relative time for the feed: "2s ago", "1m ago", "4h ago", "3d ago". */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Number with thousands separators, e.g. 1204 → "1,204". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** Capitalized plan label for the profile badge. */
export function planLabel(plan: Plan): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}
