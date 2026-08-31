// ============================================================================
// VIXOR Observability — Performance Monitoring Utilities
// ============================================================================
//
// Lightweight performance timers, metric recording, and reporting.
// Uses in-memory storage — no external dependencies.
//
// Usage:
//   const timer = startTimer('db-query');
//   // ... do work ...
//   const duration = timer.end(); // ms
//   recordMetric('api.latency', duration, { endpoint: '/api/health' });
//   const report = getPerformanceReport();
// ============================================================================

export interface PerformanceTimer {
  /** Stop the timer and return the duration in ms. */
  end(): number;
}

// ── Timer tracking ──────────────────────────────────────────────────────────

interface TimerRecord {
  durations: number[];
}

const timerStore = new Map<string, TimerRecord>();

/**
 * Start a named performance timer.
 *
 * Returns a PerformanceTimer object. Call `.end()` to stop the timer
 * and record the duration.
 */
export function startTimer(label: string): PerformanceTimer {
  const start = performance.now();

  return {
    end(): number {
      const duration = performance.now() - start;

      let record = timerStore.get(label);
      if (!record) {
        record = { durations: [] };
        timerStore.set(label, record);
      }
      record.durations.push(duration);

      return duration;
    },
  };
}

// ── Metric recording ────────────────────────────────────────────────────────

interface MetricPoint {
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

const metricStore = new Map<string, MetricPoint[]>();

/**
 * Record a metric data point.
 *
 * @param name  — The metric name (e.g., 'api.latency')
 * @param value — The numeric value
 * @param tags  — Optional key-value tags for grouping/filtering
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  let points = metricStore.get(name);
  if (!points) {
    points = [];
    metricStore.set(name, points);
  }
  points.push({
    value,
    tags: tags ?? {},
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get all recorded metric points for a given name.
 *
 * Returns an array of { value, tags, timestamp } entries.
 * If no name is provided, returns the entire store as a Map.
 */
export function getMetrics(): Map<
  string,
  { value: number; tags: Record<string, string>; timestamp: string }[]
> {
  return metricStore;
}

// ── Performance report ──────────────────────────────────────────────────────

interface TimerSummary {
  count: number;
  avgMs: number;
  maxMs: number;
  minMs: number;
}

interface MetricSummary {
  last: number;
  avg: number;
}

export interface PerformanceReport {
  timers: Record<string, TimerSummary>;
  metrics: Record<string, MetricSummary>;
}

/**
 * Create a performance report summary.
 *
 * Aggregates all timer data (count, avg, max, min) and metric data
 * (last value, avg value) into a single report object.
 */
export function getPerformanceReport(): PerformanceReport {
  const timers: Record<string, TimerSummary> = {};
  const metrics: Record<string, MetricSummary> = {};

  // Aggregate timers
  for (const [label, record] of timerStore.entries()) {
    if (record.durations.length === 0) continue;
    const sum = record.durations.reduce((a, b) => a + b, 0);
    timers[label] = {
      count: record.durations.length,
      avgMs: sum / record.durations.length,
      maxMs: Math.max(...record.durations),
      minMs: Math.min(...record.durations),
    };
  }

  // Aggregate metrics
  for (const [name, points] of metricStore.entries()) {
    if (points.length === 0) continue;
    const sum = points.reduce((a, b) => a + b.value, 0);
    metrics[name] = {
      last: points[points.length - 1].value,
      avg: sum / points.length,
    };
  }

  return { timers, metrics };
}

/**
 * Reset all stored timers and metrics.
 * Primarily used in tests.
 */
export function resetPerfData(): void {
  timerStore.clear();
  metricStore.clear();
}
