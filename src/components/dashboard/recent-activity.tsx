"use client";

// Recent Activity — the signature of this screen. Server-rendered from the
// merged feed (DMs, clicks, leads, edits) and then kept live: new dm_logs rows
// arrive over Supabase realtime and slide in at the top with a subtle flash.
//
// The realtime channel only covers dm_logs. Clicks and leads are inserted by
// paths the browser has no subscription to, so they appear on the next load —
// pretending otherwise would mean polling four tables to save a refresh.

import { useEffect, useState, useSyncExternalStore } from "react";
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
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVITY_META,
  relativeTime,
  type ActivityKind,
  type ActivityRow,
} from "@/lib/analytics/model";
import { AnalyticsCard, CardEmpty } from "@/components/analytics/card";

const ICONS: Record<ActivityKind, LucideIcon> = {
  dm_sent: Send,
  dm_failed: TriangleAlert,
  link_click: Link2,
  lead: UserPlus,
  automation_edited: Pencil,
};

/** How many rows the feed keeps in memory. The card scrolls to reach the rest. */
const MAX_ROWS = 8;

/**
 * Floor for the feed, in px — roughly four rows.
 *
 * The feed is `flex-1` above this, so it takes whatever height the row's taller
 * card (the 248px chart) hands it and scrolls past that. The floor only matters
 * when this card is the tall one, and it stops the list collapsing to a single
 * row on a quiet week.
 *
 * Height-capped rather than `rows.slice(0, 4)`: slicing would mean a realtime
 * row arriving at the top pushes the last one out of existence, leaving nothing
 * to scroll to. Everything the feed holds stays reachable.
 */
const FEED_MIN_HEIGHT = 216;

/** Re-render every 30s so "2m ago" stays true. Bucketed to keep it stable. */
function subscribeToClock(onChange: () => void): () => void {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / 30_000);
/** The server has no useful "now", so it renders timestamps blank. */
const serverSnapshot = () => null;

export function RecentActivity({
  userId,
  rows: initialRows,
  hasAutomations,
  className,
}: {
  userId: string;
  rows: ActivityRow[];
  hasAutomations: boolean;
  className?: string;
}) {
  const [rows, setRows] = useState<ActivityRow[]>(initialRows);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [syncedRows, setSyncedRows] = useState<ActivityRow[]>(initialRows);

  // A fresh server render (range change, navigation) wins over accumulated
  // realtime state — otherwise switching to "last 7 days" keeps showing rows
  // from outside the window.
  //
  // Adjusted during render rather than in an effect. As an effect this painted
  // the stale feed first and then immediately re-rendered with the new one,
  // which is the cascading update React warns about — and on a live feed that
  // flicker is visible.
  if (initialRows !== syncedRows) {
    setSyncedRows(initialRows);
    setRows(initialRows);
    setFlashIds(new Set());
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dash-feed-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_logs",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const id = `dm-${String(row.id)}`;
          const who =
            (row.recipient_username as string | null) ||
            (row.recipient_ig_id as string | null) ||
            "someone";
          const at = (row.sent_at as string) ?? new Date().toISOString();
          const sent = ((row.status as string) ?? "sent") === "sent";

          const next: ActivityRow = {
            id,
            kind: sent ? "dm_sent" : "dm_failed",
            title: sent
              ? `DM sent to @${who}`
              : `DM to @${who} didn't send`,
            at,
          };

          setRows((prev) =>
            prev.some((r) => r.id === id)
              ? prev
              : [next, ...prev].slice(0, MAX_ROWS),
          );
          setFlashIds((prev) => new Set(prev).add(id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // "2m ago" has to be measured against the reader's clock, not the render's,
  // or the server HTML and the hydrated DOM disagree.
  const tick = useSyncExternalStore(
    subscribeToClock,
    clockSnapshot,
    serverSnapshot,
  );
  const now = tick === null ? null : new Date();

  return (
    <AnalyticsCard
      title="Recent Activity"
      className={className}
      // The card body is a plain block by default; the feed needs it to be a
      // flex column before `flex-1` on the list means anything.
      bodyClassName="flex flex-col"
      action={
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1 rounded-sm text-[12px] font-medium text-brand transition-colors duration-100 hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {rows.length === 0 ? (
        hasAutomations ? (
          <CardEmpty>
            Nothing yet in this period. New DMs appear here as they send.
          </CardEmpty>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-[13px] text-ink-muted">
              No activity yet. Your first automation starts the feed.
            </p>
            <Link
              href="/automations/new"
              className="text-[13px] font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              Create your first automation
            </Link>
          </div>
        )
      ) : (
        // `tabIndex={0}` because a scrollable region that can only be reached
        // with a mouse is unreachable for keyboard users — the browser needs it
        // to be focusable before arrow keys will scroll it.
        //
        // The explicit `minHeight` is also what makes the scrolling work. A flex
        // item defaults to `min-height: auto`, which means it grows to fit its
        // content and the overflow never triggers; any explicit value overrides
        // that, so the list is free to be shorter than its contents.
        <ul
          aria-live="polite"
          tabIndex={0}
          aria-label="Recent activity feed, scrollable"
          className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          style={{ minHeight: FEED_MIN_HEIGHT }}
        >
          {rows.map((row) => {
            const Icon = ICONS[row.kind];
            const meta = ACTIVITY_META[row.kind];
            return (
              <li
                key={row.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors duration-100 hover:bg-hover-bg",
                  flashIds.has(row.id) && "dash-row-flash",
                )}
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
