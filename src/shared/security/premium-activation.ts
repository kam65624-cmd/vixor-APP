/** Prevents paid entitlements from being granted by a client-triggered action. */
export function rejectUnverifiedPremiumActivation(): never {
  throw new Error("Premium activation requires a verified payment. Direct activation is disabled.");
}
