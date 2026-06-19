// Account health widget (spec §6). One row per connected account with a status,
// derived from the right columns. Status is never colour-only — each carries a
// label too (spec §12).

import Link from "next/link";

export type AccountHealth = {
  id: string;
  ig_username: string;
  token_expires_at: string | null;
  hourlySends: number;
};

const DAY_MS = 86_400_000;

// Conservative hourly send cap mirrored from the n8n engine (Node 9). Surfaced
// here only as an early warning — enforcement still happens in the workflow.
export const HOURLY_DM_CAP = 100;

type Status = {
  tone: "green" | "amber" | "red";
  label: string;
  action?: { href: string; label: string };
};

function statusFor(account: AccountHealth): Status {
  if (account.token_expires_at) {
    const days = Math.floor(
      (new Date(account.token_expires_at).getTime() - Date.now()) / DAY_MS,
    );
    if (days < 0) {
      return {
        tone: "red",
        label: "Connection expired",
        action: { href: "/accounts", label: "Reconnect" },
      };
    }
    if (days <= 7) {
      return {
        tone: "amber",
        label: `Reconnect within ${days} day${days === 1 ? "" : "s"}`,
        action: { href: "/accounts", label: "Reconnect" },
      };
    }
  }

  if (account.hourlySends > HOURLY_DM_CAP * 0.8) {
    return { tone: "red", label: "Approaching the hourly limit" };
  }

  return { tone: "green", label: "Healthy" };
}

const DOT: Record<Status["tone"], string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-[var(--wz-accent-pop)]",
};

export function AccountHealthWidget({
  accounts,
}: {
  accounts: AccountHealth[];
}) {
  return (
    <section className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)]">
      <h2 className="border-b border-[var(--wz-border)] px-5 py-3 text-sm font-semibold text-[var(--wz-text)]">
        Account health
      </h2>

      {accounts.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[var(--wz-text-muted)]">
          No Instagram account connected yet.{" "}
          <Link
            href="/accounts"
            className="font-medium text-[var(--wz-accent)] hover:underline"
          >
            Connect one
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-[var(--wz-border)]">
          {accounts.map((account) => {
            const status = statusFor(account);
            const labelColor =
              status.tone === "red"
                ? "text-[var(--wz-accent-pop)]"
                : "text-[var(--wz-text-muted)]";
            return (
              <li
                key={account.id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span
                  className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${DOT[status.tone]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--wz-text)]">
                    @{account.ig_username}
                  </div>
                  <div className={`text-xs ${labelColor}`}>{status.label}</div>
                </div>
                {status.action && (
                  <Link
                    href={status.action.href}
                    className="shrink-0 rounded-md border border-[var(--wz-border)] px-3 py-1.5 text-xs font-medium text-[var(--wz-text)] hover:bg-[var(--wz-surface)]"
                  >
                    {status.action.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
