"use client";

// Recent Activity — the last eight things that happened, merged from DM logs,
// link clicks, leads and automation edits. Client-side only so the relative
// timestamps ("2m ago") tick without a round trip and don't trip hydration.

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Link2,
  Pencil,
  Send,
  TriangleAlert,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ACTIVITY_META,
  relativeTime,
  type ActivityKind,
  type ActivityRow,
} from "@/lib/analytics/model";
import { AnalyticsCard, CardEmpty } from "./card";

const ICONS: Record<ActivityKind, LucideIcon> = {
  dm_sent: Send,
  dm_failed: TriangleAlert,
  link_click: Link2,
  lead: UserPlus,
  automation_edited: Pencil,
};

/** Re-render every 30s. Coarsened to a bucket so the snapshot stays stable. */
function subscribeToClock(onChange: () => void): () => void {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

const clockSnapshot = () => Math.floor(Date.now() / 30_000);
/** The server has no useful "now", so it renders the timestamps blank. */
const serverSnapshot = () => null;

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  // "2m ago" has to be measured against the reader's clock, not the render's,
  // or the server HTML and the hydrated DOM disagree. useSyncExternalStore is
  // the sanctioned way to say "this value differs on the server".
  const tick = useSyncExternalStore(
    subscribeToClock,
    clockSnapshot,
    serverSnapshot,
  );
  const now = tick === null ? null : new Date();

  return (
    <AnalyticsCard
      title="Recent Activity"
      action={
        <Link
          href="/automations"
          className="inline-flex items-center gap-1 rounded-sm text-[12px] font-medium text-brand transition-colors duration-100 hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <CardEmpty>Nothing has happened in this period yet.</CardEmpty>
      ) : (
        <ul className="space-y-0.5">
          {rows.map((row) => {
            const Icon = ICONS[row.kind];
            const meta = ACTIVITY_META[row.kind];
            return (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors duration-100 hover:bg-hover-bg"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    row.kind === "dm_failed"
                      ? "bg-danger-bg text-danger"
                      : "bg-surface-muted text-ink-secondary",
                  )}
                  aria-hidden
                >
                  <Icon className="size-3.5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">
                    {row.title}
                  </span>
                  <span className="block text-[11px] text-ink-muted">
                    {now ? (
                      relativeTime(row.at, now)
                    ) : (
                      <span className="invisible">just now</span>
                    )}
                  </span>
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    meta.chip,
                  )}
                >
                  {meta.badge}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AnalyticsCard>
  );
}
