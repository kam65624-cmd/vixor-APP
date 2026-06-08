import { g as generateObject } from "../_libs/ai.mjs";
import { g as google } from "../_libs/ai-sdk__google.mjs";
import { o as object, c as string, _ as _enum, b as array, n as number } from "../_libs/zod.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/react.mjs";
import "../_libs/opentelemetry__api.mjs";
const ScenarioSchema = object({
  name: string().describe("Descriptive scenario name, e.g. 'Bullish Breakout', 'Pullback Entry', 'Bearish Failure'"),
  story: string().describe("Narrative of what happens and why — the trader should understand the logic, not just the numbers"),
  trigger: string().describe("Specific trigger that confirms this scenario is playing out"),
  invalidation_trigger: string().describe("What would make this scenario fail or become invalid"),
  probability: number().min(5).max(85).describe("Estimated probability percentage"),
  entry: string().describe("Entry price as string"),
  sl: number().describe("Stop loss price"),
  tp1: number().describe("First take profit target"),
  tp2: number().describe("Second take profit target (final)"),
  rr: string().describe("Risk-reward ratio, e.g. '1:2.5'")
});
const AnalysisSchema = object({
  pair: string().describe("Trading pair detected on the chart, e.g. BTC/USDT, EUR/USD"),
  timeframe: string().describe("Chart timeframe, e.g. 1H, 4H, 1D"),
  trend: _enum(["BULLISH", "BEARISH", "NEUTRAL"]).describe("Overall trend of the asset on this timeframe"),
  risk_level: _enum(["LOW", "MEDIUM", "HIGH"]).describe("Risk assessment for the current setup"),
  risk_reasons: array(string()).min(1).max(3).describe("Reasons justifying the risk level"),
  invalidation_level: number().describe("Price level where this thesis becomes completely invalid"),
  liquidity_zones: object({
    buySide: array(number()).describe("Buy-side liquidity zones (resistance/highs)"),
    sellSide: array(number()).describe("Sell-side liquidity zones (support/lows)")
  }),
  market_structure: object({
    direction: _enum(["BULLISH", "BEARISH", "SIDEWAYS"]),
    structure: string().describe("e.g. HIGHER_HIGHS, LOWER_LOWS, CONSOLIDATION"),
    bos: number().optional().describe("Price level of the recent Break of Structure (BOS) if any")
  }),
  key_levels: object({
    resistance: array(number()),
    support: array(number()),
    pivot: number().optional()
  }),
  recommendation: _enum(["BUY", "SELL", "WAIT"]),
  confidence: number().min(0).max(100).describe("Internal confidence score (used for setup_strength derivation, not shown to user)"),
  setup_strength: _enum(["STRONG", "MODERATE", "WEAK"]).describe("Setup quality based on confluence: STRONG (3+ confluences + clean structure), MODERATE (2 confluences or minor noise), WEAK (1 confluence or conflicting signals)"),
  entry: number().describe("Recommended entry price"),
  stop_loss: number().describe("Stop loss price"),
  take_profit: array(number()).length(3).describe("Three take-profit levels, conservative to aggressive"),
  rr: string().describe("Approx risk-reward ratio for the balanced target, e.g. '1:2.5'"),
  pattern: string().describe("Short summary of detected pattern, e.g. 'Bullish Engulfing + Support Hold'"),
  reasons: array(string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  thesis: object({
    why: string().describe("The core narrative — why this setup exists right now. What market conditions created it."),
    confirms: array(string()).min(2).max(4).describe("Specific confirmation signals that validate this thesis — what the trader should watch for"),
    invalidates: array(string()).min(2).max(4).describe("Specific invalidation triggers — what would prove this thesis wrong")
  }).describe("Trade thesis: the thinking behind the trade, not just the signal"),
  scenarios: object({
    primary: ScenarioSchema.describe("The main scenario aligned with the recommendation — what you expect to happen"),
    alternative: ScenarioSchema.describe("An alternative scenario — different path the market could take (e.g. pullback before continuation)"),
    counter: ScenarioSchema.describe("Counter-scenario — what happens if the thesis is wrong (always show the bearish case for bullish setups and vice versa)")
  }).describe("Three market scenarios that teach the trader to think in probabilities"),
  management: array(string()).min(3).max(6).describe("Step-by-step trade management instructions"),
  news_impact: object({
    relevant_news: array(object({
      headline: string().describe("Headline of the news article"),
      source: string().describe("Source of the news, e.g. Reuters, Bloomberg"),
      impact: _enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]).describe("How this news impacts the asset price or trend direction"),
      explanation: string().describe("Explanation of how this news negatively or positively affects the technical structure, invalidation levels, or general price action")
    })).min(1).max(3).describe("1-3 news articles that are relevant to this trading pair"),
    overall_sentiment: _enum(["BULLISH", "BEARISH", "NEUTRAL"]).describe("Overall fundamental sentiment derived from news"),
    verdict: string().describe("Final verdict indicating if the fundamental news aligns with the technical setup or warns against it")
  }).describe("Analysis of recent news and fundamentals affecting this specific trading pair"),
  signal_badge: object({
    direction: _enum(["BUY", "SELL", "WAIT"]),
    entry: string(),
    stop_loss: string(),
    take_profit: string(),
    rr: string()
  }),
  vixor_message: string().describe("A confident, authoritative message from Vixor explaining the verdict.")
});
async function fetchLatestNewsForPrompt() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return "No live news available.";
  try {
    const [genRes, forexRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
      fetch(`https://finnhub.io/api/v1/news?category=forex&token=${key}`)
    ]);
    let newsList = [];
    if (genRes.ok) {
      const data = await genRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (forexRes.ok) {
      const data = await forexRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (newsList.length === 0) return "No news items fetched.";
    const uniqueNews = Array.from(new Map(newsList.map((item) => [item.id, item])).values());
    return uniqueNews.slice(0, 15).map(
      (n) => `- Source: ${n.source}
  Headline: ${n.headline}
  Summary: ${n.summary}`
    ).join("\n\n");
  } catch (e) {
    console.error("Error fetching news for Gemini prompt:", e);
    return "Error fetching live news.";
  }
}
async function runChartAnalysis(imageBytes, mimeType, fileName, selectedPair, trading_style) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY. Using dynamic mock analysis.");
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    return generateDynamicMock(fileName, selectedPair);
  }
  const newsContext = await fetchLatestNewsForPrompt();
  const assetGuidance = selectedPair && selectedPair !== "auto" ? `The user has specified that this chart is for the asset: ${selectedPair}. Analyze the chart for this specific asset.` : "";
  const { object: object2 } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: AnalysisSchema,
    messages: [
      {
        role: "system",
        content: "You are Vixor, an elite trading intelligence engine built for professional traders. You do NOT give blind signals. You provide structured market intelligence that helps traders make informed decisions.\n\nCORE METHODOLOGY: Smart Money Concepts (SMC) and Inner Circle Trader (ICT). Focus on Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure, Change of Character.\n\nSETUP STRENGTH RULES:\n- STRONG: 3+ confluences aligning, clean market structure, clear liquidity targets, no major news conflicts\n- MODERATE: 2 confluences, some noise or conflicting signals, minor news risk\n- WEAK: 1 confluence, choppy structure, conflicting news, or unclear price action\nNEVER default to STRONG. Be honest about setup quality.\n\nTHESIS RULES:\n- 'why': Explain the core market narrative that created this setup. Be specific, not generic.\n- 'confirms': List specific, observable triggers the trader can watch for (price levels, candle patterns, volume).\n- 'invalidates': List specific, observable red flags that prove the thesis wrong.\n\nSCENARIO ENGINE RULES (CRITICAL):\n- 'primary': The most likely scenario aligned with your recommendation. Include a narrative story.\n- 'alternative': A different path the market could take (e.g. pullback before continuation, consolidation before breakout).\n- 'counter': What happens if you are WRONG. For bullish setups, show the bearish case. For bearish, show the bullish case.\n- Each scenario MUST have: story (why this could happen), trigger (what confirms it), invalidation_trigger (what kills it)\n- Probabilities should sum to roughly 100% and be realistic.\n- The counter scenario should ALWAYS have probability >= 10%. Never ignore the risk.\n\nFUNDAMENTAL ANALYSIS:\nCompare the technical setup with the provided recent market news. Filter the news for items relevant to the detected asset. Provide a final fundamental + technical verdict.\n\nTONE: Confident and authoritative, but NOT reckless. You're a trading intelligence tool, not a signal service. Help the trader THINK, not just follow. Do not use generic AI caveats."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this chart and provide a complete trading intelligence report.

` + (assetGuidance ? `${assetGuidance}

` : "") + (trading_style ? `The user's trading style is: ${trading_style}. Adjust your targets, timeframes, and stop-loss logic accordingly.

` : "") + `Here is the latest live financial news from Finnhub:
${newsContext}

Provide: pair, timeframe, trend, risk assessment, setup strength, trade thesis (why/confirm/invalidates), 3 market scenarios (primary/alternative/counter with stories and triggers), key SMC levels, news confluence, and management plan. Be specific with price levels and triggers.`
          },
          { type: "image", image: imageBytes, mediaType: mimeType }
        ]
      }
    ]
  });
  return object2;
}
function detectPairFromFileName(fileName) {
  if (!fileName) return void 0;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USD";
  if (name.includes("eth") || name.includes("ethereum")) return "ETH/USDT";
  if (name.includes("gbp") || name.includes("jpy") || name.includes("pound")) return "GBP/JPY";
  if (name.includes("aapl") || name.includes("apple")) return "AAPL";
  if (name.includes("nasdaq") || name.includes("ndx") || name.includes("us100")) return "NASDAQ";
  return void 0;
}
function generateDynamicMock(fileName, selectedPair, tradingStyle) {
  const pairs = ["BTC/USD", "ETH/USDT", "EUR/USD", "XAU/USD", "GBP/JPY", "AAPL", "NASDAQ"];
  const timeframes = ["15M", "1H", "4H", "1D"];
  const directions = ["BULLISH", "BEARISH", "SIDEWAYS"];
  let pair = selectedPair && selectedPair !== "auto" ? selectedPair : void 0;
  if (!pair) pair = detectPairFromFileName(fileName);
  if (!pair) pair = pairs[Math.floor(Math.random() * pairs.length)];
  const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  const basePrices = {
    "BTC/USD": 64e3,
    "ETH/USDT": 3500,
    "EUR/USD": 1.085,
    "XAU/USD": 2350,
    "GBP/JPY": 190.5,
    "AAPL": 175.5,
    "NASDAQ": 18200
  };
  const base = basePrices[pair] || 100;
  const variance = base * 0.05;
  const entry = base + Math.random() * variance - variance / 2;
  const isBullish = direction === "BULLISH";
  const trend = direction === "SIDEWAYS" ? "NEUTRAL" : direction;
  const rec = direction === "SIDEWAYS" ? "WAIT" : isBullish ? "BUY" : "SELL";
  const spread = base * 0.01;
  const tp1 = isBullish ? entry + spread : entry - spread;
  const tp2 = isBullish ? entry + spread * 2 : entry - spread * 2;
  const tp3 = isBullish ? entry + spread * 3 : entry - spread * 3;
  const sl = isBullish ? entry - spread * 1.5 : entry + spread * 1.5;
  const invalidation = isBullish ? sl - base * 5e-3 : sl + base * 5e-3;
  const p = (n) => pair === "EUR/USD" ? Number(n.toFixed(4)) : Number(n.toFixed(2));
  const patterns = isBullish ? ["Bullish Order Block Mitigation", "Liquidity Sweep & BOS", "Fair Value Gap (FVG) Fill", "Change of Character (ChoCh)"] : ["Bearish Order Block Rejection", "Buy-Side Liquidity Sweep", "Bearish FVG Mitigation", "Bearish ChoCh"];
  const setupStrength = direction === "SIDEWAYS" ? "WEAK" : Math.random() > 0.4 ? "STRONG" : "MODERATE";
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
  const primaryScenario = isBullish ? {
    name: "Bullish Breakout",
    story: `Price breaks above the equal highs at ${p(tp1)} with increasing volume, targeting buy-side liquidity at ${p(tp2)}. The bullish structure is intact and smart money is driving price toward the liquidity pool.`,
    trigger: `4H candle closes above ${p(tp1)} with above-average volume`,
    invalidation_trigger: `Rejection candle at ${p(tp1)} forming a double top`,
    probability: 55,
    entry: `${p(entry)}`,
    sl: p(sl),
    tp1: p(tp1),
    tp2: p(tp2),
    rr: "1:2.5"
  } : direction === "SIDEWAYS" ? {
    name: "Range Continuation",
    story: `Price continues to rotate within the established range, sweeping liquidity on both sides before any directional move. Smart money is likely building positions in the discount zone.`,
    trigger: `Price respects the range boundaries at ${p(tp1)} and ${p(sl)}`,
    invalidation_trigger: `Decisive 4H close outside the range with volume`,
    probability: 50,
    entry: `${p(entry)}`,
    sl: p(sl),
    tp1: p(tp1),
    tp2: p(tp2),
    rr: "1:1.5"
  } : {
    name: "Bearish Continuation",
    story: `Price breaks below support at ${p(tp1)} with increasing selling pressure, targeting sell-side liquidity at ${p(tp2)}. The bearish structure is intact and smart money is pushing toward the discount zone.`,
    trigger: `4H candle closes below ${p(tp1)} with above-average volume`,
    invalidation_trigger: `Bullish rejection at ${p(tp1)} forming a higher low`,
    probability: 55,
    entry: `${p(entry)}`,
    sl: p(sl),
    tp1: p(tp1),
    tp2: p(tp2),
    rr: "1:2.5"
  };
  const alternativeScenario = isBullish ? {
    name: "Pullback Entry",
    story: `Before continuing higher, price retraces to mitigate the bullish Order Block at ${p(entry - spread * 0.3)}, providing a better risk-reward entry for patient traders.`,
    trigger: `1H rejection candle at the ${p(entry - spread * 0.3)} demand zone`,
    invalidation_trigger: `Price sweeps below the OB and closes below ${p(sl)}`,
    probability: 30,
    entry: `${p(entry - spread * 0.3)}`,
    sl: p(sl - spread * 0.2),
    tp1: p(tp1),
    tp2: p(tp2),
    rr: "1:3.0"
  } : direction === "SIDEWAYS" ? {
    name: "Upside Breakout",
    story: `An unexpected bullish catalyst breaks price above the range, triggering buy-side liquidity sweeps and forcing shorts to cover. The move could be swift once range resistance falls.`,
    trigger: `4H close above range resistance with volume spike`,
    invalidation_trigger: `Quick rejection back into range (bull trap)`,
    probability: 25,
    entry: `${p(tp1 + spread * 0.2)}`,
    sl: p(entry - spread * 0.5),
    tp1: p(tp1 + spread * 1.5),
    tp2: p(tp1 + spread * 2.5),
    rr: "1:2.0"
  } : {
    name: "Pullback Entry",
    story: `Before continuing lower, price retraces to mitigate the bearish Order Block at ${p(entry + spread * 0.3)}, providing a better risk-reward entry for patient traders.`,
    trigger: `1H rejection candle at the ${p(entry + spread * 0.3)} supply zone`,
    invalidation_trigger: `Price sweeps above the OB and closes above ${p(sl)}`,
    probability: 30,
    entry: `${p(entry + spread * 0.3)}`,
    sl: p(sl + spread * 0.2),
    tp1: p(tp1),
    tp2: p(tp2),
    rr: "1:3.0"
  };
  const counterScenario = isBullish ? {
    name: "Bearish Failure",
    story: `The bullish setup fails as price rejects at key resistance, forming a bearish Change of Character. Smart money uses the bullish liquidity as a trap before reversing toward sell-side targets.`,
    trigger: `1H bearish engulfing candle at ${p(tp1)} resistance`,
    invalidation_trigger: `Bullish reclaim of ${p(tp1)} with volume`,
    probability: 15,
    entry: `${p(tp1 - spread * 0.1)}`,
    sl: p(tp1 + spread * 0.5),
    tp1: p(sl),
    tp2: p(invalidation),
    rr: "1:2.0"
  } : direction === "SIDEWAYS" ? {
    name: "Downside Breakout",
    story: `Bearish pressure breaks the range to the downside, triggering sell-side liquidity sweeps and forcing longs to liquidate. The move accelerates once support cracks.`,
    trigger: `4H close below range support with volume spike`,
    invalidation_trigger: `Quick reclaim of support (bear trap)`,
    probability: 25,
    entry: `${p(sl - spread * 0.2)}`,
    sl: p(entry + spread * 0.5),
    tp1: p(sl - spread * 1.5),
    tp2: p(sl - spread * 2.5),
    rr: "1:2.0"
  } : {
    name: "Bullish Failure",
    story: `The bearish setup fails as price rejects at key support, forming a bullish Change of Character. Smart money uses the bearish liquidity as a trap before reversing toward buy-side targets.`,
    trigger: `1H bullish engulfing candle at ${p(tp1)} support`,
    invalidation_trigger: `Bearish reclaim of ${p(tp1)} with volume`,
    probability: 15,
    entry: `${p(tp1 + spread * 0.1)}`,
    sl: p(tp1 - spread * 0.5),
    tp1: p(sl),
    tp2: p(invalidation),
    rr: "1:2.0"
  };
  const mockNewsByPair = {
    "XAU/USD": [
      { headline: "US Treasury Yields Slide on Lower Inflation Expectations", source: "Bloomberg", impact: "POSITIVE", explanation: "Lower yields reduce the opportunity cost of holding non-yielding Gold, reinforcing the technical support at $2350." },
      { headline: "Dollar Index Strengthens After Robust Services PMI", source: "Reuters", impact: "NEGATIVE", explanation: "A stronger Dollar pressures Gold prices, potentially delaying the breakout above key resistance at $2370." }
    ],
    "EUR/USD": [
      { headline: "ECB Signals Potential Rate Cut in June Meeting", source: "Reuters", impact: "NEGATIVE", explanation: "Divergence between ECB's dovish tone and Fed's hawkish stance puts fundamental downward pressure on the Euro." },
      { headline: "US Jobless Claims Rise More Than Expected", source: "MarketWatch", impact: "POSITIVE", explanation: "Weak labor data weakens the Dollar, supporting a potential technical bounce from the 1.0840 support area." }
    ],
    "BTC/USD": [
      { headline: "Institutional Inflows to Spot Bitcoin ETFs Accelerate", source: "Coindesk", impact: "POSITIVE", explanation: "Consistent spot buying pressure aligns with the bullish pattern, raising the probability of a breakout above $65,000." },
      { headline: "Regulatory Concerns Re-emerge as SEC Review Guidelines", source: "Bloomberg", impact: "NEUTRAL", explanation: "Short-term regulatory noise is causing consolidation, matching the sideways market structure detected on the chart." }
    ]
  };
  const defaultMockNews = [
    { headline: "Federal Reserve Maintains Hawkish Stance on Inflation", source: "Bloomberg", impact: "NEGATIVE", explanation: "High interest rates for longer strengthen the USD, which is fundamentally bearish for dollar-denominated assets." },
    { headline: "Global Market Sentiment Shifts to Risk-On Amid Earnings Boost", source: "Reuters", impact: "POSITIVE", explanation: "Improved risk appetite supports index and equity prices, reinforcing bullish breakouts in major indexes." }
  ];
  const relevantMockNews = mockNewsByPair[pair] || defaultMockNews;
  const overallSentiment = direction === "SIDEWAYS" ? "NEUTRAL" : direction === "BULLISH" ? "BULLISH" : "BEARISH";
  const verdict = direction === "SIDEWAYS" ? "Sideways consolidation is supported by conflicting fundamentals and lack of clear news drivers." : isBullish ? `Bullish technical setup is confirmed by positive news sentiment, increasing the likelihood of target completion.` : `Bearish technical structure aligns with negative fundamental pressures, supporting a breakdown narrative.`;
  return {
    pair,
    timeframe,
    trend,
    risk_level: setupStrength === "STRONG" ? "LOW" : setupStrength === "MODERATE" ? "MEDIUM" : "HIGH",
    risk_reasons: setupStrength === "STRONG" ? ["Approaching minor liquidity zone", "Slightly decreasing volume on pullbacks"] : ["Approaching major liquidity zone", "Volume decreasing on pullbacks", "Upcoming high-impact news event"],
    invalidation_level: p(invalidation),
    liquidity_zones: {
      buySide: [p(tp2), p(tp3)],
      sellSide: [p(sl), p(invalidation)]
    },
    market_structure: {
      direction,
      structure: isBullish ? "HIGHER_HIGHS" : direction === "BEARISH" ? "LOWER_LOWS" : "CONSOLIDATION",
      bos: p(entry + (isBullish ? -(spread * 0.5) : spread * 0.5))
    },
    key_levels: {
      resistance: [p(tp1), p(tp2)],
      support: [p(sl), p(entry - spread * 0.5)],
      pivot: p(entry)
    },
    recommendation: rec,
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
    scenarios: {
      primary: primaryScenario,
      alternative: alternativeScenario,
      counter: counterScenario
    },
    management: [
      "Wait for 15M candle close to confirm entry.",
      "Move Stop Loss to breakeven after TP1 is hit.",
      "Scale out 50% at TP2 and trail the rest.",
      "Close position manually if price closes past invalidation level."
    ],
    news_impact: {
      relevant_news: relevantMockNews,
      overall_sentiment: overallSentiment,
      verdict
    },
    signal_badge: {
      direction: rec,
      entry: `${p(entry)}`,
      stop_loss: `${p(sl)}`,
      take_profit: `${p(tp2)}`,
      rr: "1:2.5"
    },
    vixor_message: direction === "SIDEWAYS" ? "Market is currently sweeping liquidity in a tight range. Sit on your hands until a clear Break of Structure." : `I have detected a ${setupStrength === "STRONG" ? "high-conviction" : setupStrength === "MODERATE" ? "developing" : "speculative"} ${isBullish ? "bullish" : "bearish"} setup with key confluences. Enter with discipline and respect the invalidation level.`
  };
}
export {
  AnalysisSchema,
  runChartAnalysis
};
