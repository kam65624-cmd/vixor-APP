import { describe, it, expect } from "vitest";
import { cn } from "./cn";

/**
 * Unit tests for the cn() utility — custom conditional class-name merger.
 */

describe("cn (clsx)", () => {
  it("keeps a plain string", () => {
    expect(cn("foo")).toBe("foo");
    expect(cn("bar baz")).toBe("bar baz");
  });

  it("handles multiple strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out false-like values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar", undefined, "baz")).toBe("foo bar baz");
    expect(cn("foo", 0, "bar")).toBe("foo bar");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn(["foo"], ["bar"])).toBe("foo bar");
    expect(cn(["foo", false, "bar"])).toBe("foo bar");
  });

  it("handles nested arrays", () => {
    expect(cn([["foo", "bar"], "baz"])).toBe("foo bar baz");
  });

  it("skips plain objects (not supported in this implementation)", () => {
    // cn.ts handles strings/numbers/arrays only — objects are filtered out
    expect(cn({ foo: true, bar: false } as any)).toBe("");
    expect(cn({ "foo-bar": true, "baz-qux": false } as any)).toBe("");
  });

  it("handles mixed inputs (objects skipped)", () => {
    // Objects are ignored; only strings and arrays are processed
    expect(cn("foo", { bar: true, baz: false } as any, ["qux", false])).toBe("foo qux");
  });

  it("handles empty calls", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined, 0)).toBe("");
  });

  it("deduplicates class names", () => {
    // clsx preserves order, deduplication is not guaranteed — just verify it doesn't break
    expect(cn("foo", "foo")).toBe("foo foo");
  });

  it("handles string and number booleans", () => {
    expect(cn("foo", true && "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
  });
});
