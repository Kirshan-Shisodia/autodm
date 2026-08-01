"use client";

// Referral activity. A quiet HALO data table: white, gridded, flat. Status is
// never colour-only — every chip carries its word. Under md the grid collapses
// into one card per referral; a data table is never scrolled sideways.
//
// Client-side because each row carries an actions menu. The actions that touch
// the server (resend, revoke) are left as TODOs pointing at routes that don't
// exist yet rather than silently doing nothing.

import Link from "next/link";
import { ArrowRight, Copy, MoreVertical, Send, Users, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDate,
  formatReward,
  STATUS_META,
  type Referral,
} from "@/lib/referrals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HEAD =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase";
const CELL = "px-4 py-3.5 align-middle";

/** Warm initial disc. Deterministic per friend so the colour never flickers. */
const TILES = [
  "bg-warning-bg text-warning-text",
  "bg-success-bg text-success",
  "bg-running-bg text-running",
  "bg-selected-bg text-brand",
  "bg-surface-muted text-ink-secondary",
];

function Initial({ friend }: { friend: string }) {
  const tile =
    TILES[
      friend.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) %
        TILES.length
    ];
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-medium uppercase",
        tile,
      )}
      aria-hidden
    >
      {friend[0]}
    </span>
  );
}

function StatusChip({ status }: { status: Referral["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.chip,
      )}
    >
      {meta.label}
    </span>
  );
}

function RowMenu({ referral }: { referral: Referral }) {
  const canResend =
    referral.status === "invited" || referral.status === "expired";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${referral.friend}`}
        className="inline-flex size-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <MoreVertical className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard?.writeText(referral.friend);
          }}
        >
          <Copy className="size-4" aria-hidden />
          Copy email
        </DropdownMenuItem>
        {canResend && (
          // TODO(referrals): POST /api/referrals/[id]/resend once the invite
          // mailer exists. Disabled rather than fake-successful until then.
          <DropdownMenuItem disabled>
            <Send className="size-4" aria-hidden />
            Resend invite
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {/* TODO(referrals): DELETE /api/referrals/[id]. */}
        <DropdownMenuItem disabled variant="destructive">
          <XCircle className="size-4" aria-hidden />
          Revoke invite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Reward({ paise }: { paise: number | null }) {
  if (paise === null) {
    return (
      <span className="text-ink-muted" aria-label="No reward yet">
        –
      </span>
    );
  }
  return <span className="wz-font-mono font-medium">{formatReward(paise)}</span>;
}

export function ReferralActivity({ referrals }: { referrals: Referral[] }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3">
        <h2 className="text-[13px] font-semibold text-ink">Referral Activity</h2>
        <Link
          href="/referrals/activity"
          className="inline-flex h-8 items-center rounded-lg border border-border-default bg-surface-card px-2.5 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View All
        </Link>
      </div>

      {referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span
            className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-ink-tertiary"
            aria-hidden
          >
            <Users className="size-5" />
          </span>
          <h3 className="mt-4 text-[14px] font-semibold text-ink">
            No referrals yet
          </h3>
          <p className="mt-1 max-w-sm text-[13px] text-ink-tertiary">
            Share your link above — invited friends show up here the moment they
            sign up.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet — the full grid. */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className={HEAD}>Friend</th>
                  <th className={HEAD}>Status</th>
                  <th className={HEAD}>Plan</th>
                  <th className={HEAD}>Joined On</th>
                  <th className={`${HEAD} text-right`}>Reward</th>
                  <th className={`${HEAD} w-12`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className={CELL}>
                      <span className="flex items-center gap-2.5">
                        <Initial friend={referral.friend} />
                        <span className="truncate text-[13px] text-ink">
                          {referral.friend}
                        </span>
                      </span>
                    </td>
                    <td className={CELL}>
                      <StatusChip status={referral.status} />
                    </td>
                    <td className={`${CELL} text-[13px] text-ink-secondary`}>
                      {referral.planName ?? (
                        <span className="text-ink-muted">–</span>
                      )}
                    </td>
                    <td className={`${CELL} text-[13px] text-ink-secondary`}>
                      {formatDate(referral.joinedAt)}
                    </td>
                    <td className={`${CELL} text-right text-[13px] text-ink`}>
                      <Reward paise={referral.rewardPaise} />
                    </td>
                    <td className={`${CELL} text-right`}>
                      <RowMenu referral={referral} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — one card per referral. */}
          <ul className="divide-y divide-border-subtle md:hidden">
            {referrals.map((referral) => (
              <li
                key={referral.id}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <Initial friend={referral.friend} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">
                    {referral.friend}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {formatDate(referral.joinedAt)}
                    {referral.planName ? ` · ${referral.planName}` : ""}
                    {referral.rewardPaise !== null
                      ? ` · ${formatReward(referral.rewardPaise)}`
                      : ""}
                  </p>
                </div>
                <StatusChip status={referral.status} />
                <RowMenu referral={referral} />
              </li>
            ))}
          </ul>

          <div className="border-t border-border-default px-4 py-3.5 text-center">
            <Link
              href="/referrals/activity"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              View all referrals
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
