const BASE_URL = "https://api.twelvedata.com";
function getApiKey() {
  return process.env.TWELVEDATA_API_KEY || "";
}
function isConfigured() {
  return !!getApiKey() && getApiKey() !== "";
}
async function tdFetch(endpoint, params) {
  if (!isConfigured()) return null;
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("apikey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15e3) });
    if (!res.ok) {
      console.warn(`[TwelveData] ${endpoint} returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.status === "error") {
      console.warn(`[TwelveData] ${endpoint} error: ${data.message}`);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[TwelveData] ${endpoint} fetch failed:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}
async function fetchExchangeRate(symbol) {
  const data = await tdFetch(
    "/exchange_rate",
    { symbol }
  );
  if (!data || !data.rate) return null;
  return data;
}
async function fetchExchangeRates(pairs) {
  const results = await Promise.allSettled(
    pairs.map(async (pair) => {
      const result = await fetchExchangeRate(pair);
      return { pair, rate: result?.rate ?? 0 };
    })
  );
  const map = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.rate > 0) {
      map[r.value.pair] = r.value.rate;
    }
  }
  return map;
}
async function convertCurrency(symbol, amount) {
  const data = await tdFetch(
    "/currency_conversion",
    { symbol, amount: String(amount) }
  );
  if (!data || !data.rate) return null;
  return data;
}
async function fetchETFsDirectory(params) {
  const p = {};
  if (params?.symbol) p.symbol = params.symbol;
  if (params?.country) p.country = params.country;
  if (params?.fund_family) p.fund_family = params.fund_family;
  if (params?.fund_type) p.fund_type = params.fund_type;
  if (params?.page) p.page = String(params.page);
  if (params?.outputsize) p.outputsize = String(params.outputsize);
  const data = await tdFetch("/etfs/list", p);
  if (!data?.result) return null;
  return data.result;
}
async function fetchETFFullData(symbol) {
  const data = await tdFetch("/etfs/world", { symbol });
  return data?.etf ?? null;
}
async function fetchETFPerformance(symbol) {
  const data = await tdFetch(
    "/etfs/world/performance",
    { symbol }
  );
  return data?.etf?.performance ?? null;
}
async function fetchETFSummary(symbol) {
  const data = await tdFetch(
    "/etfs/world/summary",
    { symbol }
  );
  return data?.etf?.summary ?? null;
}
async function fetchCashFlow(params) {
  const p = { symbol: params.symbol };
  if (params.period) p.period = params.period;
  if (params.start_date) p.start_date = params.start_date;
  if (params.end_date) p.end_date = params.end_date;
  if (params.outputsize) p.outputsize = String(params.outputsize);
  return tdFetch("/cash_flow", p);
}
async function fetchEarningsEstimate(symbol) {
  return tdFetch("/earnings_estimate", { symbol });
}
async function fetchEPSTrend(symbol) {
  return tdFetch("/eps_trend", { symbol });
}
async function fetchGrowthEstimates(symbol) {
  return tdFetch("/growth_estimates", { symbol });
}
async function fetchStockFundamentals(symbol) {
  const [cashFlow, earningsEstimate, epsTrend, growthEstimates] = await Promise.all([
    fetchCashFlow({ symbol, period: "quarterly", outputsize: 4 }),
    fetchEarningsEstimate(symbol),
    fetchEPSTrend(symbol),
    fetchGrowthEstimates(symbol)
  ]);
  return {
    cash_flow: cashFlow,
    earnings_estimate: earningsEstimate,
    eps_trend: epsTrend,
    growth_estimates: growthEstimates
  };
}
export {
  convertCurrency,
  fetchCashFlow,
  fetchEPSTrend,
  fetchETFFullData,
  fetchETFPerformance,
  fetchETFSummary,
  fetchETFsDirectory,
  fetchEarningsEstimate,
  fetchExchangeRate,
  fetchExchangeRates,
  fetchGrowthEstimates,
  fetchStockFundamentals
};
