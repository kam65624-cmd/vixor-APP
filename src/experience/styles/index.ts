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
