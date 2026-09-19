// ============================================================================
// VIXOR — Character i18n tests (v2 P1)
// ============================================================================
//
// Guards two contracts:
//   1. Parity — the `characters` namespace in en.ts must mirror the canonical
//      copy owned by src/shared/characters.ts. If someone edits one side
//      without the other, these tests fail before the UI can drift.
//   2. Localization — with an I18nProvider mounted and language set to "ar",
//      CharacterGuide renders Arabic copy and the provider flips <html dir>
//      to rtl. Without a provider, the P0 fallback contract holds (existing
//      character-guide tests cover that side).
//
// ============================================================================

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CharacterGuide } from "@/components/characters/CharacterGuide";
import { CHARACTERS, getCharacterPresentation, type CharacterId } from "@/shared/characters";
import { I18nProvider, useI18n } from "@/shared/i18n";
import { translate, ensureTranslations } from "@/shared/i18n/translations";

const CHARACTER_IDS: CharacterId[] = ["moxi", "mrVigo", "drDex", "echo"];

describe("characters i18n namespace ↔ bridge parity (en)", () => {
  it("taglines, descriptions and surface labels match the bridge copy", () => {
    for (const id of CHARACTER_IDS) {
      const char = getCharacterPresentation(id);
      expect(translate("en", `characters.${id}.tagline`)).toBe(char.tagline);
      expect(translate("en", `characters.${id}.description`)).toBe(char.description);
      expect(translate("en", `characters.${id}.surfaceLabel`)).toBe(char.surfaceLabel);
    }
  });

  it("role labels match the bridge role mapping", () => {
    for (const char of CHARACTERS) {
      expect(translate("en", `characters.roles.${char.role}`)).toBe(char.roleLabel);
    }
  });

  it("Arabic dictionary carries the same keys with non-Latin copy", async () => {
    await ensureTranslations("ar");
    for (const id of CHARACTER_IDS) {
      const tagline = translate("ar", `characters.${id}.tagline`);
      expect(tagline).not.toBe(translate("en", `characters.${id}.tagline`));
      expect(tagline).toMatch(/[\u0600-\u06FF]/); // contains Arabic script
      expect(translate("ar", `characters.${id}.surfaceLabel`)).toMatch(/[\u0600-\u06FF]/);
    }
    expect(translate("ar", "characters.roles.main_guide")).toMatch(/[\u0600-\u06FF]/);
  });
});

describe("CharacterGuide under I18nProvider (ar)", () => {
  let setLangRef: (lang: "en" | "ar") => void = () => {};

  // Probe: reaches into the provider to flip the language from the test.
  function LanguageProbe() {
    const { setLang } = useI18n();
    setLangRef = setLang;
    return null;
  }

  beforeEach(() => {
    localStorage.removeItem("vixor-lang");
    setLangRef = () => {};
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem("vixor-lang");
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    document.documentElement.classList.remove("rtl");
  });

  it("renders Arabic tagline, role badge and aria-label after switching to ar", async () => {
    render(
      <I18nProvider>
        <LanguageProbe />
        <CharacterGuide character="moxi" />
      </I18nProvider>,
    );

    await act(async () => {
      setLangRef("ar");
    });

    await waitFor(() => {
      expect(screen.getByText("يكتشف الفرصة")).toBeInTheDocument(); // tagline
    });
    expect(screen.getByText("الاستكشاف")).toBeInTheDocument(); // role badge (main_guide)
    expect(screen.queryByText("افتح MOXI")).not.toBeInTheDocument(); // no CTA passed
    expect(screen.getByRole("region", { name: "دليل MOXI" })).toBeInTheDocument();
  });

  it("renders Arabic state messages and a translated retry button", async () => {
    render(
      <I18nProvider>
        <LanguageProbe />
        <CharacterGuide character="echo" state="error" onRetry={() => {}} />
      </I18nProvider>,
    );

    await act(async () => {
      setLangRef("ar");
    });

    const status = await waitFor(() => screen.getByRole("status"));
    expect(status).toHaveTextContent("حدث خطأ ما.");
    const retry = screen.getByRole("button", { name: "إعادة المحاولة" });
    expect(retry).toBeInTheDocument();
  });

  it("flips document direction to rtl while Arabic is active", async () => {
    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>,
    );

    expect(document.documentElement.dir).toBe("ltr");
    await act(async () => {
      setLangRef("ar");
    });
    await waitFor(() => {
      expect(document.documentElement.dir).toBe("rtl");
    });
    expect(document.documentElement.classList.contains("rtl")).toBe(true);
    expect(document.documentElement.lang).toBe("ar");
  });

  it("LanguageToggle switches the language on click", async () => {
    const { LanguageToggle } = await import("@/components/vixor/i18n/LanguageToggle");
    render(
      <I18nProvider>
        <LanguageToggle />
        <CharacterGuide character="drDex" compact />
      </I18nProvider>,
    );

    // English first (canonical bridge copy via en namespace)
    expect(screen.getByText("Quantifies the risk")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    await waitFor(() => {
      expect(screen.getByText("يحدّد حجم المخاطرة")).toBeInTheDocument();
    });
    // and the English tagline is gone
    expect(screen.queryByText("Quantifies the risk")).not.toBeInTheDocument();
  });
});
