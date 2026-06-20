import type { ArbitrageConfig } from "../config";
import type { ExchangeClient } from "./types";
import { createJupiterClient } from "./jupiter.client";
import { createAxiomClient } from "./axiom.client";
import { createMockDexClients } from "../mock/dex-clients";
import { PriceFeed } from "../price-feed";

export function createExchangeClients(
  config: ArbitrageConfig,
  priceFeed: PriceFeed,
): ExchangeClient[] {
  const clients: ExchangeClient[] = [
    createJupiterClient(config.jupiterQuoteUrl, config.mode, priceFeed),
    createAxiomClient(config.axiomApiUrl, config.axiomApiKey, config.mode, priceFeed),
  ];

  if (config.mode === "mock") {
    clients.push(...createMockDexClients(priceFeed));
  }

  return clients;
}

export type { ExchangeClient };
