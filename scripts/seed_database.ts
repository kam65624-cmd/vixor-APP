/**
 * VIXOR Database Seed Script
 * Seeds: 6 pairs, 10 signals, 3 positions (trades), 4 alerts
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually (no dotenv dependency needed)
const envPath = resolve(import.meta.dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
  if (!process.env[key]) process.env[key] = value;
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo user ID — we'll look up the first profile or use a fixed demo UUID
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

async function findFirstUser(): Promise<string> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();

  if (error) {
    console.log('⚠️  No profiles found. Using demo UUID for seed.');
    return DEMO_USER_ID;
  }
  return data.id;
}

async function seedWatchlistPairs(userId: string): Promise<void> {
  // Find or create default watchlist
  let { data: watchlist } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (!watchlist) {
    const { data: newWl, error } = await supabase
      .from('watchlists')
      .insert({ user_id: userId, name: 'My Watchlist', is_default: true, sort_order: 0 })
      .select('id')
      .single();
    if (error) { console.error('❌ Watchlist create error:', error.message); return; }
    watchlist = newWl;
  }

  const pairs = [
    { pair: 'BTC/USDT', category: 'crypto', notes: 'Bitcoin — primary signal source' },
    { pair: 'ETH/USDT', category: 'crypto', notes: 'Ethereum — DeFi correlation play' },
    { pair: 'SOL/USDT', category: 'crypto', notes: 'Solana — high-beta memecoin proxy' },
    { pair: 'DOGE/USDT', category: 'crypto', notes: 'Dogecoin — memecoin sentiment gauge' },
    { pair: 'PEPE/USDT', category: 'crypto', notes: 'Pepe — high-vol memecoin' },
    { pair: 'WIF/USDT', category: 'crypto', notes: 'dogwifhat — trending memecoin' },
  ];

  // Clear existing items for this watchlist
  await supabase.from('watchlist_items').delete().eq('watchlist_id', watchlist.id);

  const items = pairs.map((p, i) => ({
    watchlist_id: watchlist!.id,
    pair: p.pair,
    category: p.category,
    notes: p.notes,
    sort_order: i,
  }));

  const { error } = await supabase.from('watchlist_items').insert(items);
  if (error) {
    console.error('❌ Watchlist items seed error:', error.message);
    return;
  }
  console.log(`✅ Seeded ${pairs.length} pairs into watchlist "${watchlist!.id}"`);
}

async function seedSignals(): Promise<void> {
  // Clear existing signals
  const { count: existingCount } = await supabase
    .from('daily_signals')
    .select('*', { count: 'exact', head: true });

  if (existingCount && existingCount > 0) {
    await supabase.from('daily_signals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const signals = [
    {
      pair: 'BTC/USDT', timeframe: '4H', recommendation: 'BUY', confidence: 82,
      entry: 104500, stop_loss: 102800, take_profit: [108000, 112000],
      reasons: ['Bullish engulfing at key support', 'RSI oversold bounce on 4H', 'Volume surge at demand zone'],
      pattern: 'Bullish Engulfing',
      market_structure: { trend: 'bullish', swing_high: 109000, swing_low: 101200, structure: 'higher_lows' },
      liquidity_zones: [{ level: 102500, type: 'demand' }, { level: 108500, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'ETH/USDT', timeframe: '4H', recommendation: 'BUY', confidence: 75,
      entry: 3520, stop_loss: 3380, take_profit: [3700, 3950],
      reasons: ['Double bottom formation', 'ETH/BTC ratio breaking out', 'DeFi TVL increasing'],
      pattern: 'Double Bottom',
      market_structure: { trend: 'neutral_to_bullish', swing_high: 3650, swing_low: 3280, structure: 'range_breakout' },
      liquidity_zones: [{ level: 3390, type: 'demand' }, { level: 3640, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'SOL/USDT', timeframe: '1H', recommendation: 'BUY', confidence: 91,
      entry: 178, stop_loss: 172, take_profit: [185, 195, 210],
      reasons: ['Breaking ascending triangle resistance', 'On-chain volume 3x average', 'Meme sector rotation into SOL'],
      pattern: 'Ascending Triangle Breakout',
      market_structure: { trend: 'strong_bullish', swing_high: 179, swing_low: 162, structure: 'breakout' },
      liquidity_zones: [{ level: 173, type: 'demand' }, { level: 186, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'DOGE/USDT', timeframe: '1H', recommendation: 'WAIT', confidence: 55,
      entry: null, stop_loss: null, take_profit: [],
      reasons: ['Inside bar consolidation', 'No clear directional bias', 'Awaiting BTC direction'],
      pattern: 'Inside Bar',
      market_structure: { trend: 'neutral', swing_high: 0.185, swing_low: 0.162, structure: 'consolidation' },
      liquidity_zones: [{ level: 0.163, type: 'demand' }, { level: 0.184, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'PEPE/USDT', timeframe: '15M', recommendation: 'SELL', confidence: 78,
      entry: 0.0000142, stop_loss: 0.0000155, take_profit: [0.0000125, 0.000011],
      reasons: ['Bearish divergence on RSI', 'Rejected at 0.618 Fibonacci', 'Volume declining on highs'],
      pattern: 'Bearish Divergence',
      market_structure: { trend: 'bearish', swing_high: 0.0000158, swing_low: 0.000012, structure: 'lower_highs' },
      liquidity_zones: [{ level: 0.0000125, type: 'demand' }, { level: 0.0000155, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'WIF/USDT', timeframe: '1H', recommendation: 'BUY', confidence: 68,
      entry: 2.85, stop_loss: 2.65, take_profit: [3.2, 3.6],
      reasons: ['Bounce off 200 EMA', 'Social sentiment spike (+340%)', 'Whale accumulation detected'],
      pattern: 'EMA Bounce',
      market_structure: { trend: 'bullish', swing_high: 3.4, swing_low: 2.5, structure: 'higher_lows' },
      liquidity_zones: [{ level: 2.6, type: 'demand' }, { level: 3.35, type: 'supply' }],
      signal_date: '2026-06-24',
    },
    {
      pair: 'BTC/USDT', timeframe: '1D', recommendation: 'BUY', confidence: 88,
      entry: 103000, stop_loss: 98000, take_profit: [110000, 125000],
      reasons: ['Weekly MA cross bullish', 'Halving cycle alignment', 'Institutional inflows +$2.1B weekly'],
      pattern: 'Golden Cross',
      market_structure: { trend: 'bullish', swing_high: 109000, swing_low: 89000, structure: 'macro_uptrend' },
      liquidity_zones: [{ level: 99000, type: 'demand' }, { level: 110000, type: 'supply' }],
      signal_date: '2026-06-23',
    },
    {
      pair: 'ETH/USDT', timeframe: '1D', recommendation: 'WAIT', confidence: 52,
      entry: null, stop_loss: null, take_profit: [],
      reasons: ['Range-bound between 3280-3650', 'Awaiting ETH ETF decision catalyst', 'Low volatility compression'],
      pattern: 'Range Consolidation',
      market_structure: { trend: 'neutral', swing_high: 3650, swing_low: 3280, structure: 'range' },
      liquidity_zones: [{ level: 3300, type: 'demand' }, { level: 3620, type: 'supply' }],
      signal_date: '2026-06-23',
    },
    {
      pair: 'SOL/USDT', timeframe: '4H', recommendation: 'BUY', confidence: 85,
      entry: 172, stop_loss: 165, take_profit: [185, 200],
      reasons: ['Firedancer upgrade catalyst', 'DeFi TVL ATH on Solana', 'Meme coin launchpad dominance'],
      pattern: 'Cup and Handle',
      market_structure: { trend: 'strong_bullish', swing_high: 195, swing_low: 148, structure: 'breakout' },
      liquidity_zones: [{ level: 166, type: 'demand' }, { level: 194, type: 'supply' }],
      signal_date: '2026-06-22',
    },
    {
      pair: 'PEPE/USDT', timeframe: '1H', recommendation: 'SELL', confidence: 83,
      entry: 0.000015, stop_loss: 0.0000162, take_profit: [0.000013, 0.000011],
      reasons: ['Rising wedge breakdown', 'On-chain selling pressure from top holders', 'Market cap divergence from volume'],
      pattern: 'Rising Wedge Breakdown',
      market_structure: { trend: 'bearish', swing_high: 0.000016, swing_low: 0.0000105, structure: 'lower_highs' },
      liquidity_zones: [{ level: 0.000011, type: 'demand' }, { level: 0.000016, type: 'supply' }],
      signal_date: '2026-06-22',
    },
  ];

  const { error } = await supabase.from('daily_signals').insert(signals);
  if (error) {
    console.error('❌ Signals seed error:', error.message);
    return;
  }
  console.log(`✅ Seeded ${signals.length} signals`);
}

async function seedTrades(userId: string): Promise<void> {
  // Clear existing trades for this user
  await supabase.from('trades').delete().eq('user_id', userId);

  const trades = [
    {
      user_id: userId,
      pair: 'SOL/USDT',
      direction: 'long',
      status: 'open',
      entry_price: 168.5,
      entry_date: '2026-06-20T14:30:00Z',
      quantity: 10,
      stop_loss: 162,
      take_profit: 195,
      strategy: 'Breakout Momentum',
      tags: ['breakout', 'momentum', 'sol'],
      notes: 'Ascending triangle breakout on 4H — strong on-chain volume confirmation',
    },
    {
      user_id: userId,
      pair: 'PEPE/USDT',
      direction: 'short',
      status: 'open',
      entry_price: 0.0000158,
      entry_date: '2026-06-21T09:15:00Z',
      quantity: 50000000,
      stop_loss: 0.0000165,
      take_profit: 0.000012,
      strategy: 'Divergence Short',
      tags: ['divergence', 'short', 'memecoin'],
      notes: 'Bearish RSI divergence at 0.618 fib — rising wedge topping pattern',
    },
    {
      user_id: userId,
      pair: 'BTC/USDT',
      direction: 'long',
      status: 'closed',
      entry_price: 99500,
      entry_date: '2026-06-15T10:00:00Z',
      exit_price: 106200,
      exit_date: '2026-06-19T16:45:00Z',
      quantity: 0.5,
      stop_loss: 97500,
      take_profit: 108000,
      strategy: 'Demand Zone Bounce',
      tags: ['demand_zone', 'swing_trade', 'btc'],
      notes: 'Bounced off $100k psychological demand zone — closed at resistance ahead of retest',
    },
  ];

  const { error } = await supabase.from('trades').insert(trades);
  if (error) {
    console.error('❌ Trades seed error:', error.message);
    return;
  }
  console.log(`✅ Seeded ${trades.length} trades (2 open, 1 closed)`);
}

async function seedAlerts(userId: string): Promise<void> {
  // Clear existing alerts
  await supabase.from('price_alerts').delete().eq('user_id', userId);

  const alerts = [
    {
      user_id: userId,
      symbol: 'BTC',
      pair: 'BTC/USDT',
      condition: 'crosses_up',
      target_price: 110000,
      current_price: 104500,
      status: 'active',
      note: 'Psychological resistance + prior swing high',
      timeframe: '4H',
    },
    {
      user_id: userId,
      symbol: 'ETH',
      pair: 'ETH/USDT',
      condition: 'above',
      target_price: 3700,
      current_price: 3520,
      status: 'active',
      note: 'Range upper boundary breakout',
      timeframe: '4H',
    },
    {
      user_id: userId,
      symbol: 'SOL',
      pair: 'SOL/USDT',
      condition: 'crosses_down',
      target_price: 165,
      current_price: 178,
      status: 'active',
      note: 'Stop loss zone — invalidation level for bullish setup',
      timeframe: '1H',
    },
    {
      user_id: userId,
      symbol: 'PEPE',
      pair: 'PEPE/USDT',
      condition: 'below',
      target_price: 0.00001,
      current_price: 0.0000142,
      status: 'active',
      note: 'Major demand zone — potential reversal area',
      timeframe: '15M',
    },
  ];

  const { error } = await supabase.from('price_alerts').insert(alerts);
  if (error) {
    console.error('❌ Alerts seed error:', error.message);
    return;
  }
  console.log(`✅ Seeded ${alerts.length} price alerts`);
}

async function main() {
  console.log('🌱 VIXOR Database Seed');
  console.log('========================\n');

  const userId = await findFirstUser();
  console.log(`👤 Target user: ${userId}\n`);

  await seedWatchlistPairs(userId);
  await seedSignals();
  await seedTrades(userId);
  await seedAlerts(userId);

  console.log('\n✅ Seed complete! Blocker 4 resolved.');
}

main().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});