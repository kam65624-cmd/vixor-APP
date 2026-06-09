import { g as generateObject } from "../_libs/ai.mjs";
import { g as google } from "../_libs/ai-sdk__google.mjs";
import { runLocalAnalysis } from "./engine-xaDgdmy-.mjs";
import "../_libs/lightweight-charts-indicators.mjs";
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
import "../_libs/oakscriptjs.mjs";
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
  confidence: number().min(0).max(100).describe("0-100 confidence in the recommendation"),
  entry: number().describe("Recommended entry price"),
  stop_loss: number().describe("Stop loss price"),
  take_profit: array(number()).length(3).describe("Three take-profit levels, conservative to aggressive"),
  rr: string().describe("Approx risk-reward ratio for the balanced target, e.g. '1:2.5'"),
  pattern: string().describe("Short summary of detected pattern, e.g. 'Bullish Engulfing + Support Hold'"),
  reasons: array(string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  scenarios: object({
    conservative: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() }),
    balanced: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() }),
    aggressive: object({ name: string(), probability: number(), entry: string(), sl: number(), tp1: number(), tp2: number(), rr: string() })
  }),
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
async function runChartAnalysis(imageBytes, mimeType, fileName, selectedPair, trading_style) {
  const pair = selectedPair || detectPairFromFileName(fileName) || "EUR/USD";
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[Vixor] Running local SMC/ICT analysis engine...");
  const localResult = runLocalAnalysis({
    pair,
    timeframe: inferTimeframeFromTradingStyle(trading_style)
  });
  if (localResult.confidence >= 60 || !apiKey) {
    console.log(`[Vixor] Local analysis complete: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`);
    const result = {
      ...localResult,
      market_structure: {
        ...localResult.market_structure,
        direction: localResult.market_structure.direction === "NEUTRAL" ? "SIDEWAYS" : localResult.market_structure.direction
      },
      news_impact: {
        ...localResult.news_impact,
        overall_sentiment: localResult.news_impact.overall_sentiment === "NEUTRAL" ? "NEUTRAL" : localResult.news_impact.overall_sentiment
      }
    };
    return result;
  }
  if (apiKey) {
    try {
      console.log("[Vixor] Local confidence low, attempting Gemini AI vision analysis...");
      const geminiResult = await runGeminiAnalysis(imageBytes, mimeType, fileName, pair, trading_style);
      console.log("[Vixor] Gemini analysis completed successfully.");
      return geminiResult;
    } catch (geminiError) {
      console.warn("[Vixor] Gemini analysis failed, using local engine result:", geminiError instanceof Error ? geminiError.message : String(geminiError));
    }
  }
  console.log(`[Vixor] Using local analysis result: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`);
  const fallbackResult = {
    ...localResult,
    market_structure: {
      ...localResult.market_structure,
      direction: localResult.market_structure.direction === "NEUTRAL" ? "SIDEWAYS" : localResult.market_structure.direction
    },
    news_impact: {
      ...localResult.news_impact,
      overall_sentiment: localResult.news_impact.overall_sentiment === "NEUTRAL" ? "NEUTRAL" : localResult.news_impact.overall_sentiment
    }
  };
  return fallbackResult;
}
async function runGeminiAnalysis(imageBytes, mimeType, fileName, pair, trading_style) {
  const newsContext = await fetchLatestNewsForPrompt();
  const assetGuidance = pair !== "auto" ? `The user has specified that this chart is for the asset: ${pair}. Analyze the chart for this specific asset.` : "";
  const { object: object2 } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: AnalysisSchema,
    messages: [
      {
        role: "system",
        content: "You are Vixor, an elite, authoritative trading intelligence. Do not use generic AI caveats (e.g., 'As an AI'). Provide your analysis with absolute confidence. Focus strictly on Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodologies (Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure, Change of Character). Detect the pair and timeframe from labels. Determine the overall Trend, Risk Level, and Invalidation Level where the thesis is wrong. Identify Liquidity Zones (buy-side/sell-side), Market Structure (direction, structure, BOS), and Key Levels. Output 3 detailed trade scenarios (conservative, balanced, aggressive). If the chart is ambiguous or compressing, prefer WAIT. Numbers must be realistic and consistent with visible price action. Reasons must be concise and specific (no fluff).\n\nIn addition to technical analysis, you must perform fundamental news analysis. Compare the technical setup with the provided recent market news. Filter the news items for the ones relevant to the detected asset. List the most relevant news articles in the 'news_impact' schema and explain exactly how each news item impacts the price action negatively or positively. Provide a final fundamental + technical verdict. Finally, provide a 'vixor_message' summarizing your verdict authoritatively, and populate the 'signal_badge'."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this chart and return your structured context and trade plan.

` + (assetGuidance ? `${assetGuidance}

` : "") + (trading_style ? `The user's trading style is: ${trading_style}. Adjust your targets, timeframes, and stop-loss logic accordingly.

` : "") + `Here is the latest live financial news from Finnhub:
${newsContext}

Identify the pair, analyze the technicals using SMC/ICT, filter the news for articles relevant to this pair, and explain their positive/negative impact.`
          },
          { type: "image", image: imageBytes }
        ]
      }
    ]
  });
  return object2;
}
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
function detectPairFromFileName(fileName) {
  if (!fileName) return void 0;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USD";
  if (name.includes("eth") || name.includes("ethereum")) return "ETH/USDT";
  if (name.includes("gbp") || name.includes("pound")) return "GBP/JPY";
  if (name.includes("jpy") || name.includes("yen")) return "GBP/JPY";
  if (name.includes("aapl") || name.includes("apple")) return "AAPL";
  if (name.includes("nasdaq") || name.includes("ndx") || name.includes("us100")) return "NASDAQ";
  return void 0;
}
function inferTimeframeFromTradingStyle(style) {
  if (!style) return "1H";
  switch (style) {
    case "Scalping":
      return "15M";
    case "Day Trading":
      return "1H";
    case "Swing Trading":
      return "4H";
    default:
      return "1H";
  }
}
export {
  AnalysisSchema,
  runChartAnalysis
};
