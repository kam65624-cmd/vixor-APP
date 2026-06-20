// ============================================================================
// VIXOR Arbitrage Domain — Public API
// ============================================================================
//
// Ported from axiom-arbitrage-trading-bot. Provides:
//   - Cross-DEX arbitrage (buy on venue A, sell on venue B)
//   - Triangular arbitrage (A → B → C → A cycles)
//   - CEX-DEX arbitrage (CEX mid vs DEX quotes)
//   - Risk management (min profit, max slippage, daily limits)
//   - Dry-run execution by default (safe)
//
// Usage:
//   import { createArbitrageEngine } from "@/domains/arbitrage";
//   const engine = await createArbitrageEngine();
//   const result = await engine.scanOnce();
//
// Safety:
//   - DRY_RUN=true by default
//   - EXECUTION_ENABLED=false by default
//   - No live trades unless explicitly enabled in env
// ============================================================================

export type {
  ArbitrageOpportunity,
  ArbitrageLeg,
  BotStats,
  ExecutionResult,
  ScanResult,
  RejectedOpportunity,
  StrategyContext,
  TokenInfo,
  QuoteRequest,
  QuoteResult,
  BotMode,
  DexVenue,
  StrategyKind,
  PriceSnapshot,
} from "./types";

export { ArbitrageEngine } from "./engine";
export { CrossDexStrategy } from "./strategies/cross-dex";
export { TriangularStrategy } from "./strategies/triangular";
export { CexDexStrategy } from "./strategies/cex-dex";
export { BaseStrategy } from "./strategies/base";
export { createStrategies } from "./strategies/index";

export { JupiterClient, MockJupiterClient, createJupiterClient } from "./exchanges/jupiter.client";
export { AxiomClient, MockAxiomClient, createAxiomClient } from "./exchanges/axiom.client";
export type { ExchangeClient } from "./exchanges/types";
export { createExchangeClients } from "./exchanges/index";

export { TradeExecutor } from "./executor";
export { PriceFeed } from "./price-feed";
export { resolveTokens, SOL_MINT, USDC_MINT } from "./token-registry";
export { loadArbitrageConfig, type ArbitrageConfig } from "./config";
export { logger as arbitrageLogger } from "./logger";

// Convenience factory
export async function createArbitrageEngine() {
  const { loadArbitrageConfig } = await import("./config");
  const { createStrategies } = await import("./strategies/index");
  const { createExchangeClients } = await import("./exchanges/index");
  const { ArbitrageEngine } = await import("./engine");
  const { PriceFeed } = await import("./price-feed");
  const { RiskManager, CircuitBreaker } = await import("./risk");
  const { TradeExecutor } = await import("./executor");

  const config = loadArbitrageConfig();
  const priceFeed = new PriceFeed(config.mode);
  const clients = createExchangeClients(config, priceFeed);
  const strategies = createStrategies();
  const riskManager = new RiskManager(config);
  const circuitBreaker = new CircuitBreaker(config.maxConsecutiveFailures);
  const executor = new TradeExecutor(config);

  return new ArbitrageEngine(
    config,
    strategies,
    clients,
    priceFeed,
    riskManager,
    circuitBreaker,
    executor,
  );
}
