export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_plan: "free" | "pro" | "platinum";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          dm_quota_monthly: number;
          dm_quota_used_this_month: number;
          dm_quota_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: "free" | "pro" | "platinum";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          dm_quota_monthly?: number;
          dm_quota_used_this_month?: number;
          dm_quota_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_plan?: "free" | "pro" | "platinum";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          dm_quota_monthly?: number;
          dm_quota_used_this_month?: number;
          dm_quota_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          ig_username: string;
          ig_business_account_id: string;
          ig_access_token_encrypted: string;
          connected_at: string;
          last_sync_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ig_username: string;
          ig_business_account_id: string;
          ig_access_token_encrypted: string;
          connected_at?: string;
          last_sync_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ig_username?: string;
          ig_business_account_id?: string;
          ig_access_token_encrypted?: string;
          connected_at?: string;
          last_sync_at?: string | null;
          is_active?: boolean;
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
          user_id: string;
          ig_account_id: string;
          name: string;
          trigger_type: "comment" | "dm" | "story_mention";
          trigger_keyword: string | null;
          message_template_id: string | null;
          custom_message: string | null;
          is_active: boolean;
          daily_limit: number;
          rate_limit_per_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ig_account_id: string;
          name: string;
          trigger_type: "comment" | "dm" | "story_mention";
          trigger_keyword?: string | null;
          message_template_id?: string | null;
          custom_message?: string | null;
          is_active?: boolean;
          daily_limit?: number;
          rate_limit_per_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ig_account_id?: string;
          name?: string;
          trigger_type?: "comment" | "dm" | "story_mention";
          trigger_keyword?: string | null;
          message_template_id?: string | null;
          custom_message?: string | null;
          is_active?: boolean;
          daily_limit?: number;
          rate_limit_per_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automations_ig_account_id_fkey";
            columns: ["ig_account_id"];
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automations_message_template_id_fkey";
            columns: ["message_template_id"];
            referencedRelation: "templates";
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
          signup_bonus_credited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_user_id: string;
          referred_user_id?: string | null;
          referred_email?: string | null;
          signup_bonus_credited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_user_id?: string;
          referred_user_id?: string | null;
          referred_email?: string | null;
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
    };
    Views: {};
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
    Enums: {};
    CompositeTypes: {};
  };
}
