// ============================================================================
// VIXOR Experience — Design Tokens
// ============================================================================
//
// Three visual styles for the Web3 Terminal workspace:
//   1. BullX Terminal — Dark trading terminal with green accent
//   2. Axiom Grid — Deep navy with blue accent
//   3. OpenSea Collection — Dark slate with cyan accent
//
// Each style defines its own palette that can be applied to any page
// component via CSS custom properties or Tailwind classes.
//
// Usage:
//   import { bullxTokens } from "@/experience/styles/bullx";
//   <div style={bullxTokens.cssVars}>...</div>
// ============================================================================

/** Base design token interface shared by all styles */
export interface StyleTokens {
  /** Style identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** CSS custom property declarations (inline style object) */
  readonly cssVars: React.CSSProperties;
  /** Primary accent color (hex) */
  readonly accent: string;
  /** Background color (hex) */
  readonly background: string;
  /** Card/surface color (hex) */
  readonly surface: string;
  /** Text/foreground color (hex) */
  readonly foreground: string;
  /** Border color (hex or rgba) */
  readonly border: string;
  /** Font family override */
  readonly fontFamily: string;
  /** Mono font family override */
  readonly monoFontFamily: string;
  /** Border radius scale */
  readonly radius: string;
}

export type WorkspaceStyle = "os" | "bullx" | "axiom" | "opensea";
