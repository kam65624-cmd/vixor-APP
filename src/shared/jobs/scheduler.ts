// ============================================================================
// VIXOR Job Scheduler — Lightweight in-process job scheduler for serverless
// ============================================================================
//
// Design:
//   - Singleton pattern (serverless-compatible, one per invocation)
//   - Jobs run via setTimeout with configurable delay
//   - Retry logic with exponential backoff (delay * 2^attempt)
//   - Timeout: Promise.race with a timeout promise
//   - Job status tracking in memory (NOT persisted)
//
// Usage:
//   const scheduler = JobScheduler.getInstance();
//   scheduler.register({ name: 'my-job', handler: async (p) => { ... } });
//   const job = await scheduler.run('my-job', { foo: 'bar' });
//   const id = scheduler.schedule('my-job', { foo: 'bar' }, 5000);
// ============================================================================

// ── Types ─────────────────────────────────────────────────────────────────

export interface JobDefinition<T = unknown> {
  name: string;
  handler: (payload: T) => Promise<void>;
  retryCount?: number; // default: 2
  retryDelayMs?: number; // default: 1000
  timeoutMs?: number; // default: 30000
}

export interface ScheduledJob<T = unknown> {
  id: string;
  definition: JobDefinition<T>;
  payload: T;
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// ── ID Generator ───────────────────────────────────────────────────────────

let idCounter = 0;
function generateJobId(): string {
  idCounter++;
  return `job-${Date.now()}-${idCounter}`;
}

// ── Job Scheduler ──────────────────────────────────────────────────────────

export class JobScheduler {
  private static instance: JobScheduler;
  private jobs: Map<string, JobDefinition> = new Map();
  private runningJobs: Map<string, ScheduledJob> = new Map();
  private completedJobs: Map<string, ScheduledJob> = new Map();

  private constructor() {}

  static getInstance(): JobScheduler {
    if (!JobScheduler.instance) {
      JobScheduler.instance = new JobScheduler();
    }
    return JobScheduler.instance;
  }

  /** Reset the singleton (for testing) */
  static resetInstance(): void {
    JobScheduler.instance = new JobScheduler();
    idCounter = 0;
  }

  // ── Register ─────────────────────────────────────────────────────────────

  /** Register a job definition */
  register<T>(definition: JobDefinition<T>): void {
    this.jobs.set(definition.name, definition as JobDefinition);
  }

  // ── Execute Immediately ──────────────────────────────────────────────────

  /** Execute a job immediately */
  async run<T>(name: string, payload: T): Promise<ScheduledJob<T>> {
    const definition = this.jobs.get(name);
    if (!definition) {
      throw new Error(`Job '${name}' is not registered`);
    }

    const job: ScheduledJob<T> = {
      id: generateJobId(),
      definition: definition as JobDefinition<T>,
      payload,
      status: "pending",
      attempts: 0,
      scheduledAt: new Date().toISOString(),
    };

    this.runningJobs.set(job.id, job as ScheduledJob);

    try {
      await this.executeWithRetry(job, definition);
    } finally {
      // Move to completed jobs to keep runningJobs bounded
      this.runningJobs.delete(job.id);
      this.completedJobs.set(job.id, job as ScheduledJob);
    }

    return job;
  }

  // ── Schedule with Delay ──────────────────────────────────────────────────

  /** Schedule a job to run after a delay. Returns jobId. */
  schedule<T>(name: string, payload: T, delayMs: number): string {
    const definition = this.jobs.get(name);
    if (!definition) {
      throw new Error(`Job '${name}' is not registered`);
    }

    const job: ScheduledJob<T> = {
      id: generateJobId(),
      definition: definition as JobDefinition<T>,
      payload,
      status: "pending",
      attempts: 0,
      scheduledAt: new Date().toISOString(),
    };

    this.runningJobs.set(job.id, job as ScheduledJob);

    const timer = setTimeout(async () => {
      try {
        await this.executeWithRetry(job, definition);
      } finally {
        this.runningJobs.delete(job.id);
        this.completedJobs.set(job.id, job as ScheduledJob);
      }
    }, delayMs);

    // Don't prevent the process from exiting
    if (typeof timer === "object" && "unref" in timer) {
      (timer as NodeJS.Timeout).unref();
    }

    return job.id;
  }

  // ── Status ───────────────────────────────────────────────────────────────

  /** Get status of a running/completed job */
  getStatus(jobId: string): ScheduledJob | undefined {
    return this.runningJobs.get(jobId) ?? this.completedJobs.get(jobId);
  }

  // ── List Jobs ────────────────────────────────────────────────────────────

  /** List all registered job definition names */
  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  // ── Is Running ───────────────────────────────────────────────────────────

  /** Check if a job definition is currently running */
  isRunning(name: string): boolean {
    for (const job of this.runningJobs.values()) {
      if (job.definition.name === name && job.status === "running") {
        return true;
      }
    }
    return false;
  }

  // ── Get all jobs (for testing) ───────────────────────────────────────────

  /** Get all running jobs (for testing) */
  getRunningJobs(): ScheduledJob[] {
    return Array.from(this.runningJobs.values());
  }

  /** Get all completed jobs (for testing) */
  getCompletedJobs(): ScheduledJob[] {
    return Array.from(this.completedJobs.values());
  }

  // ── Private: Execute with Retry ──────────────────────────────────────────

  private async executeWithRetry<T>(
    job: ScheduledJob<T>,
    definition: JobDefinition<T>,
  ): Promise<void> {
    const maxRetries = definition.retryCount ?? 2;
    const baseDelay = definition.retryDelayMs ?? 1000;
    const timeoutMs = definition.timeoutMs ?? 30000;

    while (job.attempts <= maxRetries) {
      job.attempts++;
      job.status = "running";
      job.startedAt = new Date().toISOString();

      try {
        // Wrap handler with timeout
        await Promise.race([
          definition.handler(job.payload),
          this.createTimeoutPromise(timeoutMs, definition.name),
        ]);

        job.status = "completed";
        job.completedAt = new Date().toISOString();
        return;
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);

        // If this was the last attempt, mark as failed
        if (job.attempts > maxRetries) {
          job.status = "failed";
          job.completedAt = new Date().toISOString();
          return;
        }

        // Wait with exponential backoff before retrying
        const backoffMs = baseDelay * Math.pow(2, job.attempts - 1);
        await this.sleep(backoffMs);
      }
    }

    // Should not reach here, but just in case
    job.status = "failed";
    job.completedAt = new Date().toISOString();
  }

  // ── Private: Timeout Promise ─────────────────────────────────────────────

  private createTimeoutPromise(ms: number, jobName: string): Promise<never> {
    return new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Job '${jobName}' timed out after ${ms}ms`));
      }, ms);
      if (typeof timer === "object" && "unref" in timer) {
        (timer as NodeJS.Timeout).unref();
      }
    });
  }

  // ── Private: Sleep ───────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      if (typeof timer === "object" && "unref" in timer) {
        (timer as NodeJS.Timeout).unref();
      }
    });
  }
}
