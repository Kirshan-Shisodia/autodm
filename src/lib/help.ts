// Help & Support screen model. The /help page is a thin server shell; every
// string it renders is defined here so the components stay presentational.
//
// Nothing here is backed by a table yet — the help centre is a static catalog.
// When articles move to a CMS or `public.help_articles`, only this file changes;
// the components never see the difference.

import {
  BarChart3,
  BookOpen,
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Puzzle,
  Settings,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ------------------------------------------------------------------
// Categories — the six tiles under "Browse Help Topics" and the values
// behind the "All Categories" filter on the search bar.
// ------------------------------------------------------------------

export type CategoryId =
  | "getting-started"
  | "automations"
  | "leads-crm"
  | "analytics"
  | "integrations"
  | "account-billing";

export type HelpCategory = {
  id: CategoryId;
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** Tailwind classes for the tinted icon tile. HALO status washes only. */
  tile: string;
  articleCount: number;
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    blurb: "Learn the basics and set up your workspace.",
    icon: BookOpen,
    tile: "bg-warning-bg text-brand",
    articleCount: 12,
  },
  {
    id: "automations",
    title: "Automations",
    blurb: "Create, manage and optimize automations.",
    icon: Zap,
    tile: "bg-running-bg text-running",
    articleCount: 18,
  },
  {
    id: "leads-crm",
    title: "Leads & CRM",
    blurb: "Manage leads, segments and engagement.",
    icon: Users,
    tile: "bg-success-bg text-success",
    articleCount: 14,
  },
  {
    id: "analytics",
    title: "Analytics",
    blurb: "Understand reports and performance.",
    icon: BarChart3,
    tile: "bg-selected-bg text-brand",
    articleCount: 10,
  },
  {
    id: "integrations",
    title: "Integrations",
    blurb: "Connect third-party tools and services.",
    icon: Puzzle,
    tile: "bg-warning-bg text-warning-text",
    articleCount: 16,
  },
  {
    id: "account-billing",
    title: "Account & Billing",
    blurb: "Manage your account, plan and billing.",
    icon: Settings,
    tile: "bg-danger-bg text-danger",
    articleCount: 9,
  },
];

/** Label lookup for the filter dropdown and article rows. */
export const CATEGORY_LABEL: Record<CategoryId, string> = Object.fromEntries(
  HELP_CATEGORIES.map((c) => [c.id, c.title]),
) as Record<CategoryId, string>;

// ------------------------------------------------------------------
// Articles
// ------------------------------------------------------------------

export type HelpArticle = {
  slug: string;
  title: string;
  blurb: string;
  category: CategoryId;
  icon: LucideIcon;
  /** Surfaced in the "Popular Articles" card; the rest live in the archive. */
  popular?: boolean;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "create-your-first-automation",
    title: "How to create your first automation",
    blurb: "A step-by-step guide to building your first automation in ChatPilott.",
    category: "automations",
    icon: Zap,
    popular: true,
  },
  {
    slug: "connect-instagram-facebook",
    title: "Connecting your Instagram & Facebook accounts",
    blurb: "Learn how to safely connect and manage your social accounts.",
    category: "getting-started",
    icon: Users,
    popular: true,
  },
  {
    slug: "dm-limits-and-plans",
    title: "Understanding DM limits and plan usage",
    blurb: "Get clarity on DM limits, usage tracking and plan upgrades.",
    category: "account-billing",
    icon: FileText,
    popular: true,
  },
  {
    slug: "how-to-use-templates",
    title: "How to use templates",
    blurb: "Save time using pre-built automation templates.",
    category: "automations",
    icon: FileText,
    popular: true,
  },
  {
    slug: "automation-not-working",
    title: "Troubleshooting automation not working",
    blurb: "Common reasons and fixes for automation issues.",
    category: "automations",
    icon: Wrench,
    popular: true,
  },
  {
    slug: "set-up-your-workspace",
    title: "Setting up your workspace",
    blurb: "Name your workspace, invite teammates and pick a default account.",
    category: "getting-started",
    icon: BookOpen,
  },
  {
    slug: "keyword-triggers",
    title: "Using keyword triggers effectively",
    blurb: "Pick triggers that catch intent without firing on every comment.",
    category: "automations",
    icon: Zap,
  },
  {
    slug: "segmenting-leads",
    title: "Segmenting leads with tags",
    blurb: "Group leads by behaviour so follow-ups land with the right people.",
    category: "leads-crm",
    icon: Users,
  },
  {
    slug: "exporting-leads",
    title: "Exporting your leads to CSV",
    blurb: "Pull your lead list out of ChatPilott for use elsewhere.",
    category: "leads-crm",
    icon: FileText,
  },
  {
    slug: "reading-analytics",
    title: "Reading your analytics dashboard",
    blurb: "What each metric means and which ones actually predict revenue.",
    category: "analytics",
    icon: BarChart3,
  },
  {
    slug: "export-reports",
    title: "Exporting analytics reports",
    blurb: "Schedule or download performance reports for your team.",
    category: "analytics",
    icon: BarChart3,
  },
  {
    slug: "connect-zapier",
    title: "Connecting ChatPilott to Zapier",
    blurb: "Push new leads into thousands of downstream apps.",
    category: "integrations",
    icon: Puzzle,
  },
  {
    slug: "webhooks",
    title: "Setting up outbound webhooks",
    blurb: "Send automation events to your own endpoint in real time.",
    category: "integrations",
    icon: Puzzle,
  },
  {
    slug: "change-your-plan",
    title: "Changing or cancelling your plan",
    blurb: "Upgrade, downgrade or cancel — and what happens to your data.",
    category: "account-billing",
    icon: Settings,
  },
  {
    slug: "invoices-and-gst",
    title: "Invoices, GST and payment methods",
    blurb: "Find past invoices and keep your billing details current.",
    category: "account-billing",
    icon: FileText,
  },
];

