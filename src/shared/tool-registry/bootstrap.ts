// ============================================================================
// VIXOR Tool Registry — Bootstrap: Register All Tools
// ============================================================================
//
// Import this file once at server startup to register all tools.
// Tools are registered as a side effect of importing the modules.
// ============================================================================

import "./tools/trading";
import "./tools/journal-analysis";

console.log("[ToolRegistry] All tools registered");
