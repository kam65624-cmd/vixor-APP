import type { User, Session } from "@supabase/supabase-js";

export type AuthProductType = "hunt" | "shield" | "trade";

export interface VixorUserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  telegram_id: number | null;
  xp: number;
  current_level: number;
  current_tier: "bronze" | "silver" | "gold" | "platinum";
  level_title: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthConfig {
  productName: string;
  productBadge: string;
  tagline: string;
  features: Array<{
    title: string;
    description: string;
    iconName: string;
  }>;
}

export type { User as SupabaseUser, Session as SupabaseSession };
