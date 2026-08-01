"use client";

// The Connected Accounts surface. A quiet HALO data table: white, gridded,
// flat. Status is never colour-only — every dot carries a label beside it.
// Under md the grid collapses into one card per connection; a data table is
// never scrolled sideways.

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, RefreshCw, Unplug, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  expiryLabel,
  expiryTone,
  formatDate,
  formatTime,
  STATUS_META,
  type ConnectionItem,
} from "@/lib/accounts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DisconnectDialog } from "./disconnect-dialog";
import { PlatformIcon } from "./platform-icon";

const HEAD =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase";
const CELL = "px-4 py-3.5 align-middle";

/** OAuth needs a top-level redirect, so reconnect is a plain <a>, not a router push. */
const RECONNECT_HREF = "/api/auth/instagram/start";

export function ConnectionsTable({
  connections,
  archivedCount,
}: {
  connections: ConnectionItem[];
  /** Accounts that were disconnected — surfaced as a footer link. */
  archivedCount: number;
}) {
  const [target, setTarget] = useState<ConnectionItem | null>(null);

  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <h2 className="border-b border-border-default px-4 py-3.5 text-[13px] font-semibold text-ink">
        Connected Accounts
      </h2>

      {/* Desktop / tablet — the full grid. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className={HEAD}>Account</th>
              <th className={HEAD}>Platform</th>
              <th className={HEAD}>Status</th>
              <th className={`${HEAD} hidden lg:table-cell`}>Added on</th>
              <th className={HEAD}>Token expiry</th>
              <th className={`${HEAD} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <tr
                  key={item.key}
                  className="border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-hover-bg"
                >
                  <td className={CELL}>
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={item.platform} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {item.title}
                        </span>
                        <span className="block truncate text-[12px] text-ink-muted">
                          {item.subtitle}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className={CELL}>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={item.platform} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-[13px] text-ink">
                          {item.platformLabel}
                        </span>
                        <span className="block truncate text-[12px] text-brand">
                          {item.platformTier}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className={CELL}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn("size-1.5 rounded-full", meta.dot)}
                        aria-hidden
                      />
                      <span className="text-[13px] text-ink">{meta.label}</span>
                    </div>
                    <span className={cn("text-[12px]", meta.text)}>
                      {item.healthLabel}
                    </span>
                  </td>

                  <td className={`${CELL} hidden lg:table-cell`}>
                    <span className="wz-font-mono block text-[12px] text-ink-secondary">
                      {formatDate(item.addedAt)}
                    </span>
                    <span className="wz-font-mono block text-[11px] text-ink-muted">
                      {formatTime(item.addedAt)}
                    </span>
                  </td>

                  <td className={CELL}>
                    <span className="wz-font-mono block text-[12px] text-ink-secondary">
                      {formatDate(item.tokenExpiresAt)}
                    </span>
                    <ExpiryChip daysLeft={item.daysLeft} />
                  </td>

                  <td className={`${CELL} text-right`}>
                    <RowActions
                      item={item}
                      onRequestDisconnect={() => setTarget(item)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile — one card per connection. */}
      <div className="divide-y divide-border-subtle md:hidden">
        {connections.map((item) => {
          const meta = STATUS_META[item.status];
          return (
            <div key={item.key} className="p-4">
              <div className="flex items-start gap-3">
                <PlatformIcon platform={item.platform} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">
                    {item.title}
                  </div>
                  <div className="truncate text-[12px] text-ink-muted">
                    {item.platformLabel} · {item.platformTier}
                  </div>
                </div>
                <RowActions
                  item={item}
                  onRequestDisconnect={() => setTarget(item)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-12">
                <span className="flex items-center gap-1.5 text-[12px] text-ink-secondary">
                  <span
                    className={cn("size-1.5 rounded-full", meta.dot)}
                    aria-hidden
                  />
                  {item.healthLabel}
                </span>
                <ExpiryChip daysLeft={item.daysLeft} />
                <span className="wz-font-mono text-[11px] text-ink-muted">
                  Added {formatDate(item.addedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {archivedCount > 0 && (
        <div className="border-t border-border-default px-4 py-3 text-center">
          <Link
            href="/accounts?view=archived"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-tertiary transition-colors hover:text-brand"
          >
            <Unplug className="size-3.5" aria-hidden />
            View archived accounts ({archivedCount})
          </Link>
        </div>
      )}

      {target && (
        <DisconnectDialog
          open
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          account={{
            id: target.accountId,
            ig_username: target.title.replace(/^@/, ""),
          }}
        />
      )}
    </section>
  );
}

function ExpiryChip({ daysLeft }: { daysLeft: number | null }) {
  return (
    <span
      className={cn(
        "wz-font-mono mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        expiryTone(daysLeft),
      )}
    >
      {expiryLabel(daysLeft)}
    </span>
  );
}

// Manage is the one visible verb; everything state-changing or destructive
// hides one click deep in the kebab.
function RowActions({
  item,
  onRequestDisconnect,
}: {
  item: ConnectionItem;
  onRequestDisconnect: () => void;
}) {
  const needsAttention =
    item.status === "expired" || item.status === "disconnected";

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-lg border-border-default bg-surface-card text-[12px] text-ink-secondary hover:bg-hover-bg"
      >
        <a href={RECONNECT_HREF}>{needsAttention ? "Reconnect" : "Manage"}</a>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label={`More actions for ${item.title}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <a href={RECONNECT_HREF}>
              <RefreshCw className="size-4" />
              Refresh access token
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/automations">
              <Zap className="size-4" />
              View automations
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onRequestDisconnect();
            }}
            className="text-danger focus:text-danger"
          >
            <Unplug className="size-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
