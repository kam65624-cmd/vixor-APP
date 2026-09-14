// ============================================================================
// VIXOR — Nav localization tests (v2 gap-cleanup)
// ============================================================================
//
// Guards three contracts for the "More" sheet + bottom dock localization:
//   1. Coverage  — every canonical string in the nav data (moreNavCategories,
//      dockItems) maps to an i18n key. Adding a nav entry without a
//      translation fails here instead of silently staying English.
//   2. Parity    — the en dictionary value for each mapped key equals the
//      canonical English string owned by the nav data.
//   3. Behavior  — useMoreNavStrings localizes under an Arabic provider and
//      falls back to the canonical copy without a provider (P0 contract).
//
// ============================================================================

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { moreNavCategories } from "@/components/vixor/app-shell/MorePanel";
import { dockItems } from "@/components/vixor/app-shell/BottomBar";
import { LanguageToggle } from "@/components/vixor/i18n/LanguageToggle";
import { I18nProvider, useI18n } from "@/shared/i18n";
import {
  CATEGORY_KEYS,
  DOCK_ITEM_KEYS,
  ITEM_KEYS,
  useMoreNavStrings,
  type MoreNavStrings,
} from "@/shared/i18n/nav-strings";
import { ensureTranslations, translate } from "@/shared/i18n/translations";

describe("nav i18n coverage ↔ canonical data (en)", () => {
  it("every More-sheet category title maps to a key whose en value matches", () => {
    for (const category of moreNavCategories) {
      const key = CATEGORY_KEYS[category.title];
      expect(key, `no i18n key for category "${category.title}"`).toBeTruthy();
      expect(translate("en", key as string)).toBe(category.title);
    }
  });

  it("every More-sheet item route maps to a key whose en value matches its label", () => {
    for (const category of moreNavCategories) {
      for (const item of category.items) {
        const key = ITEM_KEYS[item.to];
        expect(key, `no i18n key for item route "${item.to}"`).toBeTruthy();
        expect(translate("en", key as string)).toBe(item.label);
      }
    }
  });

  it("every dock item route maps to a key whose en value matches its label", () => {
    for (const item of dockItems) {
      const key = DOCK_ITEM_KEYS[item.to];
      expect(key, `no i18n key for dock route "${item.to}"`).toBeTruthy();
      expect(translate("en", key as string)).toBe(item.label);
    }
  });

  it("arabic dictionary carries Arabic script for all mapped keys (brand names excepted)", async () => {
    await ensureTranslations("ar");
    const keys = [
      ...Object.values(CATEGORY_KEYS),
      ...Object.values(ITEM_KEYS),
      ...Object.values(DOCK_ITEM_KEYS),
      "nav.more.explore",
      "nav.more.itemsCount",
      "nav.moreNavAria",
      "nav.mainNavAria",
    ];
    for (const key of keys) {
      const value = translate("ar", key);
      if (key === "nav.alpha") continue; // brand surface name stays latin (like character names)
      expect(value, `ar key "${key}" has no Arabic script`).toMatch(/[\u0600-\u06FF]/);
      expect(value).not.toBe(translate("en", key));
    }
  });
});

describe("useMoreNavStrings", () => {
  let captured: MoreNavStrings | null = null;
  let setLangRef: (lang: "en" | "ar") => void = () => {};

  function Probe() {
    captured = useMoreNavStrings();
    return null;
  }

  // Reaches into the provider to flip the language from the test.
  function LanguageProbe() {
    const { setLang } = useI18n();
    setLangRef = setLang;
    return null;
  }

  beforeEach(() => {
    captured = null;
    setLangRef = () => {};
    localStorage.removeItem("vixor-lang");
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem("vixor-lang");
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    document.documentElement.classList.remove("rtl");
  });

  it("without a provider it returns the canonical English copy verbatim", () => {
    render(<Probe />);
    expect(captured).not.toBeNull();
    expect(captured!.explore).toBe("Explore");
    expect(captured!.itemsCount(15)).toBe("15 items");
    expect(captured!.categoryTitle("Market Intelligence")).toBe("Market Intelligence");
    expect(captured!.itemLabel("/radar", "Radar")).toBe("Radar");
    // unknown routes fall through to the canonical label
    expect(captured!.itemLabel("/does-not-exist", "Fallback Label")).toBe("Fallback Label");
    expect(captured!.dockItemLabel("/", "Home")).toBe("Home");
    expect(captured!.moreNavAria).toBe("More navigation");
    expect(captured!.mainNavAria).toBe("Main navigation");
  });

  it("under an arabic provider it localizes categories, items, dock and count", async () => {
    render(
      <I18nProvider>
        <LanguageProbe />
        <Probe />
      </I18nProvider>,
    );

    await act(async () => {
      setLangRef("ar");
    });

    await waitFor(() => {
      expect(captured!.categoryTitle("Market Intelligence")).toBe("ذكاء السوق");
    });
    expect(captured!.categoryTitle("AI & Automation")).toBe("الذكاء والأتمتة");
    expect(captured!.itemLabel("/radar", "Radar")).toBe("الرادار");
    expect(captured!.dockItemLabel("/", "Home")).toBe("الرئيسية");
    expect(captured!.dockItemLabel("/swap", "Swap")).toBe("مبادلة");
    expect(captured!.itemsCount(15)).toBe("15 عنصر");
    expect(captured!.explore).toBe("استكشاف");
    expect(captured!.moreNavAria).toBe("قائمة المزيد");
    // unknown canonical input still falls through
    expect(captured!.itemLabel("/does-not-exist", "Fallback Label")).toBe("Fallback Label");
  });
});

describe("LanguageToggle group label", () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem("vixor-lang");
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    document.documentElement.classList.remove("rtl");
  });

  it("exposes an accessible group name that follows the active language", async () => {
    render(
      <I18nProvider>
        <LanguageToggle />
      </I18nProvider>,
    );

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    await waitFor(() => {
      expect(screen.getByRole("group", { name: "اللغة" })).toBeInTheDocument();
    });
  });
});
