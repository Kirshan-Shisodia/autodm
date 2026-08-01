// Server-side data assembly for the Dashboard.
//
// The dashboard and the Analytics screen ask the same questions of the same
// tables, so this deliberately builds on `loadAnalytics` rather than growing a
// second, subtly-different definition of "DMs sent". What lives here is only
// what the dashboard adds on top: account health, the insight line, and plan
// usage — the operational half of the screen that Analytics has no opinion on.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  formatPercent,
  isFlat,
  percentChange,
  resolveRange,
  share,
  type ActivityRow,
  type Delta,
  type FunnelStage,
  type Metric,
  type RangeKey,
  type ResolvedRange,
  type SeriesPoint,
} from "@/lib/analytics/model";
import {
  loadAnalytics,
  type TopAutomationRow,
} from "@/lib/analytics/query";
import { DM_LIMIT, tokenExpiryDays, type Plan } from "./index";

// ------------------------------------------------------------------
// Health
// ------------------------------------------------------------------

/**
 * Health reads as a traffic light, not a sentence. `ok` is the only state that
 * should be boring; `warn` means "this will break soon", `bad` means "it is
 * broken now", `idle` means "there is nothing to be healthy about yet" — which
 * is not the same as broken and must not be coloured like it.
 */
export type HealthTone = "ok" | "warn" | "bad" | "idle";

export type HealthTile = {
  key: "instagram" | "webhook" | "token" | "rate_limit";
  label: string;
  status: string;
  tone: HealthTone;
  /** One line of "why", shown under the status on wide layouts. */
  detail?: string;
};

/** Meta's per-account send ceiling we treat as "you are near the edge". */
const HOURLY_SEND_CEILING = 100;

/** A webhook that hasn't spoken in this long is assumed to have gone quiet. */
const WEBHOOK_STALE_HOURS = 48;

/** Below this many days of token life left, we start nagging. */
const TOKEN_WARN_DAYS = 7;

export type AccountHealthRow = {
  id: string;
  ig_username: string;
  token_expires_at: string | null;
  webhook_subscribed: boolean;
  last_webhook_at: string | null;
  hourlySends: number;
};

