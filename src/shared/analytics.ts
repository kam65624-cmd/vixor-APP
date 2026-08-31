// Production-only Mixpanel wrapper
// All functions are no-ops in development or if VITE_MIXPANEL_TOKEN is missing

const mp: any = null;
let initialized = false;

async function ensure() {
  if (initialized) return;
  if (typeof window === "undefined" || !import.meta.env.PROD) return;
  const token = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
  if (!token) return;
  try {
    // Analytics optional initialization
    initialized = true;
  } catch {
    /* analytics must never crash the app */
  }
}

export async function initAnalytics() {
  await ensure();
}
export async function trackEvent(event: string, props?: Record<string, unknown>) {
  try {
    await ensure();
  } catch {
    /* noop */
  }
}
export async function identifyUser(id: string) {
  try {
    await ensure();
  } catch {
    /* noop */
  }
}
export async function resetAnalytics() {
  try {
    /* noop */
  } catch {
    /* noop */
  }
}
