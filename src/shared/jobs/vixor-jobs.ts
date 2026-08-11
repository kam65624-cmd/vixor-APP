// ============================================================================
// VIXOR Cron Jobs — Registers all VIXOR background jobs with the JobScheduler
// ============================================================================
//
// 1. signal-monitor  — Monitors active signal trackings against live prices (30s)
// 2. signal-expiry   — Expires signals past their expires_at (60s)
// 3. reanalysis      — Re-analyzes active signals periodically (5min)
// 4. opportunity-scan — Scans for new opportunities (15min)
// 5. event-cleanup   — Cleans old domain_events older than 7 days (24h)
//
// Usage:
//   import { startVixorJobs } from "@/shared/jobs/vixor-jobs";
//   startVixorJobs(); // call once at server startup
// ============================================================================

import { JobScheduler, type JobDefinition } from "./scheduler";

// ── Job Interval Constants (ms) ──────────────────────────────────────────────

const SIGNAL_MONITOR_INTERVAL_MS = 30_000; // 30 seconds
const SIGNAL_EXPIRY_INTERVAL_MS = 60_000; // 60 seconds
const REANALYSIS_INTERVAL_MS = 5 * 60_000; // 5 minutes
const OPPORTUNITY_SCAN_INTERVAL_MS = 15 * 60_000; // 15 minutes
const EVENT_CLEANUP_INTERVAL_MS = 24 * 60 * 60_000; // 24 hours

// ── Job Definitions ──────────────────────────────────────────────────────────

/**
 * signal-monitor: Monitors active signal trackings against live prices.
 * Uses executeSignalTransition from signal-tracking domain.
 */