export function buildHealthTiles(
  accounts: AccountHealthRow[],
  now: Date = new Date(),
): HealthTile[] {
  // No account connected is a first-run state, not a failure. Every tile says
  // the same honest thing rather than showing four red lights at signup.
  if (accounts.length === 0) {
    return [
      {
        key: "instagram",
        label: "Instagram Connection",
        status: "Not connected",
        tone: "warn",
        detail: "Connect an account to start automating.",
      },
      { key: "webhook", label: "Webhook Status", status: "—", tone: "idle" },
      { key: "token", label: "Access Token", status: "—", tone: "idle" },
      { key: "rate_limit", label: "Rate Limit", status: "—", tone: "idle" },
    ];
  }

  // ---- connection ----
  const connection: HealthTile = {
    key: "instagram",
    label: "Instagram Connection",
    status: "Connected",
    tone: "ok",
    detail:
      accounts.length === 1
        ? `@${accounts[0].ig_username}`
        : `${accounts.length} accounts`,
  };

  // ---- webhook ----
  const unsubscribed = accounts.filter((a) => !a.webhook_subscribed);
  const lastWebhook = accounts
    .map((a) => (a.last_webhook_at ? new Date(a.last_webhook_at).getTime() : 0))
    .reduce((max, t) => Math.max(max, t), 0);
  const hoursSinceWebhook =
    lastWebhook === 0 ? null : (now.getTime() - lastWebhook) / 3_600_000;

  let webhook: HealthTile;
  if (unsubscribed.length > 0) {
    webhook = {
      key: "webhook",
      label: "Webhook Status",
      status: "Not subscribed",
      tone: "bad",
      detail:
        unsubscribed.length === accounts.length
          ? "Reconnect to receive comments."
          : `${unsubscribed.length} of ${accounts.length} accounts.`,
    };
  } else if (hoursSinceWebhook === null) {
    // Subscribed but never fired. That's what a brand-new account looks like,
    // so it's "waiting", not "down".
    webhook = {
      key: "webhook",
      label: "Webhook Status",
      status: "Awaiting first event",
      tone: "idle",
    };
  } else if (hoursSinceWebhook > WEBHOOK_STALE_HOURS) {
    webhook = {
      key: "webhook",
      label: "Webhook Status",
      status: "Quiet",
      tone: "warn",
      detail: `No events for ${Math.floor(hoursSinceWebhook / 24)}d.`,
    };
  } else {
    webhook = {
      key: "webhook",
      label: "Webhook Status",
      status: "Healthy",
      tone: "ok",
    };
  }

  // ---- token ----
  // The worst account decides the tile: one expired token is an outage for
  // that account, and averaging it away would hide it.
  const expiries = accounts
    .map((a) => tokenExpiryDays(a.token_expires_at, now))
    .filter((d): d is number => d !== null);
  const soonest = expiries.length ? Math.min(...expiries) : null;

  let token: HealthTile;
  if (soonest === null) {
    token = {
      key: "token",
      label: "Access Token",
      status: "No expiry on record",
      tone: "idle",
    };
  } else if (soonest < 0) {
    token = {
      key: "token",
      label: "Access Token",
      status: "Expired",
      tone: "bad",
      detail: "Reconnect the account to resume sending.",
    };
  } else if (soonest <= TOKEN_WARN_DAYS) {
    token = {
      key: "token",
      label: "Access Token",
      status: `Expires in ${soonest}d`,
      tone: "warn",
      detail: "Reconnect before it lapses.",
    };
  } else {
    token = {
      key: "token",
      label: "Access Token",
      status: "Valid",
      tone: "ok",
      detail: `${soonest}d remaining`,
    };
  }

  // ---- rate limit ----
  const busiest = accounts.reduce(
    (max, a) => Math.max(max, a.hourlySends),
    0,
  );
  const usedPct = share(busiest, HOURLY_SEND_CEILING);
  const rateLimit: HealthTile = {
    key: "rate_limit",
    label: "Rate Limit",
    status: usedPct >= 90 ? "Throttling" : usedPct >= 70 ? "Elevated" : "Normal",
    tone: usedPct >= 90 ? "bad" : usedPct >= 70 ? "warn" : "ok",
    detail: `${busiest} / ${HOURLY_SEND_CEILING} sends this hour`,
  };

  return [connection, webhook, token, rateLimit];
}

// ------------------------------------------------------------------
// Insight line
// ------------------------------------------------------------------

export type Insight = {
  headline: string;
  detail: string | null;
  tone: "positive" | "neutral";
};

/**
 * The one sentence at the top of the page. It only speaks when it has
 * something to say — a generic "you're doing great!" on an empty account is
 * worse than nothing, so a flat or absent delta returns null and the banner
 * doesn't render at all.
 */
export function buildInsight({
  dmsDelta,
  comparisonLabel,
  topByConversion,
}: {
  dmsDelta: Delta;
  comparisonLabel: string;
  topByConversion: TopAutomationRow | null;
}): Insight | null {
  const detail =
    topByConversion && topByConversion.conversionRate !== null
      ? `Your "${topByConversion.name}" automation has the highest conversion rate at ${formatPercent(
          topByConversion.conversionRate,
        )}.`
      : null;

  if (dmsDelta.kind === "new") {
    return {
      headline: "Your automations sent their first DMs this period.",
      detail,
      tone: "positive",
    };
  }

  if (dmsDelta.kind === "value" && !isFlat(dmsDelta)) {
    const up = dmsDelta.value > 0;
    return {
      headline: up
        ? `Your automations are performing ${Math.abs(dmsDelta.value).toFixed(
            0,
          )}% better than the ${comparisonLabel.replace(/^vs /, "")}.`
        : `Activity is down ${Math.abs(dmsDelta.value).toFixed(
            0,
          )}% on the ${comparisonLabel.replace(/^vs /, "")}.`,
      detail,
      tone: up ? "positive" : "neutral",
    };
  }

  // Nothing moved, but there may still be a standout automation worth naming.
  return detail
    ? { headline: "Steady period.", detail, tone: "neutral" }
    : null;
}

