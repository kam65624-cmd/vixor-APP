export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          confidence: number | null
          created_at: string
          entry: number | null
          error_message: string | null
          id: string
          image_path: string | null
          invalidation_level: number | null
          key_levels: Json | null
          liquidity_zones: Json | null
          management: string[] | null
          market_structure: Json | null
          news: Json | null
          pair: string | null
          pattern: string | null
          raw_ai_response: Json | null
          reasons: string[] | null
          risk_level: string | null
          risk_reasons: string[] | null
          recommendation:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          rr: string | null
          scenarios: Json | null
          signal_badge: Json | null
          source: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          stop_loss: number | null
          take_profit: number[] | null
          timeframe: string | null
          trend: string | null
          updated_at: string
          user_id: string
          vixor_message: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entry?: number | null
          error_message?: string | null
          id?: string
          image_path?: string | null
          invalidation_level?: number | null
          key_levels?: Json | null
          liquidity_zones?: Json | null
          management?: string[] | null
          market_structure?: Json | null
          news?: Json | null
          pair?: string | null
          pattern?: string | null
          raw_ai_response?: Json | null
          reasons?: string[] | null
          risk_level?: string | null
          risk_reasons?: string[] | null
          recommendation?:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          rr?: string | null
          scenarios?: Json | null
          signal_badge?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stop_loss?: number | null
          take_profit?: number[] | null
          timeframe?: string | null
          trend?: string | null
          updated_at?: string
          user_id: string
          vixor_message?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entry?: number | null
          error_message?: string | null
          id?: string
          image_path?: string | null
          invalidation_level?: number | null
          key_levels?: Json | null
          liquidity_zones?: Json | null
          management?: string[] | null
          market_structure?: Json | null
          news?: Json | null
          pair?: string | null
          pattern?: string | null
          raw_ai_response?: Json | null
          reasons?: string[] | null
          risk_level?: string | null
          risk_reasons?: string[] | null
          recommendation?:
            | Database["public"]["Enums"]["recommendation_type"]
            | null
          rr?: string | null
          scenarios?: Json | null
          signal_badge?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          stop_loss?: number | null
          take_profit?: number[] | null
          timeframe?: string | null
          trend?: string | null
          updated_at?: string
          user_id?: string
          vixor_message?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      point_packs: {
        Row: {
          badge: string | null
          bonus_points: number
          id: string
          is_active: boolean
          name: string
          points: number
          price_cents: number
          sort_order: number
        }
        Insert: {
          badge?: string | null
          bonus_points?: number
          id: string
          is_active?: boolean
          name: string
          points: number
          price_cents: number
          sort_order?: number
        }
        Update: {
          badge?: string | null
          bonus_points?: number
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      points_balances: {
        Row: {
          balance: number
          lifetime_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          lifetime_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          lifetime_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json
          reason: Database["public"]["Enums"]["points_reason"]
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json
          reason: Database["public"]["Enums"]["points_reason"]
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json
          reason?: Database["public"]["Enums"]["points_reason"]
          user_id?: string
        }
        Relationships: []
      }
      premium_plans: {
        Row: {
          badge: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          badge?: string | null
          features?: Json
          id: string
          interval: string
          is_active?: boolean
          name: string
          price_cents: number
          sort_order?: number
        }
        Update: {
          badge?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          id: string
          plan_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          id?: string
          plan_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          id?: string
          plan_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          id: string
          user_id: string
          symbol: string
          pair: string
          condition: "above" | "below" | "crosses_up" | "crosses_down"
          target_price: number
          current_price: number | null
          status: "active" | "triggered" | "cancelled"
          triggered_at: string | null
          created_at: string
          note: string | null
          timeframe: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          pair: string
          condition: "above" | "below" | "crosses_up" | "crosses_down"
          target_price: number
          current_price?: number | null
          status?: "active" | "triggered" | "cancelled"
          triggered_at?: string | null
          created_at?: string
          note?: string | null
          timeframe?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          pair?: string
          condition?: "above" | "below" | "crosses_up" | "crosses_down"
          target_price?: number
          current_price?: number | null
          status?: "active" | "triggered" | "cancelled"
          triggered_at?: string | null
          created_at?: string
          note?: string | null
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_signals: {
        Row: {
          id: string
          pair: string
          timeframe: string
          recommendation: "BUY" | "SELL" | "WAIT"
          confidence: number
          entry: number | null
          stop_loss: number | null
          take_profit: number[] | null
          reasons: string[] | null
          pattern: string | null
          market_structure: Json | null
          liquidity_zones: Json | null
          signal_date: string
          created_at: string
        }
        Insert: {
          id?: string
          pair: string
          timeframe: string
          recommendation: "BUY" | "SELL" | "WAIT"
          confidence: number
          entry?: number | null
          stop_loss?: number | null
          take_profit?: number[] | null
          reasons?: string[] | null
          pattern?: string | null
          market_structure?: Json | null
          liquidity_zones?: Json | null
          signal_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          pair?: string
          timeframe?: string
          recommendation?: "BUY" | "SELL" | "WAIT"
          confidence?: number
          entry?: number | null
          stop_loss?: number | null
          take_profit?: number[] | null
          reasons?: string[] | null
          pattern?: string | null
          market_structure?: Json | null
          liquidity_zones?: Json | null
          signal_date?: string
          created_at?: string
        }
        Relationships: []
      }
      user_strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          pairs: string[]
          trading_style: string
          risk_tolerance: string
          preferred_timeframes: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          pairs?: string[]
          trading_style?: string
          risk_tolerance?: string
          preferred_timeframes?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          pairs?: string[]
          trading_style?: string
          risk_tolerance?: string
          preferred_timeframes?: string[]
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_active_at: string
          referral_code: string
          referred_by: string | null
          streak_days: number
          telegram_id: string | null
          telegram_photo_url: string | null
          telegram_username: string | null
          xp: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_active_at?: string
          referral_code?: string
          referred_by?: string | null
          streak_days?: number
          telegram_id?: string | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
          xp?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_at?: string
          referral_code?: string
          referred_by?: string | null
          streak_days?: number
          telegram_id?: string | null
          telegram_photo_url?: string | null
          telegram_username?: string | null
          xp?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_points: {
        Args: {
          _amount: number
          _meta?: Json
          _reason: Database["public"]["Enums"]["points_reason"]
          _user: string
        }
        Returns: number
      }
      gen_referral_code: { Args: never; Returns: string }
      spend_points: {
        Args: {
          _amount: number
          _meta?: Json
          _reason: Database["public"]["Enums"]["points_reason"]
          _user: string
        }
        Returns: number
      }
    }
    Enums: {
      analysis_status: "queued" | "processing" | "complete" | "failed"
      points_reason:
        | "signup_bonus"
        | "analysis_cost"
        | "pack_purchase"
        | "referral_bonus"
        | "daily_streak"
        | "premium_grant"
        | "admin_adjust"
        | "telegram_stars_purchase"
      recommendation_type: "BUY" | "SELL" | "WAIT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: ["queued", "processing", "complete", "failed"],
      points_reason: [
        "signup_bonus",
        "analysis_cost",
        "pack_purchase",
        "referral_bonus",
        "daily_streak",
        "premium_grant",
        "admin_adjust",
        "telegram_stars_purchase",
      ],
      recommendation_type: ["BUY", "SELL", "WAIT"],
    },
  },
} as const
