// ============================================================================
// VIXOR Tool Router — Secure Dispatch Layer for Tool Execution
// ============================================================================
//
// Every tool call from the Copilot Agent MUST pass through this router.
// No tool may execute directly — all calls go through:
//   1. Input validation
//   2. Permission check
//   3. Execution
//   4. Audit logging
//   5. Event emission
// ============================================================================

import { ToolRegistry, type ToolContext, type ToolResult, type ToolInput } from "../tool-registry";
import { VixorEvents } from "../events";

// ── Router Options ───────────────────────────────────────────────────────────

export interface RouterOptions {
  /** Whether to emit copilot.action.executed events */
  emitEvents?: boolean;
  /** Whether to log execution to console */
  verbose?: boolean;
  /** Conversation ID for event correlation */
  conversationId?: string;
}

// ── Tool Router Class ────────────────────────────────────────────────────────

class ToolRouterClass {
  /**
   * Dispatch a tool call through the secure routing pipeline.
   */
  async dispatch(
    toolName: string,
    input: ToolInput,
    context: ToolContext,
    options: RouterOptions = {},
  ): Promise<ToolResult> {
    const { emitEvents = true, verbose = true, conversationId } = options;
    const startTime = Date.now();

    // 1. Tool lookup
    const tool = ToolRegistry.get(toolName);
    if (!tool) {
      if (verbose) {
        console.warn(`[ToolRouter] Unknown tool: "${toolName}"`);
      }
      return {
        success: false,
        error: `Tool "${toolName}" is not registered. Available tools: ${ToolRegistry.all().map((t) => t.name).join(", ")}`,
        metadata: { executionTime: Date.now() - startTime, toolName },
      };
    }

    // 2. Input validation — check required parameters
    const missingParams = tool.parameters
      .filter((p) => p.required && (input[p.name] === undefined || input[p.name] === null))
      .map((p) => p.name);

    if (missingParams.length > 0) {
      if (verbose) {
        console.warn(`[ToolRouter] Missing required params for ${toolName}: ${missingParams.join(", ")}`);
      }
      return {
        success: false,
        error: `Missing required parameters: ${missingParams.join(", ")}`,
        metadata: { executionTime: Date.now() - startTime, toolName },
      };
    }

    // 3. Execute via ToolRegistry (includes permission check)
    if (verbose) {
      console.log(`[ToolRouter] Dispatching: ${toolName} (${tool.category}${tool.mutative ? ", mutative" : ""}) for user ${context.userId}`);
    }

    const result = await ToolRegistry.execute(toolName, input, context);
    const executionTime = Date.now() - startTime;

    // 4. Audit logging
    if (verbose) {
      if (result.success) {
        console.log(`[ToolRouter] ✓ ${toolName} completed in ${executionTime}ms`);
      } else {
        console.warn(`[ToolRouter] ✗ ${toolName} failed: ${result.error}`);
      }
    }

    // 5. Event emission
    if (emitEvents && context.userId) {
      void VixorEvents.emit("copilot.action.executed", {
        conversationId: conversationId || "unknown",
        userId: context.userId,
        action: toolName,
        result: result.success ? "success" : "error",
      });
    }

    return result;
  }

  /**
   * List all tools available to a user (for Copilot prompts).
   */
  availableTools(context: ToolContext): string {
    return ToolRegistry.toolDescriptionsForPrompt(context);
  }

  /**
   * Check if a tool name is valid (registered).
   */
  isValidTool(name: string): boolean {
    return ToolRegistry.has(name);
  }

  /**
   * Get tool suggestions based on a partial name or description match.
   */
  suggestTools(query: string, context: ToolContext): Array<{ name: string; description: string }> {
    const lowerQuery = query.toLowerCase();
    const available = ToolRegistry.availableForUser(context);

    return available
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery),
      )
      .map((t) => ({ name: t.name, description: t.description }));
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

export const ToolRouter = new ToolRouterClass();
