import { describe, it, expect } from "vitest";
import {
  CHARACTER_REGISTRY,
  ACTIVE_CHARACTER_IDS,
  getCharacter,
  isActiveCharacter,
  isAllowedSurface,
  getAllActiveCharacters,
  type CharacterId,
  type CharacterRole,
} from "../../packages/vixor-gamification/src/characters/registry";

describe("Character Registry", () => {
  it("contains exactly four active characters", () => {
    expect(ACTIVE_CHARACTER_IDS).toHaveLength(4);
    expect(Object.keys(CHARACTER_REGISTRY)).toHaveLength(4);
  });

  it("uses stable machine IDs separate from display names", () => {
    const expectedIds: CharacterId[] = ["moxi", "mrVigo", "drDex", "echo"];
    for (const id of expectedIds) {
      expect(CHARACTER_REGISTRY[id]).toBeDefined();
      expect(CHARACTER_REGISTRY[id].id).toBe(id);
      expect(CHARACTER_REGISTRY[id].displayName).not.toBe(id);
    }
  });

  it("has unique character IDs", () => {
    const ids = Object.keys(CHARACTER_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("assigns correct roles to each character", () => {
    const roleMap: Record<CharacterId, CharacterRole> = {
      moxi: "main_guide",
      mrVigo: "investigator",
      drDex: "risk_analyst",
      echo: "memory_learning",
    };
    for (const [id, expectedRole] of Object.entries(roleMap)) {
      expect(CHARACTER_REGISTRY[id as CharacterId].role).toBe(expectedRole);
    }
  });

  it("has at least one allowed surface per character", () => {
    for (const id of ACTIVE_CHARACTER_IDS) {
      const def = CHARACTER_REGISTRY[id];
      expect(def.allowedSurfaces.length).toBeGreaterThan(0);
    }
  });

  it("restricts characters to their role-aligned surfaces", () => {
    expect(isAllowedSurface("moxi", "onboarding")).toBe(true);
    expect(isAllowedSurface("moxi", "discovery")).toBe(true);
    expect(isAllowedSurface("moxi", "guidance")).toBe(true);
    expect(isAllowedSurface("moxi", "risk_assessment")).toBe(false);

    expect(isAllowedSurface("mrVigo", "investigation")).toBe(true);
    expect(isAllowedSurface("mrVigo", "evidence")).toBe(true);
    expect(isAllowedSurface("mrVigo", "onboarding")).toBe(false);

    expect(isAllowedSurface("drDex", "risk_assessment")).toBe(true);
    expect(isAllowedSurface("drDex", "decision_review")).toBe(true);
    expect(isAllowedSurface("drDex", "evidence")).toBe(false);

    expect(isAllowedSurface("echo", "history")).toBe(true);
    expect(isAllowedSurface("echo", "outcome_review")).toBe(true);
    expect(isAllowedSurface("echo", "learning")).toBe(true);
    expect(isAllowedSurface("echo", "onboarding")).toBe(false);
  });

  it("getCharacter returns the correct definition for valid IDs", () => {
    const moxi = getCharacter("moxi");
    expect(moxi.displayName).toBe("MOXI");
    expect(moxi.role).toBe("main_guide");
  });

  it("getCharacter throws a clear error for unknown IDs", () => {
    expect(() => getCharacter("vix" as CharacterId)).toThrow("Unknown character id: vix");
    expect(() => getCharacter("sly" as CharacterId)).toThrow("Unknown character id: sly");
    expect(() => getCharacter("unknown" as CharacterId)).toThrow("Unknown character id: unknown");
  });

  it("does not treat VIX or SLY as active characters", () => {
    expect(isActiveCharacter("vix")).toBe(false);
    expect(isActiveCharacter("sly")).toBe(false);
    expect(isActiveCharacter("VIX")).toBe(false);
    expect(isActiveCharacter("SLY")).toBe(false);
  });

  it("isActiveCharacter returns true only for registered active IDs", () => {
    for (const id of ACTIVE_CHARACTER_IDS) {
      expect(isActiveCharacter(id)).toBe(true);
    }
    expect(isActiveCharacter("not-a-character")).toBe(false);
    expect(isActiveCharacter("")).toBe(false);
  });

  it("isAllowedSurface returns false for unknown character IDs", () => {
    expect(isAllowedSurface("vix" as CharacterId, "onboarding")).toBe(false);
  });

  it("getAllActiveCharacters returns exactly four characters", () => {
    const all = getAllActiveCharacters();
    expect(all).toHaveLength(4);
    expect(all.every((c) => c.active)).toBe(true);
  });

  it("display names are separate from machine IDs", () => {
    expect(CHARACTER_REGISTRY.moxi.displayName).toBe("MOXI");
    expect(CHARACTER_REGISTRY.mrVigo.displayName).toBe("MR.VIGO");
    expect(CHARACTER_REGISTRY.drDex.displayName).toBe("DR.DEX");
    expect(CHARACTER_REGISTRY.echo.displayName).toBe("ECHO");
  });

  it("tone arrays contain at least one descriptor per character", () => {
    for (const id of ACTIVE_CHARACTER_IDS) {
      expect(CHARACTER_REGISTRY[id].tone.length).toBeGreaterThan(0);
    }
  });
});
