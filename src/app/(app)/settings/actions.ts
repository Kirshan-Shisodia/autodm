"use server";

// Server Actions for /settings. Every write on the screen lands here.
//
// Shape of each action: authenticate, validate with Zod against the same option
// catalogs the UI rendered from, upsert scoped to the session user, revalidate.
// RLS already enforces ownership (`auth.uid() = user_id`); the explicit
// `.eq("user_id", user.id)` on every statement is defence in depth so a bug in
// a policy can never turn into cross-tenant writes.
//
// Ids never come from the client without being re-scoped — an attacker passing
// someone else's key id gets a no-op, not a deletion.

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  API_DEFAULTS,
  AUTOMATION_DEFAULTS,
  DM_DEFAULTS,
  FREQUENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_DEFAULTS,
  PRIVACY_DEFAULTS,
  SEAT_LIMIT,
  TIMEZONE_OPTIONS,
  WEBHOOK_EVENT_OPTIONS,
  WORKSPACE_DEFAULTS,
  API_KEY_LIMIT,
  WEBHOOK_LIMIT,
} from "@/lib/settings/model";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

const PATH = "/settings";

/** Session user or null — every action starts here. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const values = (options: ReadonlyArray<{ value: string }>) =>
  options.map((o) => o.value) as [string, ...string[]];

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "invalid_time");

// ==================================================================
// General
// ==================================================================

const workspaceSchema = z.object({
  workspace_name: z.string().trim().min(1).max(80),
  workspace_timezone: z.enum(values(TIMEZONE_OPTIONS)),
  workspace_language: z.enum(values(LANGUAGE_OPTIONS)),
  // Optional field: an empty string from a cleared input means "unset", not "".
  phone_number: z
    .string()
    .trim()
    .max(20)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  dark_mode: z.boolean(),
  compact_mode: z.boolean(),
  sound_notifications: z.boolean(),
  email_digest: z.boolean(),
  marketing_emails: z.boolean(),
  auto_refresh_data: z.boolean(),
});

export async function saveWorkspaceSettings(
  input: unknown,
): Promise<ActionResult> {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("workspace_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

/** Name / avatar live on `users`, not on the settings sheet. */
const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  avatar_url: z.string().url().nullable().optional(),
});

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Notifications
// ==================================================================

const prefSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(values(FREQUENCY_OPTIONS)),
});

const notificationSchema = z.object({
  email: z.record(z.string(), prefSchema),
  push: z.record(z.string(), prefSchema),
  in_app: z.record(z.string(), prefSchema),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: hhmm,
  quiet_hours_end: hhmm,
  quiet_hours_timezone: z.enum(values(TIMEZONE_OPTIONS)),
});

