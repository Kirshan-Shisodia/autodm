"use client";

// Recent activity feed (spec §7) — the signature of this screen. The last 10
// sends, newest first, updating live via Supabase realtime. New rows get a
// subtle flash that respects prefers-reduced-motion.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/dashboard";

export type FeedRow = {
  id: string;
  recipient: string;
  label: string;
  status: string;
  sent_at: string;
  automation_id: string | null;
};

const MAX_ROWS = 10;

function StatusDot({ status }: { status: string }) {
  const failed = status === "failed";
  return (
    <span
      className={`inline-block size-2 shrink-0 rounded-full ${failed ? "bg-[var(--wz-accent-pop)]" : "bg-green-500"}`}
      aria-hidden
    />
  );
}

export function RecentActivity({
  userId,
  initialRows,
  hasAutomations,
}: {
  userId: string;
  initialRows: FeedRow[];
  hasAutomations: boolean;
}) {
  const [rows, setRows] = useState<FeedRow[]>(initialRows);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [, forceTick] = useState(0);

  // Map automation_id → display label so realtime inserts (which only carry the
  // id) can show the same name as the server-rendered rows.
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of initialRows) {
      if (r.automation_id && r.label) map.set(r.automation_id, r.label);
    }
    return map;
  }, [initialRows]);
  const nameRef = useRef(nameById);
  useEffect(() => {
    nameRef.current = nameById;
  }, [nameById]);

  // Keep relative timestamps fresh without a refresh.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Live: prepend new dm_logs INSERTs for this user.
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
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = String(row.id);
          const automationId = (row.automation_id as string | null) ?? null;
          const next: FeedRow = {
            id,
            recipient:
              (row.recipient_username as string | null) ||
              (row.recipient_ig_id as string | null) ||
              "someone",
            label:
              (automationId && nameRef.current.get(automationId)) || "DM",
            status: (row.status as string) ?? "sent",
            sent_at: (row.sent_at as string) ?? new Date().toISOString(),
            automation_id: automationId,
          };
          setRows((prev) => {
            if (prev.some((r) => r.id === id)) return prev;
            return [next, ...prev].slice(0, MAX_ROWS);
          });
          setFlashIds((prev) => new Set(prev).add(id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <section className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)]">
      <h2 className="border-b border-[var(--wz-border)] px-5 py-3 text-sm font-semibold text-[var(--wz-text)]">
        Recent activity
      </h2>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Inbox className="size-6 text-[var(--wz-text-muted)]" />
          <p className="text-sm text-[var(--wz-text-muted)]">
            No DMs sent yet. When someone comments your keyword, it&apos;ll show
            up here.
          </p>
          {!hasAutomations && (
            <Link
              href="/automations/new"
              className="mt-1 text-sm font-medium text-[var(--wz-accent)] hover:underline"
            >
              Create your first automation
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--wz-border)]">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`flex items-center gap-3 px-5 py-3 ${flashIds.has(row.id) ? "dash-row-flash" : ""}`}
            >
              <StatusDot status={row.status} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-[var(--wz-text)]">
                  @{row.recipient}
                </span>{" "}
                <span className="text-sm text-[var(--wz-text-muted)]">
                  · {row.label}
                </span>
              </div>
              <time
                dateTime={row.sent_at}
                className="wz-font-mono shrink-0 text-xs text-[var(--wz-text-muted)]"
              >
                {relativeTime(row.sent_at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
