// ============================================================================
// VIXOR Gamification — XP & Level Calculation Engine
// ============================================================================

export type TierName = "bronze" | "silver" | "gold" | "platinum";

export interface LevelInfo {
  level: number;
  tier: TierName;
  title: string;
  xpRequired: number;
  xpToNext: number | null;
  progressPct: number;
}

export function calculateLevelFromXP(xp: number): LevelInfo {
  // Approximate level threshold formula matching the 100-level database seed
  let level = 1;
  let tier: TierName = "bronze";
  let title = "Scout";

  if (xp >= 650000) {
    level = 100;
    tier = "platinum";
    title = "MOXI Master";
    return { level, tier, title, xpRequired: 650000, xpToNext: null, progressPct: 100 };
  }

  // Level bands
  if (xp >= 254200) {
    tier = "platinum";
    title = "Apex";
    level = Math.min(99, Math.floor(76 + (xp - 254200) / 16000));
  } else if (xp >= 89200) {
    tier = "gold";
    title = "Sentinel";
    level = Math.floor(51 + (xp - 89200) / 6600);
  } else if (xp >= 19200) {
    tier = "silver";
    title = "Predator";
    level = Math.floor(26 + (xp - 19200) / 2800);
  } else {
    tier = "bronze";
    title = "Scout";
    level = Math.floor(1 + xp / 750);
  }

  level = Math.max(1, Math.min(100, level));
  const currentThreshold = (level - 1) * 6500;
  const nextThreshold = level * 6500;
  const range = nextThreshold - currentThreshold;
  const progressPct = Math.min(100, Math.max(0, Math.round(((xp - currentThreshold) / range) * 100)));

  return {
    level,
    tier,
    title,
    xpRequired: currentThreshold,
    xpToNext: range,
    progressPct,
  };
}
