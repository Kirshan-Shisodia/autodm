// App shell navigation (spec §4). Grouped: Main / Pro / Account.
// Pro items route free users to the upgrade screen instead of the feature.

import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Users,
  GitBranch,
  UserPlus,
  FileText,
  Gift,
  CreditCard,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  pro?: boolean;
  /** Small chip on the right of the row, e.g. "New". Use sparingly. */
  badge?: string;
};

export type NavGroup = {
  heading: string;
  pro?: boolean;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Automations", href: "/automations", icon: Zap },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Accounts", href: "/accounts", icon: Users },
    ],
  },
  {
    heading: "Pro",
    pro: true,
    items: [
      { label: "Flows", href: "/flows", icon: GitBranch, pro: true },
      { label: "Leads", href: "/leads", icon: UserPlus, pro: true },
      { label: "Templates", href: "/templates", icon: FileText, pro: true },
      {
        label: "Referral Program",
        href: "/referrals",
        icon: Gift,
        pro: true,
        badge: "New",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Billing", href: "/billing", icon: CreditCard },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Help & Support", href: "/help", icon: HelpCircle },
    ],
  },
];

/** Where a nav item actually links: Pro items send free users to upgrade. */
export function resolveHref(item: NavItem, plan: string): string {
  if (item.pro && plan === "free") return "/billing?upgrade=pro";
  return item.href;
}
