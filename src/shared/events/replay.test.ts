// ============================================================================
// VIXOR Event Replay — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, getLimitArgs, getEqArgs, getGteArgs, getLtArgs, setMockData, chain } = vi.hoisted(
  () => {
    // Track calls
    let limitArgs: unknown[] = [];
    let eqArgs: unknown[] = [];
    let gteArgs: unknown[] = [];
    let ltArgs: unknown[] = [];
    let resolveData: any = { data: [], error: null };

    // Single chain object where every method returns the same object
    const chain: Record<string, any> = {};
    const methods = ["select", "order", "eq", "gte", "lt", "single", "maybeSingle"];
    for (const m of methods) {
      chain[m] = (...args: unknown[]) => {
        if (m === "eq") eqArgs = args;
        if (m === "gte") gteArgs = args;
        if (m === "lt") ltArgs = args;
        return chain;
      };
    }
    chain.limit = (...args: unknown[]) => {
      limitArgs = args;
      return Promise.resolve(resolveData);
    };

    const mockFrom = () => chain;

    return {
      mockFrom,
      chain,
      getLimitArgs: () => limitArgs,
      getEqArgs: () => eqArgs,
      getGteArgs: () => gteArgs,
      getLtArgs: () => ltArgs,
      setMockData: (data: any) => {
        resolveData = data;
      },
    };
  },
);

vi.mock("@/shared/supabase/client.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { replayEvents } from "./replay";

describe("Event Replay", () => {
  beforeEach(() => {
    setMockData({ data: [], error: null });
  });

  it("returns processed: 0, errors: 0 when no events found", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const result = await replayEvents({ handler });

    expect(result).toEqual({ processed: 0, errors: 0 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("processes all events successfully", async () => {
    setMockData({
      data: [
        {
          event_type: "signal.transition.completed",
          payload: { pair: "BTC/USDT" },
          created_at: "2026-08-01T00:00:00Z",
        },
        {
          event_type: "alert.triggered",
          payload: { pair: "ETH/USDT" },
          created_at: "2026-08-01T01:00:00Z",
        },
        {
          event_type: "trade.opened",
          payload: { pair: "SOL/USDT" },
          created_at: "2026-08-01T02:00:00Z",
        },
      ],
      error: null,
    });

    const handler = vi.fn().mockResolvedValue(undefined);
    const result = await replayEvents({ handler });

    expect(result.processed).toBe(3);
    expect(result.errors).toBe(0);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenCalledWith("signal.transition.completed", { pair: "BTC/USDT" });
    expect(handler).toHaveBeenCalledWith("alert.triggered", { pair: "ETH/USDT" });
    expect(handler).toHaveBeenCalledWith("trade.opened", { pair: "SOL/USDT" });
  });

  it("continues processing after handler errors (non-blocking)", async () => {
    setMockData({
      data: [
        { event_type: "a", payload: {}, created_at: "2026-08-01T00:00:00Z" },
        { event_type: "b", payload: {}, created_at: "2026-08-01T01:00:00Z" },
        { event_type: "c", payload: {}, created_at: "2026-08-01T02:00:00Z" },
      ],
      error: null,
    });

    const handler = vi.fn().mockImplementation(async (type: string) => {
      if (type === "b") throw new Error("handler error");
    });

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await replayEvents({ handler });

    expect(result.processed).toBe(2);
    expect(result.errors).toBe(1);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Handler error for event b"),
      "handler error",
    );

    consoleSpy.mockRestore();
  });

  it("filters by eventType", async () => {
    const handler = vi.fn();
    await replayEvents({ eventType: "signal.transition.completed", handler });

    expect(getEqArgs()).toEqual(["event_type", "signal.transition.completed"]);
  });

  it("applies since and until filters", async () => {
    const handler = vi.fn();
    await replayEvents({
      since: "2026-08-01T00:00:00Z",
      until: "2026-08-10T00:00:00Z",
      handler,
    });

    expect(getGteArgs()).toEqual(["created_at", "2026-08-01T00:00:00Z"]);
    expect(getLtArgs()).toEqual(["created_at", "2026-08-10T00:00:00Z"]);
  });

  it("applies limit option", async () => {
    const handler = vi.fn();
    await replayEvents({ limit: 500, handler });

    expect(getLimitArgs()).toEqual([500]);
  });

  it("defaults limit to 1000 when not specified", async () => {
    const handler = vi.fn();
    await replayEvents({ handler });

    expect(getLimitArgs()).toEqual([1000]);
  });

  it("throws on database query error", async () => {
    setMockData({ data: null, error: { message: "Permission denied" } });

    const handler = vi.fn();
    await expect(replayEvents({ handler })).rejects.toThrow(
      "Failed to query domain_events for replay: Permission denied",
    );
  });
});
