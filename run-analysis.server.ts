import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const AnalysisSchema = z.object({
  pair: z.string().describe("Trading pair detected on the chart, e.g. BTC/USDT, EUR/USD"),
  timeframe: z.string().describe("Chart timeframe, e.g. 1H, 4H, 1D"),
  recommendation: z.enum(["BUY", "SELL", "WAIT"]),
  confidence: z.number().min(0).max(100).describe("0-100 confidence in the recommendation"),
  entry: z.number().describe("Recommended entry price"),
  stop_loss: z.number().describe("Stop loss price"),
  take_profit: z.array(z.number()).length(3).describe("Three take-profit levels, conservative to aggressive"),
  rr: z.string().describe("Approx risk-reward ratio for the balanced target, e.g. '1:2.5'"),
  pattern: z.string().describe("Short summary of detected pattern, e.g. 'Bullish Engulfing + Support Hold'"),
  reasons: z.array(z.string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  scenarios: z.object({
    conservative: z.object({ entry: z.number(), target: z.number(), rr: z.string() }),
    balanced: z.object({ entry: z.number(), target: z.number(), rr: z.string() }),
    aggressive: z.object({ entry: z.number(), target: z.number(), rr: z.string() }),
  }),
  management: z.array(z.string()).min(3).max(6).describe("Step-by-step trade management instructions"),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

export async function runChartAnalysis(imageBytes: Uint8Array, mimeType: string): Promise<AnalysisResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createLovableAiGatewayProvider(apiKey);
  const model = gateway("google/gemini-2.5-pro");

  const { object } = await generateObject({
    model,
    schema: AnalysisSchema,
    messages: [
      {
        role: "system",
        content:
          "You are Vixor, an expert technical-analysis assistant. Analyze the chart image precisely. " +
          "Detect the pair and timeframe from labels. Identify candlestick patterns, support/resistance, " +
          "trend structure, and momentum. Output a single concrete trade plan with strict risk management. " +
          "If the chart is ambiguous or compressing, prefer WAIT. Numbers must be realistic and consistent " +
          "with visible price action. Reasons must be concise and specific (no fluff).",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this chart and return your structured trade plan." },
          { type: "image", image: imageBytes, mediaType: mimeType },
        ],
      },
    ],
  });

  return object;
}
