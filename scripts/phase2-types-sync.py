#!/usr/bin/env python3
"""Phase 2: Generate missing table type definitions for supabase/types.ts"""

import re

TYPES_PATH = "/home/z/my-project/src/shared/supabase/types.ts"

with open(TYPES_PATH, "r") as f:
    content = f.read()

# ═══════════════════════════════════════════════════════════════════════
# FIX 1: Add 'invalidated' to signal_status enum type union
# ═══════════════════════════════════════════════════════════════════════
old_signal = '''      signal_status:
        | "pending"
        | "active"
        | "tp1_hit"
        | "tp2_hit"
        | "tp3_hit"
        | "sl_hit"
        | "expired"
        | "cancelled";'''

new_signal = '''      signal_status:
        | "pending"
        | "active"
        | "tp1_hit"
        | "tp2_hit"
        | "tp3_hit"
        | "sl_hit"
        | "invalidated"
        | "expired"
        | "cancelled";'''

if old_signal in content:
    content = content.replace(old_signal, new_signal)
    print("FIX 1: Added 'invalidated' to signal_status enum type")
else:
    print("FIX 1: signal_status enum already correct or not found")

# ═══════════════════════════════════════════════════════════════════════
# FIX 2: Add 18 missing table type definitions
# ═══════════════════════════════════════════════════════════════════════

