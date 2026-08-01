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
