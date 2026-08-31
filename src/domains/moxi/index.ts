// ============================================================================
// MOXI AI Companion — Domain Exports
// ============================================================================

// Types
export type {
  MoxiPersona,
  MoxiAvatarVariant,
  MoxiResponse,
  MoxiProactiveInsight,
  MoxiQuickAction,
  MoxiFormattedContext,
} from "./types";
export { DEFAULT_MOXI_PERSONA, MOXI_QUICK_ACTIONS } from "./types";

// Tool definitions (schema registry)
export { MOXI_TOOLS, getMoxiTool, getMoxiToolsByCategory, getMoxiToolNames } from "./tools";
export type { MoxiToolDefinition, MoxiToolParam } from "./tools";

// Context engine (data assembly)
export { buildMoxiContext } from "./context-engine";
export type { MoxiContext } from "./context-engine";

// Persona system
export { getMoxiPersona, updateMoxiPersona, AVATAR_VARIANTS } from "./persona";
export type { AvatarVariantConfig } from "./persona";

// System prompt builder
export { buildMoxiSystemPrompt, formatMoxiContext } from "./prompt";

// Server functions
export {
  askMoxi,
  updateMoxiPersona as updateMoxiPersonaFn,
  getMoxiPersonaFn,
  getMoxiInsights,
} from "./functions";

// Notification hub
export {
  detectOverexposure,
  detectSignalProximity,
  detectEventRisk,
  generateMoxiInsights,
} from "./notification-hub";
