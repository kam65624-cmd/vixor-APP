// ============================================================================
// VIXOR — More-navigation localization bridge (v2 gap-cleanup)
// ============================================================================
//
// The "More" sheet data (moreNavCategories in app-shell/MorePanel.tsx) owns
// the canonical English strings and is shared by two renderers:
//   - app-shell/MorePanel.tsx
//   - layout/BottomNav/DynamicDock.tsx (internal More sheet)
//
// This bridge maps those canonical strings to i18n keys at render time so the
// data shape stays stable for every consumer. Routes are used as the identity
// for items (stable), while categories map by their canonical English title.
//
// Without an I18nProvider (isolated mounts, most tests) the identity fallback
// returns the canonical copy — the P0 contract: no provider, no drift.
//
// ============================================================================

import { useI18nSafe } from "./index";

/** Category title (canonical English) → i18n key. */
export const CATEGORY_KEYS: Record<string, string> = {
  "Market Intelligence": "nav.more.categories.market",
  "AI & Automation": "nav.more.categories.ai",
  Performance: "nav.more.categories.performance",
  Platform: "nav.more.categories.platform",
};

/** Item route (stable identity) → i18n key. */
export const ITEM_KEYS: Record<string, string> = {
  "/radar": "nav.more.items.radar",
  "/pulse": "nav.more.items.pulse",
  "/predictions": "nav.more.items.predictions",
  "/daily-loop": "nav.more.items.dailyLoop",
  "/backtest": "nav.more.items.strategyLab",
  "/vision": "nav.more.items.visionAi",
  "/trackers": "nav.more.items.trackers",
  "/pnl": "nav.more.items.pnl",
  "/journal": "nav.more.items.journal",
  "/settings": "nav.more.items.settings",
  "/profile": "nav.more.items.profile",
  "/premium": "nav.more.items.premium",
  "/rewards": "nav.more.items.rewards",
  "/referral": "nav.more.items.referral",
};

/** Bottom-dock item route (stable identity) → i18n key. */
export const DOCK_ITEM_KEYS: Record<string, string> = {
  "/": "nav.home",
  "/discover": "nav.discover",
  "/analyze": "nav.analyze",
  "/signals": "nav.signals",
  "/swap": "nav.swap",
  "/trade-desk": "nav.desk",
  "/alpha": "nav.alpha",
  "/portfolio": "nav.portfolio",
  "/charts": "nav.charts",
  "": "nav.moreButton",
};

export interface MoreNavStrings {
  /** Sheet header title. */
  explore: string;
  /** Items badge — "{count} items" with interpolation. */
  itemsCount: (count: number) => string;
  /** Localized category title; falls back to the canonical English title. */
  categoryTitle: (canonicalTitle: string) => string;
  /** Localized item label; falls back to the canonical English label. */
  itemLabel: (route: string, canonicalLabel: string) => string;
  /** Localized bottom-dock item label (dockItems share the same contract). */
  dockItemLabel: (route: string, canonicalLabel: string) => string;
  /** Dock "More" button aria-label. */
  moreNavAria: string;
  /** Dock nav landmark aria-label. */
  mainNavAria: string;
}

const FALLBACK: MoreNavStrings = {
  explore: "Explore",
  itemsCount: (count) => `${count} items`,
  categoryTitle: (title) => title,
  itemLabel: (_route, label) => label,
  dockItemLabel: (_route, label) => label,
  moreNavAria: "More navigation",
  mainNavAria: "Main navigation",
};

export function useMoreNavStrings(): MoreNavStrings {
  const i18n = useI18nSafe();
  if (!i18n) return FALLBACK;
  const { t } = i18n;
  return {
    explore: t("nav.more.explore"),
    itemsCount: (count) => t("nav.more.itemsCount", { count }),
    categoryTitle: (title) => {
      const key = CATEGORY_KEYS[title];
      return key ? t(key) : title;
    },
    itemLabel: (route, label) => {
      const key = ITEM_KEYS[route];
      return key ? t(key) : label;
    },
    dockItemLabel: (route, label) => {
      const key = DOCK_ITEM_KEYS[route];
      return key ? t(key) : label;
    },
    moreNavAria: t("nav.moreNavAria"),
    mainNavAria: t("nav.mainNavAria"),
  };
}
