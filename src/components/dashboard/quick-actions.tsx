// Quick Actions — the four routes people actually came here to take, hoisted
// out of the sidebar so the bottom of the page has an exit instead of a dead
// end. Plain links: nothing here is destructive or stateful.

import Link from "next/link";
import {
  BarChart3,
  FileText,
  Plus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AnalyticsCard } from "@/components/analytics/card";

type Action = { label: string; href: string; icon: LucideIcon };

const ACTIONS: Action[] = [
  { label: "Create Automation", href: "/automations/new", icon: Plus },
  { label: "Connect Account", href: "/accounts", icon: Users },
  { label: "Import Template", href: "/templates", icon: FileText },
  { label: "View Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Invite Team", href: "/settings", icon: UserPlus },
];

export function QuickActions({ className }: { className?: string }) {
  return (
    <AnalyticsCard title="Quick Actions" className={className}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </AnalyticsCard>
  );
}
