// ============================================================================
// Analysis Domain — Types
// ============================================================================

export interface AnalysisRow {
  id: string;
  user_id: string;
  image_path: string | null;
  status: string;
  pair: string | null;
  timeframe: string | null;
  trend: string | null;
  risk_level: string | null;
  risk_reasons: string[] | null;
  invalidation_level: number | null;
  liquidity_zones: any | null;
  market_structure: any | null;
  key_levels: any | null;
  recommendation: string | null;
  confidence: number | null;
  entry: number | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  rr: string | null;
  pattern: string | null;
  reasons: string[] | null;
  scenarios: any | null;
  management: string[] | null;
  news: any | null;
  raw_ai_response: any | null;
  source: string | null;
  signal_badge: any | null;
  vixor_message: string | null;
  created_at: string;
  updated_at: string;
  error_message: string | null;
}

export interface CreateAnalysisInput {
  imageBase64: string;
  mimeType: string;
  fileName?: string;
  selectedPair?: string;
  tradingStyle?: string;
}

export interface QuickAnalyzeInput {
  pair: string;
  timeframe: string;
  tradingStyle: string;
}

export interface AnalysisListItem {
  id: string;
  pair: string | null;
  timeframe: string | null;
  recommendation: string | null;
  confidence: number | null;
  pattern: string | null;
  status: string;
  created_at: string;
}
