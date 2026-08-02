// Server-side loader for /settings.
//
// One round of parallel queries fills all ten sections. Every preference sheet
// is optional in the database — the account may predate the settings migration,
// or simply have never opened the screen — so each result is merged over the
// defaults in model.ts. That keeps the page render pure: components receive a
// fully-populated object and never branch on "no row yet".

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { PLANS } from "@/lib/billing";
import type { Plan } from "@/lib/dashboard";
import {
  API_DEFAULTS,
  API_KEY_LIMIT,
  AUTOMATION_DEFAULTS,
  coerceChannel,
  DM_DEFAULTS,
  NOTIFICATION_DEFAULTS,
  PERMISSION_CATALOG,
  PLATFORM_META,
  PRIVACY_DEFAULTS,
  SEAT_LIMIT,
  WEBHOOK_LIMIT,
  WORKSPACE_DEFAULTS,
  type AccountPermission,
  type SettingsData,
  type SocialAccount,
  type TeamRole,
} from "./model";

type Client = SupabaseClient<Database>;

/** Drop nulls so a partially-populated row can't erase a default. */
function merge<T extends object>(defaults: T, row: Partial<T> | null): T {
  if (!row) return { ...defaults };
  const out = { ...defaults };
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && value !== undefined && key in out) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export async function loadSettings(
  supabase: Client,
  userId: string,
  userEmail: string,
): Promise<SettingsData> {
  const [
    profileRes,
    workspaceRes,
    notificationsRes,
    automationRes,
    dmRes,
    privacyRes,
    apiRes,
    teamRes,
    keysRes,
    hooksRes,
    integrationsRes,
    igAccountsRes,
    templatesRes,
    automationCountRes,
    leadCountRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, avatar_url, plan, created_at")
      .eq("id", userId)
      .single(),
    supabase.from("workspace_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("notification_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("automation_defaults").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("dm_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("privacy_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("api_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", userId)
      .order("role", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("integrations").select("*").eq("user_id", userId),
    supabase
      .from("instagram_accounts")
      .select("ig_username, fb_page_name, scopes, is_active, created_at, token_expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("templates").select("id, name").eq("user_id", userId).order("name"),
    supabase
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const plan = (profileRes.data?.plan ?? "free") as Plan;
  const team = teamRes.data ?? [];

  // The owner's own seat is a row in `team_members`; if the backfill never ran
  // for this account, fall back to "owner" rather than showing them as a guest.
  const ownSeat = team.find((m) => m.member_user_id === userId);

  const notificationRow = notificationsRes.data;

  const accounts = buildAccounts(igAccountsRes.data ?? []);
  const grantedScopes = new Set(
    (igAccountsRes.data ?? []).flatMap((a) => a.scopes ?? []),
  );

  const permissions: AccountPermission[] = PERMISSION_CATALOG.map(
    ({ requiredScope, ...perm }) => ({
      ...perm,
      active: grantedScopes.has(requiredScope),
    }),
  );

  return {
    profile: {
      id: userId,
      name: profileRes.data?.full_name || userEmail.split("@")[0] || "there",
      email: userEmail,
      avatarUrl: profileRes.data?.avatar_url ?? null,
      plan,
      planName: PLANS[plan]?.name ?? "Starter",
      createdAt: profileRes.data?.created_at ?? new Date().toISOString(),
      role: (ownSeat?.role ?? "owner") as TeamRole,
    },

    workspace: merge(WORKSPACE_DEFAULTS, workspaceRes.data),

    notifications: {
      ...NOTIFICATION_DEFAULTS,
      ...merge(
        {
          quiet_hours_enabled: NOTIFICATION_DEFAULTS.quiet_hours_enabled,
          quiet_hours_start: NOTIFICATION_DEFAULTS.quiet_hours_start,
          quiet_hours_end: NOTIFICATION_DEFAULTS.quiet_hours_end,
          quiet_hours_timezone: NOTIFICATION_DEFAULTS.quiet_hours_timezone,
        },
        notificationRow,
      ),
      email: coerceChannel(notificationRow?.email, "email"),
      push: coerceChannel(notificationRow?.push, "push"),
      in_app: coerceChannel(notificationRow?.in_app, "in_app"),
    },

    automation: merge(AUTOMATION_DEFAULTS, automationRes.data),
    dm: merge(DM_DEFAULTS, dmRes.data),
    privacy: merge(PRIVACY_DEFAULTS, privacyRes.data),
    api: merge(API_DEFAULTS, apiRes.data),

    team,
    apiKeys: keysRes.data ?? [],
    webhooks: hooksRes.data ?? [],
    integrations: integrationsRes.data ?? [],
    accounts,
    permissions,
    templates: templatesRes.data ?? [],

    counts: {
      automationsActive: automationCountRes.count ?? 0,
      leadsStored: leadCountRes.count ?? 0,
      seatsUsed: team.filter((m) => m.status === "active").length,
      seatLimit: SEAT_LIMIT[plan] ?? SEAT_LIMIT.free,
      apiKeyLimit: API_KEY_LIMIT[plan] ?? API_KEY_LIMIT.free,
      webhookLimit: WEBHOOK_LIMIT[plan] ?? WEBHOOK_LIMIT.free,
    },
  };
}

type IgAccountRow = {
  ig_username: string;
  fb_page_name: string | null;
  scopes: string[] | null;
  is_active: boolean;
  created_at: string;
  token_expires_at: string | null;
};

/**
 * One Meta connection lights up three rows on this screen — Instagram, the
 * backing Facebook Page and Messenger — because that is how the user thinks
 * about it, even though the database stores a single account. TikTok and
 * YouTube have no integration yet and always render as unavailable.
 */
function buildAccounts(rows: IgAccountRow[]): SocialAccount[] {
  const primary = rows.find((r) => r.is_active) ?? rows[0] ?? null;
  const expiring =
    primary?.token_expires_at != null &&
    new Date(primary.token_expires_at).getTime() - Date.now() < 7 * 86_400_000;

  const connectedStatus: SocialAccount["status"] = !primary
    ? "not_connected"
    : expiring
      ? "limited"
      : "connected";

  const detail = !primary
    ? "Connect to unlock features"
    : expiring
      ? "Reconnect needed — token expiring"
      : `Connected on ${new Date(primary.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}`;

  return [
    {
      platform: "instagram",
      name: PLATFORM_META.instagram.name,
      handle: primary ? `@${primary.ig_username}` : "—",
      status: connectedStatus,
      detail,
      connectedAt: primary?.created_at ?? null,
    },
    {
      platform: "facebook",
      name: PLATFORM_META.facebook.name,
      handle: primary?.fb_page_name ?? "—",
      status: connectedStatus,
      detail,
      connectedAt: primary?.created_at ?? null,
    },
    {
      platform: "messenger",
      name: PLATFORM_META.messenger.name,
      handle: primary?.fb_page_name ?? "—",
      status: connectedStatus,
      detail,
      connectedAt: primary?.created_at ?? null,
    },
    {
      platform: "tiktok",
      name: PLATFORM_META.tiktok.name,
      handle: primary ? `@${primary.ig_username}` : "—",
      status: "limited",
      detail: "Some features unavailable",
      connectedAt: null,
    },
    {
      platform: "youtube",
      name: PLATFORM_META.youtube.name,
      handle: "—",
      status: "not_connected",
      detail: "Connect to unlock features",
      connectedAt: null,
    },
  ];
}
