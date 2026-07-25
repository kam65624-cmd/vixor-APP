import { useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { askCopilot, getConsensus } from "@/domains/copilot/functions";
import {
  createConversation,
  listConversations,
  getConversation,
  saveMessage,
  deleteConversation,
  updateConversationTitle,
} from "@/domains/copilot/conversations";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { PageLayout, ScrollArea, Badge, EmptyState } from "@/components/vixor/PageLayout";
import { MoxiAvatar } from "@/components/vixor/MoxiAvatar";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  BarChart3,
  Shield,
  Newspaper,
  Wrench,
  ChevronDown,
  User,
  RotateCcw,
  Zap,
  Users,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  MessageSquare,
  Check,
  X,
  Pencil,
  BrainCircuit,
} from "lucide-react";

// ─── Helpers ───

/** Append hex alpha to a hex color for opacity (pct 0-100) */
const alpha = (hex: string, pct: number) => {
  const a = Math.round((pct / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
};

// ─── Types ───

type AgentId =
  "market_analyst" | "risk_manager" | "news_analyst" | "strategy_builder" | "auto" | "moxi";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "consensus";
  content: string;
  agent?: string;
  consensusData?: {
    responses: { agent: AgentId; response: string }[];
    synthesis: string;
  };
  timestamp: number;
  dbId?: string; // DB message ID for persistence tracking
}

interface ConversationSummary {
  id: string;
  title: string;
  agent_id: string | null;
  is_consensus: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AgentConfig {
  id: AgentId;
  label: string;
  icon: typeof BarChart3;
  color: string;
  bgColor: string;
  desc: string;
  capabilities: string[];
}

const AGENTS: AgentConfig[] = [
  {
    id: "auto",
    label: "Auto",
    icon: Zap,
    color: "var(--color-bullish)",
    bgColor: alpha("var(--color-bullish)", 10),
    desc: "AI Picks Best Agent",
    capabilities: ["Auto-detects question type", "Routes to the best agent"],
  },
  {
    id: "market_analyst",
    label: "Market Analyst",
    icon: BarChart3,
    color: "var(--color-bullish)",
    bgColor: alpha("var(--color-bullish)", 10),
    desc: "SMC/ICT Technical Analysis",
    capabilities: [
      "Market structure (BOS/ChoCh)",
      "Order Blocks & FVGs",
      "Entry/SL/TP levels",
      "Liquidity mapping",
    ],
  },
  {
    id: "risk_manager",
    label: "Risk Manager",
    icon: Shield,
    color: "var(--color-neutral-wait)",
    bgColor: alpha("var(--color-neutral-wait)", 10),
    desc: "Position Sizing & Risk Control",
    capabilities: [
      "Position sizing",
      "Risk-reward optimization",
      "Exposure analysis",
      "Stop loss placement",
    ],
  },
  {
    id: "news_analyst",
    label: "News Analyst",
    icon: Newspaper,
    color: "var(--color-info)",
    bgColor: alpha("var(--color-info)", 10),
    desc: "Fundamental News Impact",
    capabilities: [
      "Economic calendar",
      "Central bank analysis",
      "Sentiment scoring",
      "Event timing",
    ],
  },
  {
    id: "strategy_builder",
    label: "Strategy Builder",
    icon: Wrench,
    color: "var(--color-info)",
    bgColor: alpha("var(--color-info)", 10),
    desc: "Trading Plans & Systems",
    capabilities: ["Daily routines", "Trading plans", "Backtesting ideas", "Psychology coaching"],
  },
  {
    id: "moxi",
    label: "MOXI",
    icon: BrainCircuit,
    color: "#A78BFA",
    bgColor: alpha("#A78BFA", 10),
    desc: "AI Trading Companion",
    capabilities: [
      "Unified analysis + signals + alerts",
      "Proactive risk & opportunity detection",
      "Portfolio overview & insights",
      "Tool execution on your behalf",
    ],
  },
];

const QUICK_ACTIONS: { label: string; prompt: string; agent: AgentId }[] = [
  {
    label: "Analyze BTC/USDT setup",
    prompt:
      "Give me a detailed SMC analysis of BTC/USDT right now. Identify key Order Blocks, Fair Value Gaps, and liquidity levels.",
    agent: "market_analyst",
  },
  {
    label: "Review my risk exposure",
    prompt:
      "Based on my recent analyses and active alerts, review my current risk exposure. Am I overexposed to any single direction or pair?",
    agent: "risk_manager",
  },
  {
    label: "What's moving the markets?",
    prompt:
      "What are the key fundamental events and news driving the markets right now? How should I position myself?",
    agent: "news_analyst",
  },
  {
    label: "Build a daily routine",
    prompt:
      "Help me build a structured daily trading routine with pre-market, intraday, and post-market checklists.",
    agent: "strategy_builder",
  },
  {
    label: "XAU/USD outlook",
    prompt:
      "What's the current outlook for XAU/USD? Analyze the key levels, market structure, and potential setups.",
    agent: "market_analyst",
  },
  {
    label: "Full consensus: Gold trade",
    prompt:
      "Should I trade XAU/USD right now? I want all perspectives — technical, risk, fundamental, and strategic.",
    agent: "auto",
  },
  {
    label: "MOXI: Market pulse",
    prompt:
      "Give me a quick market summary — what's moving, what's quiet, any events I should know about?",
    agent: "moxi",
  },
  {
    label: "MOXI: Check my signals",
    prompt: "What's the status of my active signals? Any close to TP or SL?",
    agent: "moxi",
  },
];

// ─── Shared button style (icon button) ───
const iconBtnBase: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: `1px solid ${"var(--color-border)"}`,
  background: "var(--color-card)",
  cursor: "pointer",
  transition: "background 0.15s ease",
};

// ─── Main Component ───

export function CopilotPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const search = useSearch({ strict: false }) as {
    chartPair?: string;
    chartTimeframe?: string;
    chartPrice?: number;
    chartSymbol?: string;
  };

  // Build chart session context if available (from charts page navigation)
  const chartSession = useMemo(() => {
    if (search.chartPair && search.chartTimeframe && search.chartPrice) {
      return {
        pair: search.chartPair,
        timeframe: search.chartTimeframe,
        currentPrice: search.chartPrice,
        tradingViewSymbol: search.chartSymbol || search.chartPair,
      };
    }
    return undefined;
  }, [search.chartPair, search.chartTimeframe, search.chartPrice, search.chartSymbol]);

  // ─── Chat State ───
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentId>("auto");
  const [showAgents, setShowAgents] = useState(false);
  const [consensusMode, setConsensusMode] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Sidebar State ───
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // ─── Stable Server Functions ───
  const askCopilotFn = useStableServerFn(askCopilot);
  const getConsensusFn = useStableServerFn(getConsensus);
  const createConversationFn = useStableServerFn(createConversation);
  const listConversationsFn = useStableServerFn(listConversations);
  const getConversationFn = useStableServerFn(getConversation);
  const saveMessageFn = useStableServerFn(saveMessage);
  const deleteConversationFn = useStableServerFn(deleteConversation);
  const updateConversationTitleFn = useStableServerFn(updateConversationTitle);

  // ─── Fetch Conversation List (paginated) ───
  const [convPage, setConvPage] = useState(1);
  const CONV_PAGE_SIZE = 15;
  const conversationsQuery = useQuery({
    queryKey: ["copilot-conversations", convPage],
    queryFn: () =>
      listConversationsFn({
        data: { limit: CONV_PAGE_SIZE, offset: (convPage - 1) * CONV_PAGE_SIZE },
      }),
  });

  // ─── Copilot Mutation ───
  const copilotMutation = useMutation({
    mutationFn: (data: {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      agent: AgentId;
      chartSession?: {
        pair: string;
        timeframe: string;
        currentPrice: number;
        tradingViewSymbol: string;
      };
    }) => askCopilotFn({ data }),
    onSuccess: async (result) => {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
        agent: result.agent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setConsensusMode(false);

      // Save assistant message to DB
      if (activeConversationId) {
        try {
          await saveMessageFn({
            data: {
              conversation_id: activeConversationId,
              role: "assistant",
              content: result.response,
              agent_id: result.agent,
            },
          });
          // Refresh conversation list to pick up title changes
          queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
        } catch {
          // Silent fail — persistence shouldn't break the UX
        }
      }
    },
    onError: (error) => {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${error.message || "Failed to get AI response. Please try again."}`,
        agent: "error",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setConsensusMode(false);
    },
  });

  // ─── Consensus Mutation ───
  const consensusMutation = useMutation({
    mutationFn: (data: { message: string }) => getConsensusFn({ data }),
    onSuccess: async (result) => {
      const consensusMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "consensus",
        content: "",
        agent: "consensus",
        consensusData: result,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, consensusMsg]);
      setConsensusMode(false);

      // Save consensus as assistant message with metadata
      if (activeConversationId) {
        try {
          await saveMessageFn({
            data: {
              conversation_id: activeConversationId,
              role: "assistant",
              content: result.synthesis,
              agent_id: "consensus",
              metadata: {
                consensusData: {
                  responses: result.responses,
                  synthesis: result.synthesis,
                },
              },
            },
          });
          queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
        } catch {
          // Silent fail
        }
      }
    },
    onError: (error) => {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${error.message || "Failed to get consensus. Please try again."}`,
        agent: "error",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setConsensusMode(false);
    },
  });

  // ─── Streaming Copilot ───
  const streamCopilot = useCallback(
    async (params: {
      trimmed: string;
      history: { role: "user" | "assistant"; content: string }[];
      agent: AgentId;
      chartSession?: {
        pair: string;
        timeframe: string;
        currentPrice: number;
        tradingViewSymbol: string;
      };
    }) => {
      const { trimmed, history, agent, chartSession } = params;
      setIsStreaming(true);
      setConsensusMode(false);

      // Create an empty assistant message that will be progressively updated
      const streamMsgId = crypto.randomUUID();
      const streamMsg: ChatMessage = {
        id: streamMsgId,
        role: "assistant",
        content: "",
        agent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, streamMsg]);

      try {
        const token =
          typeof window !== "undefined"
            ? (() => {
                // Try Supabase access token from multiple sources
                // 1. sb-access-token cookie (Supabase default)
                const cookieToken = document.cookie
                  .split("; ")
                  .find((row) => row.startsWith("sb-access-token="))
                  ?.split("=")[1];
                if (cookieToken) return cookieToken;
                // 2. sb-<ref>-auth-token cookie (Supabase project-specific)
                const projCookie = document.cookie
                  .split("; ")
                  .find((row) => row.startsWith("sb-") && row.includes("-auth-token="))
                  ?.split("=")[1];
                if (projCookie) return projCookie;
                // 3. localStorage fallback
                return localStorage.getItem("sb-token") || "";
              })()
            : "";

        if (!token) throw new Error("No auth token found");

        const response = await fetch("/api/copilot-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: chartSession
              ? `${chartSession.pair} (${chartSession.timeframe}) — ${trimmed}`
              : trimmed,
            history,
            agent,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "Stream request failed");
          throw new Error(errText || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";
        let resolvedAgent = agent;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.agent && chunk.agent !== "auto") resolvedAgent = chunk.agent;
              if (chunk.delta) {
                fullContent += chunk.delta;
                const currentContent = fullContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? { ...m, content: currentContent, agent: resolvedAgent }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        // Save the complete message to conversation
        if (activeConversationId && fullContent) {
          try {
            await saveMessageFn({
              data: {
                conversation_id: activeConversationId,
                role: "assistant",
                content: fullContent,
                agent_id: resolvedAgent,
              },
            });
            queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
          } catch {
            // Silent fail
          }
        }
      } catch (err) {
        // On streaming error, replace the empty message with the error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamMsgId
              ? {
                  ...m,
                  content: `⚠️ ${err instanceof Error ? err.message : "Streaming failed"}. Retrying with standard mode...`,
                  agent: "error" as any,
                }
              : m,
          ),
        );
        // Remove the failed message after a short delay and re-throw for the fallback
        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
        }, 1500);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    [activeConversationId, saveMessageFn, queryClient],
  );

  // ─── Send Message ───
  const sendMessage = useCallback(
    async (text: string, agentOverride?: AgentId) => {
      const trimmed = text.trim();
      if (!trimmed || copilotMutation.isPending || consensusMutation.isPending || isStreaming)
        return;
      const agent = agentOverride || activeAgent;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // ─── Persistence: Create conversation if needed ───
      let convId = activeConversationId;
      if (!convId) {
        try {
          const conv = await createConversationFn({
            data: {
              agent_id: agent,
              is_consensus: consensusMode,
            },
          });
          convId = conv.id;
          setActiveConversationId(convId);
          // Save the user message to DB
          await saveMessageFn({
            data: {
              conversation_id: convId,
              role: "user",
              content: trimmed,
            },
          });
          // Refresh conversation list
          queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
        } catch {
          // If persistence fails, continue with ephemeral chat
        }
      } else {
        // Save user message to existing conversation
        try {
          await saveMessageFn({
            data: {
              conversation_id: convId,
              role: "user",
              content: trimmed,
            },
          });
        } catch {
          // Silent fail
        }
      }

      if (consensusMode) {
        consensusMutation.mutate({ message: trimmed });
      } else {
        // Try streaming first, fall back to non-streaming
        streamCopilot({ trimmed, history, agent, chartSession }).catch(() => {
          // Fall back to non-streaming mutation
          copilotMutation.mutate({ message: trimmed, history, agent, chartSession });
        });
      }
    },
    [
      activeAgent,
      copilotMutation,
      consensusMutation,
      messages,
      consensusMode,
      activeConversationId,
      createConversationFn,
      saveMessageFn,
      queryClient,
      chartSession,
      isStreaming,
      streamCopilot,
    ],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
      setInput("");
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
        setInput("");
      }
    },
    [input, sendMessage],
  );

  // ─── New Chat ───
  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setConsensusMode(false);
    setMobileDrawerOpen(false);
  }, []);

  // ─── Load Conversation ───
  const loadConversation = useCallback(
    async (convId: string) => {
      try {
        const conv = await getConversationFn({ data: { conversationId: convId } });
        setActiveConversationId(convId);

        // Convert DB messages to ChatMessage format
        const loadedMessages: ChatMessage[] = (conv.messages || []).map((msg: any) => {
          // Check if this is a consensus message
          if (msg.agent_id === "consensus" && msg.metadata?.consensusData) {
            return {
              id: msg.id || crypto.randomUUID(),
              dbId: msg.id,
              role: "consensus",
              content: "",
              agent: "consensus",
              consensusData: msg.metadata.consensusData,
              timestamp: new Date(msg.created_at).getTime(),
            };
          }
          return {
            id: msg.id || crypto.randomUUID(),
            dbId: msg.id,
            role: msg.role as "user" | "assistant" | "consensus",
            content: msg.content,
            agent: msg.agent_id || undefined,
            timestamp: new Date(msg.created_at).getTime(),
          };
        });
        setMessages(loadedMessages);
        setActiveAgent((conv.agent_id as AgentId) || "auto");
        setMobileDrawerOpen(false);
      } catch {
        // If loading fails, just clear the chat
        startNewChat();
      }
    },
    [getConversationFn, startNewChat],
  );

  // ─── Delete Conversation ───
  const handleDeleteConversation = useCallback(
    async (convId: string) => {
      try {
        await deleteConversationFn({ data: { conversationId: convId } });
        if (activeConversationId === convId) {
          startNewChat();
        }
        queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
        setDeleteConfirmId(null);
      } catch {
        // Silent fail
      }
    },
    [deleteConversationFn, activeConversationId, startNewChat, queryClient],
  );

  // ─── Rename Conversation ───
  const handleRenameConversation = useCallback(
    async (convId: string, newTitle: string) => {
      try {
        await updateConversationTitleFn({ data: { conversationId: convId, title: newTitle } });
        queryClient.invalidateQueries({ queryKey: ["copilot-conversations"] });
        setEditingTitleId(null);
      } catch {
        // Silent fail
      }
    },
    [updateConversationTitleFn, queryClient],
  );

  // ─── Auto-scroll ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const currentAgentConfig = AGENTS.find((a) => a.id === activeAgent)!;
  const isPending = copilotMutation.isPending || consensusMutation.isPending;
  const conversationsRaw = conversationsQuery.data as
    { items: ConversationSummary[]; total: number; hasMore: boolean } | undefined;
  const conversations = conversationsRaw?.items ?? [];
  const conversationsTotal = conversationsRaw?.total ?? 0;

  // ─── Get agent icon for sidebar ───
  const getAgentIcon = (agentId: string | null) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent || agentId === "auto") return Zap;
    return agent.icon;
  };

  const getAgentColor = (agentId: string | null) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent || agentId === "auto") return "var(--color-bullish)";
    return agent.color;
  };

  return (
    <div style={{ height: "calc(100vh - 8rem)" }}>
      <PageLayout title="AI Copilot" badge="COPILOT" badgeColor={"var(--color-info)"}>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* ─── Desktop Sidebar ─── */}
          <div
            className={`hidden lg:flex flex-col transition-all duration-300 shrink-0 ${
              sidebarOpen ? "w-72" : "w-0 overflow-hidden"
            }`}
            style={{ borderRight: `1px solid ${"var(--color-border)"}` }}
          >
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              isLoading={conversationsQuery.isLoading}
              onSelect={loadConversation}
              onDelete={handleDeleteConversation}
              onRename={handleRenameConversation}
              onNewChat={startNewChat}
              deleteConfirmId={deleteConfirmId}
              setDeleteConfirmId={setDeleteConfirmId}
              editingTitleId={editingTitleId}
              setEditingTitleId={setEditingTitleId}
              editingTitleValue={editingTitleValue}
              setEditingTitleValue={setEditingTitleValue}
              getAgentIcon={getAgentIcon}
              getAgentColor={getAgentColor}
              page={convPage}
              pageSize={CONV_PAGE_SIZE}
              total={conversationsTotal}
              onPageChange={setConvPage}
            />
          </div>

          {/* ─── Mobile Drawer Overlay ─── */}
          {mobileDrawerOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                style={{ background: "rgba(0,0,0,0.5)" }}
                className="absolute inset-0"
                onClick={() => setMobileDrawerOpen(false)}
              />
              <div
                className="relative w-80 max-w-[85vw] h-full animate-in slide-in-from-left duration-200"
                style={{
                  background: "var(--color-background)",
                  borderRight: `1px solid ${"var(--color-border)"}`,
                }}
              >
                <ConversationSidebar
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  isLoading={conversationsQuery.isLoading}
                  onSelect={loadConversation}
                  onDelete={handleDeleteConversation}
                  onRename={handleRenameConversation}
                  onNewChat={startNewChat}
                  deleteConfirmId={deleteConfirmId}
                  setDeleteConfirmId={setDeleteConfirmId}
                  editingTitleId={editingTitleId}
                  setEditingTitleId={setEditingTitleId}
                  editingTitleValue={editingTitleValue}
                  setEditingTitleValue={setEditingTitleValue}
                  getAgentIcon={getAgentIcon}
                  getAgentColor={getAgentColor}
                  page={convPage}
                  pageSize={CONV_PAGE_SIZE}
                  total={conversationsTotal}
                  onPageChange={setConvPage}
                />
              </div>
            </div>
          )}

          {/* ─── Main Chat Area ─── */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* ─── Header Controls ─── */}
            <div className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Sidebar toggle */}
                  <button
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setMobileDrawerOpen(true);
                      } else {
                        setSidebarOpen(!sidebarOpen);
                      }
                    }}
                    style={iconBtnBase}
                    title="Chat history"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-card)";
                    }}
                  >
                    {sidebarOpen ? (
                      <PanelLeftClose
                        size={16}
                        style={{ color: "var(--color-muted-foreground)" }}
                      />
                    ) : (
                      <PanelLeftOpen size={16} style={{ color: "var(--color-muted-foreground)" }} />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={startNewChat}
                      style={iconBtnBase}
                      title="New chat"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--color-card)";
                      }}
                    >
                      <Plus size={16} style={{ color: "var(--color-muted-foreground)" }} />
                    </button>
                  )}
                  {messages.length > 0 && (
                    <button
                      onClick={() => {
                        setMessages([]);
                        setActiveConversationId(null);
                        setConsensusMode(false);
                      }}
                      style={iconBtnBase}
                      title="Clear chat"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--color-card)";
                      }}
                    >
                      <RotateCcw size={16} style={{ color: "var(--color-muted-foreground)" }} />
                    </button>
                  )}
                </div>
              </div>

              {/* ─── Agent Selector + Consensus Toggle ─── */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAgents(!showAgents)}
                    className="flex items-center gap-2 px-3 h-9 rounded-xl transition-colors flex-1 sm:flex-none"
                    style={{
                      background: "var(--color-card)",
                      border: `1px solid ${"var(--color-border)"}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-card)";
                    }}
                  >
                    <currentAgentConfig.icon
                      size={16}
                      style={{ color: currentAgentConfig.color }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {currentAgentConfig.label}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: "var(--color-muted-foreground)",
                        transition: "transform 0.2s",
                        transform: showAgents ? "rotate(180deg)" : "none",
                      }}
                    />
                  </button>

                  <button
                    onClick={() => setConsensusMode(!consensusMode)}
                    className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-bold transition-all"
                    style={
                      consensusMode
                        ? {
                            background: alpha("var(--color-bullish)", 15),
                            border: `1px solid ${alpha("var(--color-bullish)", 40)}`,
                            color: "var(--color-bullish)",
                          }
                        : {
                            background: "var(--color-card)",
                            border: `1px solid ${"var(--color-border)"}`,
                            color: "var(--color-muted-foreground)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!consensusMode)
                        e.currentTarget.style.background = "var(--color-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!consensusMode) e.currentTarget.style.background = "var(--color-card)";
                    }}
                  >
                    <Users size={16} />
                    <span className="hidden sm:inline">
                      {t("copilot.consensusMode") || "Consensus"}
                    </span>
                    <span className="sm:hidden">{t("copilot.consensusShort") || "All"}</span>
                  </button>
                </div>

                {consensusMode && (
                  <div
                    className="p-2.5 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200"
                    style={{
                      background: alpha("var(--color-bullish)", 5),
                      border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
                    }}
                  >
                    <div
                      className="flex items-center gap-2 text-xs font-bold"
                      style={{ color: "var(--color-bullish)" }}
                    >
                      <Users size={14} />
                      {t("copilot.consensusMode") || "Multi-Agent Consensus"}
                    </div>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {t("copilot.consensusDesc") || "Get perspectives from all 4 AI agents"}
                    </p>
                  </div>
                )}

                {showAgents && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {AGENTS.map((agent) => {
                      const Icon = agent.icon;
                      const isActive = activeAgent === agent.id;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setActiveAgent(agent.id);
                            setShowAgents(false);
                            if (agent.id === "auto") setConsensusMode(false);
                          }}
                          className="w-full p-3 rounded-xl text-left transition-all"
                          style={
                            isActive
                              ? {
                                  background: alpha(agent.color, 10),
                                  border: `1px solid ${alpha(agent.color, 30)}`,
                                }
                              : {
                                  background: "var(--color-card)",
                                  border: `1px solid ${"var(--color-border)"}`,
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!isActive)
                              e.currentTarget.style.background = "var(--color-card-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "var(--color-card)";
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="size-6 rounded-lg flex items-center justify-center"
                              style={{ background: agent.bgColor }}
                            >
                              <Icon size={14} style={{ color: agent.color }} />
                            </div>
                            <span
                              className="text-xs font-bold"
                              style={{ color: isActive ? agent.color : "var(--color-foreground)" }}
                            >
                              {agent.label}
                            </span>
                            {agent.id === "auto" && (
                              <Badge
                                label={t("copilot.autoMode")?.split(" ")[0] || "AUTO"}
                                color={"var(--color-bullish)"}
                                small
                              />
                            )}
                          </div>
                          <div
                            className="text-[10px] mb-1.5"
                            style={{ color: "var(--color-muted-foreground)" }}
                          >
                            {agent.desc}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {agent.capabilities.slice(0, 4).map((cap, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-1.5 py-0.5 rounded-md"
                                style={{
                                  background: "var(--color-card)",
                                  border: `1px solid ${"var(--color-border)"}`,
                                  color: "var(--color-muted-foreground)",
                                }}
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Messages Area ─── */}
            <ScrollArea
              style={{
                flex: 1,
                padding: "0 4px",
                gap: "12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {messages.length === 0 ? (
                <ChatWelcome onQuickAction={sendMessage} onConsensus={setConsensusMode} />
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onConsultAgent={(agent) => {
                      setActiveAgent(agent);
                      setShowAgents(false);
                      sendMessage(msg.role === "user" ? msg.content : "", agent);
                    }}
                  />
                ))
              )}

              {copilotMutation.isPending && (
                <div className="flex items-start gap-3 animate-in fade-in duration-300">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: alpha("var(--color-bullish)", 10),
                      border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
                    }}
                  >
                    <Bot size={16} style={{ color: "var(--color-bullish)" }} />
                  </div>
                  <div className="vixor-card p-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "var(--color-bullish)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        {consensusMode
                          ? "Getting consensus from all agents..."
                          : "Vixor is thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {consensusMutation.isPending && (
                <div className="flex items-start gap-3 animate-in fade-in duration-300">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: alpha("var(--color-bullish)", 10),
                      border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
                    }}
                  >
                    <Users size={16} style={{ color: "var(--color-bullish)" }} />
                  </div>
                  <div className="vixor-card p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "var(--color-bullish)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        Consulting all 4 agents...
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {AGENTS.filter((a) => a.id !== "auto").map((agent, i) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-1.5 text-[10px] animate-pulse"
                          style={{
                            color: "var(--color-muted-foreground)",
                            animationDelay: `${i * 300}ms`,
                          }}
                        >
                          <agent.icon size={12} style={{ color: agent.color }} />
                          {agent.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* ─── Input Area ─── */}
            <div
              className="flex-shrink-0 pt-3"
              style={{ borderTop: `1px solid ${"var(--color-border)"}` }}
            >
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      consensusMode
                        ? t("copilot.consensusPlaceholder") ||
                          "Ask all 4 agents for their perspective..."
                        : t("copilot.placeholder") || "Ask Vixor anything about trading..."
                    }
                    rows={1}
                    className="w-full resize-none rounded-xl px-4 py-3 text-sm transition-all max-h-32 min-h-[44px]"
                    style={{
                      background: "var(--color-card)",
                      border: `1px solid ${"var(--color-border)"}`,
                      color: "var(--color-foreground)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = "none";
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${alpha("var(--color-bullish)", 30)}`;
                      e.currentTarget.style.borderColor = alpha("var(--color-bullish)", 50);
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "var(--color-border)";
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = Math.min(target.scrollHeight, 128) + "px";
                    }}
                    disabled={isPending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isPending}
                  className="size-11 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={
                    consensusMode
                      ? {
                          background: `linear-gradient(to right, ${"var(--color-bullish)"}, ${"var(--color-neutral-wait)"}, ${"var(--color-info)"})`,
                          color: "var(--color-foreground)",
                        }
                      : {
                          background: `linear-gradient(to right, ${"var(--color-bullish)"}, ${"var(--color-bullish)"})`,
                          color: "var(--color-foreground)",
                        }
                  }
                >
                  {isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : consensusMode ? (
                    <Users size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>
              <div className="mt-1.5 text-center">
                <span
                  className="text-[11px]"
                  style={{ color: alpha("var(--color-muted-foreground)", 50) }}
                >
                  AI responses may not always be accurate. Always verify with your own analysis.
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}

// ─── Conversation Sidebar ───

function ConversationSidebar({
  conversations,
  activeConversationId,
  isLoading,
  onSelect,
  onDelete,
  onRename,
  onNewChat,
  deleteConfirmId,
  setDeleteConfirmId,
  editingTitleId,
  setEditingTitleId,
  editingTitleValue,
  setEditingTitleValue,
  getAgentIcon,
  getAgentColor,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNewChat: () => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  editingTitleId: string | null;
  setEditingTitleId: (id: string | null) => void;
  editingTitleValue: string;
  setEditingTitleValue: (v: string) => void;
  getAgentIcon: (id: string | null) => typeof BarChart3;
  getAgentColor: (id: string | null) => string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitleId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingTitleId]);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3" style={{ borderBottom: `1px solid ${"var(--color-border)"}` }}>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 h-9 rounded-xl text-white text-xs font-bold transition-opacity"
          style={{
            background: `linear-gradient(to right, ${"var(--color-bullish)"}, ${"var(--color-bullish)"})`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <ScrollArea style={{ padding: "8px", gap: "4px", display: "flex", flexDirection: "column" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: "var(--color-muted-foreground)" }}
            />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState icon="💬" title="No conversations yet" message="Start a new chat to begin!" />
        ) : (
          conversations.map((conv) => {
            const isActive = activeConversationId === conv.id;
            const isConfirmingDelete = deleteConfirmId === conv.id;
            const isEditing = editingTitleId === conv.id;
            const AgentIcon = getAgentIcon(conv.agent_id);
            const agentColor = getAgentColor(conv.agent_id);

            return (
              <div
                key={conv.id}
                className="group rounded-xl transition-all"
                style={
                  isActive
                    ? {
                        background: alpha("var(--color-bullish)", 10),
                        border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
                      }
                    : {
                        border: "1px solid transparent",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--color-card)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1 p-2">
                    <input
                      ref={renameInputRef}
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRename(conv.id, editingTitleValue);
                        } else if (e.key === "Escape") {
                          setEditingTitleId(null);
                        }
                      }}
                      className="flex-1 text-xs rounded-lg px-2 py-1"
                      style={{
                        background: "var(--color-card)",
                        border: `1px solid ${"var(--color-border)"}`,
                        color: "var(--color-foreground)",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${alpha("var(--color-bullish)", 30)}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      onClick={() => onRename(conv.id, editingTitleValue)}
                      className="size-6 rounded-lg flex items-center justify-center"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Check size={12} style={{ color: "var(--color-bullish)" }} />
                    </button>
                    <button
                      onClick={() => setEditingTitleId(null)}
                      className="size-6 rounded-lg flex items-center justify-center"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-card-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <X size={12} style={{ color: "var(--color-muted-foreground)" }} />
                    </button>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="p-2">
                    <p
                      className="text-[10px] mb-1.5 truncate"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      Delete &quot;{conv.title}&quot;?
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDelete(conv.id)}
                        className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                        style={{
                          background: alpha("var(--color-bearish)", 10),
                          color: "var(--color-bearish)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = alpha("var(--color-bearish)", 20);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = alpha("var(--color-bearish)", 10);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                        style={{
                          background: "var(--color-card)",
                          border: `1px solid ${"var(--color-border)"}`,
                          color: "var(--color-foreground)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--color-card-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--color-card)";
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2">
                    <button
                      onClick={() => onSelect(conv.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <div
                        className="size-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isActive
                            ? alpha("var(--color-bullish)", 15)
                            : "var(--color-card)",
                          border: `1px solid ${"var(--color-border)"}`,
                        }}
                      >
                        {conv.is_consensus ? (
                          <Users
                            size={12}
                            style={{ color: isActive ? "var(--color-bullish)" : agentColor }}
                          />
                        ) : (
                          <AgentIcon
                            size={12}
                            style={{ color: isActive ? "var(--color-bullish)" : agentColor }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-medium truncate"
                          style={{
                            color: isActive ? "var(--color-bullish)" : "var(--color-foreground)",
                          }}
                        >
                          {conv.title}
                        </div>
                        <div
                          className="text-[11px]"
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          {formatRelativeTime(conv.updated_at)}
                        </div>
                      </div>
                    </button>
                    <div
                      className="flex items-center gap-0.5 shrink-0 transition-opacity"
                      style={{ opacity: 0 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0";
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(conv.id);
                          setEditingTitleValue(conv.title);
                        }}
                        className="size-6 rounded-lg flex items-center justify-center"
                        title="Rename"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--color-card-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Pencil size={12} style={{ color: "var(--color-muted-foreground)" }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="size-6 rounded-lg flex items-center justify-center"
                        title="Delete"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = alpha("var(--color-bearish)", 10);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <Trash2 size={12} style={{ color: "var(--color-muted-foreground)" }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </ScrollArea>

      {/* Pagination */}
      {total > pageSize && (
        <div className="p-2" style={{ borderTop: `1px solid ${"var(--color-border)"}` }}>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

// ─── Relative time formatter ───
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

// ─── Chat Welcome (with Quick Actions) ───

function ChatWelcome({
  onQuickAction,
  onConsensus,
}: {
  onQuickAction: (prompt: string, agent: AgentId) => void;
  onConsensus: (v: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4">
      <div className="relative mb-6">
        <div
          className="size-20 rounded-2xl flex items-center justify-center"
          style={{
            background: alpha("var(--color-bullish)", 10),
            border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
          }}
        >
          <Sparkles size={36} style={{ color: "var(--color-bullish)" }} />
        </div>
        <div
          className="absolute -right-1 -top-1 size-5 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-bullish)" }}
        >
          <Bot size={12} style={{ color: "var(--color-foreground)" }} />
        </div>
      </div>

      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-foreground)" }}>
        {t("copilot.welcomeTitle") || "How can I help you today?"}
      </h2>
      <p
        className="text-sm text-center max-w-xs mb-4"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {t("copilot.welcomeDesc") ||
          "I'm your context-aware AI trading assistant. I know your recent analyses, signals, and alerts."}
      </p>

      {/* Consensus CTA */}
      <button
        onClick={() => onConsensus(true)}
        className="w-full max-w-lg mb-4 p-3 rounded-xl transition-all group"
        style={{
          background: `linear-gradient(to right, ${alpha("var(--color-bullish)", 10)}, ${alpha("var(--color-neutral-wait)", 10)}, ${alpha("var(--color-info)", 10)})`,
          border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = alpha("var(--color-bullish)", 40);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = alpha("var(--color-bullish)", 20);
        }}
      >
        <div className="flex items-center gap-2 justify-center">
          <Users size={16} style={{ color: "var(--color-bullish)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--color-bullish)" }}>
            {t("copilot.getConsensus") || "Get Multi-Agent Consensus"}
          </span>
        </div>
        <p
          className="text-[10px] mt-1 text-center"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {t("copilot.consensusDesc") || "Get perspectives from all 4 AI agents"}
        </p>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {QUICK_ACTIONS.map((action, i) => {
          const agentConfig = AGENTS.find((a) => a.id === action.agent);
          const Icon = agentConfig?.icon || BarChart3;
          return (
            <button
              key={i}
              onClick={() => onQuickAction(action.prompt, action.agent)}
              className="p-3 rounded-xl text-left transition-all group"
              style={{
                background: "var(--color-card)",
                border: `1px solid ${"var(--color-border)"}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-card-hover)";
                e.currentTarget.style.borderColor = alpha("var(--color-bullish)", 30);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-card)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: agentConfig?.color || "var(--color-bullish)" }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider transition-colors"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {agentConfig?.label}
                </span>
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                {action.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Message Bubble ───

function MessageBubble({
  message,
  onConsultAgent,
}: {
  message: ChatMessage;
  onConsultAgent: (agent: AgentId) => void;
}) {
  const { t } = useI18n();
  const isUser = message.role === "user";
  const isError = message.agent === "error";
  const isConsensus = message.role === "consensus";

  if (isConsensus && message.consensusData) {
    return (
      <ConsensusBubble
        data={message.consensusData}
        timestamp={message.timestamp}
        onConsultAgent={onConsultAgent}
      />
    );
  }

  const agentConfig = AGENTS.find((a) => a.id === message.agent);
  const Icon = isUser ? User : agentConfig?.icon || Bot;
  const iconColor = isError
    ? "var(--color-bearish)"
    : isUser
      ? "var(--color-muted-foreground)"
      : agentConfig?.color || "var(--color-bullish)";

  // Detect agent handoff suggestions in the message
  const handoffAgents = detectHandoffAgents(message.content);

  return (
    <div
      className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser && message.agent === "moxi" ? (
        <MoxiAvatar size={32} variant="default" />
      ) : (
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: isUser
              ? "var(--color-card)"
              : isError
                ? alpha("var(--color-bearish)", 10)
                : alpha("var(--color-bullish)", 10),
            border: `1px solid ${
              isUser
                ? "var(--color-border)"
                : isError
                  ? alpha("var(--color-bearish)", 20)
                  : alpha("var(--color-bullish)", 20)
            }`,
          }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      )}
      <div
        className="max-w-[85%] vixor-card p-4"
        style={
          isUser
            ? {
                background: alpha("var(--color-bullish)", 5),
                borderColor: alpha("var(--color-bullish)", 15),
              }
            : isError
              ? {
                  borderColor: alpha("var(--color-bearish)", 20),
                  background: alpha("var(--color-bearish)", 5),
                }
              : undefined
        }
      >
        {!isUser && !isError && agentConfig && (
          <div className="flex items-center gap-1.5 mb-2">
            <Badge label={agentConfig.label} color={agentConfig.color} small />
          </div>
        )}
        <div className="text-sm leading-relaxed prose-sm">
          <FormattedContent content={message.content} />
        </div>

        {/* Agent handoff buttons */}
        {!isUser && handoffAgents.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 mt-3 pt-2"
            style={{ borderTop: `1px solid ${alpha("var(--color-border)", 50)}` }}
          >
            {handoffAgents.map((hAgent) => {
              const hConfig = AGENTS.find((a) => a.id === hAgent);
              if (!hConfig) return null;
              const HIcon = hConfig.icon;
              return (
                <button
                  key={hAgent}
                  onClick={() => onConsultAgent(hAgent)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: "var(--color-card)",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-card-hover)";
                    e.currentTarget.style.borderColor = alpha("var(--color-bullish)", 30);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-card)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <HIcon size={12} style={{ color: hConfig.color }} />
                  <span style={{ color: hConfig.color }}>
                    {t("copilot.consultAgent", { agent: hConfig.label }) ||
                      `Consult ${hConfig.label}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="text-[11px] mt-2"
          style={{
            color: alpha("var(--color-muted-foreground)", 50),
            textAlign: isUser ? "right" : "left",
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Consensus Bubble ───

function ConsensusBubble({
  data,
  timestamp,
  onConsultAgent,
}: {
  data: { responses: { agent: AgentId; response: string }[]; synthesis: string };
  timestamp: number;
  onConsultAgent: (agent: AgentId) => void;
}) {
  const { t } = useI18n();
  const [expandedAgent, setExpandedAgent] = useState<AgentId | null>(null);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Synthesis section */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="size-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${alpha("var(--color-bullish)", 20)}, ${alpha("var(--color-neutral-wait)", 20)}, ${alpha("var(--color-info)", 20)})`,
            border: `1px solid ${alpha("var(--color-bullish)", 20)}`,
          }}
        >
          <Users size={16} style={{ color: "var(--color-bullish)" }} />
        </div>
        <div
          className="vixor-card p-4 flex-1"
          style={{ borderColor: alpha("var(--color-bullish)", 15) }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} style={{ color: "var(--color-bullish)" }} />
            <Badge
              label={t("copilot.synthesis") || "AI Synthesis"}
              color={"var(--color-bullish)"}
              small
            />
          </div>
          <div className="text-sm leading-relaxed prose-sm">
            <FormattedContent content={data.synthesis} />
          </div>
        </div>
      </div>

      {/* Individual agent responses */}
      <div className="ml-11 space-y-2">
        {data.responses.map((r) => {
          const agentConfig = AGENTS.find((a) => a.id === r.agent);
          if (!agentConfig) return null;
          const AIcon = agentConfig.icon;
          const isExpanded = expandedAgent === r.agent;

          return (
            <div key={r.agent} className="vixor-card overflow-hidden">
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : r.agent)}
                className="w-full flex items-center gap-2 p-3 transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-card-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="size-6 rounded-lg flex items-center justify-center"
                  style={{ background: agentConfig.bgColor }}
                >
                  <AIcon size={12} style={{ color: agentConfig.color }} />
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: agentConfig.color }}
                >
                  {agentConfig.label}
                </span>
                <ChevronDown
                  size={12}
                  className="ml-auto"
                  style={{
                    color: "var(--color-muted-foreground)",
                    transition: "transform 0.2s",
                    transform: isExpanded ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in fade-in duration-200">
                  <div className="text-xs leading-relaxed prose-sm">
                    <FormattedContent content={r.response} />
                  </div>
                  <button
                    onClick={() => onConsultAgent(r.agent)}
                    className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: "var(--color-card)",
                      border: `1px solid ${"var(--color-border)"}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--color-card)";
                    }}
                  >
                    <AIcon size={12} style={{ color: agentConfig.color }} />
                    <span style={{ color: agentConfig.color }}>
                      {t("copilot.consultAgent", { agent: agentConfig.label }) ||
                        `Consult ${agentConfig.label}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="text-[11px] mt-2 ml-11"
        style={{ color: alpha("var(--color-muted-foreground)", 50) }}
      >
        {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

// ─── Detect handoff suggestions in agent responses ───
function detectHandoffAgents(content: string): AgentId[] {
  const agents: AgentId[] = [];
  const lower = content.toLowerCase();

  if (lower.includes("consult the risk manager") || lower.includes("consult risk manager")) {
    if (!agents.includes("risk_manager")) agents.push("risk_manager");
  }
  if (lower.includes("consult the market analyst") || lower.includes("consult market analyst")) {
    if (!agents.includes("market_analyst")) agents.push("market_analyst");
  }
  if (lower.includes("consult the news analyst") || lower.includes("consult news analyst")) {
    if (!agents.includes("news_analyst")) agents.push("news_analyst");
  }
  if (
    lower.includes("consult the strategy builder") ||
    lower.includes("consult strategy builder")
  ) {
    if (!agents.includes("strategy_builder")) agents.push("strategy_builder");
  }

  return agents;
}

// ─── Formatted Content (Markdown-like rendering) ───

function FormattedContent({ content }: { content: string }) {
  const formatted = useMemo(() => {
    const blocks = content.split(/\n\n+/);
    return blocks.map((block, blockIdx) => {
      const lines = block.split("\n");
      return (
        <div key={blockIdx} className={blockIdx > 0 ? "mt-3" : ""}>
          {lines.map((line, lineIdx) => {
            if (line.startsWith("## "))
              return (
                <h3
                  key={lineIdx}
                  className="text-sm font-bold mt-2 mb-1"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {formatInline(line.slice(3))}
                </h3>
              );
            if (line.startsWith("# "))
              return (
                <h3
                  key={lineIdx}
                  className="text-sm font-bold mt-2 mb-1"
                  style={{ color: "var(--color-bullish)" }}
                >
                  {formatInline(line.slice(2))}
                </h3>
              );
            if (line.startsWith("> "))
              return (
                <div
                  key={lineIdx}
                  className="pl-3 my-1"
                  style={{
                    borderLeft: `2px solid ${alpha("var(--color-bullish)", 40)}`,
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {formatInline(line.slice(2))}
                </div>
              );
            if (line.match(/^[-*•]\s/))
              return (
                <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                  <span className="mt-0.5 shrink-0" style={{ color: "var(--color-bullish)" }}>
                    •
                  </span>
                  <span>{formatInline(line.replace(/^[-*•]\s/, ""))}</span>
                </div>
              );
            if (line.match(/^\d+\.\s/)) {
              const match = line.match(/^(\d+\.)\s(.*)$/);
              if (match)
                return (
                  <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                    <span
                      className="font-bold text-xs mt-0.5 shrink-0"
                      style={{ color: "var(--color-bullish)" }}
                    >
                      {match[1]}
                    </span>
                    <span>{formatInline(match[2])}</span>
                  </div>
                );
            }
            if (line.trim())
              return (
                <div key={lineIdx} className="my-0.5">
                  {formatInline(line)}
                </div>
              );
            return null;
          })}
        </div>
      );
    });
  }, [content]);

  return <>{formatted}</>;
}

// ─── Inline formatting ───

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    if (match[2])
      parts.push(
        <strong key={key++} style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
          {match[2]}
        </strong>,
      );
    else if (match[3])
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md font-mono text-xs font-bold"
          style={{
            background: alpha("var(--color-bullish)", 10),
            color: "var(--color-bullish)",
          }}
        >
          {match[3]}
        </code>,
      );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return parts;
}