export async function saveNotificationSettings(
  input: unknown,
): Promise<ActionResult> {
  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("notification_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Automation defaults
// ==================================================================

const automationSchema = z.object({
  trigger_type: z.enum([
    "new_comment",
    "new_dm",
    "story_reply",
    "mention",
    "keyword",
  ]),
  reply_type: z.enum(["send_message", "reply_comment", "both", "no_reply"]),
  time_delay_seconds: z.coerce.number().int().min(0).max(3600),
  working_hours_start: hhmm,
  working_hours_end: hhmm,
  timezone: z.enum(values(TIMEZONE_OPTIONS)),
  require_approval: z.boolean(),
  dm_limit_per_day: z.coerce.number().int().min(1).max(100_000),
  retry_attempts: z.coerce.number().int().min(0).max(5),
  fallback_message: z.string().trim().min(1).max(1000),
  label: z.string().trim().min(1).max(40),
});

export async function saveAutomationDefaults(
  input: unknown,
): Promise<ActionResult> {
  const parsed = automationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("automation_defaults")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// DM settings
// ==================================================================

const dmSchema = z.object({
  auto_dm_enabled: z.boolean(),
  message_type: z.enum(["text", "media", "button", "carousel"]),
  template_id: z.string().uuid().nullable(),
  typing_delay_seconds: z.coerce.number().int().min(0).max(60),
  link_preview: z.boolean(),
  media_support: z.boolean(),
  max_file_size_mb: z.coerce.number().int().refine((n) => [5, 10, 25, 50].includes(n)),
  humanize_messages: z.boolean(),
  stop_on_unsubscribe: z.boolean(),
  block_non_followers: z.boolean(),
  fallback_message: z.string().trim().min(1).max(1000),
  daily_dm_limit_per_user: z.coerce.number().int().min(1).max(100),
});

export async function saveDmSettings(input: unknown): Promise<ActionResult> {
  const parsed = dmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // A template id from the client is only accepted if the user owns it.
  if (parsed.data.template_id) {
    const { data: owned } = await supabase
      .from("templates")
      .select("id")
      .eq("id", parsed.data.template_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!owned) return { ok: false, error: "invalid_template" };
  }

  const { error } = await supabase
    .from("dm_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Data & privacy
// ==================================================================

const privacySchema = z.object({
  profile_visibility: z.enum(["public", "workspace", "private"]),
  activity_visibility: z.boolean(),
  data_sharing: z.boolean(),
  personalized_recommendations: z.boolean(),
  retention_months: z.coerce
    .number()
    .int()
    .refine((n) => [3, 6, 12, 24, 36].includes(n)),
  marketing_communications: z.boolean(),
  data_storage_location: z.enum([
    "ap-south-1",
    "us-east-1",
    "eu-west-1",
    "ap-southeast-1",
  ]),
});

export async function savePrivacySettings(
  input: unknown,
): Promise<ActionResult> {
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("privacy_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// API settings, keys and webhooks
// ==================================================================

const apiSettingsSchema = z.object({
  api_access_enabled: z.boolean(),
  rate_limit_per_min: z.coerce.number().int().min(60).max(10_000),
});

export async function saveApiSettings(input: unknown): Promise<ActionResult> {
  const parsed = apiSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("api_settings")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(60),
  scope: z.enum(["full_access", "read_only"]),
});

/**
 * Mint an API key. The plaintext is returned exactly once — only its SHA-256
 * hash and last four characters are persisted, so a database leak cannot be
 * replayed against the API.
 */
export async function createApiKey(
  input: unknown,
): Promise<ActionResult<{ key: string }>> {
  const parsed = createKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const plan = await planOf(supabase, user.id);
  const { count } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) >= (API_KEY_LIMIT[plan] ?? API_KEY_LIMIT.free)) {
    return { ok: false, error: "key_limit_reached" };
  }

  const prefix = parsed.data.scope === "full_access" ? "cp_live" : "cp_read";
  const secret = randomBytes(24).toString("base64url");
  const plaintext = `${prefix}_${secret}`;

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: parsed.data.name,
    prefix,
    key_hash: createHash("sha256").update(plaintext).digest("hex"),
    last4: plaintext.slice(-4),
    scope: parsed.data.scope,
  });

  if (error) return { ok: false, error: "create_failed" };

  revalidatePath(PATH);
  return { ok: true, data: { key: plaintext } };
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "revoke_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

const webhookSchema = z.object({
  url: z.string().url().max(500),
  description: z.string().trim().max(120).optional(),
  events: z.array(z.enum(values(WEBHOOK_EVENT_OPTIONS))).min(1),
});

export async function createWebhook(input: unknown): Promise<ActionResult> {
  const parsed = webhookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  // Endpoints must be reachable over TLS — a plaintext callback would leak
  // lead data and the signing secret on the wire.
  if (!parsed.data.url.startsWith("https://")) {
    return { ok: false, error: "https_required" };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const plan = await planOf(supabase, user.id);
  const { count } = await supabase
    .from("webhook_endpoints")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= (WEBHOOK_LIMIT[plan] ?? WEBHOOK_LIMIT.free)) {
    return { ok: false, error: "webhook_limit_reached" };
  }

  const { error } = await supabase.from("webhook_endpoints").insert({
    user_id: user.id,
    url: parsed.data.url,
    description: parsed.data.description ?? null,
    events: parsed.data.events,
    secret: `whsec_${randomBytes(24).toString("base64url")}`,
  });

  if (error) return { ok: false, error: "create_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteWebhook(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "delete_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Fire a signed `ping` at the endpoint and record what came back. Runs with a
 * short timeout because this is an interactive button, not a delivery worker.
 */
export async function testWebhook(
  id: string,
): Promise<ActionResult<{ status: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: hook } = await supabase
    .from("webhook_endpoints")
    .select("id, url, secret")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!hook) return { ok: false, error: "not_found" };

  const body = JSON.stringify({
    id: randomUUID(),
    type: "ping",
    created_at: new Date().toISOString(),
  });

  let status = 0;
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-chatpilott-signature": createHash("sha256")
          .update(`${hook.secret}.${body}`)
          .digest("hex"),
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
  } catch {
    status = 0;
  }

  await supabase
    .from("webhook_endpoints")
    .update({
      last_triggered_at: new Date().toISOString(),
      last_status_code: status,
      status: status >= 200 && status < 300 ? "active" : "failing",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath(PATH);
  return { ok: true, data: { status } };
}

// ==================================================================
// Team
// ==================================================================

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["admin", "editor", "viewer"]),
  scopes: z.array(z.string().max(40)).max(10).default([]),
});

export async function inviteTeamMember(input: unknown): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const plan = await planOf(supabase, user.id);
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if ((count ?? 0) >= (SEAT_LIMIT[plan] ?? SEAT_LIMIT.free)) {
    return { ok: false, error: "seat_limit_reached" };
  }

  const { error } = await supabase.from("team_members").insert({
    owner_id: user.id,
    email: parsed.data.email,
    role: parsed.data.role,
    scopes: parsed.data.scopes,
    status: "pending",
  });

  // The unique (owner_id, email) index is what stops a duplicate invite.
  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "already_invited" : "invite_failed",
    };
  }

  revalidatePath(PATH);
  return { ok: true };
}

const updateMemberSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  scopes: z.array(z.string().max(40)).max(10).optional(),
});

export async function updateTeamMember(input: unknown): Promise<ActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { id, ...patch } = parsed.data;
  if (Object.keys(patch).length === 0) return { ok: true };

  // The owner seat is not editable — demoting it would orphan the workspace.
  const { error } = await supabase
    .from("team_members")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", user.id)
    .neq("role", "owner");

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

export async function removeTeamMember(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .neq("role", "owner");

  if (error) return { ok: false, error: "remove_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

/** Re-stamp `invited_at` so the pending row shows a fresh invitation date. */
export async function resendInvitation(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("team_members")
    .update({ invited_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("status", "pending");

  if (error) return { ok: false, error: "resend_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Integrations
// ==================================================================

const integrationSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  connect: z.boolean(),
});

export async function setIntegration(input: unknown): Promise<ActionResult> {
  const parsed = integrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: user.id,
      provider: parsed.data.provider,
      status: parsed.data.connect ? "connected" : "disconnected",
      connected_at: parsed.data.connect ? now : null,
    },
    { onConflict: "user_id,provider" },
  );

  if (error) return { ok: false, error: "save_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Reset to recommended
// ==================================================================

const RESETTABLE = {
  general: ["workspace_settings", WORKSPACE_DEFAULTS],
  notifications: ["notification_settings", NOTIFICATION_DEFAULTS],
  automation: ["automation_defaults", AUTOMATION_DEFAULTS],
  dm: ["dm_settings", DM_DEFAULTS],
  privacy: ["privacy_settings", PRIVACY_DEFAULTS],
  api: ["api_settings", API_DEFAULTS],
} as const;

/** The "Reset to Recommended" button on each summary rail. */
export async function resetSection(section: string): Promise<ActionResult> {
  const entry = RESETTABLE[section as keyof typeof RESETTABLE];
  if (!entry) return { ok: false, error: "invalid_section" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const [table, defaults] = entry;
  const { error } = await supabase
    // The table name is looked up from RESETTABLE, never taken from the client.
    .from(table)
    .upsert({ user_id: user.id, ...defaults }, { onConflict: "user_id" });

  if (error) return { ok: false, error: "reset_failed" };

  revalidatePath(PATH);
  return { ok: true };
}

// ==================================================================
// Danger zone
// ==================================================================

export async function pauseAllAutomations(): Promise<
  ActionResult<{ count: number }>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("automations")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true)
    .select("id");

  if (error) return { ok: false, error: "pause_failed" };

  revalidatePath("/automations");
  revalidatePath(PATH);
  return { ok: true, data: { count: data?.length ?? 0 } };
}

const confirmSchema = z.object({ confirm: z.string() });

/**
 * Wipe automations, leads and analytics but keep the account, its connected
 * accounts and its subscription. Typing the workspace name is the guard — a
 * misfired click cannot get here.
 */
export async function resetWorkspace(input: unknown): Promise<ActionResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("workspace_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const expected = settings?.workspace_name ?? WORKSPACE_DEFAULTS.workspace_name;
  if (parsed.data.confirm.trim() !== expected) {
    return { ok: false, error: "confirmation_mismatch" };
  }

  // dm_logs, dm_queue and short_links cascade from automations.
  const [automations, leads] = await Promise.all([
    supabase.from("automations").delete().eq("user_id", user.id),
    supabase.from("leads").delete().eq("user_id", user.id),
  ]);

  if (automations.error || leads.error) {
    return { ok: false, error: "reset_failed" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/automations");
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Delete the auth user; `on delete cascade` from `auth.users` takes every
 * application row with it. Requires the service role, so it runs through the
 * admin client after the session user has been re-verified here.
 */
export async function deleteAccount(input: unknown): Promise<ActionResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const { user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (parsed.data.confirm.trim().toLowerCase() !== user.email?.toLowerCase()) {
    return { ok: false, error: "confirmation_mismatch" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "delete_failed" };

  return { ok: true };
}

/** JSON export of everything the account owns, for the Data & Privacy card. */
export async function exportAccountData(): Promise<
  ActionResult<{ filename: string; json: string }>
> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const [profile, accounts, automations, leads, templates] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("instagram_accounts")
      .select("ig_username, fb_page_name, is_active, created_at")
      .eq("user_id", user.id),
    supabase.from("automations").select("*").eq("user_id", user.id),
    supabase.from("leads").select("*").eq("user_id", user.id),
    supabase.from("templates").select("*").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    // Token columns are never selected above, so nothing secret rides along.
    profile: profile.data ?? null,
    connected_accounts: accounts.data ?? [],
    automations: automations.data ?? [],
    leads: leads.data ?? [],
    templates: templates.data ?? [],
  };

  return {
    ok: true,
    data: {
      filename: `chatpilott-export-${new Date().toISOString().slice(0, 10)}.json`,
      json: JSON.stringify(payload, null, 2),
    },
  };
}

// ------------------------------------------------------------------

async function planOf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();
  return data?.plan ?? "free";
}
