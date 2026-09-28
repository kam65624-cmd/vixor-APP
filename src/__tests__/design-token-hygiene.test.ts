// ============================================================================
// VIXOR — Design-token hygiene tests (v2 gap-cleanup)
// ============================================================================
//
// Guards the D14 token contract in src/styles.css:
//   1. The ONLY character-named tokens allowed are the official registry's
//      four (--char-moxi / --char-vigo / --char-dex / --char-echo). This is
//      the tombstone of the legacy --char-vix / --char-sly naming, which
//      implied characters that do not exist in the registry.
//   2. Every character in the registry bridge has its base token defined.
//   3. Page-domain accents live under the --accent-* namespace
//      (--accent-hunt for /hunt/*, --accent-shield for /shield/*).
//
// ============================================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getCharacterPresentation, type CharacterId } from "@/shared/characters";

const CSS_PATH = join(process.cwd(), "src", "styles.css");
const css = readFileSync(CSS_PATH, "utf8");

const CANONICAL_IDS: CharacterId[] = ["moxi", "mrVigo", "drDex", "echo"];
const CANONICAL_TOKENS = ["--char-moxi", "--char-vigo", "--char-dex", "--char-echo"];

describe("styles.css character-token hygiene", () => {
  it("defines character tokens for the official registry only", () => {
    const defs = [...css.matchAll(/(--char-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
    expect(defs.length).toBeGreaterThan(0);
    for (const def of defs) {
      const allowed = CANONICAL_TOKENS.some((t) => def === t || def.startsWith(`${t}-`));
      expect(
        allowed,
        `non-canonical character token "${def}" — use --accent-* for page domains`,
      ).toBe(true);
    }
  });

  it("every registry character has its base token defined", () => {
    for (const id of CANONICAL_IDS) {
      const char = getCharacterPresentation(id);
      expect(css).toContain(`--char-${char.token}:`);
    }
  });

  it("domain accents are defined under the --accent-* namespace", () => {
    expect(css).toContain("--accent-hunt:");
    expect(css).toContain("--accent-shield:");
  });

  it("no legacy --char-vix / --char-sly tokens survive anywhere in styles.css", () => {
    expect(css).not.toMatch(/--char-(vix|sly)\b/);
  });
});