const signalMonitorJob: JobDefinition<Record<string, never>> = {
  name: "signal-monitor",
  retryCount: 1,
  retryDelayMs: 5000,
  timeoutMs: 60_000,
  handler: async () => {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { MONITORED_STATUSES } = await import("@/domains/signal-tracking/types");
    const { executeSignalTransition } =
      await import("@/domains/signal-tracking/signal-transition.service");
    const { MarketDataGateway } = await import("@/shared/market-data/market-data-gateway");
    const gateway = MarketDataGateway.getInstance();

    // Fetch all monitored signal trackings
    const { data: trackings, error } = await supabaseAdmin
      .from("signal_tracking")
      .select(
        "id, user_id, pair, direction, entry_price, stop_loss, take_profit, status, current_price, updated_at",
      )
      .in("status", MONITORED_STATUSES)
      .limit(500);

    if (error || !trackings || trackings.length === 0) {
      return;
    }

    // Process each tracking with live price
    for (const tracking of trackings) {
      try {
        const quote = await gateway.getQuote(tracking.pair);
        if (!quote || !quote.price) continue;

        const price = quote.price;
        await executeSignalTransition(supabaseAdmin as any, tracking.user_id, {
          trackingId: tracking.id,
          observedPrice: price,
          observedAt: new Date().toISOString(),
          currentVersion: tracking.updated_at,
          actor: "system",
        });
      } catch (err) {
        console.warn(
          `[SignalMonitor] Failed for ${tracking.id}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  },
};

/**
 * signal-expiry: Expires signals past their expires_at timestamp.
 */
const signalExpiryJob: JobDefinition<Record<string, never>> = {
  name: "signal-expiry",
  retryCount: 1,
  retryDelayMs: 10_000,
  timeoutMs: 60_000,
  handler: async () => {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { MONITORED_STATUSES } = await import("@/domains/signal-tracking/types");
    const { executeSignalTransition } =
      await import("@/domains/signal-tracking/signal-transition.service");

    const now = new Date().toISOString();

    // Find signals that have expired but are still in monitored states
    const { data: expired, error } = await supabaseAdmin
      .from("signal_tracking")
      .select("id, user_id, pair, direction, status, current_price, updated_at")
      .in("status", MONITORED_STATUSES)
      .lt("expires_at", now)
      .limit(500);

    if (error || !expired || expired.length === 0) {
      return;
    }

    for (const tracking of expired) {
      try {
        await executeSignalTransition(supabaseAdmin as any, tracking.user_id, {
          trackingId: tracking.id,
          observedPrice: tracking.current_price ?? 0,
          observedAt: now,
          requestedTransition: "expired",
          currentVersion: tracking.updated_at,
          actor: "system",
        });
      } catch (err) {
        console.warn(
          `[SignalExpiry] Failed for ${tracking.id}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  },
};

/**
 * reanalysis: Re-analyzes active analysis signals periodically.
 * Uses reanalyzeAllActiveAnalysisSignals from analysis domain.
 */
const reanalysisJob: JobDefinition<Record<string, never>> = {
  name: "reanalysis",
  retryCount: 1,
  retryDelayMs: 30_000,
  timeoutMs: 120_000,
  handler: async () => {
    const { reanalyzeAllActiveAnalysisSignals } = await import("@/domains/analysis/reanalysis");
    const result = await reanalyzeAllActiveAnalysisSignals();
    console.log(
      `[Reanalysis] Completed: ${result.processed}/${result.total} processed, ${result.notified} notified, ${result.errors} errors`,
    );
  },
};

/**
 * opportunity-scan: Scans for new trading opportunities.
 * Uses scanForOpportunities from analysis domain.
 * Caches results for MOXI context.
 */
const opportunityScanJob: JobDefinition<Record<string, never>> = {
  name: "opportunity-scan",
  retryCount: 1,
  retryDelayMs: 60_000,
  timeoutMs: 300_000, // 5 min — scanning many pairs can be slow
  handler: async () => {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { scanForOpportunities, setScanFetcher } =
      await import("@/domains/analysis/opportunity-scanner");
    const { fetchBinanceKlines } = await import("@/domains/market/server/price-fetcher");

    // Set up fetcher
    setScanFetcher(async (pair, timeframe, limit) => {
      const klines = await fetchBinanceKlines(pair, timeframe, limit);
      return klines.map((k) => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
      }));
    });

    // Get pairs to scan from watchlists or a default list
    const defaultPairs = [
      "BTC/USDT",
      "ETH/USDT",
      "SOL/USDT",
      "BNB/USDT",
      "XRP/USDT",
      "ADA/USDT",
      "DOGE/USDT",
      "AVAX/USDT",
      "DOT/USDT",
      "LINK/USDT",
      "MATIC/USDT",
      "UNI/USDT",
      "ATOM/USDT",
      "LTC/USDT",
      "NEAR/USDT",
      "APT/USDT",
      "AR/USDT",
      "OP/USDT",
      "ARB/USDT",
      "SUI/USDT",
    ];

    try {
      const result = await scanForOpportunities(defaultPairs, {
        minConfidence: 70,
        timeframes: ["1H", "4H"],
        maxResults: 15,
      });

      console.log(
        `[OpportunityScan] Found ${result.opportunities.length} opportunities from ${result.totalScanned} scans (${result.scanDurationMs}ms)`,
      );

      // Cache for MOXI context (5-min TTL)
      const { cache, CACHE_TTL } = await import("@/shared/cache");
      await cache.set(
        "opportunities:latest",
        result.opportunities,
        5 * 60_000, // 5 minutes
      );
    } catch (err) {
      console.warn(
        `[OpportunityScan] Scan failed:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  },
};

/**
 * event-cleanup: Cleans old domain_events (older than 7 days).
 */
const eventCleanupJob: JobDefinition<Record<string, never>> = {
  name: "event-cleanup",
  retryCount: 1,
  retryDelayMs: 60_000,
  timeoutMs: 120_000,
  handler: async () => {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60_1000).toISOString();

    const { error, count } = await supabaseAdmin
      .from("domain_events")
      .delete({ count: "exact" as any })
      .lt("created_at", cutoffDate);

    if (error) {
      console.warn(`[EventCleanup] Failed to clean old events:`, error.message);
    } else {
      console.log(`[EventCleanup] Deleted ${count} events older than ${cutoffDate}`);
    }
  },
};

// ── Registration & Scheduling ────────────────────────────────────────────────

const ALL_VIXOR_JOBS: JobDefinition<unknown>[] = [
  signalMonitorJob as JobDefinition<unknown>,
  signalExpiryJob as JobDefinition<unknown>,
  reanalysisJob as JobDefinition<unknown>,
  opportunityScanJob as JobDefinition<unknown>,
  eventCleanupJob as JobDefinition<unknown>,
];

const JOB_INTERVALS: Record<string, number> = {
  "signal-monitor": SIGNAL_MONITOR_INTERVAL_MS,
  "signal-expiry": SIGNAL_EXPIRY_INTERVAL_MS,
  reanalysis: REANALYSIS_INTERVAL_MS,
  "opportunity-scan": OPPORTUNITY_SCAN_INTERVAL_MS,
  "event-cleanup": EVENT_CLEANUP_INTERVAL_MS,
};

/**
 * Register all VIXOR job definitions with the scheduler.
 * Does NOT start the recurring schedules — call startVixorJobs() for that.
 */
export function registerVixorJobs(): void {
  const scheduler = JobScheduler.getInstance();
  for (const job of ALL_VIXOR_JOBS) {
    scheduler.register(job);
  }
  console.log(`[VixorJobs] Registered ${ALL_VIXOR_JOBS.length} job definitions`);
}

/**
 * Start all VIXOR recurring jobs.
 * Registers definitions if not already registered, then schedules each job.
 */
export function startVixorJobs(): void {
  const scheduler = JobScheduler.getInstance();

  // Register all jobs
  registerVixorJobs();

  // Schedule each job with its interval
  for (const job of ALL_VIXOR_JOBS) {
    const intervalMs = JOB_INTERVALS[job.name]!;
    scheduler.schedule(job.name, {}, intervalMs);
  }

  console.log(`[VixorJobs] Started ${ALL_VIXOR_JOBS.length} recurring jobs`);
}

/** Exported for testing */
export { ALL_VIXOR_JOBS, JOB_INTERVALS };
