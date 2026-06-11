// ============================================================================
// VIXOR P1 Intelligence Layer — Bootstrap
// ============================================================================
//
// This file MUST be imported at server startup to activate the P1
// Intelligence Layer. It:
//   1. Registers all tools in the Tool Registry (via side-effect import)
//   2. Configures event persistence to domain_events table
//   3. Logs initialization status
//
// Import once at the top of src/server.ts:
//   import "./shared/p1-bootstrap";
// ============================================================================

// ── Side-effect import: registers all tools when this module loads ──────────
// This import triggers ToolRegistry.register() calls for all 8 tools.
// Without this, the Tool Registry is empty at runtime.
import "./tool-registry/bootstrap";

// ── Side-effect import: configures event persistence to domain_events ───────
// This wires the EventOrchestrator to persist all events to Supabase.
import { configureEventPersistence } from "./events/persist";

// ── Execute initialization ──────────────────────────────────────────────────
configureEventPersistence();

console.log("[P1 Bootstrap] ✓ Intelligence Layer activated — Tools registered, Event Persistence configured");
