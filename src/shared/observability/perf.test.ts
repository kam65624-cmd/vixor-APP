// ============================================================================
// VIXOR Observability — Performance Monitoring Tests
// ============================================================================

import { describe, expect, it, beforeEach } from "vitest";
import { startTimer, recordMetric, getMetrics, getPerformanceReport, resetPerfData } from "./perf";

beforeEach(() => {
  resetPerfData();
});

describe("startTimer", () => {
  it("1. returns a timer object with end method", () => {
    const timer = startTimer("test");
    expect(timer).toHaveProperty("end");
    expect(typeof timer.end).toBe("function");
  });

  it("2. returns positive duration from end()", () => {
    const timer = startTimer("fast-op");
    const duration = timer.end();
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(typeof duration).toBe("number");
  });

  it("3. tracks multiple calls to same timer", () => {
    const t1 = startTimer("db-query");
    t1.end();
    const t2 = startTimer("db-query");
    t2.end();

    const report = getPerformanceReport();
    expect(report.timers["db-query"].count).toBe(2);
  });

  it("4. timer duration is finite and reasonable", () => {
    const timer = startTimer("micro-op");
    // Small delay to ensure measurable duration
    const start = performance.now();
    const duration = timer.end();
    const elapsed = performance.now() - start;
    expect(duration).toBeLessThan(100); // should be nearly instant
    expect(elapsed).toBeLessThan(100);
  });
});

describe("recordMetric", () => {
  it("5. records a metric point", () => {
    recordMetric("api.latency", 42);
    const metrics = getMetrics();
    const points = metrics.get("api.latency");
    expect(points).toBeDefined();
    expect(points!.length).toBe(1);
    expect(points![0].value).toBe(42);
  });

  it("6. records tags with metric", () => {
    recordMetric("api.latency", 100, { endpoint: "/api/health" });
    const points = getMetrics().get("api.latency");
    expect(points![0].tags).toEqual({ endpoint: "/api/health" });
    expect(points![0].timestamp).toBeTruthy();
  });

  it("7. records multiple metric points", () => {
    recordMetric("memory", 100);
    recordMetric("memory", 200);
    recordMetric("memory", 300);

    const points = getMetrics().get("memory");
    expect(points!.length).toBe(3);
    expect(points![2].value).toBe(300);
  });
});

describe("getPerformanceReport", () => {
  it("8. returns empty report when no data", () => {
    const report = getPerformanceReport();
    expect(report.timers).toEqual({});
    expect(report.metrics).toEqual({});
  });

  it("9. aggregates timer stats correctly", () => {
    const t1 = startTimer("query");
    t1.end();
    const t2 = startTimer("query");
    t2.end();

    const report = getPerformanceReport();
    expect(report.timers["query"].count).toBe(2);
    expect(report.timers["query"].avgMs).toBeGreaterThanOrEqual(0);
    expect(report.timers["query"].maxMs).toBeGreaterThanOrEqual(report.timers["query"].minMs);
  });

  it("10. aggregates metric stats correctly", () => {
    recordMetric("cpu", 10);
    recordMetric("cpu", 30);
    recordMetric("cpu", 20);

    const report = getPerformanceReport();
    expect(report.metrics["cpu"].last).toBe(20);
    expect(report.metrics["cpu"].avg).toBe(20);
  });
});

describe("resetPerfData", () => {
  it("11. clears all data", () => {
    const t = startTimer("test");
    t.end();
    recordMetric("test-metric", 42);

    resetPerfData();

    expect(getPerformanceReport().timers).toEqual({});
    expect(getPerformanceReport().metrics).toEqual({});
    expect(getMetrics().size).toBe(0);
  });
});
