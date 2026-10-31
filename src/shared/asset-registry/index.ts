// ============================================================================
// VIXOR Asset Registry — Public API
// ============================================================================

import { AssetRegistry } from "./types";

export { AssetRegistry, POPULAR_PAIRS, ALL_KNOWN_PAIRS, PAIR_CONFIGS, TIMEFRAMES } from "./types";

export type {
  AssetDefinition,
  AssetCategory,
  AssetConfig,
  AssetSymbolMappings,
  TimeframeDefinition,
} from "./types";

/**
 * Stage 1 scope boundary (TASK 37): re-exported so every entry point can
 * enforce the Crypto-only product boundary through one shared guard.
 * See AssetRegistry.assertCryptoPair for the exact contract.
 */
export const assertCryptoPair = (pair: string) => AssetRegistry.assertCryptoPair(pair);