// ------------------------------------------------------------------
// Assembly
// ------------------------------------------------------------------

export type DashboardData = {
  range: ResolvedRange;
  greetingName: string;
  plan: Plan;

  kpis: Metric[];
  chart: { dmsSent: SeriesPoint[]; linkClicks: SeriesPoint[] };
  topAutomations: TopAutomationRow[];
  funnel: FunnelStage[];
  activity: ActivityRow[];
  health: HealthTile[];
  insight: Insight | null;

  planUsage: { used: number; limit: number; pct: number };
  /** Drives the empty state — "create your first automation" vs "no activity". */
  hasAutomations: boolean;
  /** Row fetches hit the page ceiling; numbers are a lower bound. */
  truncated: boolean;
};

export async function loadDashboard({
  supabase,
  userId,
  rangeKey,
  fallbackName,
  now = new Date(),
}: {
  supabase: SupabaseClient;
  userId: string;
  rangeKey: RangeKey;
  fallbackName: string;
  now?: Date;
}): Promise<DashboardData> {
  const range = resolveRange(rangeKey, now);
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();

  const [
    analytics,
    { data: userRow },
    { data: accountRows },
    { data: hourlyLogs },
    { count: automationCount },
  ] = await Promise.all([
    // The dashboard never filters, so it always sees the whole account.
    loadAnalytics({
      supabase,
      userId,
      range,
      filters: { accounts: [], automations: [], statuses: [] },
      now,
    }),
    supabase
      .from("users")
      .select("full_name, plan, dm_count_month")
      .eq("id", userId)
      .single(),
    supabase
      .from("instagram_accounts")
      .select(
        "id, ig_username, token_expires_at, webhook_subscribed, last_webhook_at",
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    // Only the last hour matters for the rate-limit tile, so this stays a
    // narrow read rather than reusing the (much wider) analytics window.
    supabase
      .from("dm_logs")
      .select("ig_account_id")
      .eq("user_id", userId)
      .eq("status", "sent")
      .gte("sent_at", hourAgo),
    supabase
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const hourlyByAccount = new Map<string, number>();
  for (const log of (hourlyLogs ?? []) as { ig_account_id: string }[]) {
    hourlyByAccount.set(
      log.ig_account_id,
      (hourlyByAccount.get(log.ig_account_id) ?? 0) + 1,
    );
  }

  const accounts: AccountHealthRow[] = (
    (accountRows ?? []) as Omit<AccountHealthRow, "hourlySends">[]
  ).map((a) => ({ ...a, hourlySends: hourlyByAccount.get(a.id) ?? 0 }));

  const plan = ((userRow?.plan as string) ?? "free") as Plan;
  const used = (userRow?.dm_count_month as number) ?? 0;
  const limit = DM_LIMIT[plan] ?? DM_LIMIT.free;

  const dmsMetric = analytics.kpis.find((m: Metric) => m.key === "dms_sent");

  // Ranked by conversion, not volume — the insight line is about quality, and
  // the biggest automation is very often not the best one.
  const topByConversion =
    [...analytics.topAutomations]
      .filter((a) => a.conversionRate !== null)
      .sort((a, b) => (b.conversionRate ?? 0) - (a.conversionRate ?? 0))[0] ??
    null;

  return {
    range,
    greetingName: ((userRow?.full_name as string | null) || fallbackName).split(
      " ",
    )[0],
    plan,

    kpis: analytics.kpis,
    chart: analytics.chart,
    topAutomations: analytics.topAutomations,
    funnel: analytics.funnel,
    activity: analytics.activity,
    health: buildHealthTiles(accounts, now),
    insight: buildInsight({
      dmsDelta: dmsMetric?.delta ?? percentChange(0, null),
      comparisonLabel: range.comparisonLabel,
      topByConversion,
    }),

    planUsage: { used, limit, pct: Math.min(100, share(used, limit)) },
    hasAutomations: (automationCount ?? 0) > 0,
    truncated: analytics.truncated,
  };
}
