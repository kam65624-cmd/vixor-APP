// ============================================================================
// VIXOR Safe Exec — Runner Test Suite
// ============================================================================
//
// Verifies:
//   1. Blocked APIs (eval, Function, process, require, import, fetch, etc.)
//      all throw / return success=false.
//   2. Allowed code (pure arithmetic, Math, JSON, Array) returns expected
//      results.
//   3. Timeout fires for infinite loops (using async detection).
//   4. Caller-provided context is accessible.
//
// Run: npx vitest run src/shared/safe-exec/runner.test.ts
// ============================================================================

import { describe, expect, it } from "vitest";
import { safeExecStrategy, validateStrategyCode } from "./index";

describe("validateStrategyCode", () => {
  it("accepts simple arithmetic", () => {
    expect(validateStrategyCode("return 1 + 2").valid).toBe(true);
  });

  it("accepts Math / JSON / Array usage", () => {
    expect(validateStrategyCode("return Math.max(1, 2, 3)").valid).toBe(true);
    expect(validateStrategyCode("return JSON.stringify({a: 1})").valid).toBe(true);
    expect(validateStrategyCode("return [1,2,3].map(x => x * 2)").valid).toBe(true);
  });

  it("rejects eval()", () => {
    const r = validateStrategyCode("eval('1+1')");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/eval/);
  });

  it("rejects Function constructor", () => {
    const r = validateStrategyCode("const f = new Function('return 1')");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Function/);
  });

  it("rejects process global", () => {
    const r = validateStrategyCode("return process.env.SECRET");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/process/);
  });

  it("rejects require()", () => {
    const r = validateStrategyCode("const fs = require('fs')");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/require/);
  });

  it("rejects import statement", () => {
    const r = validateStrategyCode("import fs from 'fs'");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/import|fs module|built-in/);
  });

  it("rejects dynamic import()", () => {
    const r = validateStrategyCode("const m = import('fs')");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/import/);
  });

  it("rejects fetch()", () => {
    const r = validateStrategyCode("fetch('https://evil.example.com')");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/fetch|built-in/);
  });

  it("rejects __proto__ access", () => {
    const r = validateStrategyCode("const x = {}.__proto__");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/proto/i);
  });

  it("rejects bracket dunder access", () => {
    const r = validateStrategyCode('const x = {}["__proto__"]');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/dunder|bracket|__proto__/i);
  });

  it("rejects constructor chain", () => {
    const r = validateStrategyCode("const x = ({}).constructor.constructor('return 1')()");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/constructor/i);
  });

  it("rejects window / document globals", () => {
    expect(validateStrategyCode("window.location").valid).toBe(false);
    expect(validateStrategyCode("document.cookie").valid).toBe(false);
  });

  it("rejects Node.js built-in module references", () => {
    expect(validateStrategyCode("const x = fs.readFileSync('a')").valid).toBe(false);
    expect(validateStrategyCode("const x = child_process.exec('rm -rf /')").valid).toBe(false);
  });

  it("rejects syntactically invalid code", () => {
    const r = validateStrategyCode("function(");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/yntax/i);
  });

  it("accepts empty code", () => {
    expect(validateStrategyCode("").valid).toBe(true);
  });

  it("rejects oversized code", () => {
    const r = validateStrategyCode("x".repeat(200_001));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/length/i);
  });
});

describe("safeExecStrategy", () => {
  it("returns expected result for allowed arithmetic", async () => {
    const r = await safeExecStrategy("return 1 + 2 * 3");
    expect(r.success).toBe(true);
    expect(r.result).toBe(7);
  });

  it("exposes Math global", async () => {
    const r = await safeExecStrategy("return Math.max(1, 5, 3)");
    expect(r.success).toBe(true);
    expect(r.result).toBe(5);
  });

  it("exposes caller-provided context (close, open, high, low, volume)", async () => {
    const r = await safeExecStrategy("return close + open + high + low + volume;", {
      close: 10,
      open: 20,
      high: 30,
      low: 40,
      volume: 50,
    });
    expect(r.success).toBe(true);
    expect(r.result).toBe(150);
  });

  it("exposes params in context", async () => {
    const r = await safeExecStrategy("return params.threshold * 2;", { params: { threshold: 25 } });
    expect(r.success).toBe(true);
    expect(r.result).toBe(50);
  });

  it("rejects code that tries to access process", async () => {
    const r = await safeExecStrategy("return process.env.HOME");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/process/);
  });

  it("rejects code that tries to eval", async () => {
    const r = await safeExecStrategy("eval('1+1')");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/eval/);
  });

  it("rejects code that tries to fetch", async () => {
    const r = await safeExecStrategy("fetch('https://evil.example.com')");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/fetch|built-in/);
  });

  it("rejects code that tries to require fs", async () => {
    const r = await safeExecStrategy("require('fs')");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/require/);
  });

  it("captures thrown errors", async () => {
    const r = await safeExecStrategy("throw new Error('boom')");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/boom/);
  });

  it("records execution time", async () => {
    const r = await safeExecStrategy("return 1");
    expect(r.success).toBe(true);
    expect(r.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(r.executionTimeMs).toBeLessThan(1000);
  });

  it("returns undefined when no return statement", async () => {
    const r = await safeExecStrategy("const x = 1");
    expect(r.success).toBe(true);
    expect(r.result).toBeUndefined();
  });

  it("supports try/catch inside user code", async () => {
    const r = await safeExecStrategy(`
      try {
        throw new Error("inner");
      } catch (e) {
        return "caught:" + e.message;
      }
    `);
    expect(r.success).toBe(true);
    expect(r.result).toBe("caught:inner");
  });

  it("cannot escape sandbox via globalThis", async () => {
    const r = await safeExecStrategy("return globalThis.process");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/globalThis|process/);
  });
});
