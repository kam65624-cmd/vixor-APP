// ============================================================================
// MOXI — Persona System
// ============================================================================
//
// Manages MOXI's personality configuration per user.
// Users can customize MOXI's name, communication style, and avatar variant.
// The default persona is used until the user customizes.
//
// Storage: `moxi_personas` table (user_id PK)
// Fallback: DEFAULT_MOXI_PERSONA from types.ts
// ============================================================================

import { DEFAULT_MOXI_PERSONA, type MoxiPersona, type MoxiAvatarVariant } from "./types";

// ── Avatar Variant Config ────────────────────────────────────────────────────

export interface AvatarVariantConfig {
  /** Gradient colors for the avatar background */
  gradient: [string, string];
  /** Emoji or symbol shown in the avatar */
  symbol: string;
  /** Label for UI display */
  label: string;
  /** Description of the variant's vibe */
  description: string;
}

/** All available avatar variants with their visual config */
export const AVATAR_VARIANTS: Record<MoxiAvatarVariant, AvatarVariantConfig> = {
  default: {
    gradient: ["#0ECE81", "#06B6D4"],
    symbol: "M",
    label: "Default",
    description: "Classic MOXI — balanced and sharp",
  },
  bull: {
    gradient: ["#22C55E", "#16A34A"],
    symbol: "B",
    label: "Bull Mode",
    description: "Optimistic, momentum-focused MOXI",
  },
  bear: {
    gradient: ["#EF4444", "#DC2626"],
    symbol: "B",
    label: "Bear Mode",
    description: "Cautious, protection-focused MOXI",
  },
  crystal: {
    gradient: ["#A78BFA", "#7C3AED"],
    symbol: "C",
    label: "Crystal",
    description: "Analytical, data-crystal MOXI",
  },
  flame: {
    gradient: ["#F97316", "#EF4444"],
    symbol: "F",
    label: "Flame",
    description: "Aggressive, high-energy MOXI",
  },
  ocean: {
    gradient: ["#06B6D4", "#3B82F6"],
    symbol: "O",
    label: "Ocean",
    description: "Calm, deep-analysis MOXI",
  },
  phantom: {
    gradient: ["#6B7280", "#374151"],
    symbol: "P",
    label: "Phantom",
    description: "Stealth, low-key MOXI",
  },
  nova: {
    gradient: ["#F59E0B", "#EF4444"],
    symbol: "N",
    label: "Nova",
    description: "Explosive, opportunity-hunter MOXI",
  },
};

// ── Persona CRUD ────────────────────────────────────────────────────────────

/**
 * Get the user's MOXI persona. Falls back to DEFAULT_MOXI_PERSONA.
 * Server-only — requires a supabase client.
 */
export async function getMoxiPersona(userId: string, supabase: any): Promise<MoxiPersona> {
  try {
    const { data } = await supabase
      .from("moxi_personas")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return { ...DEFAULT_MOXI_PERSONA, userId };

    return {
      name: data.name || DEFAULT_MOXI_PERSONA.name,
      personality: data.personality || DEFAULT_MOXI_PERSONA.personality,
      expertise: data.expertise || DEFAULT_MOXI_PERSONA.expertise,
      communicationStyle: data.communication_style || DEFAULT_MOXI_PERSONA.communicationStyle,
      avatarVariant: data.avatar_variant || DEFAULT_MOXI_PERSONA.avatarVariant,
      nftTokenId: data.nft_token_id || undefined,
      userId: data.user_id,
      isCustomized: data.is_customized ?? false,
    };
  } catch {
    return { ...DEFAULT_MOXI_PERSONA, userId };
  }
}

/**
 * Update the user's MOXI persona. Uses upsert.
 * Server-only — requires a supabase client.
 */
export async function updateMoxiPersona(
  userId: string,
  supabase: any,
  updates: Partial<
    Pick<MoxiPersona, "name" | "personality" | "communicationStyle" | "avatarVariant">
  >,
): Promise<MoxiPersona> {
  const dbRow: Record<string, unknown> = {
    user_id: userId,
    is_customized: true,
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbRow.name = updates.name;
  if (updates.personality !== undefined) dbRow.personality = updates.personality;
  if (updates.communicationStyle !== undefined)
    dbRow.communication_style = updates.communicationStyle;
  if (updates.avatarVariant !== undefined) dbRow.avatar_variant = updates.avatarVariant;

  await supabase.from("moxi_personas").upsert(dbRow, { onConflict: "user_id" });

  return getMoxiPersona(userId, supabase);
}
