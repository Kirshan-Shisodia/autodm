// Settings model. Every option list, default and label that the ten Settings
// sections render lives here, so the panels stay presentational and the server
// actions validate against exactly what the UI offered.
//
// Two rules this file exists to enforce:
//   1. A missing row is not an empty screen. Each section has a full default
//      object; `loadSettings` merges the DB row over it, so a brand-new account
//      renders the same as an old one and the first save is an upsert.
//   2. Options are declared once. Select menus, summary chips and the Zod
//      schemas in actions.ts all read the same `*_OPTIONS` array.

import type {
  ApiKeyRow,
  ApiSettingsRow,
  AutomationDefaultsRow,
  DmSettingsRow,
  IntegrationRow,
  PrivacySettingsRow,
  TeamMemberRow,
  WebhookEndpointRow,
  WorkspaceSettingsRow,
} from "@/types/database";

// ------------------------------------------------------------------
// Sections — the tab strip, in order
// ------------------------------------------------------------------

export const SETTINGS_SECTIONS = [
  { id: "general", label: "General", title: "Settings", blurb: "Manage your account, preferences and workspace settings." },
  { id: "accounts", label: "Connected Accounts", title: "Connected Accounts", blurb: "Manage and connect your social media accounts and other integrations." },
  { id: "team", label: "Team Members", title: "Team Members", blurb: "Invite, manage and control access for your team members." },
  { id: "notifications", label: "Notifications", title: "Notifications", blurb: "Manage how and when you want to be notified." },
  { id: "automation", label: "Automation Defaults", title: "Automation Defaults", blurb: "Set default values and preferences for your automations." },
  { id: "dm", label: "DM Settings", title: "DM Settings", blurb: "Configure default messaging preferences for your automations." },
  { id: "privacy", label: "Data & Privacy", title: "Data & Privacy", blurb: "Manage your data, privacy preferences and download your information." },
  { id: "integrations", label: "Integrations", title: "Integrations", blurb: "Connect ChatPilott to the tools your team already runs on." },
  { id: "api", label: "API & Webhooks", title: "API & Webhooks", blurb: "Connect your apps, access the API and manage webhook endpoints." },
  { id: "danger", label: "Danger Zone", title: "Danger Zone", blurb: "Irreversible actions that affect your entire account." },
] as const;

export type SectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

export const SECTION_IDS = SETTINGS_SECTIONS.map((s) => s.id) as SectionId[];

export function isSectionId(value: string | undefined): value is SectionId {
  return !!value && (SECTION_IDS as string[]).includes(value);
}

// ------------------------------------------------------------------
// Shared option catalogs
// ------------------------------------------------------------------

export type Option<T extends string = string> = { value: T; label: string };

export const TIMEZONE_OPTIONS: Option[] = [
  { value: "Asia/Kolkata", label: "(GMT+05:30) Asia/Kolkata" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Asia/Dubai" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Asia/Singapore" },
  { value: "Europe/London", label: "(GMT+00:00) Europe/London" },
  { value: "Europe/Berlin", label: "(GMT+01:00) Europe/Berlin" },
  { value: "America/New_York", label: "(GMT−05:00) America/New_York" },
  { value: "America/Los_Angeles", label: "(GMT−08:00) America/Los_Angeles" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

export const LANGUAGE_OPTIONS: Option[] = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "Hindi (India)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
];

/** 00:00 → 23:30 in half-hour steps, for the quiet-hours and working-hours pickers. */
export const TIME_OPTIONS: Option[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const value = `${String(h).padStart(2, "0")}:${m}`;
  return { value, label: formatTime(value) };
});