MISSING_TABLES = '''
      // ── MOXI conversations (20260610020000 + 20260804000000 rename) ──
      moxi_conversations: {
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
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── MOXI messages (20260610020000 + 20260804000000 rename) ──
      moxi_messages: {
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
            referencedRelation: "moxi_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Wallet sessions (20260622000000) ──
      wallet_sessions: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          session_token: string;
          created_at: string;
          expires_at: string;
          ip_address: string;
          user_agent: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          session_token: string;
          created_at?: string;
          expires_at: string;
          ip_address?: string;
          user_agent?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          chain?: string;
          session_token?: string;
          created_at?: string;
          expires_at?: string;
          ip_address?: string;
          user_agent?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Web3 transactions (20260622000000) ──
      web3_transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          type: string;
          tx_signature: string | null;
          status: string;
          input_token: string | null;
          output_token: string | null;
          input_amount: number | null;
          output_amount: number | null;
          input_usd: number | null;
          output_usd: number | null;
          gas_paid: number | null;
          venue: string | null;
          metadata: Json | null;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          chain: string;
          type: string;
          tx_signature?: string | null;
          status?: string;
          input_token?: string | null;
          output_token?: string | null;
          input_amount?: number | null;
          output_amount?: number | null;
          input_usd?: number | null;
          output_usd?: number | null;
          gas_paid?: number | null;
          venue?: string | null;
          metadata?: Json | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          wallet_address?: string;
          chain?: string;
          type?: string;
          tx_signature?: string | null;
          status?: string;
          input_token?: string | null;
          output_token?: string | null;
          input_amount?: number | null;
          output_amount?: number | null;
          input_usd?: number | null;
          output_usd?: number | null;
          gas_paid?: number | null;
          venue?: string | null;
          metadata?: Json | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "web3_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── NFT badges (20260622000000) ──
      nft_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_type: string;
          chain: string;
          nft_mint: string | null;
          nft_name: string | null;
          nft_image_url: string | null;
          verified_at: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type: string;
          chain: string;
          nft_mint?: string | null;
          nft_name?: string | null;
          nft_image_url?: string | null;
          verified_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_type?: string;
          chain?: string;
          nft_mint?: string | null;
          nft_name?: string | null;
          nft_image_url?: string | null;
          verified_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nft_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Arbitrage opportunities (20260621000000) ──
      arbitrage_opportunities: {
        Row: {
          id: string;
          user_id: string | null;
          strategy: string;
          legs: Json;
          start_token: Json;
          end_token: Json;
          input_amount: number;
          expected_output: number;
          gross_profit_bps: number;
          net_profit_bps: number;
          estimated_gas_lamports: number;
          confidence: number;
          detected_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          strategy: string;
          legs: Json;
          start_token: Json;
          end_token: Json;
          input_amount: number;
          expected_output: number;
          gross_profit_bps: number;
          net_profit_bps: number;
          estimated_gas_lamports: number;
          confidence: number;
          detected_at?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          strategy?: string;
          legs?: Json;
          start_token?: Json;
          end_token?: Json;
          input_amount?: number;
          expected_output?: number;
          gross_profit_bps?: number;
          net_profit_bps?: number;
          estimated_gas_lamports?: number;
          confidence?: number;
          detected_at?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arbitrage_opportunities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Arbitrage executions (20260621000000) ──
      arbitrage_executions: {
        Row: {
          id: string;
          opportunity_id: string | null;
          user_id: string | null;
          success: boolean;
          dry_run: boolean;
          tx_signature: string | null;
          actual_output: number | null;
          profit_lamports: number | null;
          error: string | null;
          executed_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id?: string | null;
          user_id?: string | null;
          success: boolean;
          dry_run: boolean;
          tx_signature?: string | null;
          actual_output?: number | null;
          profit_lamports?: number | null;
          error?: string | null;
          executed_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string | null;
          user_id?: string | null;
          success?: boolean;
          dry_run?: boolean;
          tx_signature?: string | null;
          actual_output?: number | null;
          profit_lamports?: number | null;
          error?: string | null;
          executed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "arbitrage_executions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Arbitrage bot stats (20260621000000) ──
      arbitrage_bot_stats: {
        Row: {
          id: string;
          stat_date: string;
          mode: string;
          total_scans: number;
          opportunities_found: number;
          trades_executed: number;
          trades_succeeded: number;
          total_profit_lamports: number;
          consecutive_failures: number;
          circuit_breaker_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stat_date: string;
          mode: string;
          total_scans?: number;
          opportunities_found?: number;
          trades_executed?: number;
          trades_succeeded?: number;
          total_profit_lamports?: number;
          consecutive_failures?: number;
          circuit_breaker_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stat_date?: string;
          mode?: string;
          total_scans?: number;
          opportunities_found?: number;
          trades_executed?: number;
          trades_succeeded?: number;
          total_profit_lamports?: number;
          consecutive_failures?: number;
          circuit_breaker_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // ── Memecoin discoveries (20260623000000) ──
      memecoin_discoveries: {
        Row: {
          id: string;
          user_id: string | null;
          token_address: string;
          symbol: string;
          name: string;
          chain: string;
          price: number | null;
          change_24h: number | null;
          volume_24h: number | null;
          liquidity: number | null;
          market_cap: number | null;
          discovery_score: number;
          smart_money_score: number;
          social_score: number;
          liquidity_score: number;
          age_score: number;
          risk_level: string;
          nft_badge: string;
          raw_data: Json | null;
          scanned_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          token_address: string;
          symbol: string;
          name: string;
          chain: string;
          price?: number | null;
          change_24h?: number | null;
          volume_24h?: number | null;
          liquidity?: number | null;
          market_cap?: number | null;
          discovery_score?: number;
          smart_money_score?: number;
          social_score?: number;
          liquidity_score?: number;
          age_score?: number;
          risk_level?: string;
          nft_badge?: string;
          raw_data?: Json | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          token_address?: string;
          symbol?: string;
          name?: string;
          chain?: string;
          price?: number | null;
          change_24h?: number | null;
          volume_24h?: number | null;
          liquidity?: number | null;
          market_cap?: number | null;
          discovery_score?: number;
          smart_money_score?: number;
          social_score?: number;
          liquidity_score?: number;
          age_score?: number;
          risk_level?: string;
          nft_badge?: string;
          raw_data?: Json | null;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memecoin_discoveries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Social signals (20260623000000) ──
      social_signals: {
        Row: {
          id: string;
          token_symbol: string;
          source: string;
          mentions: number;
          sentiment: number | null;
          engagement: number;
          influencer_score: number;
          window_start: string;
          window_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_symbol: string;
          source: string;
          mentions?: number;
          sentiment?: number | null;
          engagement?: number;
          influencer_score?: number;
          window_start: string;
          window_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_symbol?: string;
          source?: string;
          mentions?: number;
          sentiment?: number | null;
          engagement?: number;
          influencer_score?: number;
          window_start?: string;
          window_end?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      // ── Pairs (20260624010000) ──
      pairs: {
        Row: {
          id: string;
          symbol: string;
          label: string;
          category: string;
          decimals: number;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          label: string;
          category: string;
          decimals?: number;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          label?: string;
          category?: string;
          decimals?: number;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // ── News cache (20260624010000) ──
      news_cache: {
        Row: {
          id: string;
          symbol: string | null;
          category: string;
          headline: string;
          summary: string | null;
          source: string | null;
          url: string | null;
          datetime: string | null;
          sentiment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol?: string | null;
          category?: string;
          headline: string;
          summary?: string | null;
          source?: string | null;
          url?: string | null;
          datetime?: string | null;
          sentiment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string | null;
          category?: string;
          headline?: string;
          summary?: string | null;
          source?: string | null;
          url?: string | null;
          datetime?: string | null;
          sentiment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // ── Price history (20260624010000) ──
      price_history: {
        Row: {
          id: string;
          pair: string;
          timeframe: string;
          timestamp: string;
          open: number | null;
          high: number | null;
          low: number | null;
          close: number | null;
          volume: number | null;
        };
        Insert: {
          id?: string;
          pair: string;
          timeframe: string;
          timestamp: string;
          open?: number | null;
          high?: number | null;
          low?: number | null;
          close?: number | null;
          volume?: number | null;
        };
        Update: {
          id?: string;
          pair?: string;
          timeframe?: string;
          timestamp?: string;
          open?: number | null;
          high?: number | null;
          low?: number | null;
          close?: number | null;
          volume?: number | null;
        };
        Relationships: [];
      };
      // ── Strategies (20260624010000) ──
      strategies: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          code: string;
          status: string;
          last_run_at: string | null;
          return_pct: number | null;
          sharpe: number | null;
          win_rate: number | null;
          trades_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          code: string;
          status?: string;
          last_run_at?: string | null;
          return_pct?: number | null;
          sharpe?: number | null;
          win_rate?: number | null;
          trades_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          code?: string;
          status?: string;
          last_run_at?: string | null;
          return_pct?: number | null;
          sharpe?: number | null;
          win_rate?: number | null;
          trades_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strategies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Paper trades (20260803000000) ──
      paper_trades: {
        Row: {
          id: string;
          user_id: string;
          pair: string;
          direction: string;
          entry_price: number;
          stop_loss: number | null;
          take_profit: number | null;
          size_pct: number | null;
          status: string;
          opened_at: string;
          closed_at: string | null;
          exit_price: number | null;
          pnl_pct: number | null;
          agent_confidence: number | null;
          debate_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pair: string;
          direction: string;
          entry_price: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          size_pct?: number | null;
          status?: string;
          opened_at?: string;
          closed_at?: string | null;
          exit_price?: number | null;
          pnl_pct?: number | null;
          agent_confidence?: number | null;
          debate_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pair?: string;
          direction?: string;
          entry_price?: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          size_pct?: number | null;
          status?: string;
          opened_at?: string;
          closed_at?: string | null;
          exit_price?: number | null;
          pnl_pct?: number | null;
          agent_confidence?: number | null;
          debate_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "paper_trades_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Charts (20260803000001) ──
      charts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pair: string | null;
          timeframe: string | null;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          pair?: string | null;
          timeframe?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          pair?: string | null;
          timeframe?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── MOXI personas (20260708000000) ──
      moxi_personas: {
        Row: {
          user_id: string;
          name: string;
          personality: string;
          expertise: Json;
          communication_style: string;
          avatar_variant: string;
          nft_token_id: string | null;
          is_customized: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name?: string;
          personality?: string;
          expertise?: Json;
          communication_style?: string;
          avatar_variant?: string;
          nft_token_id?: string | null;
          is_customized?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          personality?: string;
          expertise?: Json;
          communication_style?: string;
          avatar_variant?: string;
          nft_token_id?: string | null;
          is_customized?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moxi_personas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      // ── Broker connections (20260715000000) ──
      broker_connections: {
        Row: {
          id: string;
          user_id: string;
          broker_name: string;
          status: string;
          connected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          broker_name: string;
          status?: string;
          connected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          broker_name?: string;
          status?: string;
          connected_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broker_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
'''

# Insert before the closing of Tables section: the last table entry ends with };
# and then comes the closing }; of the Tables object.
# Find the backtest_results closing and the Tables closing
insert_marker = '''      };
    };
    Views: {'''

if insert_marker in content:
    content = content.replace(insert_marker, MISSING_TABLES.rstrip() + "\n      };\n    };\n    Views: {")
    print("FIX 2: Added 18 missing table type definitions")
else:
    print("FIX 2: Could not find insertion point!")

with open(TYPES_PATH, "w") as f:
    f.write(content)

print(f"Done. File size: {len(content)} chars")
