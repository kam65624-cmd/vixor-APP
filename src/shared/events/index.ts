// ============================================================================
// VIXOR Event System — Public API
// ============================================================================

export { VixorEvents } from "./orchestrator";
export { configureEventPersistence } from "./persist";
export { registerEventConsumers, isEventConsumersRegistered } from "./consumers";
export { setupQueryInvalidation, isQueryInvalidationSetup } from "./query-invalidation";
export { replayEvents } from "./replay";
export type { ReplayOptions, ReplayResult } from "./replay";

export type { VixorEventMap, EventLogEntry } from "./orchestrator";
