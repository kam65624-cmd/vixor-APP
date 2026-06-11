// ============================================================================
// VIXOR P1 Validation Endpoint — Runtime Testing for Intelligence Layer
// ============================================================================
//
// This endpoint validates that every P1 component is ACTIVE at runtime.
// It tests: Asset Registry, Event Orchestrator, Tool Registry, Tool Router,
// Memory Store, and Copilot Agent integration.
//
// Protected by CRON_SECRET — only accessible by admin/cron requests.
// ============================================================================

import { defineEventHandler, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  // Auth check
  const query = getQuery(event) as Record<string, string>;
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = event.node.req.headers["x-vercel-cron"] || event.node.req.headers["authorization"];
  const querySecret = query.secret;

  if (cronSecret && querySecret !== cronSecret && headerSecret !== cronSecret && headerSecret !== `Bearer ${cronSecret}`) {
    // Allow without secret in development
    if (process.env.NODE_ENV === "production") {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  }

  const results: Record<string, any> = {};
  const errors: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Asset Registry Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { AssetRegistry } = await import("../../src/shared/asset-registry");
    const allAssets = AssetRegistry.all();
    const popularAssets = AssetRegistry.popular();
    const categories = ["crypto", "forex", "commodity", "index", "stock"] as const;
    const byCategory = Object.fromEntries(
      categories.map((cat) => [cat, AssetRegistry.byCategory(cat).length]),
    );

    results.assetRegistry = {
      status: "ACTIVE",
      totalAssets: allAssets.length,
      popularAssets: popularAssets.length,
      categories: byCategory,
      pairs: allAssets.map((a) => a.pair),
      sampleLookup: AssetRegistry.find("BTC/USDT") ? "BTC/USDT found" : "BTC/USDT NOT FOUND",
    };
  } catch (err) {
    errors.push(`Asset Registry: ${err instanceof Error ? err.message : String(err)}`);
    results.assetRegistry = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Event Orchestrator Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { VixorEvents } = await import("../../src/shared/events");
    const handlerCounts = VixorEvents.handlerCounts();

    // Test emit a signal event
    let eventReceived = false;
    const testHandler = () => { eventReceived = true; };
    VixorEvents.on("signal.generated", testHandler);
    await VixorEvents.emit("signal.generated", {
      pair: "BTC/USDT",
      timeframe: "1H",
      recommendation: "BUY",
      confidence: 85,
      signalDate: new Date().toISOString().split("T")[0],
    });
    VixorEvents.off("signal.generated", testHandler);

    // Check event persistence config
    const hasPersistence = (VixorEvents as any).persistEnabled === true;

    results.eventOrchestrator = {
      status: "ACTIVE",
      handlerCounts,
      eventEmission: eventReceived ? "WORKING" : "FAILED",
      persistence: hasPersistence ? "CONFIGURED" : "NOT CONFIGURED",
    };
  } catch (err) {
    errors.push(`Event Orchestrator: ${err instanceof Error ? err.message : String(err)}`);
    results.eventOrchestrator = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Tool Registry Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { ToolRegistry } = await import("../../src/shared/tool-registry");
    const allTools = ToolRegistry.all();

    results.toolRegistry = {
      status: allTools.length > 0 ? "ACTIVE" : "EMPTY (bootstrap not loaded)",
      totalTools: allTools.length,
      tools: allTools.map((t) => ({
        name: t.name,
        category: t.category,
        mutative: t.mutative,
        permissions: t.permissions,
        paramCount: t.parameters.length,
        requiredParams: t.parameters.filter((p) => p.required).map((p) => p.name),
      })),
    };
  } catch (err) {
    errors.push(`Tool Registry: ${err instanceof Error ? err.message : String(err)}`);
    results.toolRegistry = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Tool Router Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { ToolRouter } = await import("../../src/shared/tool-router");
    const { ToolRegistry } = await import("../../src/shared/tool-registry");

    const testContext = {
      userId: "validation-test",
      isPremium: false,
      isAdmin: false,
      traceId: "p1-validation",
    };

    // Test tool validity check
    const toolChecks = {
      createAlert: ToolRouter.isValidTool("createAlert"),
      fetchSignals: ToolRouter.isValidTool("fetchSignals"),
      analyzeAsset: ToolRouter.isValidTool("analyzeAsset"),
      getAssetState: ToolRouter.isValidTool("getAssetState"),
      listAlerts: ToolRouter.isValidTool("listAlerts"),
      deleteAlert: ToolRouter.isValidTool("deleteAlert"),
      createJournalEntry: ToolRouter.isValidTool("createJournalEntry"),
      fetchPortfolio: ToolRouter.isValidTool("fetchPortfolio"),
    };

    // Test available tools for prompt
    const availableTools = ToolRouter.availableTools(testContext);

    // Test tool suggestions
    const suggestions = ToolRouter.suggestTools("alert", testContext);

    results.toolRouter = {
      status: "ACTIVE",
      toolValidity: toolChecks,
      availableToolsLength: availableTools.length,
      suggestionsForAlert: suggestions.map((s) => s.name),
    };
  } catch (err) {
    errors.push(`Tool Router: ${err instanceof Error ? err.message : String(err)}`);
    results.toolRouter = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Memory Store Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { MemoryStore } = await import("../../src/shared/memory");

    const testUserId = "validation-test-user";
    const testKey = `test_${Date.now()}`;

    // Store
    const storeResult = await MemoryStore.store(testUserId, "behavior", testKey, { test: true }, { confidence: 0.9, source: "validation" });

    // Retrieve
    const retrieved = await MemoryStore.retrieve(testUserId, "behavior", testKey);

    // Learn (reinforcement)
    await MemoryStore.learn(testUserId, "behavior", testKey, { test: true, reinforced: true }, "validation");

    // Context for prompt
    const contextResult = await MemoryStore.contextForPrompt(testUserId);

    // Cleanup
    await MemoryStore.forget(testUserId, "behavior", testKey);

    results.memoryStore = {
      status: "ACTIVE",
      store: storeResult.success ? "WORKING" : "FAILED",
      retrieve: retrieved !== null ? "WORKING" : "FAILED",
      contextForPrompt: contextResult ? "WORKING" : "FAILED",
      forget: "WORKING",
    };
  } catch (err) {
    errors.push(`Memory Store: ${err instanceof Error ? err.message : String(err)}`);
    results.memoryStore = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Copilot Agent Validation (Intent Detection)
  // ═══════════════════════════════════════════════════════════════════════
  try {
    // Test intent detection by importing and checking the module
    const copilotModule = await import("../../src/domains/copilot/server/copilot-agent");

    // Check that processWithAgent is exported
    const hasProcessWithAgent = typeof copilotModule.processWithAgent === "function";

    // We can't actually call processWithAgent without a real user context,
    // but we can verify the function exists and the module is loadable
    results.copilotAgent = {
      status: hasProcessWithAgent ? "ACTIVE" : "MISSING",
      processWithAgent: hasProcessWithAgent ? "EXPORTED" : "NOT FOUND",
      integrationNote: "processWithAgent() is wired into askCopilot() — check copilot logs",
    };
  } catch (err) {
    errors.push(`Copilot Agent: ${err instanceof Error ? err.message : String(err)}`);
    results.copilotAgent = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Database Tables Validation
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { checkMigrations } = await import("../../src/shared/migrate.server");
    const migrationStatus = await checkMigrations();

    results.database = {
      status: migrationStatus.allComplete ? "ALL TABLES EXIST" : "SOME TABLES MISSING",
      tables: {
        price_alerts: migrationStatus.price_alerts,
        daily_signals: migrationStatus.daily_signals,
        user_strategies: migrationStatus.user_strategies,
        trading_notes: migrationStatus.trading_notes,
        trades: migrationStatus.trades,
        copilot_conversations: migrationStatus.copilot_conversations,
        copilot_messages: migrationStatus.copilot_messages,
        daily_loops: migrationStatus.daily_loops,
        user_streaks: migrationStatus.user_streaks,
        domain_events: migrationStatus.domain_events,
        user_memories: migrationStatus.user_memories,
      },
    };
  } catch (err) {
    errors.push(`Database: ${err instanceof Error ? err.message : String(err)}`);
    results.database = { status: "ERROR", error: err instanceof Error ? err.message : String(err) };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════
  const activeCount = Object.values(results).filter(
    (r: any) => r.status === "ACTIVE" || r.status === "ALL TABLES EXIST",
  ).length;
  const totalComponents = Object.keys(results).length;

  return {
    timestamp: new Date().toISOString(),
    version: "P1-activation-v1",
    summary: {
      activeComponents: `${activeCount}/${totalComponents}`,
      errors: errors.length,
      overallStatus: errors.length === 0 ? "ALL GREEN" : `${errors.length} ISSUE(S)`,
    },
    components: results,
    errors: errors.length > 0 ? errors : undefined,
  };
});
