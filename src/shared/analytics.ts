// Production-only Mixpanel wrapper
// All functions are no-ops in development or if VITE_MIXPANEL_TOKEN is missing

let mp: typeof import("mixpanel-browser") | null = null;
let initialized = false;

async function ensure() {
  if (initialized) return;
  if (typeof window === "undefined" || !import.meta.env.PROD) return;
  const token = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
  if (!token) return;
  try {
    mp = await import("mixpanel-browser");
    mp.init(token, { debug: false, track_pageview: false, persistence: "localStorage" });
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
    mp?.track(event, props);
  } catch {
    /* noop */
  }
}
export async function identifyUser(id: string) {
  try {
    await ensure();
    mp?.identify(id);
    mp?.people.set({ $name: id });
  } catch {
    /* noop */
  }
}
export async function resetAnalytics() {
  try {
    mp?.reset();
  } catch {
    /* noop */
  }
}
