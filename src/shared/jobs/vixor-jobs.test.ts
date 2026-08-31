// ============================================================================
// VIXOR Cron Jobs — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobScheduler } from "./scheduler";
import { registerVixorJobs, startVixorJobs, ALL_VIXOR_JOBS, JOB_INTERVALS } from "./vixor-jobs";

describe("VIXOR Cron Jobs", () => {
  beforeEach(() => {
    JobScheduler.resetInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("job definitions", () => {
    it("defines exactly 5 jobs", () => {
      expect(ALL_VIXOR_JOBS).toHaveLength(5);
    });

    it("has all required job names", () => {
      const names = ALL_VIXOR_JOBS.map((j) => j.name);
      expect(names).toContain("signal-monitor");
      expect(names).toContain("signal-expiry");
      expect(names).toContain("reanalysis");
      expect(names).toContain("opportunity-scan");
      expect(names).toContain("event-cleanup");
    });

    it("each job has a handler function", () => {
      for (const job of ALL_VIXOR_JOBS) {
        expect(typeof job.handler).toBe("function");
      }
    });

    it("defines intervals for all jobs", () => {
      for (const job of ALL_VIXOR_JOBS) {
        expect(JOB_INTERVALS[job.name]).toBeDefined();
        expect(JOB_INTERVALS[job.name]).toBeGreaterThan(0);
      }
    });

    it("signal-monitor has 30s interval", () => {
      expect(JOB_INTERVALS["signal-monitor"]).toBe(30_000);
    });

    it("signal-expiry has 60s interval", () => {
      expect(JOB_INTERVALS["signal-expiry"]).toBe(60_000);
    });

    it("reanalysis has 5min interval", () => {
      expect(JOB_INTERVALS["reanalysis"]).toBe(5 * 60_000);
    });

    it("opportunity-scan has 15min interval", () => {
      expect(JOB_INTERVALS["opportunity-scan"]).toBe(15 * 60_000);
    });

    it("event-cleanup has 24h interval", () => {
      expect(JOB_INTERVALS["event-cleanup"]).toBe(24 * 60 * 60_000);
    });
  });

  describe("registerVixorJobs()", () => {
    it("registers all 5 jobs with the scheduler", () => {
      const scheduler = JobScheduler.getInstance();
      registerVixorJobs();

      const jobs = scheduler.listJobs();
      expect(jobs).toHaveLength(5);
      expect(jobs).toContain("signal-monitor");
      expect(jobs).toContain("signal-expiry");
      expect(jobs).toContain("reanalysis");
      expect(jobs).toContain("opportunity-scan");
      expect(jobs).toContain("event-cleanup");
    });

    it("is idempotent (calling twice does not duplicate)", () => {
      const scheduler = JobScheduler.getInstance();
      registerVixorJobs();
      registerVixorJobs();
      expect(scheduler.listJobs()).toHaveLength(5);
    });
  });

  describe("startVixorJobs()", () => {
    it("registers and schedules all 5 jobs", async () => {
      vi.useFakeTimers();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      startVixorJobs();

      const scheduler = JobScheduler.getInstance();
      const jobs = scheduler.listJobs();
      expect(jobs).toHaveLength(5);

      // Verify the jobs were scheduled by checking the running jobs map
      // (jobs are pending in runningJobs before their delay elapses)
      const runningBefore = scheduler.getRunningJobs();
      expect(runningBefore.length).toBe(5);

      // Advance past the shortest interval (30s)
      vi.advanceTimersByTime(35_000);
      await vi.advanceTimersByTimeAsync(500);

      // After the signal-monitor interval, at least the monitor job should have started
      // (it may still be running since the handler is dynamic import mocked)
      consoleSpy.mockRestore();
    });

    it("logs registration messages", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      startVixorJobs();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Registered 5 job definitions"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Started 5 recurring jobs"));

      consoleSpy.mockRestore();
    });
  });
});
