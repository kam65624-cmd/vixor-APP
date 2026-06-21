import type { ArbitrageStrategy } from "./base";
import { CrossDexStrategy } from "./cross-dex";
import { TriangularStrategy } from "./triangular";
import { CexDexStrategy } from "./cex-dex";

export function createStrategies(): ArbitrageStrategy[] {
  return [new CrossDexStrategy(), new TriangularStrategy(), new CexDexStrategy()];
}

export { CrossDexStrategy, TriangularStrategy, CexDexStrategy };
export type { ArbitrageStrategy };