export const POPULAR_ARTICLES = HELP_ARTICLES.filter((a) => a.popular);

/** Route for an article. Single place to change if the archive moves. */
export function articleHref(slug: string): string {
  return `/help/articles/${slug}`;
}

/**
 * Search + category filter for the article list. Case-insensitive substring
 * match over title and blurb — deliberately dumb, since the catalog is small
 * and lives client-side. Swap for a real index when it moves server-side.
 */
export function filterArticles(
  articles: HelpArticle[],
  query: string,
  category: CategoryId | "all",
): HelpArticle[] {
  const q = query.trim().toLowerCase();

  return articles.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.blurb.toLowerCase().includes(q)
    );
  });
}

// ------------------------------------------------------------------
// Video guides
// ------------------------------------------------------------------

export type VideoGuide = {
  id: string;
  title: string;
  blurb: string;
  /** Display string, e.g. "5:24". Kept as text — never arithmetic on it. */
  duration: string;
  href: string;
};

export const VIDEO_GUIDES: VideoGuide[] = [
  {
    id: "getting-started",
    title: "Getting Started with ChatPilott",
    blurb: "Learn the basics and set up your workspace.",
    duration: "5:24",
    href: "/help/videos/getting-started",
  },
  {
    id: "first-automation",
    title: "Create Your First Automation",
    blurb: "Build and launch your first automation in minutes.",
    duration: "7:15",
    href: "/help/videos/first-automation",
  },
  {
    id: "manage-leads",
    title: "Manage Leads Effectively",
    blurb: "Organize, segment and engage your leads like a pro.",
    duration: "6:40",
    href: "/help/videos/manage-leads",
  },
];

// ------------------------------------------------------------------
// System status — hardcoded today. When a health endpoint exists, this
// becomes a fetch and `SystemService.status` starts varying.
// ------------------------------------------------------------------

export type ServiceStatus = "operational" | "degraded" | "down";

export type SystemService = {
  name: string;
  status: ServiceStatus;
};

export const SYSTEM_SERVICES: SystemService[] = [
  { name: "Automations", status: "operational" },
  { name: "DM Service", status: "operational" },
  { name: "Integrations", status: "operational" },
  { name: "Analytics", status: "operational" },
  { name: "Website", status: "operational" },
];

export const STATUS_PAGE_URL = "https://status.chatpilott.com";

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

/** Worst status across all services drives the summary line at the top. */
export function overallStatus(services: SystemService[]): ServiceStatus {
  if (services.some((s) => s.status === "down")) return "down";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "operational";
}

export const OVERALL_STATUS_COPY: Record<
  ServiceStatus,
  { title: string; blurb: string }
> = {
  operational: {
    title: "All Systems Operational",
    blurb: "Everything is running smoothly.",
  },
  degraded: {
    title: "Partial Degradation",
    blurb: "Some services are slower than usual.",
  },
  down: {
    title: "Major Outage",
    blurb: "We're working on it — follow the status page for updates.",
  },
};

// ------------------------------------------------------------------
// Contact channels + community
// ------------------------------------------------------------------

export type SupportChannel = {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  href: string;
  /** Opens off-site — renders as an anchor rather than a next/link. */
  external?: boolean;
};

export const SUPPORT_CHANNELS: SupportChannel[] = [
  {
    id: "live-chat",
    title: "Live Chat",
    detail: "Available 24/7",
    icon: MessageCircle,
    href: "/help/chat",
  },
  {
    id: "email",
    title: "Email Support",
    detail: "support@chatpilott.com",
    icon: Mail,
    href: "mailto:support@chatpilott.com",
    external: true,
  },
  {
    id: "help-center",
    title: "Help Center",
    detail: "Browse all articles",
    icon: LifeBuoy,
    href: "/help/articles",
  },
];

export type CommunityLink = {
  id: string;
  label: string;
  href: string;
  /** Brand fill for the round chip. Only place foreign hexes are allowed. */
  chip: string;
};

export const COMMUNITY_LINKS: CommunityLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com/chatpilott",
    chip: "bg-[#1877F2]",
  },
  { id: "x", label: "X", href: "https://x.com/chatpilott", chip: "bg-[#0F1419]" },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@chatpilott",
    chip: "bg-[#FF0000]",
  },
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.gg/chatpilott",
    chip: "bg-[#5865F2]",
  },
];

export const COMMUNITY_URL = "https://community.chatpilott.com";
