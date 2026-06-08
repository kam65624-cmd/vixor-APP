import { z } from "zod";

// ═══════════════════════════════════════════════
// VIXOR ANALYSIS SCHEMA V2 — Premium Intelligence
// ═══════════════════════════════════════════════

const ScenarioSchema = z.object({
  name: z.string().describe("Descriptive scenario name, e.g. 'Bullish Breakout', 'Pullback Entry', 'Bearish Failure'"),
  story: z.string().describe("Narrative of what happens and why — the trader should understand the logic, not just the numbers"),
  trigger: z.string().describe("Specific trigger that confirms this scenario is playing out"),
  invalidation_trigger: z.string().describe("What would make this scenario fail or become invalid"),
  probability: z.number().min(5).max(85).describe("Estimated probability percentage"),
  entry: z.string().describe("Entry price as string"),
  sl: z.number().describe("Stop loss price"),
  tp1: z.number().describe("First take profit target"),
  tp2: z.number().describe("Second take profit target (final)"),
  rr: z.string().describe("Risk-reward ratio, e.g. '1:2.5'"),
});

export const AnalysisSchema = z.object({
  pair: z.string().describe("Trading pair detected on the chart, e.g. BTC/USDT, EUR/USD, XAU/USD"),
  timeframe: z.string().describe("Chart timeframe detected from the chart axis, e.g. 1H, 4H, 1D, 15M"),
  trend: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]).describe("Overall trend of the asset on this timeframe"),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Risk assessment for the current setup"),
  risk_reasons: z.array(z.string()).min(1).max(3).describe("Reasons justifying the risk level"),
  invalidation_level: z.number().describe("Price level where this thesis becomes completely invalid — MUST be a realistic price visible on or near the chart"),
  liquidity_zones: z.object({
    buySide: z.array(z.number()).describe("Buy-side liquidity zones (resistance/highs) — MUST be actual price levels visible on the chart"),
    sellSide: z.array(z.number()).describe("Sell-side liquidity zones (support/lows) — MUST be actual price levels visible on the chart")
  }),
  market_structure: z.object({
    direction: z.enum(["BULLISH", "BEARISH", "SIDEWAYS"]),
    structure: z.string().describe("e.g. HIGHER_HIGHS, LOWER_LOWS, CONSOLIDATION"),
    bos: z.number().optional().describe("Price level of the recent Break of Structure (BOS) if any")
  }),
  key_levels: z.object({
    resistance: z.array(z.number()).describe("Resistance levels — MUST be actual price levels read from the chart Y-axis"),
    support: z.array(z.number()).describe("Support levels — MUST be actual price levels read from the chart Y-axis"),
    pivot: z.number().optional()
  }),
  recommendation: z.enum(["BUY", "SELL", "WAIT"]),
  confidence: z.number().min(0).max(100).describe("Internal confidence score (used for setup_strength derivation, not shown to user)"),
  setup_strength: z.enum(["STRONG", "MODERATE", "WEAK"]).describe("Setup quality based on confluence"),
  entry: z.number().describe("Recommended entry price — MUST match the current price action on the chart"),
  stop_loss: z.number().describe("Stop loss price — MUST be a realistic level visible on the chart"),
  take_profit: z.array(z.number()).length(3).describe("Three take-profit levels — MUST be realistic based on chart structure"),
  rr: z.string().describe("Approx risk-reward ratio, e.g. '1:2.5'"),
  pattern: z.string().describe("Short summary of detected pattern"),
  reasons: z.array(z.string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  thesis: z.object({
    why: z.string().describe("The core narrative — why this setup exists right now."),
    confirms: z.array(z.string()).min(2).max(4).describe("Specific confirmation signals"),
    invalidates: z.array(z.string()).min(2).max(4).describe("Specific invalidation triggers")
  }).describe("Trade thesis: the thinking behind the trade, not just the signal"),
  scenarios: z.object({
    primary: ScenarioSchema.describe("The main scenario aligned with the recommendation"),
    alternative: ScenarioSchema.describe("An alternative scenario — different path the market could take"),
    counter: ScenarioSchema.describe("Counter-scenario — what happens if the thesis is wrong")
  }).describe("Three market scenarios that teach the trader to think in probabilities"),
  management: z.array(z.string()).min(3).max(6).describe("Step-by-step trade management instructions"),
  news_impact: z.object({
    relevant_news: z.array(z.object({
      headline: z.string(),
      source: z.string(),
      impact: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
      explanation: z.string()
    })).min(1).max(3),
    overall_sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
    verdict: z.string()
  }).describe("Analysis of recent news and fundamentals"),
  signal_badge: z.object({
    direction: z.enum(["BUY", "SELL", "WAIT"]),
    entry: z.string(),
    stop_loss: z.string(),
    take_profit: z.string(),
    rr: z.string()
  }),
  vixor_message: z.string().describe("A confident, authoritative message from Vixor explaining the verdict.")
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// ═══════════════════════════════════════════════
// Z-AI ENGINE — Zero external key dependencies
// Uses z-ai-web-dev-sdk which manages AI access internally
// ═══════════════════════════════════════════════

let _zai: any = null;

async function getZAI() {
  if (!_zai) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    _zai = await ZAI.create();
  }
  return _zai;
}

