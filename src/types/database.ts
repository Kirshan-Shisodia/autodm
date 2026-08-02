export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ------------------------------------------------------------------
// Settings row shapes.
//
// The ten settings tables are far more regular than the core schema —
// six are one-row-per-user preference sheets and four are owned
// collections — so their Row types are declared once here and wired
// into `Database["public"]["Tables"]` through the two helpers below.
// Every column not listed in the required set is server-defaulted, so
// Insert only ever needs the owner (plus the handful of columns with
// no sensible default).
// ------------------------------------------------------------------

type SettingsSheetInsert<Row extends { user_id: string }> = Partial<
  Omit<Row, "user_id">
> & { user_id: string };

type SettingsSheet<Row extends { user_id: string }> = {
  Row: Row;
  Insert: SettingsSheetInsert<Row>;
  Update: Partial<Row>;
  Relationships: [
    {
      foreignKeyName: string;
      columns: ["user_id"];
      referencedRelation: "users";
      referencedColumns: ["id"];
    },
  ];
};

type OwnedInsert<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required>>;

export type WorkspaceSettingsRow = {
  user_id: string;
  workspace_name: string;
  workspace_timezone: string;
  workspace_language: string;
  phone_number: string | null;
  dark_mode: boolean;
  compact_mode: boolean;
  sound_notifications: boolean;
  email_digest: boolean;
  marketing_emails: boolean;
  auto_refresh_data: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationSettingsRow = {
  user_id: string;
  email: Json;
  push: Json;
  in_app: Json;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_timezone: string;
  created_at: string;
  updated_at: string;
};

export type AutomationDefaultsRow = {
  user_id: string;
  trigger_type: "new_comment" | "new_dm" | "story_reply" | "mention" | "keyword";
  reply_type: "send_message" | "reply_comment" | "both" | "no_reply";
  time_delay_seconds: number;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  require_approval: boolean;
  dm_limit_per_day: number;
  retry_attempts: number;
  fallback_message: string;
  label: string;
  created_at: string;
  updated_at: string;
};

export type DmSettingsRow = {
  user_id: string;
  auto_dm_enabled: boolean;
  message_type: "text" | "media" | "button" | "carousel";
  template_id: string | null;
  typing_delay_seconds: number;
  link_preview: boolean;
  media_support: boolean;
  max_file_size_mb: number;
  humanize_messages: boolean;
  stop_on_unsubscribe: boolean;
  block_non_followers: boolean;
  fallback_message: string;
  daily_dm_limit_per_user: number;
  created_at: string;
  updated_at: string;
};

export type PrivacySettingsRow = {
  user_id: string;
  profile_visibility: "public" | "workspace" | "private";
  activity_visibility: boolean;
  data_sharing: boolean;
  personalized_recommendations: boolean;
  retention_months: number;
  marketing_communications: boolean;
  data_storage_location:
    | "ap-south-1"
    | "us-east-1"
    | "eu-west-1"
    | "ap-southeast-1";
  created_at: string;
  updated_at: string;
};

export type ApiSettingsRow = {
  user_id: string;
  api_access_enabled: boolean;
  rate_limit_per_min: number;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: string;
  owner_id: string;
  member_user_id: string | null;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "editor" | "viewer";
  scopes: string[];
  status: "active" | "pending" | "suspended";
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  key_hash: string;
  last4: string;
  scope: "full_access" | "read_only";
  status: "active" | "revoked";
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WebhookEndpointRow = {
  id: string;
  user_id: string;
  url: string;
  description: string | null;
  events: string[];
  secret: string;
  status: "active" | "paused" | "failing";
  last_triggered_at: string | null;
  last_status_code: number | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationRow = {
  id: string;
  user_id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  account_label: string | null;
  config: Json;
  connected_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: "free" | "pro" | "platinum";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status:
            | "active"
            | "trialing"
            | "past_due"
            | "canceled"
            | "incomplete"
            | null;
          dm_count_month: number;
          dm_count_month_reset_at: string;
          white_label_enabled: boolean;
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "platinum";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?:
            | "active"
            | "trialing"
            | "past_due"
            | "canceled"
            | "incomplete"
            | null;
          dm_count_month?: number;
          dm_count_month_reset_at?: string;
          white_label_enabled?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "pro" | "platinum";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?:
            | "active"
            | "trialing"
            | "past_due"
            | "canceled"
            | "incomplete"
            | null;
          dm_count_month?: number;
          dm_count_month_reset_at?: string;
          white_label_enabled?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey";
            columns: ["referred_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          ig_user_id: string;
          ig_username: string;
          fb_page_id: string;
          fb_page_name: string | null;
          access_token_encrypted: string;
          access_token_iv: string;
          token_expires_at: string | null;
          scopes: string[];
          is_active: boolean;
          webhook_subscribed: boolean;
          last_webhook_at: string | null;
          disconnected_at: string | null;
          disconnect_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ig_user_id: string;
          ig_username: string;
          fb_page_id: string;
          fb_page_name?: string | null;
          access_token_encrypted: string;
          access_token_iv: string;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          webhook_subscribed?: boolean;
          last_webhook_at?: string | null;
          disconnected_at?: string | null;
          disconnect_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ig_user_id?: string;
          ig_username?: string;
          fb_page_id?: string;
          fb_page_name?: string | null;
          access_token_encrypted?: string;
          access_token_iv?: string;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          webhook_subscribed?: boolean;
          last_webhook_at?: string | null;
          disconnected_at?: string | null;
          disconnect_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      automations: {
        Row: {
          id: string;
          ig_account_id: string;
          user_id: string;
          name: string;
          type:
            | "post"
            | "reel"
            | "story_reply"
            | "story_mention"
            | "inbox"
            | "ad"
            | "facebook_post";
          trigger_type: "keyword" | "all" | "specific_phrase" | "starts_with";
          trigger_keywords: string[];
          media_id: string | null;
          media_url: string | null;
          dm_message: string;
          dm_link: string | null;
          short_link_id: string | null;
          comment_reply_text: string | null;
          ask_for_email: boolean;
          email_followup_message: string | null;
          follow_required: boolean;
          is_active: boolean;
          /** Lifecycle bucket driving the list tabs; is_active mirrors it. */
          status: "active" | "paused" | "completed" | "draft";
          /** Short subtitle shown under the name in the list. */
          description: string | null;
          /** Fires, including skipped/failed sends. Always >= total_dms_sent. */
          total_triggers: number;
          total_dms_sent: number;
          total_clicks: number;
          /** What one lead from this automation is worth; 0 = not a revenue automation. */
          revenue_per_conversion: number;
          /** Denormalised lifetime revenue, kept in step by trg_leads_sync_revenue. */
          total_revenue: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ig_account_id: string;
          user_id: string;
          name: string;
          type:
            | "post"
            | "reel"
            | "story_reply"
            | "story_mention"
            | "inbox"
            | "ad"
            | "facebook_post";
          trigger_type: "keyword" | "all" | "specific_phrase" | "starts_with";
          trigger_keywords?: string[];
          media_id?: string | null;
          media_url?: string | null;
          dm_message: string;
          dm_link?: string | null;
          short_link_id?: string | null;
          comment_reply_text?: string | null;
          ask_for_email?: boolean;
          email_followup_message?: string | null;
          follow_required?: boolean;
          is_active?: boolean;
          status?: "active" | "paused" | "completed" | "draft";
          description?: string | null;
          total_triggers?: number;
          total_dms_sent?: number;
          total_clicks?: number;
          revenue_per_conversion?: number;
          total_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ig_account_id?: string;
          user_id?: string;
          name?: string;
          type?:
            | "post"
            | "reel"
            | "story_reply"
            | "story_mention"
            | "inbox"
            | "ad"
            | "facebook_post";
          trigger_type?: "keyword" | "all" | "specific_phrase" | "starts_with";
          trigger_keywords?: string[];
          media_id?: string | null;
          media_url?: string | null;
          dm_message?: string;
          dm_link?: string | null;
          short_link_id?: string | null;
          comment_reply_text?: string | null;
          ask_for_email?: boolean;
          email_followup_message?: string | null;
          follow_required?: boolean;
          is_active?: boolean;
          status?: "active" | "paused" | "completed" | "draft";
          description?: string | null;
          total_triggers?: number;
          total_dms_sent?: number;
          total_clicks?: number;
          revenue_per_conversion?: number;
          total_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automations_ig_account_id_fkey";
            columns: ["ig_account_id"];
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automations_short_link_id_fkey";
            columns: ["short_link_id"];
            referencedRelation: "short_links";
            referencedColumns: ["id"];
          },
        ];
      };
      dm_logs: {
        Row: {
          id: string;
          automation_id: string;
          ig_account_id: string;
          user_id: string;
          recipient_ig_id: string;
          recipient_username: string | null;
          triggered_by_comment_id: string | null;
          triggered_by_comment_text: string | null;
          message_text: string;
          meta_message_id: string | null;
          short_link_id: string | null;
          status:
            | "sent"
            | "failed"
            | "queued"
            | "duplicate_skipped"
            | "rate_limit_skipped";
          error_code: string | null;
          error_message: string | null;
          sent_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          automation_id: string;
          ig_account_id: string;
          user_id: string;
          recipient_ig_id: string;
          recipient_username?: string | null;
          triggered_by_comment_id?: string | null;
          triggered_by_comment_text?: string | null;
          message_text: string;
          meta_message_id?: string | null;
          short_link_id?: string | null;
          status:
            | "sent"
            | "failed"
            | "queued"
            | "duplicate_skipped"
            | "rate_limit_skipped";
          error_code?: string | null;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          automation_id?: string;
          ig_account_id?: string;
          user_id?: string;
          recipient_ig_id?: string;
          recipient_username?: string | null;
          triggered_by_comment_id?: string | null;
          triggered_by_comment_text?: string | null;
          message_text?: string;
          meta_message_id?: string | null;
          short_link_id?: string | null;
          status?:
            | "sent"
            | "failed"
            | "queued"
            | "duplicate_skipped"
            | "rate_limit_skipped";
          error_code?: string | null;
          error_message?: string | null;
          sent_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dm_logs_automation_id_fkey";
            columns: ["automation_id"];
            referencedRelation: "automations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_logs_ig_account_id_fkey";
            columns: ["ig_account_id"];
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_logs_short_link_id_fkey";
            columns: ["short_link_id"];
            referencedRelation: "short_links";
            referencedColumns: ["id"];
          },
        ];
      };
      dm_queue: {
        Row: {
          id: string;
          automation_id: string;
          ig_account_id: string;
          recipient_ig_id: string;
          message_text: string;
          triggered_by_comment_id: string | null;
          scheduled_for: string;
          attempt_count: number;
          last_attempt_at: string | null;
          last_error: string | null;
          status: "pending" | "processing" | "sent" | "failed" | "expired";
          created_at: string;
        };
        Insert: {
          id?: string;
          automation_id: string;
          ig_account_id: string;
          recipient_ig_id: string;
          message_text: string;
          triggered_by_comment_id?: string | null;
          scheduled_for?: string;
          attempt_count?: number;
          last_attempt_at?: string | null;
          last_error?: string | null;
          status?: "pending" | "processing" | "sent" | "failed" | "expired";
          created_at?: string;
        };
        Update: {
          id?: string;
          automation_id?: string;
          ig_account_id?: string;
          recipient_ig_id?: string;
          message_text?: string;
          triggered_by_comment_id?: string | null;
          scheduled_for?: string;
          attempt_count?: number;
          last_attempt_at?: string | null;
          last_error?: string | null;
          status?: "pending" | "processing" | "sent" | "failed" | "expired";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dm_queue_automation_id_fkey";
            columns: ["automation_id"];
            referencedRelation: "automations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_queue_ig_account_id_fkey";
            columns: ["ig_account_id"];
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      short_links: {
        Row: {
          id: string;
          user_id: string;
          automation_id: string | null;
          original_url: string;
          short_code: string;
          click_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          automation_id?: string | null;
          original_url: string;
          short_code: string;
          click_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          automation_id?: string | null;
          original_url?: string;
          short_code?: string;
          click_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "short_links_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "short_links_automation_id_fkey";
            columns: ["automation_id"];
            referencedRelation: "automations";
            referencedColumns: ["id"];
          },
        ];
      };
      link_clicks: {
        Row: {
          id: string;
          short_link_id: string;
          dm_log_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          referer: string | null;
          clicked_at: string;
        };
        Insert: {
          id?: string;
          short_link_id: string;
          dm_log_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          short_link_id?: string;
          dm_log_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          clicked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "link_clicks_short_link_id_fkey";
            columns: ["short_link_id"];
            referencedRelation: "short_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "link_clicks_dm_log_id_fkey";
            columns: ["dm_log_id"];
            referencedRelation: "dm_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          ig_account_id: string;
          automation_id: string | null;
          email: string;
          ig_username: string | null;
          ig_user_id: string | null;
          source: string;
          synced_to_kit: boolean;
          synced_to_flodesk: boolean;
          /**
           * Money attributed to this lead, in the account currency. Defaults
           * from automations.revenue_per_conversion at insert time.
           */
          revenue_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ig_account_id: string;
          automation_id?: string | null;
          email: string;
          ig_username?: string | null;
          ig_user_id?: string | null;
          source?: string;
          synced_to_kit?: boolean;
          synced_to_flodesk?: boolean;
          revenue_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ig_account_id?: string;
          automation_id?: string | null;
          email?: string;
          ig_username?: string | null;
          ig_user_id?: string | null;
          source?: string;
          synced_to_kit?: boolean;
          synced_to_flodesk?: boolean;
          revenue_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_ig_account_id_fkey";
            columns: ["ig_account_id"];
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_automation_id_fkey";
            columns: ["automation_id"];
            referencedRelation: "automations";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          message_text: string;
          category: string | null;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          message_text: string;
          category?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          message_text?: string;
          category?: string | null;
          use_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          source: "meta" | "stripe" | "kit" | "flodesk";
          event_type: string | null;
          payload: Json;
          signature_valid: boolean | null;
          processed: boolean;
          error: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          source: "meta" | "stripe" | "kit" | "flodesk";
          event_type?: string | null;
          payload: Json;
          signature_valid?: boolean | null;
          processed?: boolean;
          error?: string | null;
          received_at?: string;
        };
        Update: {
          id?: string;
          source?: "meta" | "stripe" | "kit" | "flodesk";
          event_type?: string | null;
          payload?: Json;
          signature_valid?: boolean | null;
          processed?: boolean;
          error?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: {
          event_id: string;
          event_type: string;
          user_id: string | null;
          processed_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          user_id?: string | null;
          processed_at?: string;
        };
        Update: {
          event_id?: string;
          event_type?: string;
          user_id?: string | null;
          processed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stripe_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      referrals: {
        Row: {
          id: string;
          referrer_user_id: string;
          referred_user_id: string | null;
          referred_email: string | null;
          commission_earned_cents: number;
          commission_paid: boolean;
          signup_bonus_credited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_user_id: string;
          referred_user_id?: string | null;
          referred_email?: string | null;
          commission_earned_cents?: number;
          commission_paid?: boolean;
          signup_bonus_credited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_user_id?: string;
          referred_user_id?: string | null;
          referred_email?: string | null;
          commission_earned_cents?: number;
          commission_paid?: boolean;
          signup_bonus_credited?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_user_id_fkey";
            columns: ["referrer_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey";
            columns: ["referred_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      // ----------------------------------------------------------------
      // Settings (migration 20260802000000_settings.sql)
      // ----------------------------------------------------------------

      workspace_settings: SettingsSheet<WorkspaceSettingsRow>;
      notification_settings: SettingsSheet<NotificationSettingsRow>;
      automation_defaults: SettingsSheet<AutomationDefaultsRow>;
      privacy_settings: SettingsSheet<PrivacySettingsRow>;
      api_settings: SettingsSheet<ApiSettingsRow>;

      dm_settings: {
        Row: DmSettingsRow;
        Insert: SettingsSheetInsert<DmSettingsRow>;
        Update: Partial<DmSettingsRow>;
        Relationships: [
          {
            foreignKeyName: "dm_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dm_settings_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };

      team_members: {
        Row: TeamMemberRow;
        Insert: OwnedInsert<TeamMemberRow, "owner_id" | "email">;
        Update: Partial<TeamMemberRow>;
        Relationships: [
          {
            foreignKeyName: "team_members_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_member_user_id_fkey";
            columns: ["member_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      api_keys: {
        Row: ApiKeyRow;
        Insert: OwnedInsert<
          ApiKeyRow,
          "user_id" | "name" | "prefix" | "key_hash" | "last4"
        >;
        Update: Partial<ApiKeyRow>;
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      webhook_endpoints: {
        Row: WebhookEndpointRow;
        Insert: OwnedInsert<WebhookEndpointRow, "user_id" | "url" | "secret">;
        Update: Partial<WebhookEndpointRow>;
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      integrations: {
        Row: IntegrationRow;
        Insert: OwnedInsert<IntegrationRow, "user_id" | "provider">;
        Update: Partial<IntegrationRow>;
        Relationships: [
          {
            foreignKeyName: "integrations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
