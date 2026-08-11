// ============================================================================
// VIXOR Job Scheduler — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JobScheduler, type JobDefinition, type ScheduledJob } from "./scheduler";

describe("JobScheduler", () => {
  beforeEach(() => {
    JobScheduler.resetInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("job registration", () => {
    it("registers a job definition", () => {
      const scheduler = JobScheduler.getInstance();
      const def: JobDefinition<{ x: number }> = {
        name: "test-job",
        handler: async () => {},
      };
      scheduler.register(def);
      expect(scheduler.listJobs()).toContain("test-job");
    });

    it("registers multiple jobs", () => {
      const scheduler = JobScheduler.getInstance();
      scheduler.register({ name: "job-a", handler: async () => {} });
      scheduler.register({ name: "job-b", handler: async () => {} });
      scheduler.register({ name: "job-c", handler: async () => {} });
      expect(scheduler.listJobs()).toEqual(["job-a", "job-b", "job-c"]);
    });

    it("throws when running an unregistered job", async () => {
      const scheduler = JobScheduler.getInstance();
      await expect(scheduler.run("nonexistent", {})).rejects.toThrow(
        "Job 'nonexistent' is not registered",
      );
    });
  });

  describe("immediate execution", () => {
    it("runs a job successfully and returns completed status", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "quick", handler });

      const result = await scheduler.run("quick", { data: 42 });
      expect(result.status).toBe("completed");
      expect(result.attempts).toBe(1);
      expect(result.completedAt).toBeDefined();
      expect(handler).toHaveBeenCalledWith({ data: 42 });
    });

    it("passes payload to handler", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "payload-job", handler });

      const payload = { symbol: "BTC/USDT", action: "buy" };
      await scheduler.run("payload-job", payload);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it("sets status to failed when handler throws", async () => {
      const scheduler = JobScheduler.getInstance();
      scheduler.register({
        name: "failing",
        handler: async () => {
          throw new Error("boom");
        },
        retryCount: 0,
      });

      const result = await scheduler.run("failing", {});
      expect(result.status).toBe("failed");
      expect(result.error).toBe("boom");
      expect(result.attempts).toBe(1);
    });
  });

  describe("scheduled execution", () => {
    it("schedules a job and returns a jobId", async () => {
      vi.useFakeTimers();
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "delayed", handler });

      const jobId = scheduler.schedule("delayed", { x: 1 }, 5000);
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe("string");

      // Job should not have run yet
      expect(handler).not.toHaveBeenCalled();

      // Advance time to trigger the timeout
      vi.advanceTimersByTime(6000);
      // Microtask flush for async handlers
      await vi.advanceTimersByTimeAsync(100);

      expect(handler).toHaveBeenCalledWith({ x: 1 });
    });

    it("throws when scheduling an unregistered job", () => {
      const scheduler = JobScheduler.getInstance();
      expect(() => scheduler.schedule("ghost", {}, 1000)).toThrow("Job 'ghost' is not registered");
    });

    it("tracks status of scheduled jobs before execution", () => {
      vi.useFakeTimers();
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "tracked", handler });

      const jobId = scheduler.schedule("tracked", {}, 5000);
      const status = scheduler.getStatus(jobId);
      expect(status).toBeDefined();
      expect(status!.status).toBe("pending");
    });

    it("completes after delay", async () => {
      vi.useFakeTimers();
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "complete-delayed", handler });

      const jobId = scheduler.schedule("complete-delayed", {}, 1000);
      vi.advanceTimersByTime(1500);
      await vi.advanceTimersByTimeAsync(100);

      const status = scheduler.getStatus(jobId);
      expect(status).toBeDefined();
      expect(status!.status).toBe("completed");
    });
  });

  describe("retry on failure", () => {
    it("retries and succeeds on 3rd attempt (2 failures then success)", async () => {
      const scheduler = JobScheduler.getInstance();
      let callCount = 0;
      const handler = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`failure ${callCount}`);
        }
        // succeeds on 3rd call
      });

      scheduler.register({
        name: "retry-success",
        handler,
        retryCount: 2,
        retryDelayMs: 100,
      });

      const result = await scheduler.run("retry-success", {});
      expect(result.status).toBe("completed");
      expect(result.attempts).toBe(3);
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe("retry exhaustion", () => {
    it("fails after all retries are exhausted", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockRejectedValue(new Error("always fails"));

      scheduler.register({
        name: "retry-exhaust",
        handler,
        retryCount: 2,
        retryDelayMs: 50,
      });

      const result = await scheduler.run("retry-exhaust", {});
      expect(result.status).toBe("failed");
      expect(result.attempts).toBe(3); // initial + 2 retries
      expect(result.error).toBe("always fails");
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("uses exponential backoff", async () => {
      const scheduler = JobScheduler.getInstance();
      const timestamps: number[] = [];
      let callCount = 0;

      const handler = vi.fn().mockImplementation(async () => {
        timestamps.push(Date.now());
        callCount++;
        if (callCount <= 2) {
          throw new Error("fail");
        }
      });

      scheduler.register({
        name: "backoff",
        handler,
        retryCount: 2,
        retryDelayMs: 100,
      });

      await scheduler.run("backoff", {});

      // First attempt starts immediately
      // Second attempt should wait 100ms (100 * 2^0)
      // Third attempt should wait 200ms (100 * 2^1)
      expect(timestamps.length).toBe(3);
      expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(80); // ~100ms
      expect(timestamps[2]! - timestamps[1]!).toBeGreaterThanOrEqual(160); // ~200ms
    });
  });

  describe("timeout", () => {
    it("times out a job that exceeds timeoutMs", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10000)));

      scheduler.register({
        name: "slow-job",
        handler,
        retryCount: 0,
        timeoutMs: 50,
      });

      const result = await scheduler.run("slow-job", {});
      expect(result.status).toBe("failed");
      expect(result.error).toContain("timed out");
      expect(result.error).toContain("50ms");
    }, 10000);
  });

  describe("concurrent job execution", () => {
    it("runs multiple jobs concurrently", async () => {
      const scheduler = JobScheduler.getInstance();

      const order: string[] = [];

      const handlerA = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            order.push("a-start");
            setTimeout(() => {
              order.push("a-end");
              resolve();
            }, 50);
          }),
      );

      const handlerB = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            order.push("b-start");
            setTimeout(() => {
              order.push("b-end");
              resolve();
            }, 25);
          }),
      );

      scheduler.register({ name: "job-a", handler: handlerA });
      scheduler.register({ name: "job-b", handler: handlerB });

      // Run both concurrently
      const [resultA, resultB] = await Promise.all([
        scheduler.run("job-a", {}),
        scheduler.run("job-b", {}),
      ]);

      expect(resultA.status).toBe("completed");
      expect(resultB.status).toBe("completed");

      // Verify they overlapped (not sequential)
      expect(order).toEqual(["a-start", "b-start", "b-end", "a-end"]);
    });

    it("tracks multiple concurrent jobs of the same type", async () => {
      const scheduler = JobScheduler.getInstance();

      const handler = vi
        .fn()
        .mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

      scheduler.register({ name: "concurrent-job", handler });

      const promise1 = scheduler.run("concurrent-job", { id: 1 });
      const promise2 = scheduler.run("concurrent-job", { id: 2 });

      // Both should be running concurrently
      expect(scheduler.isRunning("concurrent-job")).toBe(true);

      await Promise.all([promise1, promise2]);

      // After completion, no longer running
      expect(scheduler.isRunning("concurrent-job")).toBe(false);
    });
  });

  describe("isRunning()", () => {
    it("returns true while job is running", async () => {
      const scheduler = JobScheduler.getInstance();
      let resolveJob!: () => void;
      const handler = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveJob = resolve;
          }),
      );

      scheduler.register({ name: "long-job", handler });
      const promise = scheduler.run("long-job", {});

      expect(scheduler.isRunning("long-job")).toBe(true);

      resolveJob();
      await promise;

      expect(scheduler.isRunning("long-job")).toBe(false);
    });

    it("returns false for unknown job names", () => {
      const scheduler = JobScheduler.getInstance();
      expect(scheduler.isRunning("nonexistent")).toBe(false);
    });

    it("returns false after job completes", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "instant", handler });

      await scheduler.run("instant", {});
      expect(scheduler.isRunning("instant")).toBe(false);
    });
  });

  describe("getStatus()", () => {
    it("returns undefined for unknown job IDs", () => {
      const scheduler = JobScheduler.getInstance();
      expect(scheduler.getStatus("nonexistent-id")).toBeUndefined();
    });

    it("returns completed job status", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "status-job", handler });

      const result = await scheduler.run("status-job", { value: 99 });
      const status = scheduler.getStatus(result.id);
      expect(status).toBeDefined();
      expect(status!.status).toBe("completed");
      expect(status!.payload).toEqual({ value: 99 });
      expect(status!.attempts).toBe(1);
    });
  });

  describe("resetInstance()", () => {
    it("clears all state on reset", async () => {
      const scheduler = JobScheduler.getInstance();
      const handler = vi.fn().mockResolvedValue(undefined);
      scheduler.register({ name: "reset-test", handler });

      await scheduler.run("reset-test", {});
      expect(scheduler.listJobs()).toContain("reset-test");

      JobScheduler.resetInstance();
      const fresh = JobScheduler.getInstance();
      expect(fresh.listJobs()).toEqual([]);
    });
  });
});
