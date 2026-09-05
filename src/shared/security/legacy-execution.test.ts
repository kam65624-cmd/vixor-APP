import { describe, expect, it } from "vitest";
import {
  assertLegacyExecutionEnabled,
  LEGACY_EXECUTION_DISABLED,
  LEGACY_EXECUTION_DISABLED_MESSAGE,
} from "./legacy-execution";

describe("legacy execution safety boundary", () => {
  it("is enabled during rehabilitation", () => {
    expect(LEGACY_EXECUTION_DISABLED).toBe(true);
  });

  it("rejects attempts to enable legacy financial execution", () => {
    expect(() => assertLegacyExecutionEnabled()).toThrow(LEGACY_EXECUTION_DISABLED_MESSAGE);
  });
});
