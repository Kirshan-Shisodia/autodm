// Accounts screen model. Everything the /accounts page renders is derived here
// so the components stay presentational and the page stays a thin server shell.
//
// One `instagram_accounts` row describes two connected things: the Instagram
// Business account and the Facebook Page it hangs off. The screen lists both,
// because that's what the user actually granted — Pages are deduped, since
// several IG accounts can share one Page.
//
// Anything this file cannot derive from the database is marked STUB and lives
// behind a single function, so swapping in a real source is a one-file change.

import type { Plan } from "@/lib/dashboard";

export const DAY_MS = 86_400_000;

/** Scopes the Facebook OAuth callback requests; see api/auth/callback/facebook. */
export const REQUIRED_SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
] as const;

/** Token is "expiring soon" inside this window — matches the dashboard widget. */
export const EXPIRY_WARNING_DAYS = 7;

// ------------------------------------------------------------------
// Row shapes
// ------------------------------------------------------------------

/** The columns the screen selects from `instagram_accounts`. */
export type AccountRow = {
  id: string;
  ig_username: string;
  fb_page_id: string;
  fb_page_name: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  webhook_subscribed: boolean;
  last_webhook_at: string | null;
  scopes: string[] | null;
  created_at: string;
  disconnected_at: string | null;
};

export type Platform = "instagram" | "facebook";

export type ConnectionStatus =
  | "connected"
  | "expiring"
  | "expired"
  | "disconnected";

/** One row in the Connected Accounts table. */
export type ConnectionItem = {
  /** Stable key — `${accountId}:${platform}`, since one row yields two entries. */
  key: string;
  /** The underlying instagram_accounts id, for disconnect / reconnect. */
  accountId: string;
  platform: Platform;
  /** "@handle" for Instagram, the Page name for Facebook. */
  title: string;
  /** "Business Account" / "Facebook Page". */
  subtitle: string;
  /** "Instagram" / "Facebook". */
  platformLabel: string;
  /** "Professional Plan" / "Page" — the tier line under the platform name. */
  platformTier: string;
  status: ConnectionStatus;
  /** "Healthy" / "Expiring soon" / "Token expired" / "Disconnected". */
  healthLabel: string;
  addedAt: string;
  tokenExpiresAt: string | null;
  /** Whole days until the token expires; null when there's no expiry on record. */
  daysLeft: number | null;
};

export type AccountStats = {
  connected: number;
  healthy: number;
  expiringSoon: number;
  /** 0–100. STUB — see `integrationUsage`. */
  rateLimitPercent: number;
};

export type HealthCheck = {
  key: string;
  label: string;
  /** How many connections satisfy the check. */
  passed: number;
  total: number;
};

export type IntegrationUsageRow = {
  key: string;
  label: string;
  platform: Platform | "webhook";
  used: number;
  limit: number;
};

// ------------------------------------------------------------------
// Derivation
// ------------------------------------------------------------------

export function daysUntil(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - now) / DAY_MS);
}

export function statusOf(
  row: Pick<AccountRow, "is_active" | "token_expires_at">,
  now = Date.now(),
): ConnectionStatus {
  if (!row.is_active) return "disconnected";
  const days = daysUntil(row.token_expires_at, now);
  if (days === null) return "connected";
  if (days < 0) return "expired";
  if (days <= EXPIRY_WARNING_DAYS) return "expiring";
  return "connected";
}

export const STATUS_META: Record<
  ConnectionStatus,
  { label: string; health: string; dot: string; text: string }
> = {
  connected: {
    label: "Connected",
    health: "Healthy",
    dot: "bg-success",
    text: "text-ink-tertiary",
  },
  expiring: {
    label: "Connected",
    health: "Expiring soon",
    dot: "bg-brand",
    text: "text-warning-text",
  },
  expired: {
    label: "Action needed",
    health: "Token expired",
    dot: "bg-danger",
    text: "text-danger",
  },
  disconnected: {
    label: "Disconnected",
    health: "Not connected",
    dot: "bg-ink-muted",
    text: "text-ink-muted",
  },
};

/**
 * Flattens account rows into the table's connection list: one Instagram entry
 * per row, plus one entry per distinct linked Facebook Page.
 */
export function toConnections(
  rows: AccountRow[],
  plan: Plan,
  now = Date.now(),
): ConnectionItem[] {
  const tier = planTier(plan);
  const items: ConnectionItem[] = [];
  const seenPages = new Set<string>();

  for (const row of rows) {
    const status = statusOf(row, now);
    const days = daysUntil(row.token_expires_at, now);

    items.push({
      key: `${row.id}:instagram`,
      accountId: row.id,
      platform: "instagram",
      title: `@${row.ig_username}`,
      subtitle: "Business Account",
      platformLabel: "Instagram",
      platformTier: tier,
      status,
      healthLabel: STATUS_META[status].health,
      addedAt: row.created_at,
      tokenExpiresAt: row.token_expires_at,
      daysLeft: days,
    });

    // The Page carries the same token, so it inherits the same status.
    if (row.fb_page_id && !seenPages.has(row.fb_page_id)) {
      seenPages.add(row.fb_page_id);
      items.push({
        key: `${row.id}:facebook`,
        accountId: row.id,
        platform: "facebook",
        title: row.fb_page_name ?? "Facebook Page",
        subtitle: "Facebook Page",
        platformLabel: "Facebook",
        platformTier: "Page",
        status,
        healthLabel: STATUS_META[status].health,
        addedAt: row.created_at,
        tokenExpiresAt: row.token_expires_at,
        daysLeft: days,
      });
    }
  }

  return items;
}

