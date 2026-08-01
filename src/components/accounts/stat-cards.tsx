// The four-card strip above the Accounts table. Flat cards, hairline borders,
// mono numerals — HALO Rule 2: data surfaces don't float.

import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AccountStats } from "@/lib/accounts";

type Card = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tile: string;
};

export function AccountStatCards({ stats }: { stats: AccountStats }) {
  const hot = stats.rateLimitPercent >= 80;

  const cards: Card[] = [
    {
      label: "Connected Accounts",
      value: String(stats.connected),
      hint: "Active across all platforms",
      icon: Users,
      tile: "bg-surface-muted text-ink-secondary",
    },
    {
      label: "Healthy Accounts",
      value: String(stats.healthy),
      hint:
        stats.healthy === stats.connected
          ? "All accounts are working fine"
          : `${stats.connected - stats.healthy} need attention`,
      icon: ShieldCheck,
      tile: "bg-success-bg text-success",
    },
    {
      label: "Expiring Soon",
      value: String(stats.expiringSoon),
      hint:
        stats.expiringSoon === 0
          ? "No accounts expiring soon"
          : "Reconnect to avoid downtime",
      icon: Clock,
      tile:
        stats.expiringSoon === 0
          ? "bg-surface-muted text-ink-tertiary"
          : "bg-warning-bg text-warning-text",
    },
    {
      label: "Rate Limit Usage",
      value: `${stats.rateLimitPercent}%`,
      hint: "Overall across all accounts",
      icon: AlertTriangle,
      tile: hot ? "bg-danger-bg text-danger" : "bg-surface-muted text-ink-tertiary",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border-default bg-surface-card px-4 py-3.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  card.tile,
                )}
                aria-hidden
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-[12px] font-medium text-ink-tertiary">
                {card.label}
              </span>
            </div>

            <div className="wz-font-mono mt-3 text-[30px] leading-none font-semibold tracking-[-0.4px] text-ink">
              {card.value}
            </div>

            <p className="mt-2.5 text-[11px] text-ink-muted">{card.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
