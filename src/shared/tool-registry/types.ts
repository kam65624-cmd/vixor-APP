// ============================================================================
// VIXOR Tool Registry — Centralized Discovery & Execution Layer for Tools
// ============================================================================
//
// This is NOT a replacement for createServerFn.
// It's a DISCOVERY LAYER on top of existing server functions.
//
// Purpose:
//   - Register existing createServerFn calls as "tools" with metadata
//   - Provide a unified interface for the Copilot Agent to discover and call tools
//   - Add permission checks, validation, and audit logging at the tool level
//   - Enable dynamic tool dispatch without hardcoding imports
//
// Architecture:
//   Existing createServerFn → continues to work exactly as before
//   Tool Registry → wraps select server functions with tool metadata
//   Tool Router → dispatches tool calls from Copilot through the registry
//
// Usage:
//   import { ToolRegistry } from "@/shared/tool-registry";
//
//   // Register a tool
//   ToolRegistry.register({
//     name: "createAlert",
//     description: "Create a price alert for a trading pair",
//     category: "trading",
//     permissions: ["authenticated"],
//     inputSchema: createAlertInputSchema,
//     execute: async (input, context) => { ... },
//   });
//
//   // Call a tool
//   const result = await ToolRegistry.execute("createAlert", input, context);
// ============================================================================

// ── Tool Types ───────────────────────────────────────────────────────────────

export type ToolCategory =
  | "analysis"
  | "trading"
  | "market"
  | "portfolio"
  | "journal"
  | "watchlist"
  | "copilot"
  | "user"
  | "system";

export type ToolPermission = "authenticated" | "premium" | "admin";

export interface ToolContext {
  /** Authenticated user ID */
  userId: string;
  /** Whether the user has premium access */
  isPremium: boolean;
  /** Whether the user is an admin */
  isAdmin: boolean;
  /** Request trace ID for correlation */
  traceId?: string;
}

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    toolName: string;
  };
}

export interface ToolDefinition<TInput extends ToolInput = ToolInput, TOutput = unknown> {
  /** Unique tool name (e.g., "createAlert", "fetchSignals") */
  name: string;
  /** Human-readable description for Copilot to understand what this tool does */
  description: string;
  /** Category for grouping and discovery */
  category: ToolCategory;
  /** Required permissions to execute this tool */
  permissions: ToolPermission[];
  /** Parameter descriptions for Copilot to understand the input shape */
  parameters: ToolParameter[];
  /** Whether this tool modifies data (vs read-only) */
  mutative: boolean;
  /** Execute the tool */
  execute: (input: TInput, context: ToolContext) => Promise<ToolResult<TOutput>>;
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  enum?: string[];
}

// ── Tool Registry Class ─────────────────────────────────────────────────────

class ToolRegistryClass {
  private tools: Map<string, ToolDefinition> = new Map();

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a tool. Throws if a tool with the same name already exists.
   */
  register<TInput extends ToolInput, TOutput>(
    tool: ToolDefinition<TInput, TOutput>,
  ): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`[ToolRegistry] Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool as ToolDefinition);
    console.log(`[ToolRegistry] Registered: ${tool.name} (${tool.category})`);
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  // ── Execution ─────────────────────────────────────────────────────────────

  /**
   * Execute a tool by name with input and context.
   * Validates permissions, executes, and returns structured result.
   */
  async execute(
    name: string,
    input: ToolInput,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
        metadata: { executionTime: 0, toolName: name },
      };
    }

    // Permission check
    const permissionError = this.checkPermissions(tool, context);
    if (permissionError) {
      return {
        success: false,
        error: permissionError,
        metadata: { executionTime: 0, toolName: name },
      };
    }

    // Execute with timing
    const startTime = Date.now();
    try {
      const result = await tool.execute(input, context);
      const executionTime = Date.now() - startTime;

      return {
        ...result,
        metadata: { executionTime, toolName: name },
      };
    } catch (err) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        metadata: { executionTime, toolName: name },
      };
    }
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  /**
   * Get a tool definition by name.
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools.
   */
  all(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  /**
   * Get tools by category.
   */
  byCategory(category: ToolCategory): ToolDefinition[] {
    return [...this.tools.values()].filter((t) => t.category === category);
  }

  /**
   * Get tools that a user has permission to execute.
   */
  availableForUser(context: ToolContext): ToolDefinition[] {
    return [...this.tools.values()].filter(
      (t) => !this.checkPermissions(t, context),
    );
  }

  /**
   * Get tool descriptions formatted for Copilot prompts.
   * This is what the Copilot Agent sees to decide which tool to use.
   */
  toolDescriptionsForPrompt(context: ToolContext): string {
    const available = this.availableForUser(context);
    if (available.length === 0) return "No tools available.";

    return available
      .map(
        (t) =>
          `- **${t.name}** (${t.category}${t.mutative ? ", mutative" : ""}): ${t.description}\n  Params: ${t.parameters.map((p) => `${p.name}: ${p.type}${p.required ? " (required)" : ""}`).join(", ")}`,
      )
      .join("\n\n");
  }

  // ── Permission Check ──────────────────────────────────────────────────────

  private checkPermissions(
    tool: ToolDefinition,
    context: ToolContext,
  ): string | null {
    for (const perm of tool.permissions) {
      switch (perm) {
        case "authenticated":
          if (!context.userId) return "Authentication required";
          break;
        case "premium":
          if (!context.isPremium) return "Premium access required";
          break;
        case "admin":
          if (!context.isAdmin) return "Admin access required";
          break;
      }
    }
    return null;
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────

export const ToolRegistry = new ToolRegistryClass();
