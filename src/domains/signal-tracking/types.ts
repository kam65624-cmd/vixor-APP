// ============================================================================
// VIXOR Signal Tracking — Domain Types
// ============================================================================

export type SignalStatus =
  | 'pending'
  | 'active'
  | 'tp1_hit'
  | 'tp2_hit'
  | 'tp3_hit'
  | 'sl_hit'
  | 'expired'
  | 'cancelled';

export type SignalSourceType = 'daily_signal' | 'analysis';

export interface SignalTracking {
  id: string;
  user_id: string;
  signal_id: string | null;
  source_type: SignalSourceType;
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  status: SignalStatus;
  current_price: number | null;
  previous_price: number | null;
  max_favorable_excursion: number;
  max_adverse_excursion: number;
  hit_tp: number;
  activated_at: string | null;
  resolved_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSignalTrackingInput {
  signalId?: string;
  sourceType?: SignalSourceType;
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number[] | null;
  expiresAt?: string | null;
}

export interface SignalPriceCheck {
  tracking: SignalTracking;
  currentPrice: number;
  hitType: 'entry_reached' | 'tp_hit' | 'sl_hit' | 'none';
  tpLevel?: number;
}

/** Status config for UI rendering */
export const SIGNAL_STATUS_CONFIG: Record<SignalStatus, { label: string; color: string; icon: string }> = {
  pending:   { label: 'Pending',   color: 'var(--color-neutral-wait)', icon: '⏳' },
  active:    { label: 'Active',    color: 'var(--color-bullish)',      icon: '🎯' },
  tp1_hit:   { label: 'TP1 Hit',   color: 'var(--color-bullish)',      icon: '✅' },
  tp2_hit:   { label: 'TP2 Hit',   color: 'var(--color-bullish)',      icon: '✅' },
  tp3_hit:   { label: 'TP3 Hit',   color: 'var(--color-bullish)',      icon: '✅' },
  sl_hit:    { label: 'SL Hit',    color: 'var(--color-bearish)',      icon: '🛑' },
  expired:   { label: 'Expired',   color: 'var(--color-muted-foreground)', icon: '⏰' },
  cancelled: { label: 'Cancelled', color: 'var(--color-muted-foreground)', icon: '❌' },
};

/** Terminal statuses — no further price monitoring needed */
export const TERMINAL_STATUSES: SignalStatus[] = ['tp1_hit', 'tp2_hit', 'tp3_hit', 'sl_hit', 'expired', 'cancelled'];