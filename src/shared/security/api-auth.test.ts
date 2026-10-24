import { describe, expect, it } from "vitest";
import {
  hasValidBearerSecret,
  isCronRequestAuthorized,
  isNonProductionEnvironment,
  isWebhookSecretBypassAllowed,
} from "./api-auth";

describe("server API authorization helpers", () => {
  it("requires the configured bearer secret in production for cron requests", () => {
    expect(isCronRequestAuthorized(undefined, "cron-secret", "production")).toBe(false);
    expect(isCronRequestAuthorized("Bearer wrong", "cron-secret", "production")).toBe(false);
    expect(isCronRequestAuthorized("Bearer cron-secret", "cron-secret", "production")).toBe(true);
  });

  it("does not treat an absent production cron secret as authorization", () => {
    expect(isCronRequestAuthorized(undefined, undefined, "production")).toBe(false);
    expect(isCronRequestAuthorized(undefined, undefined, undefined)).toBe(false);
  });

  it("keeps unauthenticated cron access limited to non-production environments", () => {
    expect(isCronRequestAuthorized(undefined, undefined, "development")).toBe(true);
    expect(isCronRequestAuthorized(undefined, undefined, "production")).toBe(false);
    expect(isCronRequestAuthorized(undefined, undefined, undefined)).toBe(false);
    expect(isNonProductionEnvironment("test")).toBe(true);
    expect(isNonProductionEnvironment(undefined)).toBe(false);
  });

  it("accepts only an explicit development webhook bypass outside production", () => {
    expect(isWebhookSecretBypassAllowed("development", true)).toBe(true);
    expect(isWebhookSecretBypassAllowed("production", true)).toBe(false);
    expect(isWebhookSecretBypassAllowed("development", false)).toBe(false);
    expect(isWebhookSecretBypassAllowed(undefined, true)).toBe(false);
  });

  it("matches only configured bearer secrets", () => {
    expect(hasValidBearerSecret("Bearer secret-a", "secret-a", "secret-b")).toBe(true);
    expect(hasValidBearerSecret("secret-a", "secret-a")).toBe(false);
    expect(hasValidBearerSecret("Bearer undefined", undefined)).toBe(false);
  });
});
