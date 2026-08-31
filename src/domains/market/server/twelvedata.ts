// ============================================================================
// Vixor Twelve Data API Client — Full Integration
// ============================================================================
//
// Integrates all Twelve Data endpoints:
//   - Exchange Rate (1 credit) — Real-time forex/crypto rates
//   - Currency Conversion (1 credit) — Convert amounts between currencies
//   - Time Series (1 credit) — OHLCV candle data (existing)
//   - ETFs Directory (1 credit) — Browse ETFs
//   - ETF Full Data (800 credits) — Detailed ETF analysis
//   - ETF Performance (200 credits) — ETF trailing/annual returns
//   - ETF Summary (200 credits) — ETF overview
//   - Cash Flow (100 credits) — Company cash flow statements
//   - Earnings Estimate (20 credits) — Analyst EPS projections
//   - EPS Trend (20 credits) — Historical EPS progression
//   - Growth Estimates (20 credits) — Consensus growth projections
//
// All endpoints use TWELVEDATA_API_KEY from environment.
// ============================================================================

const BASE_URL = "https://api.twelvedata.com";

function getApiKey(): string {
  return process.env.TWELVEDATA_API_KEY || "";
}

function isConfigured(): boolean {
  const key = getApiKey();
  return !!key && key !== "" && key !== "demo";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExchangeRateResult {
  symbol: string;
  rate: number;
  timestamp: number;
}

export interface CurrencyConversionResult {
  symbol: string;
  rate: number;
  amount: number;
  timestamp: number;
}

export interface ETFListItem {
  symbol: string;
  name: string;
  country: string;
  mic_code: string;
  fund_family: string;
  fund_type: string;
}

export interface ETFsDirectoryResult {
  count: number;
  list: ETFListItem[];
}

export interface ETFSummary {
  symbol: string;
  name: string;
  fund_family: string;
  fund_type: string;
  currency: string;
  share_class_inception_date: string;
  ytd_return: number;
  expense_ratio_net: number;
  yield: number;
  nav: number;
  last_price: number;
  turnover_rate: number;
  net_assets: number;
  overview: string;
}

export interface ETFPerformance {
  trailing_returns: Array<{
    period: string;
    share_class_return: number;
    category_return: number;
  }>;
  annual_total_returns: Array<{
    year: number;
    share_class_return: number;
    category_return: number;
  }>;
}

export interface ETFFullData {
  summary: ETFSummary;
  performance: ETFPerformance;
  risk: {
    volatility_measures: Array<{
      period: string;
      alpha: number;
      beta: number;
      mean_annual_return: number;
      r_squared: number;
      std: number;
      sharpe_ratio: number;
      treynor_ratio: number;
    }>;
    valuation_metrics: {
      price_to_earnings: number;
      price_to_book: number;
      price_to_sales: number;
      price_to_cashflow: number;
    };
  };
  composition: {
    major_market_sectors: Array<{ sector: string; weight: number }>;
    country_allocation: Array<{ country: string; allocation: number }>;
    asset_allocation: {
      cash: number;
      stocks: number;
      preferred_stocks: number;
      convertables: number;
      bonds: number;
      others: number;
    };
    top_holdings: Array<{
      symbol: string;
      name: string;
      exchange: string;
      mic_code: string;
      weight: number;
    }>;
  };
}

export interface CashFlowStatement {
  fiscal_date: string;
  quarter?: string;
  year: number;
  operating_activities: {
    net_income: number;
    depreciation: number;
    deferred_taxes: number;
    stock_based_compensation: number;
    other_non_cash_items: number;
    accounts_receivable: number;
    accounts_payable: number;
    other_assets_liabilities: number;
    operating_cash_flow: number;
  };
  investing_activities: {
    capital_expenditures: number;
    net_intangibles: number;
    net_acquisitions: number;
    purchase_of_investments: number;
    sale_of_investments: number;
    other_investing_activity: number;
    investing_cash_flow: number;
  };
  financing_activities: {
    long_term_debt_issuance: number;
    long_term_debt_payments: number;
    short_term_debt_issuance: number;
    common_stock_issuance: number;
    common_stock_repurchase: number;
    common_dividends: number;
    other_financing_charges: number;
    financing_cash_flow: number;
  };
  end_cash_position: number;
  income_tax_paid: number;
  interest_paid: number;
  free_cash_flow: number;
}

export interface CashFlowResult {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
    period: string;
  };
  cash_flow: CashFlowStatement[];
}

