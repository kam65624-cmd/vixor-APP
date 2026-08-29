// ============================================================================
// VIXOR Persona Config — Skins & Character System Config
// ============================================================================

export type ProductSkinKey = "hunt" | "shield" | "trade";

export interface ProductSkinConfig {
  key: ProductSkinKey;
  title: string;
  tagline: string;
  accentColor: string;
  badgeLabel: string;
  characterName: string;
  characterTitle: string;
  characterRole: string;
  themeClass: string;
}

export const PRODUCT_SKINS: Record<ProductSkinKey, ProductSkinConfig> = {
  hunt: {
    key: "hunt",
    title: "HUNT",
    tagline: "Token Discovery & Smart Money Radar",
    accentColor: "#22D3A6",
    badgeLabel: "TARGET FEED",
    characterName: "MOXI",
    characterTitle: "Quest Companion",
    characterRole: "Guides token discoveries and assigns daily missions",
    themeClass: "skin-hunt",
  },
  shield: {
    key: "shield",
    title: "SHIELD",
    tagline: "Protection & Forensics Engine",
    accentColor: "#7C3AED",
    badgeLabel: "CASE VERDICT",
    characterName: "The Guardian",
    characterTitle: "Web3 Security Inspector",
    characterRole: "Evaluates contract safety, detects rug pull risks, and builds evidence cases",
    themeClass: "skin-shield",
  },
  trade: {
    key: "trade",
    title: "TRADE",
    tagline: "Chart Intelligence & Execution",
    accentColor: "#6366F1",
    badgeLabel: "TRADE DESK",
    characterName: "Strategist",
    characterTitle: "Market Tactician",
    characterRole: "Monitors market structure, SMC setups, and position sizing",
    themeClass: "skin-trade",
  },
};
