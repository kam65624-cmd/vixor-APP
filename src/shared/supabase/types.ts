export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      analyses: {
        Row: {
          confidence: number | null;
          created_at: string;
          entry: number | null;
          error_message: string | null;
          id: string;
          image_path: string | null;
          invalidation_level: number | null;
          key_levels: Json | null;
          liquidity_zones: Json | null;
          management: string[] | null;
          market_structure: Json | null;
          news: Json | null;
          pair: string | null;
          pattern: string | null;
          raw_ai_response: Json | null;
          reasons: string[] | null;
          risk_level: string | null;
          risk_reasons: string[] | null;
          recommendation: Database["public"]["Enums"]["recommendation_type"] | null;
          rr: string | null;
          scenarios: Json | null;
          signal_badge: Json | null;
          source: string | null;
          status: Database["public"]["Enums"]["analysis_status"];
          stop_loss: number | null;
          take_profit: number[] | null;
          timeframe: string | null;
          trend: string | null;
          updated_at: string;
          user_id: string;
          vixor_message: string | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          entry?: number | null;
          error_message?: string | null;
          id?: string;
          image_path?: string | null;
          invalidation_level?: number | null;
          key_levels?: Json | null;
          liquidity_zones?: Json | null;
          management?: string[] | null;
          market_structure?: Json | null;
          news?: Json | null;
          pair?: string | null;
          pattern?: string | null;
          raw_ai_response?: Json | null;
          reasons?: string[] | null;
          risk_level?: string | null;
          risk_reasons?: string[] | null;
          recommendation?: Database["public"]["Enums"]["recommendation_type"] | null;
          rr?: string | null;
          scenarios?: Json | null;
          signal_badge?: Json | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          stop_loss?: number | null;
          take_profit?: number[] | null;
          timeframe?: string | null;
          trend?: string | null;
          updated_at?: string;
          user_id: string;
          vixor_message?: string | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          entry?: number | null;
          error_message?: string | null;
          id?: string;
          image_path?: string | null;
          invalidation_level?: number | null;
          key_levels?: Json | null;
          liquidity_zones?: Json | null;
          management?: string[] | null;
          market_structure?: Json | null;
          news?: Json | null;
          pair?: string | null;
          pattern?: string | null;
          raw_ai_response?: Json | null;
          reasons?: string[] | null;
          risk_level?: string | null;
          risk_reasons?: string[] | null;
          recommendation?: Database["public"]["Enums"]["recommendation_type"] | null;
          rr?: string | null;
          scenarios?: Json | null;
          signal_badge?: Json | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          stop_loss?: number | null;
          take_profit?: number[] | null;
          timeframe?: string | null;
          trend?: string | null;
          updated_at?: string;
          user_id?: string;
          vixor_message?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          // Original columns (from 20260607170345_*.sql)
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
          // Extended columns (from 20260618000000_add_quantdinger_reuse.sql)
          channel: string;
          payload: Json;
          status: string;
          sent_at: string | null;
          error: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id: string;
          channel?: string;
          payload?: Json;
          status?: string;
          sent_at?: string | null;
          error?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
          channel?: string;
          payload?: Json;
          status?: string;
          sent_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
      point_packs: {
        Row: {
          badge: string | null;
          bonus_points: number;
          id: string;
          is_active: boolean;
          name: string;
          points: number;
          price_cents: number;
          sort_order: number;
        };
        Insert: {
          badge?: string | null;
          bonus_points?: number;
          id: string;
          is_active?: boolean;
          name: string;
          points: number;
          price_cents: number;
          sort_order?: number;
        };
        Update: {
          badge?: string | null;
          bonus_points?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          points?: number;
          price_cents?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      points_balances: {
        Row: {
          balance: number;
          lifetime_earned: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          lifetime_earned?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          lifetime_earned?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      points_transactions: {
        Row: {
          created_at: string;
          delta: number;
          id: string;
          metadata: Json;
          reason: Database["public"]["Enums"]["points_reason"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          delta: number;
          id?: string;
          metadata?: Json;
          reason: Database["public"]["Enums"]["points_reason"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          delta?: number;
          id?: string;
          metadata?: Json;
          reason?: Database["public"]["Enums"]["points_reason"];
          user_id?: string;
        };
        Relationships: [];
      };
      premium_plans: {
        Row: {
          badge: string | null;
          features: Json;
          id: string;
          interval: string;
          is_active: boolean;
          name: string;
          price_cents: number;
          sort_order: number;
        };
        Insert: {
          badge?: string | null;
          features?: Json;
          id: string;
          interval: string;
          is_active?: boolean;
          name: string;
          price_cents: number;
          sort_order?: number;
        };
        Update: {
          badge?: string | null;
          features?: Json;
          id?: string;
          interval?: string;
          is_active?: boolean;
          name?: string;
          price_cents?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      premium_subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string;
          id: string;
          plan_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end: string;
          id?: string;
          plan_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string;
          id?: string;
          plan_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "premium_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "premium_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      price_alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          pair: string;
          condition: "above" | "below" | "crosses_up" | "crosses_down";
          target_price: number;
          current_price: number | null;
          status: "active" | "triggered" | "cancelled";
          triggered_at: string | null;
          created_at: string;
          note: string | null;
          timeframe: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          pair: string;
          condition: "above" | "below" | "crosses_up" | "crosses_down";
          target_price: number;
          current_price?: number | null;
          status?: "active" | "triggered" | "cancelled";
          triggered_at?: string | null;
          created_at?: string;
          note?: string | null;
          timeframe?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          pair?: string;
          condition?: "above" | "below" | "crosses_up" | "crosses_down";
          target_price?: number;
          current_price?: number | null;
          status?: "active" | "triggered" | "cancelled";
          triggered_at?: string | null;
          created_at?: string;
          note?: string | null;
          timeframe?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_signals: {
        Row: {
          id: string;
          pair: string;
          timeframe: string;
          recommendation: "BUY" | "SELL" | "WAIT";
          confidence: number;
          entry: number | null;
          stop_loss: number | null;
          take_profit: number[] | null;
          reasons: string[] | null;
          pattern: string | null;
          market_structure: Json | null;
          liquidity_zones: Json | null;
          signal_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pair: string;
          timeframe: string;
          recommendation: "BUY" | "SELL" | "WAIT";
          confidence: number;
          entry?: number | null;
          stop_loss?: number | null;
          take_profit?: number[] | null;
          reasons?: string[] | null;
          pattern?: string | null;
          market_structure?: Json | null;
          liquidity_zones?: Json | null;
          signal_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pair?: string;
          timeframe?: string;
          recommendation?: "BUY" | "SELL" | "WAIT";
          confidence?: number;
          entry?: number | null;
          stop_loss?: number | null;
          take_profit?: number[] | null;
          reasons?: string[] | null;
          pattern?: string | null;
          market_structure?: Json | null;
          liquidity_zones?: Json | null;
          signal_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      signal_tracking: {
        Row: {
          activated_at: string | null;
          created_at: string;
          current_price: number | null;
          direction: string;
          entry_price: number | null;
          expires_at: string | null;
          hit_tp: number;
          id: string;
          max_adverse_excursion: number;
          max_favorable_excursion: number;
          pair: string;
          previous_price: number | null;
          resolved_at: string | null;
          signal_id: string | null;
          source_type: string;
          status: Database["public"]["Enums"]["signal_status"];
          stop_loss: number | null;
          take_profit: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          current_price?: number | null;
          direction: string;
          entry_price?: number | null;
          expires_at?: string | null;
          hit_tp?: number;
          id?: string;
          max_adverse_excursion?: number;
          max_favorable_excursion?: number;
          pair: string;
          previous_price?: number | null;
          resolved_at?: string | null;
          signal_id?: string | null;
          source_type?: string;
          status?: Database["public"]["Enums"]["signal_status"];
          stop_loss?: number | null;
          take_profit?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          current_price?: number | null;
          direction?: string;
          entry_price?: number | null;
          expires_at?: string | null;
          hit_tp?: number;
          id?: string;
          max_adverse_excursion?: number;
          max_favorable_excursion?: number;
          pair?: string;
          previous_price?: number | null;
          resolved_at?: string | null;
          signal_id?: string | null;
          source_type?: string;
          status?: Database["public"]["Enums"]["signal_status"];
          stop_loss?: number | null;
          take_profit?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "signal_tracking_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "signal_tracking_signal_id_fkey";
            columns: ["signal_id"];
            isOneToOne: false;
            referencedRelation: "daily_signals";
            referencedColumns: ["id"];
          },
        ];
      };
      user_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pairs: string[];
          trading_style: string;
          risk_tolerance: string;
          preferred_timeframes: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          pairs?: string[];
          trading_style?: string;
          risk_tolerance?: string;
          preferred_timeframes?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          pairs?: string[];
          trading_style?: string;
          risk_tolerance?: string;
          preferred_timeframes?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_strategies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlist_items: {
        Row: {
          id: string;
          watchlist_id: string;
          pair: string;
          category: string;
          notes: string | null;
          sort_order: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          watchlist_id: string;
          pair: string;
          category?: string;
          notes?: string | null;
          sort_order?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          watchlist_id?: string;
          pair?: string;
          category?: string;
          notes?: string | null;
          sort_order?: number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey";
            columns: ["watchlist_id"];
            isOneToOne: false;
            referencedRelation: "watchlists";
            referencedColumns: ["id"];
          },
        ];
      };
      copilot_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          agent_id: string | null;
          is_consensus: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          agent_id?: string | null;
          is_consensus?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          agent_id?: string | null;
          is_consensus?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "copilot_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      copilot_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          agent_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          agent_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          agent_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "copilot_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          last_active_at: string;
          referral_code: string;
          referred_by: string | null;
          streak_days: number;
          telegram_id: string | null;
          telegram_photo_url: string | null;
          telegram_username: string | null;
          xp: number | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          last_active_at?: string;
          referral_code?: string;
          referred_by?: string | null;
          streak_days?: number;
          telegram_id?: string | null;
          telegram_photo_url?: string | null;
          telegram_username?: string | null;
          xp?: number | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          last_active_at?: string;
          referral_code?: string;
          referred_by?: string | null;
          streak_days?: number;
          telegram_id?: string | null;
          telegram_photo_url?: string | null;
          telegram_username?: string | null;
          xp?: number | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trading_notes: {
        Row: {
          id: string;
          user_id: string;
          pair: string | null;
          analysis_id: string | null;
          title: string;
          content: string;
          tags: string[];
          mood: "confident" | "cautious" | "anxious" | "neutral";
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pair?: string | null;
          analysis_id?: string | null;
          title?: string;
          content?: string;
          tags?: string[];
          mood?: "confident" | "cautious" | "anxious" | "neutral";
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pair?: string | null;
          analysis_id?: string | null;
          title?: string;
          content?: string;
          tags?: string[];
          mood?: "confident" | "cautious" | "anxious" | "neutral";
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trading_notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trading_notes_analysis_id_fkey";
            columns: ["analysis_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id"];
          },
        ];
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          pair: string;
          direction: "long" | "short";
          status: "open" | "closed" | "cancelled";
          entry_price: number;
          entry_date: string;
          quantity: number | null;
          exit_price: number | null;
          exit_date: string | null;
          stop_loss: number | null;
          take_profit: number | null;
          pnl: number | null;
          pnl_pips: number | null;
          r_multiple: number | null;
          notes: string | null;
          tags: string[];
          strategy: string | null;
          analysis_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pair: string;
          direction: "long" | "short";
          status?: "open" | "closed" | "cancelled";
          entry_price: number;
          entry_date?: string;
          quantity?: number | null;
          exit_price?: number | null;
          exit_date?: string | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          notes?: string | null;
          tags?: string[];
          strategy?: string | null;
          analysis_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pair?: string;
          direction?: "long" | "short";
          status?: "open" | "closed" | "cancelled";
          entry_price?: number;
          entry_date?: string;
          quantity?: number | null;
          exit_price?: number | null;
          exit_date?: string | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          notes?: string | null;
          tags?: string[];
          strategy?: string | null;
          analysis_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trades_analysis_id_fkey";
            columns: ["analysis_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_loops: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          morning_prep_completed: boolean;
          morning_prep_at: string | null;
          market_bias: string | null;
          key_levels: string | null;
          watchlist_reviewed: boolean;
          london_session_traded: boolean;
          london_session_notes: string | null;
          ny_session_traded: boolean;
          ny_session_notes: string | null;
          asian_session_traded: boolean;
          asian_session_notes: string | null;
          eod_review_completed: boolean;
          eod_review_at: string | null;
          daily_pnl: number | null;
          trades_taken: number;
          rules_followed: number;
          rules_broken: number;
          emotional_state: "disciplined" | "anxious" | "fomo" | "revenge" | "calm" | "tired";
          lessons_learned: string | null;
          tomorrow_plan: string | null;
          completion_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          morning_prep_completed?: boolean;
          morning_prep_at?: string | null;
          market_bias?: string | null;
          key_levels?: string | null;
          watchlist_reviewed?: boolean;
          london_session_traded?: boolean;
          london_session_notes?: string | null;
          ny_session_traded?: boolean;
          ny_session_notes?: string | null;
          asian_session_traded?: boolean;
          asian_session_notes?: string | null;
          eod_review_completed?: boolean;
          eod_review_at?: string | null;
          daily_pnl?: number | null;
          trades_taken?: number;
          rules_followed?: number;
          rules_broken?: number;
          emotional_state?: "disciplined" | "anxious" | "fomo" | "revenge" | "calm" | "tired";
          lessons_learned?: string | null;
          tomorrow_plan?: string | null;
          completion_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          morning_prep_completed?: boolean;
          morning_prep_at?: string | null;
          market_bias?: string | null;
          key_levels?: string | null;
          watchlist_reviewed?: boolean;
          london_session_traded?: boolean;
          london_session_notes?: string | null;
          ny_session_traded?: boolean;
          ny_session_notes?: string | null;
          asian_session_traded?: boolean;
          asian_session_notes?: string | null;
          eod_review_completed?: boolean;
          eod_review_at?: string | null;
          daily_pnl?: number | null;
          trades_taken?: number;
          rules_followed?: number;
          rules_broken?: number;
          emotional_state?: "disciplined" | "anxious" | "fomo" | "revenge" | "calm" | "tired";
          lessons_learned?: string | null;
          tomorrow_plan?: string | null;
          completion_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_loops_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── P1-INFRA: QuantDinger reuse tables (20260618000000) ──
      user_settings: {
        Row: {
          user_id: string;
          notification_channels: Json;
          preferred_llm_provider: string;
          llm_api_keys: Json;
          exchange_credentials: Json;
          telegram_chat_id: string | null;
          webhook_url: string | null;
          webhook_secret: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notification_channels?: Json;
          preferred_llm_provider?: string;
          llm_api_keys?: Json;
          exchange_credentials?: Json;
          telegram_chat_id?: string | null;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          notification_channels?: Json;
          preferred_llm_provider?: string;
          llm_api_keys?: Json;
          exchange_credentials?: Json;
          telegram_chat_id?: string | null;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_tokens: {
        Row: {
          id: string;
          user_id: string;
          token_hash: string;
          scopes: string[];
          name: string | null;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_hash: string;
          scopes?: string[];
          name?: string | null;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_hash?: string;
          scopes?: string[];
          name?: string | null;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          token_id: string | null;
          status: string;
          progress: number;
          result: Json | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          token_id?: string | null;
          status?: string;
          progress?: number;
          result?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          token_id?: string | null;
          status?: string;
          progress?: number;
          result?: Json | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_jobs_token_id_fkey";
            columns: ["token_id"];
            isOneToOne: false;
            referencedRelation: "agent_tokens";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          token_id: string | null;
          route: string;
          method: string;
          status: number | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          token_id?: string | null;
          route: string;
          method: string;
          status?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          token_id?: string | null;
          route?: string;
          method?: string;
          status?: number | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // ── P2-ENGINES: Experiment tables (20260618000001) ──
      experiments: {
        Row: {
          id: string;
          user_id: string;
          config: Json;
          result: Json | null;
          status: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          config: Json;
          result?: Json | null;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          config?: Json;
          result?: Json | null;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "experiments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      experiment_generations: {
        Row: {
          id: string;
          experiment_id: string;
          generation: number;
          best_score: Json | null;
          avg_score: Json | null;
          population: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          generation: number;
          best_score?: Json | null;
          avg_score?: Json | null;
          population?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          generation?: number;
          best_score?: Json | null;
          avg_score?: Json | null;
          population?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experiment_generations_experiment_id_fkey";
            columns: ["experiment_id"];
            isOneToOne: false;
            referencedRelation: "experiments";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Payments table (20260620000000) ──
      payments: {
        Row: {
          id: string;
          user_id: string;
          telegram_charge_id: string | null;
          payload: string;
          amount_stars: number | null;
          pack_id: string | null;
          plan_id: string | null;
          status: string;
          telegram_invoice_url: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          telegram_charge_id?: string | null;
          payload: string;
          amount_stars?: number | null;
          pack_id?: string | null;
          plan_id?: string | null;
          status?: string;
          telegram_invoice_url?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          telegram_charge_id?: string | null;
          payload?: string;
          amount_stars?: number | null;
          pack_id?: string | null;
          plan_id?: string | null;
          status?: string;
          telegram_invoice_url?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "point_packs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "premium_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Domain events table (20260612000000) ──
      domain_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // ── VIXOR AI Decisions table (20260624000000) ──
      vixor_decisions: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string;
          decision_type: string;
          title: string;
          description: string;
          data: Json | null;
          confidence: number | null;
          feedback: string | null;
          created_at: string;
          expires_at: string | null;
          workspace: string | null;
          token_symbol: string | null;
          chain: string | null;
          severity: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id: string;
          decision_type: string;
          title: string;
          description?: string;
          data?: Json | null;
          confidence?: number | null;
          feedback?: string | null;
          created_at?: string;
          expires_at?: string | null;
          workspace?: string | null;
          token_symbol?: string | null;
          chain?: string | null;
          severity?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string;
          decision_type?: string;
          title?: string;
          description?: string;
          data?: Json | null;
          confidence?: number | null;
          feedback?: string | null;
          created_at?: string;
          expires_at?: string | null;
          workspace?: string | null;
          token_symbol?: string | null;
          chain?: string | null;
          severity?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vixor_decisions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── User memories table (20260612010000) ──
      user_memories: {
        Row: {
          id: string;
          user_id: string;
          category: string | null;
          content: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category?: string | null;
          content: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string | null;
          content?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_memories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Backtest results table (20260803000000) ──
      backtest_results: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pair: string | null;
          timeframe: string | null;
          strategy_params: Json;
          total_trades: number | null;
          win_rate: number | null;
          total_pnl_pct: number | null;
          max_drawdown: number | null;
          sharpe_ratio: number | null;
          equity_curve: Json | null;
          trades_log: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          pair?: string | null;
          timeframe?: string | null;
          strategy_params?: Json;
          total_trades?: number | null;
          win_rate?: number | null;
          total_pnl_pct?: number | null;
          max_drawdown?: number | null;
          sharpe_ratio?: number | null;
          equity_curve?: Json | null;
          trades_log?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          pair?: string | null;
          timeframe?: string | null;
          strategy_params?: Json;
          total_trades?: number | null;
          win_rate?: number | null;
          total_pnl_pct?: number | null;
          max_drawdown?: number | null;
          sharpe_ratio?: number | null;
          equity_curve?: Json | null;
          trades_log?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "backtest_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      credit_points: {
        Args: {
          _amount: number;
          _meta?: Json;
          _reason: Database["public"]["Enums"]["points_reason"];
          _user: string;
        };
        Returns: number;
      };
      gen_referral_code: { Args: never; Returns: string };
      spend_points: {
        Args: {
          _amount: number;
          _meta?: Json;
          _reason: Database["public"]["Enums"]["points_reason"];
          _user: string;
        };
        Returns: number;
      };
    };
    Enums: {
      analysis_status: "queued" | "processing" | "complete" | "failed";
      signal_status:
        | "pending"
        | "active"
        | "tp1_hit"
        | "tp2_hit"
        | "tp3_hit"
        | "sl_hit"
        | "expired"
        | "cancelled";
      points_reason:
        | "signup_bonus"
        | "analysis_cost"
        | "pack_purchase"
        | "referral_bonus"
        | "daily_streak"
        | "premium_grant"
        | "admin_adjust"
        | "telegram_stars_purchase";
      recommendation_type: "BUY" | "SELL" | "WAIT";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

export type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
      signal_status: [
        "pending",
        "active",
        "tp1_hit",
        "tp2_hit",
        "tp3_hit",
        "sl_hit",
        "expired",
        "cancelled",
      ],
    },
  },
} as const;