export interface EarningsEstimateItem {
  date: string;
  period: string;
  number_of_analysts: number;
  avg_estimate: number;
  low_estimate: number;
  high_estimate: number;
  year_ago_eps: number;
}

export interface EarningsEstimateResult {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  earnings_estimate: EarningsEstimateItem[];
}

export interface EPSTrendItem {
  date: string;
  period: string;
  current_estimate: number;
  "7_days_ago": number;
  "30_days_ago": number;
  "60_days_ago": number;
  "90_days_ago": number;
}

export interface EPSTrendResult {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  eps_trend: EPSTrendItem[];
}

export interface GrowthEstimatesResult {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  growth_estimates: {
    current_quarter: number;
    next_quarter: number;
    current_year: number;
    next_year: number;
    next_5_years_pa: number;
    past_5_years_pa: number;
  };
}

// ---------------------------------------------------------------------------
// Generic fetch helper
// ---------------------------------------------------------------------------

async function tdFetch<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  if (!isConfigured()) return null;

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("apikey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.warn(`[TwelveData] ${endpoint} returned ${res.status}`);
      return null;
    }
    const data = await res.json();

    // TwelveData returns { status: "error", message: "..." } on failures
    if (data.status === "error") {
      console.warn(`[TwelveData] ${endpoint} error: ${data.message}`);
      return null;
    }

    return data as T;
  } catch (err) {
    console.warn(
      `[TwelveData] ${endpoint} fetch failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Exchange Rate — 1 credit/symbol
// ---------------------------------------------------------------------------

export async function fetchExchangeRate(symbol: string): Promise<ExchangeRateResult | null> {
  const data = await tdFetch<{ symbol: string; rate: number; timestamp: number }>(
    "/exchange_rate",
    { symbol },
  );
  if (!data || !data.rate) return null;
  return data;
}

/**
 * Fetch exchange rates for multiple pairs in parallel.
 * Returns a map of pair → rate for quick lookup.
 */
export async function fetchExchangeRates(pairs: string[]): Promise<Record<string, number>> {
  const results = await Promise.allSettled(
    pairs.map(async (pair) => {
      const result = await fetchExchangeRate(pair);
      return { pair, rate: result?.rate ?? 0 };
    }),
  );

  const map: Record<string, number> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.rate > 0) {
      map[r.value.pair] = r.value.rate;
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Currency Conversion — 1 credit/symbol
// ---------------------------------------------------------------------------

export async function convertCurrency(
  symbol: string,
  amount: number,
): Promise<CurrencyConversionResult | null> {
  const data = await tdFetch<{ symbol: string; rate: number; amount: number; timestamp: number }>(
    "/currency_conversion",
    { symbol, amount: String(amount) },
  );
  if (!data || !data.rate) return null;
  return data;
}

// ---------------------------------------------------------------------------
// ETFs Directory — 1 credit/request
// ---------------------------------------------------------------------------

export async function fetchETFsDirectory(params?: {
  symbol?: string;
  country?: string;
  fund_family?: string;
  fund_type?: string;
  page?: number;
  outputsize?: number;
}): Promise<ETFsDirectoryResult | null> {
  const p: Record<string, string> = {};
  if (params?.symbol) p.symbol = params.symbol;
  if (params?.country) p.country = params.country;
  if (params?.fund_family) p.fund_family = params.fund_family;
  if (params?.fund_type) p.fund_type = params.fund_type;
  if (params?.page) p.page = String(params.page);
  if (params?.outputsize) p.outputsize = String(params.outputsize);

  const data = await tdFetch<{
    result: { count: number; list: ETFListItem[] };
    status: string;
  }>("/etfs/list", p);

  if (!data?.result) return null;
  return data.result;
}

// ---------------------------------------------------------------------------
// ETF Full Data — 800 credits/request
// ---------------------------------------------------------------------------

export async function fetchETFFullData(symbol: string): Promise<ETFFullData | null> {
  const data = await tdFetch<{ etf: ETFFullData; status: string }>("/etfs/world", { symbol });
  return data?.etf ?? null;
}

// ---------------------------------------------------------------------------
// ETF Performance — 200 credits/request
// ---------------------------------------------------------------------------

export async function fetchETFPerformance(symbol: string): Promise<ETFPerformance | null> {
  const data = await tdFetch<{ etf: { performance: ETFPerformance }; status: string }>(
    "/etfs/world/performance",
    { symbol },
  );
  return data?.etf?.performance ?? null;
}

// ---------------------------------------------------------------------------
// ETF Summary — 200 credits/request
// ---------------------------------------------------------------------------

export async function fetchETFSummary(symbol: string): Promise<ETFSummary | null> {
  const data = await tdFetch<{ etf: { summary: ETFSummary }; status: string }>(
    "/etfs/world/summary",
    { symbol },
  );
  return data?.etf?.summary ?? null;
}

// ---------------------------------------------------------------------------
// Cash Flow — 100 credits/symbol
// ---------------------------------------------------------------------------

export async function fetchCashFlow(params: {
  symbol: string;
  period?: "annual" | "quarterly";
  start_date?: string;
  end_date?: string;
  outputsize?: number;
}): Promise<CashFlowResult | null> {
  const p: Record<string, string> = { symbol: params.symbol };
  if (params.period) p.period = params.period;
  if (params.start_date) p.start_date = params.start_date;
  if (params.end_date) p.end_date = params.end_date;
  if (params.outputsize) p.outputsize = String(params.outputsize);

  return tdFetch<CashFlowResult>("/cash_flow", p);
}

// ---------------------------------------------------------------------------
// Earnings Estimate — 20 credits/symbol
// ---------------------------------------------------------------------------

export async function fetchEarningsEstimate(
  symbol: string,
): Promise<EarningsEstimateResult | null> {
  return tdFetch<EarningsEstimateResult>("/earnings_estimate", { symbol });
}

// ---------------------------------------------------------------------------
// EPS Trend — 20 credits/symbol
// ---------------------------------------------------------------------------

export async function fetchEPSTrend(symbol: string): Promise<EPSTrendResult | null> {
  return tdFetch<EPSTrendResult>("/eps_trend", { symbol });
}

// ---------------------------------------------------------------------------
// Growth Estimates — 20 credits/symbol
// ---------------------------------------------------------------------------

export async function fetchGrowthEstimates(symbol: string): Promise<GrowthEstimatesResult | null> {
  return tdFetch<GrowthEstimatesResult>("/growth_estimates", { symbol });
}

// ---------------------------------------------------------------------------
// Combined fundamental data for a stock symbol
// ---------------------------------------------------------------------------

export interface StockFundamentals {
  cash_flow: CashFlowResult | null;
  earnings_estimate: EarningsEstimateResult | null;
  eps_trend: EPSTrendResult | null;
  growth_estimates: GrowthEstimatesResult | null;
}

export async function fetchStockFundamentals(symbol: string): Promise<StockFundamentals> {
  const [cashFlow, earningsEstimate, epsTrend, growthEstimates] = await Promise.all([
    fetchCashFlow({ symbol, period: "quarterly", outputsize: 4 }),
    fetchEarningsEstimate(symbol),
    fetchEPSTrend(symbol),
    fetchGrowthEstimates(symbol),
  ]);

  return {
    cash_flow: cashFlow,
    earnings_estimate: earningsEstimate,
    eps_trend: epsTrend,
    growth_estimates: growthEstimates,
  };
}
