export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      notification_sends: {
        Row: {
          channel: string;
          created_at: string;
          due_on: string;
          id: string;
          kind: string;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          due_on: string;
          id?: string;
          kind: string;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          due_on?: string;
          id?: string;
          kind?: string;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_sends_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          currency: string;
          email_enabled: boolean;
          id: string;
          monthly_digest: boolean;
          notification_frequency: string;
          push_enabled: boolean;
          reminder_lead_days: number;
          renewal_reminders: boolean;
          renews_today: boolean;
          second_send_hour: number;
          send_hour: number;
          timezone: string | null;
          trial_reminders: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          email_enabled?: boolean;
          id: string;
          monthly_digest?: boolean;
          notification_frequency?: string;
          push_enabled?: boolean;
          reminder_lead_days?: number;
          renewal_reminders?: boolean;
          renews_today?: boolean;
          second_send_hour?: number;
          send_hour?: number;
          timezone?: string | null;
          trial_reminders?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          email_enabled?: boolean;
          id?: string;
          monthly_digest?: boolean;
          notification_frequency?: string;
          push_enabled?: boolean;
          reminder_lead_days?: number;
          renewal_reminders?: boolean;
          renews_today?: boolean;
          second_send_hour?: number;
          send_hour?: number;
          timezone?: string | null;
          trial_reminders?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_receipts: {
        Row: {
          created_at: string;
          ticket_id: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          ticket_id: string;
          token: string;
        };
        Update: {
          created_at?: string;
          ticket_id?: string;
          token?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          last_seen_at: string;
          platform: string;
          token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          token?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          amount_minor: number;
          anchor_date: string;
          category: string | null;
          created_at: string;
          currency: string;
          cycle_count: number;
          cycle_unit: string;
          id: string;
          name: string;
          notes: string | null;
          payment_method: string | null;
          service_key: string | null;
          status: string;
          trial_ends_on: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_minor: number;
          anchor_date: string;
          category?: string | null;
          created_at?: string;
          currency: string;
          cycle_count?: number;
          cycle_unit: string;
          id?: string;
          name: string;
          notes?: string | null;
          payment_method?: string | null;
          service_key?: string | null;
          status?: string;
          trial_ends_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount_minor?: number;
          anchor_date?: string;
          category?: string | null;
          created_at?: string;
          currency?: string;
          cycle_count?: number;
          cycle_unit?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          payment_method?: string | null;
          service_key?: string | null;
          status?: string;
          trial_ends_on?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      change_currency: {
        Args: { p_currency: string };
        Returns: undefined;
      };
      claim_notification: {
        Args: {
          p_channel?: string;
          p_due_on: string;
          p_kind: string;
          p_subscription_id: string | null;
          p_user_id: string;
        };
        Returns: boolean;
      };
      claim_batches: { Args: { p_batches: Json }; Returns: Json };
      claim_notifications: {
        Args: {
          p_channel: string;
          p_claims: Json;
          p_gate: Json;
          p_user_id: string;
        };
        Returns: number[] | null;
      };
      currency_digits: {
        Args: { code: string };
        Returns: number;
      };
      notification_context: { Args: Record<string, never>; Returns: Json };
      register_push_token: {
        Args: { p_token: string };
        Returns: undefined;
      };
      release_notification: {
        Args: {
          p_channel?: string;
          p_due_on: string;
          p_kind: string;
          p_subscription_id: string | null;
          p_user_id: string;
        };
        Returns: undefined;
      };
      release_batches: { Args: { p_batches: Json }; Returns: undefined };
      release_notifications: {
        Args: { p_channel: string; p_claims: Json; p_user_id: string };
        Returns: undefined;
      };
      unregister_push_token: {
        Args: { p_token: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