/** "Professional Plan" is the label the mockup uses for a paid IG connection. */
function planTier(plan: Plan): string {
  return plan === "free" ? "Basic Plan" : "Professional Plan";
}

export function accountStats(
  connections: ConnectionItem[],
  usage: IntegrationUsageRow[],
): AccountStats {
  const live = connections.filter((c) => c.status !== "disconnected");
  return {
    connected: live.length,
    healthy: connections.filter((c) => c.status === "connected").length,
    expiringSoon: connections.filter(
      (c) => c.status === "expiring" || c.status === "expired",
    ).length,
    rateLimitPercent: overallUsagePercent(usage),
  };
}

/** The four checks in the Account Health Overview panel. */
export function healthChecks(
  rows: AccountRow[],
  usage: IntegrationUsageRow[],
  now = Date.now(),
): HealthCheck[] {
  const total = rows.length;
  const required = new Set<string>(REQUIRED_SCOPES);
  const rateLimitOk = usage.every((u) => percentOf(u) < 80);

  return [
    {
      key: "tokens",
      label: "All access tokens are valid",
      passed: rows.filter((r) => {
        const days = daysUntil(r.token_expires_at, now);
        return r.is_active && (days === null || days >= 0);
      }).length,
      total,
    },
    {
      key: "rate-limits",
      label: "No rate limit issues",
      passed: rateLimitOk ? total : 0,
      total,
    },
    {
      key: "webhooks",
      label: "All webhooks are active",
      passed: rows.filter((r) => r.webhook_subscribed).length,
      total,
    },
    {
      key: "permissions",
      label: "Permissions are up to date",
      passed: rows.filter((r) =>
        [...required].every((s) => (r.scopes ?? []).includes(s)),
      ).length,
      total,
    },
  ];
}

/** 0–100. An empty account list reads as 100 rather than NaN. */
export function healthPercent(checks: HealthCheck[]): number {
  const total = checks.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return 100;
  const passed = checks.reduce((sum, c) => sum + c.passed, 0);
  return Math.round((passed / total) * 100);
}

/** Connections with a token expiry, soonest first — the calendar panel. */
export function expiryCalendar(connections: ConnectionItem[]): ConnectionItem[] {
  return connections
    .filter((c) => c.tokenExpiresAt !== null && c.status !== "disconnected")
    .sort(
      (a, b) =>
        new Date(a.tokenExpiresAt!).getTime() -
        new Date(b.tokenExpiresAt!).getTime(),
    );
}

// ------------------------------------------------------------------
// STUB — metrics we don't persist yet
// ------------------------------------------------------------------

/**
 * STUB. Graph API call volume and webhook delivery counts aren't recorded
 * anywhere yet; the numbers below are derived from the connected-account count
 * purely so the panel renders with plausible shape.
 *
 * TODO: replace with real counters (e.g. an `api_usage` table written by the
 * n8n engine, or Meta's `x-app-usage` / `x-business-use-case-usage` headers
 * captured on each call). The return shape is the contract — keep it.
 */
export function integrationUsage(rows: AccountRow[]): IntegrationUsageRow[] {
  const active = rows.filter((r) => r.is_active).length;

  return [
    {
      key: "instagram-graph",
      label: "Instagram Graph API",
      platform: "instagram",
      used: active * 2_800,
      limit: 25_000,
    },
    {
      key: "facebook-graph",
      label: "Facebook Graph API",
      platform: "facebook",
      used: active * 900,
      limit: 15_000,
    },
    {
      key: "webhooks",
      label: "Webhook Deliveries",
      platform: "webhook",
      used: rows.filter((r) => r.webhook_subscribed).length * 410,
      limit: 10_000,
    },
  ];
}

export function percentOf(row: IntegrationUsageRow): number {
  if (row.limit <= 0) return 0;
  return Math.min(100, Math.round((row.used / row.limit) * 100));
}

/** The headline "Rate Limit Usage" figure — the worst of the integrations. */
export function overallUsagePercent(usage: IntegrationUsageRow[]): number {
  if (usage.length === 0) return 0;
  return Math.max(...usage.map(percentOf));
}

// ------------------------------------------------------------------
// Formatting
// ------------------------------------------------------------------

// Same shape as lib/automations/list.ts so the two data tables read alike.

/** "May 28, 2024" — an em dash when there's nothing on record. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "10:30 AM" — the second, quieter line. */
export function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** "30 days left" / "Expires today" / "Expired 4 days ago" / "No expiry". */
export function expiryLabel(daysLeft: number | null): string {
  if (daysLeft === null) return "No expiry";
  if (daysLeft < 0) {
    const ago = Math.abs(daysLeft);
    return `Expired ${ago} day${ago === 1 ? "" : "s"} ago`;
  }
  if (daysLeft === 0) return "Expires today";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}

/** Badge styling for the expiry chip — green, amber, then red. */
export function expiryTone(daysLeft: number | null): string {
  if (daysLeft === null) return "bg-surface-muted text-ink-tertiary";
  if (daysLeft < 0) return "bg-danger-bg text-danger";
  if (daysLeft <= EXPIRY_WARNING_DAYS) return "bg-warning-bg text-warning-text";
  return "bg-success-bg text-success";
}
