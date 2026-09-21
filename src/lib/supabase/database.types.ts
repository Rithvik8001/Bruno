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
      profiles: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
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
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
