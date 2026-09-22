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
          created_at: string;
          due_on: string;
          id: string;
          kind: string;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_on: string;
          id?: string;
          kind: string;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
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
          id: string;
          monthly_digest: boolean;
          reminder_lead_days: number;
          renewal_reminders: boolean;
          renews_today: boolean;
          timezone: string | null;
          trial_reminders: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          id: string;
          monthly_digest?: boolean;
          reminder_lead_days?: number;
          renewal_reminders?: boolean;
          renews_today?: boolean;
          timezone?: string | null;
          trial_reminders?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          monthly_digest?: boolean;
          reminder_lead_days?: number;
          renewal_reminders?: boolean;
          renews_today?: boolean;
          timezone?: string | null;
          trial_reminders?: boolean;
          updated_at?: string;
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
      claim_notification: {
        Args: {
          p_due_on: string;
          p_kind: string;
          p_subscription_id: string | null;
          p_user_id: string;
        };
        Returns: boolean;
      };
      release_notification: {
        Args: {
          p_due_on: string;
          p_kind: string;
          p_subscription_id: string | null;
          p_user_id: string;
        };
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
