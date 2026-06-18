// ============================================================================
// Vixor User Preferences — runtime reader
// ============================================================================
//
// Phase 0 fix (audit §15 issue #7): settings toggles are now persisted to
// localStorage by the settings page (see /src/routes/_authenticated/settings.tsx)
// and READ at runtime by the alert checker, news fetcher, haptics util, etc.
//
// Previously these toggles were local-only React state — flipping "Price
// alerts" off had no effect on actual alert delivery. Now any code path can
// call `getUserPrefs()` to read the current preference state.
//
// On the SERVER (SSR / API routes), localStorage is unavailable — but the
// preferences are still useful as a hint for default behavior. Server code
// should treat "no prefs found" as "user hasn't configured yet, use defaults".
// ============================================================================

export interface VixorPrefs {
  /** Whether haptic feedback is enabled (mobile only) */
  haptics: boolean;
  /** Whether UI sound effects are enabled */
  sound: boolean;
  /** Whether price alert notifications should fire */
  priceAlerts: boolean;
  /** Whether market news notifications should fire */
  newsAlerts: boolean;
}

export const DEFAULT_PREFS: VixorPrefs = {
  haptics: true,
  sound: true,
  priceAlerts: true,
  newsAlerts: false,
};

const PREFS_KEY = "vixor-prefs";

/**
 * Read the user's preferences from localStorage.
 * Returns DEFAULT_PREFS if running on the server or if no prefs are stored.
 */
export function getUserPrefs(): VixorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<VixorPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Subscribe to preference changes. The callback is called immediately with
 * the current prefs, and again whenever the user changes a setting.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToPrefs(cb: (prefs: VixorPrefs) => void): () => void {
  cb(getUserPrefs());
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<VixorPrefs>).detail;
    cb(detail ?? getUserPrefs());
  };
  window.addEventListener("vixor-prefs-changed", handler);
  return () => window.removeEventListener("vixor-prefs-changed", handler);
}

/**
 * Convenience: is haptic feedback enabled right now?
 */
export function isHapticsEnabled(): boolean {
  return getUserPrefs().haptics;
}

/**
 * Convenience: are price alerts enabled right now?
 * Read by the alert-checker server function (and the /api/check-alerts route).
 */
export function isPriceAlertsEnabled(): boolean {
  return getUserPrefs().priceAlerts;
}

/**
 * Convenience: are news alerts enabled right now?
 * Read by the news fetcher + /api/generate-signals route.
 */
export function isNewsAlertsEnabled(): boolean {
  return getUserPrefs().newsAlerts;
}
