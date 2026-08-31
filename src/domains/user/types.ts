// ============================================================================
// User Domain — Types
// ============================================================================

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  xp: number;
  referral_code: string | null;
  referred_by: string | null;
  telegram_id: string | null;
  telegram_username: string | null;
  telegram_photo_url: string | null;
  created_at: string;
}

export interface PointsBalance {
  user_id: string;
  balance: number;
  lifetime_earned: number;
}

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  premium_plans?: any;
}

export interface UserMeResult {
  profile: UserProfile | null;
  balance: PointsBalance;
  premium: PremiumSubscription | null;
  isPremium: boolean;
}

export interface PointPack {
  id: string;
  name: string;
  points: number;
  bonus_points: number;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface PremiumPlan {
  id: string;
  name: string;
  interval: "month" | "year";
  price_cents: number;
  is_active: boolean;
  sort_order: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read_at: string | null;
  created_at: string;
}
