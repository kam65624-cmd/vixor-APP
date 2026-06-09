// Shared types. Data has moved to the backend (see vixor.functions.ts).
// All mock/demo data has been removed. This file only exports types.

export type Recommendation = "BUY" | "SELL" | "WAIT";

export interface AnalysisItem {
  id: string;
  pair: string | null;
  timeframe: string | null;
  recommendation: Recommendation | null;
  confidence: number | null;
  pattern: string | null;
  status: "queued" | "processing" | "complete" | "failed";
  created_at: string;
}