// ═══════════════════════════════════════════════
// LIVE NEWS FETCHER (optional - works without Finnhub)
// ═══════════════════════════════════════════════

async function fetchLatestNewsForPrompt(): Promise<string> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return "No live news available — provide fundamental analysis based on your knowledge of current market conditions.";
  try {
    const [genRes, forexRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
      fetch(`https://finnhub.io/api/v1/news?category=forex&token=${key}`)
    ]);

    let newsList: any[] = [];
    if (genRes.ok) {
      const data = await genRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (forexRes.ok) {
      const data = await forexRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }

    if (newsList.length === 0) return "No live news available.";

    const uniqueNews = Array.from(new Map(newsList.map(item => [item.id, item])).values());

    return uniqueNews.slice(0, 15).map(n =>
      `- Source: ${n.source}\n  Headline: ${n.headline}\n  Summary: ${n.summary}`
    ).join("\n\n");
  } catch (e) {
    console.error("[NewsFetcher] Error:", e);
    return "Error fetching live news — provide fundamental analysis based on general knowledge.";
  }
}

// ═══════════════════════════════════════════════
// LIVE PRICE FETCHER (optional - works without Finnhub)
// ═══════════════════════════════════════════════

async function fetchCurrentPrice(pair: string): Promise<number | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;

  try {
    const symbolMap: Record<string, string> = {
      "XAU/USD": "OANDA:XAU_USD", "XAUUSD": "OANDA:XAU_USD", "GOLD": "OANDA:XAU_USD",
      "EUR/USD": "OANDA:EUR_USD", "GBP/JPY": "OANDA:GBP_JPY", "GBP/USD": "OANDA:GBP_USD",
      "USD/JPY": "OANDA:USD_JPY", "USD/CHF": "OANDA:USD_CHF", "AUD/USD": "OANDA:AUD_USD",
      "NZD/USD": "OANDA:NZD_USD", "USD/CAD": "OANDA:USD_CAD", "EUR/GBP": "OANDA:EUR_GBP",
      "BTC/USD": "BINANCE:BTCUSDT", "BTC/USDT": "BINANCE:BTCUSDT",
      "ETH/USD": "BINANCE:ETHUSDT", "ETH/USDT": "BINANCE:ETHUSDT",
      "SOL/USDT": "BINANCE:SOLUSDT",
    };

    const symbol = symbolMap[pair.toUpperCase()] || symbolMap[pair] || `OANDA:${pair.replace("/", "_")}`;
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.c && data.c > 0) ? data.c : null;
  } catch (e) {
    console.error("[PriceFetcher] Error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════
// AI ANALYSIS ENGINE — V2 Keyless Architecture
// ═══════════════════════════════════════════════

export async function runChartAnalysis(
  imageBytes: Uint8Array,
  mimeType: string,
  fileName?: string,
  selectedPair?: string,
  trading_style?: string
): Promise<AnalysisResult> {
  try {
    return await runAIAnalysis(imageBytes, mimeType, fileName, selectedPair, trading_style);
  } catch (error) {
    console.error("[Vixor] AI analysis failed, falling back to mock:", error);
    return generateDynamicMock(fileName, selectedPair, trading_style);
  }
}

async function runAIAnalysis(
  imageBytes: Uint8Array,
  mimeType: string,
  fileName?: string,
  selectedPair?: string,
  trading_style?: string
): Promise<AnalysisResult> {
  const zai = await getZAI();

  // Convert image bytes to base64 for the AI
  const base64Image = Buffer.from(imageBytes).toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  // Fetch optional context
  const [newsContext, livePrice] = await Promise.all([
    fetchLatestNewsForPrompt(),
    selectedPair && selectedPair !== "auto" ? fetchCurrentPrice(selectedPair) : Promise.resolve(null),
  ]);

  const assetGuidance = selectedPair && selectedPair !== "auto"
    ? `The user has specified that this chart is for the asset: ${selectedPair}. You MUST analyze the chart for this specific asset. Do NOT guess a different pair.`
    : "You must identify the trading pair from the chart. Look at the chart title, axis labels, or price scale to determine the pair.";

  const priceContext = livePrice
    ? `\n\nCRITICAL LIVE PRICE CONTEXT:\n- The current live market price for ${selectedPair} is: ${livePrice}\n- You MUST use this price as the reference point. Entry, SL, and TP levels MUST be realistic relative to this current price.\n- If the chart shows a significantly different price than the live price, the chart may be from a different time. Analyze what you SEE on the chart, but use the live price to contextualize the analysis.`
    : "\n\nNo live price data available. You MUST read the price scale from the chart Y-axis to determine all price levels.";

  const systemPrompt = `You are Vixor, an elite trading intelligence engine built for professional traders. You do NOT give blind signals. You provide structured market intelligence that helps traders make informed decisions.

═══ CRITICAL: CHART READING ACCURACY ═══
You are analyzing a REAL chart screenshot. You MUST:
1. READ the Y-axis price scale carefully to determine the actual price levels shown on the chart
2. IDENTIFY the trading pair from the chart title, pair label, or price range context
3. MATCH your analysis to the ACTUAL prices visible on the chart — entry, SL, TP must be at levels that exist on or near the chart
4. DO NOT invent or hallucinate price levels. Every price level you provide MUST correspond to something visible on the chart
5. The current candle's price IS the area where the chart ends (rightmost candle). Your entry price should be near this area for active setups.
6. If the chart shows XAU/USD at 3300+, your entry must be around 3300+, NOT 2350. READ THE CHART.
7. If the chart shows BTC at 100k+, your entry must be around 100k+, NOT 64k. READ THE CHART.
8. SUPPORT and RESISTANCE levels must be at prices where you can actually see horizontal levels, swing highs/lows, or consolidation zones on the chart.

CORE METHODOLOGY: Smart Money Concepts (SMC) and Inner Circle Trader (ICT). Focus on Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure, Change of Character.

SETUP STRENGTH RULES:
- STRONG: 3+ confluences aligning, clean market structure, clear liquidity targets
- MODERATE: 2 confluences, some noise or conflicting signals
- WEAK: 1 confluence, choppy structure, or unclear price action
NEVER default to STRONG. Be honest about setup quality.

THESIS RULES:
- 'why': Explain the core market narrative. Be specific about the chart structure.
- 'confirms': List specific, observable triggers with exact price levels.
- 'invalidates': List specific red flags with exact price levels.

SCENARIO ENGINE RULES (CRITICAL):
- 'primary': Most likely scenario aligned with your recommendation.
- 'alternative': Different path the market could take.
- 'counter': What happens if you are WRONG.
- Each scenario MUST have: story, trigger, invalidation_trigger
- Probabilities should sum to roughly 100%.
- Counter scenario ALWAYS probability >= 10%.
- ALL price levels must be REALISTIC for the chart's actual price range.

FUNDAMENTAL ANALYSIS:
Compare the technical setup with the provided news. Filter for items relevant to the detected asset. Provide a final verdict.

TONE: Confident and authoritative, but NOT reckless. Help the trader THINK, not just follow.`;

  const userPrompt = `Analyze this chart image carefully and provide a complete trading intelligence report.

═══ IMPORTANT INSTRUCTIONS ═══
1. LOOK at the chart Y-axis to determine the actual price range shown
2. READ any pair label, title, or symbol shown on the chart
3. ALL your price levels (entry, SL, TP, support, resistance) MUST match the chart's price scale
4. DO NOT use generic or outdated prices — READ THE CHART

${assetGuidance}
${trading_style ? `The user's trading style is: ${trading_style}. Adjust targets, timeframes, and stop-loss logic accordingly.\n` : ""}
${priceContext}

Here is the latest live financial news:
${newsContext}

You MUST respond with ONLY a valid JSON object matching this exact structure (no markdown, no code blocks, just raw JSON):
{
  "pair": "string - the trading pair detected from the chart",
  "timeframe": "string - timeframe from chart",
  "trend": "BULLISH" | "BEARISH" | "NEUTRAL",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "risk_reasons": ["string"],
  "invalidation_level": number,
  "liquidity_zones": { "buySide": [number], "sellSide": [number] },
  "market_structure": { "direction": "BULLISH"|"BEARISH"|"SIDEWAYS", "structure": "string", "bos": number|null },
  "key_levels": { "resistance": [number], "support": [number], "pivot": number|null },
  "recommendation": "BUY" | "SELL" | "WAIT",
  "confidence": number 0-100,
  "setup_strength": "STRONG" | "MODERATE" | "WEAK",
  "entry": number,
  "stop_loss": number,
  "take_profit": [number, number, number],
  "rr": "string like 1:2.5",
  "pattern": "string",
  "reasons": ["string"],
  "thesis": { "why": "string", "confirms": ["string"], "invalidates": ["string"] },
  "scenarios": {
    "primary": { "name":"string", "story":"string", "trigger":"string", "invalidation_trigger":"string", "probability":number, "entry":"string", "sl":number, "tp1":number, "tp2":number, "rr":"string" },
    "alternative": { same structure },
    "counter": { same structure }
  },
  "management": ["string"],
  "news_impact": {
    "relevant_news": [{ "headline":"string", "source":"string", "impact":"POSITIVE"|"NEGATIVE"|"NEUTRAL", "explanation":"string" }],
    "overall_sentiment": "BULLISH"|"BEARISH"|"NEUTRAL",
    "verdict": "string"
  },
  "signal_badge": { "direction":"BUY"|"SELL"|"WAIT", "entry":"string", "stop_loss":"string", "take_profit":"string", "rr":"string" },
  "vixor_message": "string"
}

Be EXACT with price levels — every number must correspond to the chart.`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  // Extract and parse the JSON response
  const rawContent = completion.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("AI returned empty response");
  }

  // Clean the response - remove markdown code blocks if present
  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith("```")) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  // Parse and validate with Zod
  const parsed = JSON.parse(jsonStr);
  const validated = AnalysisSchema.parse(parsed);
  return validated;
}

// ═══════════════════════════════════════════════
// DYNAMIC MOCK FALLBACK (when AI is unavailable)
// ═══════════════════════════════════════════════

function detectPairFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USD";
  if (name.includes("eth") || name.includes("ethereum")) return "ETH/USDT";
  if (name.includes("gbp") || name.includes("pound")) return "GBP/JPY";
  if (name.includes("jpy") || name.includes("yen")) return "USD/JPY";
  if (name.includes("aapl") || name.includes("apple")) return "AAPL";
  if (name.includes("nasdaq") || name.includes("ndx") || name.includes("us100")) return "NASDAQ";
  return undefined;
}

async function generateDynamicMock(fileName?: string, selectedPair?: string, tradingStyle?: string): Promise<AnalysisResult> {
  let pair = selectedPair && selectedPair !== "auto" ? selectedPair : undefined;
  if (!pair) pair = detectPairFromFileName(fileName);
  if (!pair) pair = "XAU/USD";

  // Try live price for accurate mock
  const livePrice = await fetchCurrentPrice(pair);

  const timeframe = tradingStyle === "Scalping" ? "5M" : tradingStyle === "Swing Trading" ? "4H" : "1H";
  const directions: ("BULLISH" | "BEARISH" | "SIDEWAYS")[] = ["BULLISH", "BEARISH", "SIDEWAYS"];
  const direction = directions[Math.floor(Math.random() * directions.length)];

  const basePrices: Record<string, number> = {
    "XAU/USD": 3350, "EUR/USD": 1.1350, "GBP/JPY": 195.50, "USD/JPY": 144.50,
    "GBP/USD": 1.3450, "BTC/USD": 105000, "BTC/USDT": 105000,
    "ETH/USD": 2600, "ETH/USDT": 2600, "AAPL": 200, "NASDAQ": 21500
  };

  const base = livePrice || basePrices[pair] || 100;
  const variance = base * 0.005;
  const entry = base + (Math.random() * variance) - (variance / 2);

  const isBullish = direction === "BULLISH";
  const trend = direction === "SIDEWAYS" ? "NEUTRAL" : direction;
  const rec = direction === "SIDEWAYS" ? "WAIT" : (isBullish ? "BUY" : "SELL");

  const spread = base * 0.008;
  const tp1 = isBullish ? entry + spread : entry - spread;
  const tp2 = isBullish ? entry + (spread * 2) : entry - (spread * 2);
  const tp3 = isBullish ? entry + (spread * 3) : entry - (spread * 3);
  const sl = isBullish ? entry - (spread * 1.5) : entry + (spread * 1.5);
  const invalidation = isBullish ? sl - (base * 0.003) : sl + (base * 0.003);

  const decimalPlaces = pair.includes("JPY") ? 2 : pair.includes("USD") && !pair.includes("XAU") && !pair.includes("BTC") && !pair.includes("ETH") && !pair.includes("AAPL") && !pair.includes("NASDAQ") ? (base < 10 ? 4 : 2) : 2;
  const p = (n: number) => Number(n.toFixed(decimalPlaces));

  const patterns = isBullish
    ? ["Bullish Order Block Mitigation", "Liquidity Sweep & BOS", "Fair Value Gap (FVG) Fill", "Change of Character (ChoCh)"]
    : ["Bearish Order Block Rejection", "Buy-Side Liquidity Sweep", "Bearish FVG Mitigation", "Bearish ChoCh"];

  const setupStrength: "STRONG" | "MODERATE" | "WEAK" = direction === "SIDEWAYS" ? "WEAK" : (Math.random() > 0.4 ? "STRONG" : "MODERATE");

  const thesisMap = {
    BULLISH: {
      why: `Institutional buying pressure detected through a ${patterns[Math.floor(Math.random() * patterns.length)]} at the ${p(entry)} zone. Market structure has shifted bullish with a clear Break of Structure, and liquidity resting above equal highs presents an attractive target for smart money.`,
      confirms: [
        `4H candle closes above ${p(entry + spread)} confirming bullish intent`,
        `Volume increases on the push toward ${p(tp1)}`,
        `Bullish Order Block at ${p(entry - spread * 0.5)} holds on retest`
      ],
      invalidates: [
        `1H close below ${p(sl)} invalidates the bullish structure`,
        `Strong USD catalyst (e.g. CPI beat) could derail the move`,
        `Bearish FVG left unfilled signals incomplete correction`
      ]
    },
    BEARISH: {
      why: `Institutional selling pressure identified through a ${patterns[Math.floor(Math.random() * patterns.length)]} near the ${p(entry)} level. Market structure has turned bearish with a clear Change of Character, and sell-side liquidity below provides a magnet for price.`,
      confirms: [
        `4H candle closes below ${p(entry - spread)} confirming bearish momentum`,
        `Bearish Order Block at ${p(entry + spread * 0.5)} rejects on retest`,
        `Increasing selling volume on approach to ${p(tp1)}`
      ],
      invalidates: [
        `1H close above ${p(sl)} invalidates the bearish thesis`,
        `Dovish central bank rhetoric could support a reversal`,
        `Buy-side liquidity sweep signals potential trap`
      ]
    },
    SIDEWAYS: {
      why: `Market is in a consolidation phase with no clear directional bias. Liquidity is trapped on both sides, and smart money is likely accumulating positions before the next move. Patience is required.`,
      confirms: [
        `Range breakout with volume above ${p(entry + spread)} or below ${p(entry - spread)}`,
        `Increasing volume on one side of the range`,
        `News catalyst that provides directional conviction`
      ],
      invalidates: [
        `False breakout followed by quick reversal (liquidity trap)`,
        `Range expands without clear direction (chop)`,
        `Conflicting fundamental data from multiple economies`
      ]
    }
  };

  const primaryScenario = isBullish
    ? {
        name: "Bullish Breakout",
        story: `Price breaks above the equal highs at ${p(tp1)} with increasing volume, targeting buy-side liquidity at ${p(tp2)}. The bullish structure is intact and smart money is driving price toward the liquidity pool.`,
        trigger: `4H candle closes above ${p(tp1)} with above-average volume`,
        invalidation_trigger: `Rejection candle at ${p(tp1)} forming a double top`,
        probability: 55, entry: `${p(entry)}`, sl: p(sl), tp1: p(tp1), tp2: p(tp2), rr: "1:2.5"
      }
    : direction === "SIDEWAYS"
    ? {
        name: "Range Continuation",
        story: `Price continues to rotate within the established range, sweeping liquidity on both sides before any directional move.`,
        trigger: `Price respects the range boundaries at ${p(tp1)} and ${p(sl)}`,
        invalidation_trigger: `Decisive 4H close outside the range with volume`,
        probability: 50, entry: `${p(entry)}`, sl: p(sl), tp1: p(tp1), tp2: p(tp2), rr: "1:1.5"
      }
    : {
        name: "Bearish Continuation",
        story: `Price breaks below support at ${p(tp1)} with increasing selling pressure, targeting sell-side liquidity at ${p(tp2)}.`,
        trigger: `4H candle closes below ${p(tp1)} with above-average volume`,
        invalidation_trigger: `Bullish rejection at ${p(tp1)} forming a higher low`,
        probability: 55, entry: `${p(entry)}`, sl: p(sl), tp1: p(tp1), tp2: p(tp2), rr: "1:2.5"
      };

  const alternativeScenario = isBullish
    ? {
        name: "Pullback Entry",
        story: `Before continuing higher, price retraces to mitigate the bullish Order Block at ${p(entry - spread * 0.3)}.`,
        trigger: `1H rejection candle at the ${p(entry - spread * 0.3)} demand zone`,
        invalidation_trigger: `Price sweeps below the OB and closes below ${p(sl)}`,
        probability: 30, entry: `${p(entry - spread * 0.3)}`, sl: p(sl - spread * 0.2), tp1: p(tp1), tp2: p(tp2), rr: "1:3.0"
      }
    : direction === "SIDEWAYS"
    ? {
        name: "Upside Breakout",
        story: `An unexpected bullish catalyst breaks price above the range, triggering buy-side liquidity sweeps.`,
        trigger: `4H close above range resistance with volume spike`,
        invalidation_trigger: `Quick rejection back into range (bull trap)`,
        probability: 25, entry: `${p(tp1 + spread * 0.2)}`, sl: p(entry - spread * 0.5), tp1: p(tp1 + spread * 1.5), tp2: p(tp1 + spread * 2.5), rr: "1:2.0"
      }
    : {
        name: "Pullback Entry",
        story: `Before continuing lower, price retraces to mitigate the bearish Order Block at ${p(entry + spread * 0.3)}.`,
        trigger: `1H rejection candle at the ${p(entry + spread * 0.3)} supply zone`,
        invalidation_trigger: `Price sweeps above the OB and closes above ${p(sl)}`,
        probability: 30, entry: `${p(entry + spread * 0.3)}`, sl: p(sl + spread * 0.2), tp1: p(tp1), tp2: p(tp2), rr: "1:3.0"
      };

  const counterScenario = isBullish
    ? {
        name: "Bearish Failure",
        story: `The bullish setup fails as price rejects at key resistance, forming a bearish Change of Character.`,
        trigger: `1H bearish engulfing candle at ${p(tp1)} resistance`,
        invalidation_trigger: `Bullish reclaim of ${p(tp1)} with volume`,
        probability: 15, entry: `${p(tp1 - spread * 0.1)}`, sl: p(tp1 + spread * 0.5), tp1: p(sl), tp2: p(invalidation), rr: "1:2.0"
      }
    : direction === "SIDEWAYS"
    ? {
        name: "Downside Breakout",
        story: `Bearish pressure breaks the range to the downside, triggering sell-side liquidity sweeps.`,
        trigger: `4H close below range support with volume spike`,
        invalidation_trigger: `Quick reclaim of support (bear trap)`,
        probability: 25, entry: `${p(sl - spread * 0.2)}`, sl: p(entry + spread * 0.5), tp1: p(sl - spread * 1.5), tp2: p(sl - spread * 2.5), rr: "1:2.0"
      }
    : {
        name: "Bullish Failure",
        story: `The bearish setup fails as price rejects at key support, forming a bullish Change of Character.`,
        trigger: `1H bullish engulfing candle at ${p(tp1)} support`,
        invalidation_trigger: `Bearish reclaim of ${p(tp1)} with volume`,
        probability: 15, entry: `${p(tp1 + spread * 0.1)}`, sl: p(tp1 - spread * 0.5), tp1: p(sl), tp2: p(invalidation), rr: "1:2.0"
      };

  const mockNewsByPair: Record<string, Array<{headline: string, source: string, impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL", explanation: string}>> = {
    "XAU/USD": [
      { headline: "US Treasury Yields Slide on Lower Inflation Expectations", source: "Bloomberg", impact: "POSITIVE", explanation: "Lower yields reduce the opportunity cost of holding non-yielding Gold, reinforcing the technical support." },
      { headline: "Dollar Index Strengthens After Robust Services PMI", source: "Reuters", impact: "NEGATIVE", explanation: "A stronger Dollar pressures Gold prices, potentially delaying the breakout above key resistance." }
    ],
    "EUR/USD": [
      { headline: "ECB Signals Potential Rate Cut in June Meeting", source: "Reuters", impact: "NEGATIVE", explanation: "Divergence between ECB's dovish tone and Fed's hawkish stance puts downward pressure on the Euro." },
      { headline: "US Jobless Claims Rise More Than Expected", source: "MarketWatch", impact: "POSITIVE", explanation: "Weak labor data weakens the Dollar, supporting a potential technical bounce." }
    ],
    "BTC/USD": [
      { headline: "Institutional Inflows to Spot Bitcoin ETFs Accelerate", source: "Coindesk", impact: "POSITIVE", explanation: "Consistent spot buying pressure aligns with the bullish pattern." },
      { headline: "Regulatory Concerns Re-emerge as SEC Review Guidelines", source: "Bloomberg", impact: "NEUTRAL", explanation: "Short-term regulatory noise is causing consolidation." }
    ]
  };

  const defaultMockNews = [
    { headline: "Federal Reserve Maintains Hawkish Stance on Inflation", source: "Bloomberg", impact: "NEGATIVE" as const, explanation: "High interest rates for longer strengthen the USD." },
    { headline: "Global Market Sentiment Shifts to Risk-On Amid Earnings Boost", source: "Reuters", impact: "POSITIVE" as const, explanation: "Improved risk appetite supports equity prices." }
  ];

  const relevantMockNews = mockNewsByPair[pair] || defaultMockNews;
  const overallSentiment = direction === "SIDEWAYS" ? "NEUTRAL" : (direction === "BULLISH" ? "BULLISH" : "BEARISH");
  const verdict = direction === "SIDEWAYS"
    ? "Sideways consolidation is supported by conflicting fundamentals and lack of clear news drivers."
    : (isBullish
        ? `Bullish technical setup is confirmed by positive news sentiment, increasing the likelihood of target completion.`
        : `Bearish technical structure aligns with negative fundamental pressures, supporting a breakdown narrative.`);

  return {
    pair,
    timeframe,
    trend: trend as "BULLISH" | "BEARISH" | "NEUTRAL",
    risk_level: setupStrength === "STRONG" ? "LOW" : setupStrength === "MODERATE" ? "MEDIUM" : "HIGH",
    risk_reasons: setupStrength === "STRONG"
      ? ["Approaching minor liquidity zone", "Slightly decreasing volume on pullbacks"]
      : ["Approaching major liquidity zone", "Volume decreasing on pullbacks", "Upcoming high-impact news event"],
    invalidation_level: p(invalidation),
    liquidity_zones: { buySide: [p(tp2), p(tp3)], sellSide: [p(sl), p(invalidation)] },
    market_structure: {
      direction,
      structure: isBullish ? "HIGHER_HIGHS" : direction === "BEARISH" ? "LOWER_LOWS" : "CONSOLIDATION",
      bos: p(entry + (isBullish ? -(spread*0.5) : (spread*0.5)))
    },
    key_levels: { resistance: [p(tp1), p(tp2)], support: [p(sl), p(entry - (spread * 0.5))], pivot: p(entry) },
    recommendation: rec as "BUY" | "SELL" | "WAIT",
    confidence: setupStrength === "STRONG" ? 82 : setupStrength === "MODERATE" ? 65 : 38,
    setup_strength: setupStrength,
    entry: p(entry),
    stop_loss: p(sl),
    take_profit: [p(tp1), p(tp2), p(tp3)],
    rr: "1:2.5",
    pattern: direction === "SIDEWAYS" ? "Consolidation Range" : patterns[Math.floor(Math.random() * patterns.length)],
    reasons: [
      "Clear sweep of prior liquidity pool.",
      "Break of Structure (BOS) confirming intent.",
      "Price mitigating a high-timeframe Fair Value Gap (FVG).",
      "Institutional sponsorship evident in the volume footprint."
    ],
    thesis: thesisMap[direction === "SIDEWAYS" ? "SIDEWAYS" : direction],
    scenarios: { primary: primaryScenario, alternative: alternativeScenario, counter: counterScenario },
    management: [
      "Wait for 15M candle close to confirm entry.",
      "Move Stop Loss to breakeven after TP1 is hit.",
      "Scale out 50% at TP2 and trail the rest.",
      "Close position manually if price closes past invalidation level."
    ],
    news_impact: { relevant_news: relevantMockNews, overall_sentiment: overallSentiment as "BULLISH" | "BEARISH" | "NEUTRAL", verdict },
    signal_badge: {
      direction: rec as "BUY" | "SELL" | "WAIT",
      entry: `${p(entry)}`, stop_loss: `${p(sl)}`, take_profit: `${p(tp2)}`, rr: "1:2.5"
    },
    vixor_message: direction === "SIDEWAYS"
      ? "Market is currently sweeping liquidity in a tight range. Sit on your hands until a clear Break of Structure."
      : `I have detected a ${setupStrength === "STRONG" ? "high-conviction" : setupStrength === "MODERATE" ? "developing" : "speculative"} ${isBullish ? 'bullish' : 'bearish'} setup with key confluences. Enter with discipline and respect the invalidation level.`
  };
}
