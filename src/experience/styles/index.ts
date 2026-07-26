// ── Platform-specific Experience Styles ─────────────────────────────────
// These files define workspace themes for external platforms (Axiom, BullX, OpenSea).
// They use their own token namespace (--ws-*) intentionally, as each platform
// has a distinct brand identity that should NOT override VIXOR's main design tokens.
// If integrating a new platform, create a new file here following the same pattern.
// ────────────────────────────────────────────────────────────────────────────
// ============================================================================
// VIXOR Experience — Design Tokens Barrel Export
// ============================================================================

export type { StyleTokens, WorkspaceStyle } from "./types";
export { bullxTokens } from "./bullx";
export { axiomTokens } from "./axiom";
export { openseaTokens } from "./opensea";

/** Map of all workspace styles by ID */
import { bullxTokens } from "./bullx";
import { axiomTokens } from "./axiom";
import { openseaTokens } from "./opensea";
import type { WorkspaceStyle, StyleTokens } from "./types";

export const WORKSPACE_STYLES: Record<WorkspaceStyle, StyleTokens> = {
  os: bullxTokens, // OS workspace uses Bloomberg style (not a separate token set)
  bullx: bullxTokens,
  axiom: axiomTokens,
  opensea: openseaTokens,
} as const;

/** Get style tokens for a given workspace */
export function getStyleTokens(style: WorkspaceStyle): StyleTokens {
  return WORKSPACE_STYLES[style] ?? bullxTokens;
}