/** "22:00" → "10:00 PM". Kept here so the picker and the summary chip agree. */
export function formatTime(hhmm: string): string {
  const [rawH, rawM] = hhmm.split(":");
  const h = Number(rawH);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${rawM ?? "00"} ${suffix}`;
}

/** "09:00" + "21:00" → "09:00 AM – 09:00 PM". */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function labelFor(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** "Jun 10, 2024" — the date format used across every settings list. */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** "May 21, 2025 10:24 AM" — for webhook and key activity rows. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Two-letter monogram for the avatar tiles: "Priya Singh" → "PS". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ------------------------------------------------------------------
// General
// ------------------------------------------------------------------

export type WorkspaceSettings = Omit<
  WorkspaceSettingsRow,
  "user_id" | "created_at" | "updated_at"
>;

export const WORKSPACE_DEFAULTS: WorkspaceSettings = {
  workspace_name: "My Workspace",
  workspace_timezone: "Asia/Kolkata",
  workspace_language: "en-US",
  phone_number: null,
  dark_mode: false,
  compact_mode: false,
  sound_notifications: true,
  email_digest: true,
  marketing_emails: false,
  auto_refresh_data: true,
};

export const WORKSPACE_PREFERENCE_KEYS = [
  {
    key: "dark_mode",
    label: "Dark Mode",
    hint: "Switch between light and dark mode",
    icon: "sun",
  },
  {
    key: "compact_mode",
    label: "Compact Mode",
    hint: "Show more content in less space",
    icon: "layers",
  },
  {
    key: "sound_notifications",
    label: "Sound Notifications",
    hint: "Play a sound for important events",
    icon: "bell",
  },
  {
    key: "email_digest",
    label: "Email Digest",
    hint: "Receive a daily summary of insights",
    icon: "mail",
  },
  {
    key: "marketing_emails",
    label: "Marketing Emails",
    hint: "Receive updates, tips and offers",
    icon: "send",
  },
  {
    key: "auto_refresh_data",
    label: "Auto-refresh Data",
    hint: "Keep analytics and data up to date",
    icon: "refresh",
  },
] as const satisfies ReadonlyArray<{
  key: keyof WorkspaceSettings;
  label: string;
  hint: string;
  icon: string;
}>;

// ------------------------------------------------------------------
// Notifications
// ------------------------------------------------------------------

export const NOTIFICATION_CHANNELS = ["email", "push", "in_app"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email Notifications",
  push: "Push Notifications",
  in_app: "In-App Notifications",
};

export const FREQUENCY_OPTIONS: Option[] = [
  { value: "instant", label: "Instant" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily Summary" },
  { value: "weekly", label: "Weekly" },
];

export type NotificationPref = { enabled: boolean; frequency: string };

export type NotificationTopic = {
  key: string;
  label: string;
  hint: string;
  icon: string;
  /** Toggling this off is not offered — billing and security always notify. */
  locked?: boolean;
};

/** The rows inside each channel tab, and the defaults a new account starts on. */
export const NOTIFICATION_TOPICS: Record<
  NotificationChannel,
  NotificationTopic[]
> = {
  email: [
    { key: "automation_alerts", label: "Automation Alerts", hint: "Get notified when an automation is triggered, fails or completed.", icon: "mail" },
    { key: "new_leads", label: "New Leads", hint: "Receive an email when you receive new leads.", icon: "user-plus" },
    { key: "dm_activity", label: "DM Activity Summary", hint: "Get a summary of DMs sent, received and replied.", icon: "message" },
    { key: "performance_reports", label: "Performance Reports", hint: "Receive analytics and performance reports.", icon: "chart" },
    { key: "billing", label: "Billing & Payments", hint: "Updates about invoices, payments and subscription.", icon: "card", locked: true },
    { key: "team_activity", label: "Team Activity", hint: "Notifications about team members and permissions.", icon: "users" },
    { key: "product_updates", label: "Product Updates", hint: "News about new features and product updates.", icon: "bell" },
    { key: "support", label: "Support & Updates", hint: "Important updates regarding support tickets.", icon: "heart" },
  ],
  push: [
    { key: "automation_alerts", label: "Automation Alerts", hint: "Push a notification the moment an automation fails.", icon: "zap" },
    { key: "new_leads", label: "New Leads", hint: "Buzz your device when a new lead comes in.", icon: "user-plus" },
    { key: "dm_activity", label: "DM Replies", hint: "Someone replied to an automated DM.", icon: "message" },
    { key: "limit_warnings", label: "Limit Warnings", hint: "You are approaching your monthly DM allowance.", icon: "gauge" },
    { key: "team_activity", label: "Team Activity", hint: "A team member joined, left or changed a role.", icon: "users" },
    { key: "billing", label: "Billing & Payments", hint: "Payment failures and renewal reminders.", icon: "card", locked: true },
  ],
  in_app: [
    { key: "automation_alerts", label: "Automation Alerts", hint: "Show a toast when an automation changes state.", icon: "zap" },
    { key: "new_leads", label: "New Leads", hint: "Badge the Leads tab when new leads arrive.", icon: "user-plus" },
    { key: "dm_activity", label: "DM Activity", hint: "Live activity in the dashboard feed.", icon: "message" },
    { key: "performance_reports", label: "Performance Reports", hint: "Weekly performance digest in-app.", icon: "chart" },
    { key: "team_activity", label: "Team Activity", hint: "Roster and permission changes.", icon: "users" },
    { key: "product_updates", label: "Product Updates", hint: "What's new announcements.", icon: "bell" },
    { key: "support", label: "Support & Updates", hint: "Replies on your support tickets.", icon: "heart" },
  ],
};

const DEFAULT_FREQUENCY: Record<string, string> = {
  automation_alerts: "instant",
  new_leads: "instant",
  dm_activity: "daily",
  performance_reports: "weekly",
  billing: "instant",
  team_activity: "daily",
  product_updates: "weekly",
  support: "instant",
  limit_warnings: "instant",
};

function defaultChannel(
  channel: NotificationChannel,
): Record<string, NotificationPref> {
  const out: Record<string, NotificationPref> = {};
  for (const topic of NOTIFICATION_TOPICS[channel]) {
    out[topic.key] = {
      // Team activity is the one row that starts quiet — most workspaces are
      // a single person on day one and the noise reads as spam.
      enabled: topic.key !== "team_activity",
      frequency: DEFAULT_FREQUENCY[topic.key] ?? "instant",
    };
  }
  return out;
}

export type NotificationSettings = {
  email: Record<string, NotificationPref>;
  push: Record<string, NotificationPref>;
  in_app: Record<string, NotificationPref>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
};

export const NOTIFICATION_DEFAULTS: NotificationSettings = {
  email: defaultChannel("email"),
  push: defaultChannel("push"),
  in_app: defaultChannel("in_app"),
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  quiet_hours_timezone: "Asia/Kolkata",
};

/**
 * jsonb comes back as `Json`, and a row written by an older build may be
 * missing keys this build renders. Coerce defensively rather than trusting
 * the column shape.
 */
export function coerceChannel(
  raw: unknown,
  channel: NotificationChannel,
): Record<string, NotificationPref> {
  const base = defaultChannel(channel);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const source = raw as Record<string, unknown>;

  for (const key of Object.keys(base)) {
    const entry = source[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const { enabled, frequency } = entry as Record<string, unknown>;
    base[key] = {
      enabled: typeof enabled === "boolean" ? enabled : base[key].enabled,
      frequency:
        typeof frequency === "string" &&
        FREQUENCY_OPTIONS.some((o) => o.value === frequency)
          ? frequency
          : base[key].frequency,
    };
  }
  return base;
}

/** "7 / 8" — how many topics in a channel are on. Feeds the summary rail. */
export function channelCount(
  prefs: Record<string, NotificationPref>,
  channel: NotificationChannel,
): { on: number; total: number } {
  const topics = NOTIFICATION_TOPICS[channel];
  return {
    on: topics.filter((t) => prefs[t.key]?.enabled).length,
    total: topics.length,
  };
}

// ------------------------------------------------------------------
// Automation defaults
// ------------------------------------------------------------------

export type AutomationDefaults = Omit<
  AutomationDefaultsRow,
  "user_id" | "created_at" | "updated_at"
>;

export const TRIGGER_OPTIONS: Option<AutomationDefaults["trigger_type"]>[] = [
  { value: "new_comment", label: "New Comment" },
  { value: "new_dm", label: "New DM" },
  { value: "story_reply", label: "Story Reply" },
  { value: "mention", label: "Mention" },
  { value: "keyword", label: "Keyword Match" },
];

export const REPLY_OPTIONS: Option<AutomationDefaults["reply_type"]>[] = [
  { value: "send_message", label: "Send Message" },
  { value: "reply_comment", label: "Reply to Comment" },
  { value: "both", label: "Comment + DM" },
  { value: "no_reply", label: "No Reply" },
];

export const RETRY_OPTIONS: Option[] = [
  { value: "0", label: "No Retry" },
  { value: "1", label: "1 Attempt" },
  { value: "2", label: "2 Attempts" },
  { value: "3", label: "3 Attempts" },
  { value: "5", label: "5 Attempts" },
];

export const LABEL_OPTIONS: Option[] = [
  { value: "general", label: "General" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "marketing", label: "Marketing" },
  { value: "onboarding", label: "Onboarding" },
];

export const AUTOMATION_DEFAULTS: AutomationDefaults = {
  trigger_type: "new_comment",
  reply_type: "send_message",
  time_delay_seconds: 3,
  working_hours_start: "09:00",
  working_hours_end: "21:00",
  timezone: "Asia/Kolkata",
  require_approval: true,
  dm_limit_per_day: 100,
  retry_attempts: 3,
  fallback_message: "Hey! Thanks for reaching out.",
  label: "general",
};

// ------------------------------------------------------------------
// DM settings
// ------------------------------------------------------------------

export type DmSettings = Omit<
  DmSettingsRow,
  "user_id" | "created_at" | "updated_at"
>;

export const MESSAGE_TYPE_OPTIONS: Option<DmSettings["message_type"]>[] = [
  { value: "text", label: "Text Message" },
  { value: "media", label: "Media Message" },
  { value: "button", label: "Button Message" },
  { value: "carousel", label: "Carousel" },
];

export const FILE_SIZE_OPTIONS: Option[] = [
  { value: "5", label: "5 MB" },
  { value: "10", label: "10 MB" },
  { value: "25", label: "25 MB" },
  { value: "50", label: "50 MB" },
];

export const DM_DEFAULTS: DmSettings = {
  auto_dm_enabled: true,
  message_type: "text",
  template_id: null,
  typing_delay_seconds: 3,
  link_preview: true,
  media_support: true,
  max_file_size_mb: 10,
  humanize_messages: true,
  stop_on_unsubscribe: true,
  block_non_followers: false,
  fallback_message: "Hey! Thanks for reaching out.",
  daily_dm_limit_per_user: 3,
};

// ------------------------------------------------------------------
// Privacy
// ------------------------------------------------------------------

export type PrivacySettings = Omit<
  PrivacySettingsRow,
  "user_id" | "created_at" | "updated_at"
>;

export const VISIBILITY_OPTIONS: Option<
  PrivacySettings["profile_visibility"]
>[] = [
  { value: "public", label: "Anyone" },
  { value: "workspace", label: "Workspace Members" },
  { value: "private", label: "Only Me" },
];

export const RETENTION_OPTIONS: Option[] = [
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
  { value: "24", label: "24 Months" },
  { value: "36", label: "36 Months" },
];

export const STORAGE_LOCATION_OPTIONS: Option<
  PrivacySettings["data_storage_location"]
>[] = [
  { value: "ap-south-1", label: "Asia (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia (Singapore)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "us-east-1", label: "US East (Virginia)" },
];

export const PRIVACY_DEFAULTS: PrivacySettings = {
  profile_visibility: "workspace",
  activity_visibility: true,
  data_sharing: true,
  personalized_recommendations: false,
  retention_months: 12,
  marketing_communications: true,
  data_storage_location: "ap-south-1",
};

// ------------------------------------------------------------------
// Team
// ------------------------------------------------------------------

export type TeamMember = TeamMemberRow;
export type TeamRole = TeamMemberRow["role"];

export const ROLE_OPTIONS: Option<Exclude<TeamRole, "owner">>[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

export const ROLE_INFO: Record<TeamRole, { label: string; blurb: string }> = {
  owner: { label: "Owner", blurb: "Full access to all features" },
  admin: { label: "Admin", blurb: "Manage team, billing and data" },
  editor: { label: "Editor", blurb: "Create and manage automations" },
  viewer: { label: "Viewer", blurb: "View data and reports only" },
};

/** Seats included with each plan — the "6 / 10 member seats used" line. */
export const SEAT_LIMIT: Record<string, number> = {
  free: 1,
  pro: 10,
  platinum: 50,
};

/** "All Access" for owners/admins, otherwise the scope list they were granted. */
export function scopeSummary(member: TeamMember): string {
  if (member.role === "owner" || member.role === "admin") return "All Access";
  if (member.scopes.length === 0) return "No modules";
  return member.scopes
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(", ");
}

export const SCOPE_OPTIONS: Option[] = [
  { value: "automations", label: "Automations" },
  { value: "leads", label: "Leads" },
  { value: "analytics", label: "Analytics" },
  { value: "templates", label: "Templates" },
  { value: "billing", label: "Billing" },
];

// ------------------------------------------------------------------
// API & webhooks
// ------------------------------------------------------------------

export type ApiSettings = Omit<
  ApiSettingsRow,
  "user_id" | "created_at" | "updated_at"
>;

export const API_DEFAULTS: ApiSettings = {
  api_access_enabled: true,
  rate_limit_per_min: 1000,
};

export type ApiKey = ApiKeyRow;
export type WebhookEndpoint = WebhookEndpointRow;

/** Plan ceilings for the "2 / 5" chips in the summary rail. */
export const API_KEY_LIMIT: Record<string, number> = {
  free: 1,
  pro: 5,
  platinum: 20,
};
export const WEBHOOK_LIMIT: Record<string, number> = {
  free: 2,
  pro: 10,
  platinum: 50,
};

export const SCOPE_LABEL: Record<ApiKey["scope"], string> = {
  full_access: "Full Access",
  read_only: "Read Only",
};

export const WEBHOOK_EVENT_OPTIONS: Option[] = [
  { value: "lead.created", label: "New Lead" },
  { value: "dm.sent", label: "DM Sent" },
  { value: "dm.failed", label: "DM Failed" },
  { value: "automation.triggered", label: "Automation Triggered" },
  { value: "automation.completed", label: "Automation Completed" },
  { value: "account.disconnected", label: "Account Disconnected" },
];

/** "ck_live_••••••••4f2a" — keys are never stored in full, only shown once. */
export function maskKey(key: ApiKey): string {
  return `${key.prefix}_••••••••${key.last4}`;
}

// ------------------------------------------------------------------
// Integrations
// ------------------------------------------------------------------

export type Integration = IntegrationRow;

export type IntegrationCatalogEntry = {
  provider: string;
  name: string;
  category: "Automation" | "Communication" | "CRM" | "Analytics" | "Commerce";
  blurb: string;
  /** Rendered as the tile monogram — no third-party marks are bundled. */
  monogram: string;
  tile: string;
};

export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  { provider: "zapier", name: "Zapier", category: "Automation", blurb: "Push leads and DM events into 6,000+ apps.", monogram: "ZP", tile: "bg-warning-bg text-warning-text" },
  { provider: "make", name: "Make", category: "Automation", blurb: "Build visual scenarios on top of ChatPilott events.", monogram: "MK", tile: "bg-running-bg text-running" },
  { provider: "slack", name: "Slack", category: "Communication", blurb: "Post new leads and failures into a channel.", monogram: "SL", tile: "bg-selected-bg text-brand" },
  { provider: "hubspot", name: "HubSpot", category: "CRM", blurb: "Sync captured leads straight into your CRM.", monogram: "HS", tile: "bg-danger-bg text-danger" },
  { provider: "google_sheets", name: "Google Sheets", category: "Analytics", blurb: "Append every lead to a spreadsheet row.", monogram: "GS", tile: "bg-success-bg text-success" },
  { provider: "shopify", name: "Shopify", category: "Commerce", blurb: "Match DMs to orders and customer records.", monogram: "SH", tile: "bg-surface-muted text-ink-secondary" },
];

// ------------------------------------------------------------------
// Connected accounts (Settings › Connected Accounts)
// ------------------------------------------------------------------

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "messenger"
  | "tiktok"
  | "youtube";

export type SocialAccount = {
  platform: SocialPlatform;
  name: string;
  handle: string;
  status: "connected" | "limited" | "not_connected";
  detail: string;
  connectedAt: string | null;
};

export const PLATFORM_META: Record<
  SocialPlatform,
  { name: string; monogram: string; tile: string }
> = {
  instagram: { name: "Instagram", monogram: "IG", tile: "bg-danger-bg text-danger" },
  facebook: { name: "Facebook Page", monogram: "FB", tile: "bg-running-bg text-running" },
  messenger: { name: "Messenger", monogram: "MS", tile: "bg-selected-bg text-brand" },
  tiktok: { name: "TikTok", monogram: "TT", tile: "bg-surface-muted text-ink-secondary" },
  youtube: { name: "YouTube (Coming Soon)", monogram: "YT", tile: "bg-surface-muted text-ink-muted" },
};

export type AccountPermission = {
  platform: SocialPlatform;
  name: string;
  blurb: string;
  active: boolean;
};

/**
 * The permission list is derived from the scopes Meta actually granted on the
 * connected accounts, so revoking a scope in Meta shows up here.
 */
export const PERMISSION_CATALOG: Array<
  AccountPermission & { requiredScope: string }
> = [
  { platform: "instagram", name: "Instagram Basic Display", blurb: "Access profile info, media, and comments.", active: false, requiredScope: "instagram_basic" },
  { platform: "instagram", name: "Instagram Messaging", blurb: "Send and receive messages on your behalf.", active: false, requiredScope: "instagram_manage_messages" },
  { platform: "facebook", name: "Facebook Pages Manage", blurb: "Access and manage your Facebook Pages.", active: false, requiredScope: "pages_show_list" },
  { platform: "messenger", name: "Facebook Messenger", blurb: "Send and receive messages via Messenger.", active: false, requiredScope: "pages_messaging" },
];

// ------------------------------------------------------------------
// The aggregate the page hands to the shell
// ------------------------------------------------------------------

export type SettingsData = {
  profile: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    plan: string;
    planName: string;
    createdAt: string;
    role: TeamRole;
  };
  workspace: WorkspaceSettings;
  notifications: NotificationSettings;
  automation: AutomationDefaults;
  dm: DmSettings;
  privacy: PrivacySettings;
  api: ApiSettings;
  team: TeamMember[];
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
  integrations: Integration[];
  accounts: SocialAccount[];
  permissions: AccountPermission[];
  templates: Array<{ id: string; name: string }>;
  counts: {
    automationsActive: number;
    leadsStored: number;
    seatsUsed: number;
    seatLimit: number;
    apiKeyLimit: number;
    webhookLimit: number;
  };
};
