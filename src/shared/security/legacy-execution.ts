/**
 * Safety boundary for the legacy application during rehabilitation.
 *
 * Keep this enabled until a separately reviewed release explicitly re-enables
 * financial execution. This module contains no credentials and is safe to use
 * from both server handlers and UI guards.
 */
export const LEGACY_EXECUTION_DISABLED = true;

export const LEGACY_EXECUTION_DISABLED_MESSAGE =
  "Real financial execution is temporarily disabled during VIXOR rehabilitation. Paper review only.";

export function assertLegacyExecutionEnabled(): void {
  if (LEGACY_EXECUTION_DISABLED) {
    throw new Error(LEGACY_EXECUTION_DISABLED_MESSAGE);
  }
}
