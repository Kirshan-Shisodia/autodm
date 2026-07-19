// Consolidated alert banner (spec §5.2). Surfaces the single most-severe
// blocking issue: past-due billing (danger, persistent) outranks an expired /
// expiring token (warning). Renders nothing when the account is healthy.
// HALO status utilities only — no hardcoded colour.

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export type AlertAccount = {
  ig_username: string;
  expiryDays: number | null;
};

type Alert = {
  tone: "danger" | "warning";
  message: string;
  action: { href: string; label: string };
};

function resolveAlert(
  subscriptionStatus: string | null,
  accounts: AlertAccount[],
): Alert | null {
  if (subscriptionStatus === "past_due") {
    return {
      tone: "danger",
      message:
        "Your last payment failed. Update billing to keep automations running.",
      action: { href: "/billing", label: "Fix now" },
    };
  }

  // Worst-off connection: expired outranks expiring-soon.
  const worst = accounts
    .filter((a) => a.expiryDays !== null && a.expiryDays <= 7)
    .sort((a, b) => (a.expiryDays ?? 0) - (b.expiryDays ?? 0))[0];

  if (worst) {
    const days = worst.expiryDays as number;
    return {
      tone: "warning",
      message:
        days < 0
          ? `@${worst.ig_username}'s connection expired. Reconnect to resume sending.`
          : `@${worst.ig_username}'s connection expires in ${days} day${
              days === 1 ? "" : "s"
            }. Reconnect to avoid interruption.`,
      action: { href: "/accounts", label: "Reconnect" },
    };
  }

  return null;
}

const TONE = {
  danger: {
    wrap: "border-danger/25 bg-danger-bg text-danger",
    button: "bg-danger text-white hover:opacity-90",
  },
  warning: {
    wrap: "border-brand/25 bg-warning-bg text-warning-text",
    button: "bg-brand text-white hover:bg-brand-hover",
  },
} as const;

export function AlertBanner({
  subscriptionStatus,
  accounts,
}: {
  subscriptionStatus: string | null;
  accounts: AlertAccount[];
}) {
  const alert = resolveAlert(subscriptionStatus, accounts);
  if (!alert) return null;

  const tone = TONE[alert.tone];

  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-md border px-4 py-3 text-sm sm:flex-row sm:items-center ${tone.wrap} motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300`}
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      <p className="flex-1">{alert.message}</p>
      <Link
        href={alert.action.href}
        className={`shrink-0 rounded-md px-3 py-1.5 text-center text-xs font-medium ${tone.button}`}
      >
        {alert.action.label}
      </Link>
    </div>
  );
}
