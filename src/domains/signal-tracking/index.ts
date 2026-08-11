// ============================================================================
// VIXOR Signal Tracking — Domain Barrel Export
// ============================================================================

export {
  createSignalTracking,
  getUserSignalTrackings,
} from "./functions";
export type {
  SignalTracking,
  SignalStatus,
  SignalSourceType,
  CreateSignalTrackingInput,
} from "./types";
export {
  SIGNAL_STATUS_CONFIG,
  TERMINAL_STATUSES,
  INTERMEDIATE_STATUSES,
  MONITORED_STATUSES,
} from "./types";
export { evaluateSignalTransition, isTerminalStatus } from "./transition-engine";
export type {
  SignalTransitionRequest,
  SignalTransitionDecision,
  SignalEventType,
} from "./transition-engine";
export { requestSignalTransition } from "./transition.server.fn";
export type {
  TransitionServiceRequest,
  TransitionServiceRequestWithVersion,
  TransitionServiceResult,
  TransitionServiceError,
  TransitionServiceResponse,
} from "./signal-transition.service";
