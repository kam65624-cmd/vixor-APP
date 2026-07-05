/** Client-safe logger. console.log in dev, no-op in production. */
const isDev =
  typeof window !== "undefined"
    ? (window as any).__DEBUG__?.() ||
      new URLSearchParams(window.location.search).get("debug") === "1"
    : false;

export const logger = {
  log: isDev ? console.log.bind(console) : (..._args: unknown[]) => {},
  warn: isDev ? console.warn.bind(console) : (..._args: unknown[]) => {},
  error: console.error.bind(console), // always log errors
  info: isDev ? console.info.bind(console) : (..._args: unknown[]) => {},
};

export default logger;
