import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { askCopilot, getConsensus, createConversation, listConversations, getConversation, saveMessage, deleteConversation, updateConversationTitle } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
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
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — Vixor" }] }),
  component: CopilotPage,
});

// ─── Types ───

type AgentId = "market_analyst" | "risk_manager" | "news_analyst" | "strategy_builder" | "auto";

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
    color: "text-primary",
    bgColor: "bg-primary/10",
    desc: "AI Picks Best Agent",
    capabilities: ["Auto-detects question type", "Routes to the best agent"],
  },
  {
    id: "market_analyst",
    label: "Market Analyst",
    icon: BarChart3,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    desc: "SMC/ICT Technical Analysis",
    capabilities: ["Market structure (BOS/ChoCh)", "Order Blocks & FVGs", "Entry/SL/TP levels", "Liquidity mapping"],
  },
  {
    id: "risk_manager",
    label: "Risk Manager",
    icon: Shield,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    desc: "Position Sizing & Risk Control",
    capabilities: ["Position sizing", "Risk-reward optimization", "Exposure analysis", "Stop loss placement"],
  },
  {
    id: "news_analyst",
    label: "News Analyst",
    icon: Newspaper,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    desc: "Fundamental News Impact",
    capabilities: ["Economic calendar", "Central bank analysis", "Sentiment scoring", "Event timing"],
  },
  {
    id: "strategy_builder",
    label: "Strategy Builder",
    icon: Wrench,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    desc: "Trading Plans & Systems",
    capabilities: ["Daily routines", "Trading plans", "Backtesting ideas", "Psychology coaching"],
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
];

// ─── Main Component ───

function CopilotPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // ─── Chat State ───
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentId>("auto");
  const [showAgents, setShowAgents] = useState(false);
  const [consensusMode, setConsensusMode] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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

  // ─── Fetch Conversation List ───
  const conversationsQuery = useQuery({
    queryKey: ["copilot-conversations"],
    queryFn: () => listConversationsFn({ data: { limit: 50 } }),
  });

  // ─── Copilot Mutation ───
  const copilotMutation = useMutation({
    mutationFn: (data: {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      agent: AgentId;
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

  // ─── Send Message ───
  const sendMessage = useCallback(
    async (text: string, agentOverride?: AgentId) => {
      const trimmed = text.trim();
      if (!trimmed || copilotMutation.isPending || consensusMutation.isPending) return;
      const agent = agentOverride || activeAgent;
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const history = messages.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

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
        copilotMutation.mutate({ message: trimmed, history, agent });
      }
    },
    [activeAgent, copilotMutation, consensusMutation, messages, consensusMode, activeConversationId, createConversationFn, saveMessageFn, queryClient],
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
  const conversations = conversationsQuery.data ?? [];

  // ─── Get agent icon for sidebar ───
  const getAgentIcon = (agentId: string | null) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent || agentId === "auto") return Zap;
    return agent.icon;
  };

  const getAgentColor = (agentId: string | null) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent || agentId === "auto") return "text-primary";
    return agent.color;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ─── Desktop Sidebar ─── */}
      <div
        className={`hidden lg:flex flex-col border-r border-border transition-all duration-300 shrink-0 ${
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
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
        />
      </div>

      {/* ─── Mobile Drawer Overlay ─── */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-80 max-w-[85vw] h-full bg-background border-r border-border animate-in slide-in-from-left duration-200">
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
            />
          </div>
        </div>
      )}

      {/* ─── Main Chat Area ─── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ─── Header ─── */}
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
                className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
                title="Chat history"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="size-4 text-muted-foreground" />
                ) : (
                  <PanelLeftOpen className="size-4 text-muted-foreground" />
                )}
              </button>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
                  {t("copilot.vixorAi") || "Vixor AI"}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("copilot.title") || "AI Copilot"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={startNewChat}
                  className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
                  title="New chat"
                >
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([]);
                    setActiveConversationId(null);
                    setConsensusMode(false);
                  }}
                  className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Agent Selector + Consensus Toggle ─── */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAgents(!showAgents)}
                className="flex items-center gap-2 px-3 h-9 rounded-xl bg-card border border-border hover:bg-card-hover transition-colors flex-1 sm:flex-none"
              >
                <currentAgentConfig.icon className={`size-4 ${currentAgentConfig.color}`} />
                <span className="text-xs font-bold">{currentAgentConfig.label}</span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform ${showAgents ? "rotate-180" : ""}`}
                />
              </button>

              <button
                onClick={() => setConsensusMode(!consensusMode)}
                className={`flex items-center gap-2 px-3 h-9 rounded-xl border text-xs font-bold transition-all ${
                  consensusMode
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                }`}
              >
                <Users className="size-4" />
                <span className="hidden sm:inline">{t("copilot.consensusMode") || "Consensus"}</span>
                <span className="sm:hidden">{t("copilot.consensusShort") || "All"}</span>
              </button>
            </div>

            {consensusMode && (
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <Users className="size-3.5" />
                  {t("copilot.consensusMode") || "Multi-Agent Consensus"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
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
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isActive ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`size-6 rounded-lg ${agent.bgColor} flex items-center justify-center`}>
                          <Icon className={`size-3.5 ${agent.color}`} />
                        </div>
                        <span className={`text-xs font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                          {agent.label}
                        </span>
                        {agent.id === "auto" && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">
                            {t("copilot.autoMode")?.split(" ")[0] || "AUTO"}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1.5">{agent.desc}</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 4).map((cap, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-card border border-border px-1.5 py-0.5 rounded-md text-muted-foreground"
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
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {messages.length === 0 ? (
            <EmptyState onQuickAction={sendMessage} onConsensus={setConsensusMode} />
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} onConsultAgent={(agent) => { setActiveAgent(agent); setShowAgents(false); sendMessage(msg.role === "user" ? msg.content : "", agent); }} />)
          )}

          {copilotMutation.isPending && (
            <div className="flex items-start gap-3 animate-in fade-in duration-300">
              <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="vixor-card p-4 flex-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {consensusMode ? "Getting consensus from all agents..." : "Vixor is thinking..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {consensusMutation.isPending && (
            <div className="flex items-start gap-3 animate-in fade-in duration-300">
              <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Users className="size-4 text-primary" />
              </div>
              <div className="vixor-card p-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Consulting all 4 agents...</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AGENTS.filter(a => a.id !== "auto").map((agent, i) => (
                    <div key={agent.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground animate-pulse" style={{ animationDelay: `${i * 300}ms` }}>
                      <agent.icon className={`size-3 ${agent.color}`} />
                      {agent.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input Area ─── */}
        <div className="flex-shrink-0 pt-3 border-t border-border">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  consensusMode
                    ? t("copilot.consensusPlaceholder") || "Ask all 4 agents for their perspective..."
                    : t("copilot.placeholder") || "Ask Vixor anything about trading..."
                }
                rows={1}
                className="w-full resize-none rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all max-h-32 min-h-[44px]"
                style={{ height: "auto" }}
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
              className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                consensusMode
                  ? "bg-gradient-to-r from-emerald-500 via-amber-500 to-violet-500 text-white"
                  : "gradient-primary text-primary-foreground glow-primary"
              }`}
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : consensusMode ? (
                <Users className="size-5" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </form>
          <div className="mt-1.5 text-center">
            <span className="text-[9px] text-muted-foreground/50">
              AI responses may not always be accurate. Always verify with your own analysis.
            </span>
          </div>
        </div>
      </div>
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
      <div className="p-3 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <MessageSquare className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              No conversations yet. Start a new chat!
            </p>
          </div>
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
                className={`group rounded-xl border transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary/20"
                    : "border-transparent hover:bg-card hover:border-border"
                }`}
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
                      className="flex-1 text-xs bg-card border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => onRename(conv.id, editingTitleValue)}
                      className="size-6 rounded-lg flex items-center justify-center hover:bg-card-hover"
                    >
                      <Check className="size-3 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => setEditingTitleId(null)}
                      className="size-6 rounded-lg flex items-center justify-center hover:bg-card-hover"
                    >
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : isConfirmingDelete ? (
                  <div className="p-2">
                    <p className="text-[10px] text-muted-foreground mb-1.5 truncate">
                      Delete &quot;{conv.title}&quot;?
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDelete(conv.id)}
                        className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-bearish/10 text-bearish hover:bg-bearish/20 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-card border border-border hover:bg-card-hover transition-colors"
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
                      <div className={`size-6 rounded-lg ${isActive ? "bg-primary/15" : "bg-card"} border border-border flex items-center justify-center shrink-0`}>
                        {conv.is_consensus ? (
                          <Users className={`size-3 ${isActive ? "text-primary" : agentColor}`} />
                        ) : (
                          <AgentIcon className={`size-3 ${isActive ? "text-primary" : agentColor}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                          {conv.title}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {formatRelativeTime(conv.updated_at)}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(conv.id);
                          setEditingTitleValue(conv.title);
                        }}
                        className="size-6 rounded-lg flex items-center justify-center hover:bg-card-hover"
                        title="Rename"
                      >
                        <Pencil className="size-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="size-6 rounded-lg flex items-center justify-center hover:bg-bearish/10"
                        title="Delete"
                      >
                        <Trash2 className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
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

// ─── Empty State with Quick Actions ───

function EmptyState({
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
        <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="size-9 text-primary" />
        </div>
        <div className="absolute -right-1 -top-1 size-5 rounded-full bg-primary flex items-center justify-center">
          <Bot className="size-3 text-primary-foreground" />
        </div>
      </div>

      <h2 className="text-lg font-bold mb-1">
        {t("copilot.welcomeTitle") || "How can I help you today?"}
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
        {t("copilot.welcomeDesc") ||
          "I'm your context-aware AI trading assistant. I know your recent analyses, signals, and alerts."}
      </p>

      {/* Consensus CTA */}
      <button
        onClick={() => onConsensus(true)}
        className="w-full max-w-lg mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-violet-500/10 border border-primary/20 hover:border-primary/40 transition-all group"
      >
        <div className="flex items-center gap-2 justify-center">
          <Users className="size-4 text-primary" />
          <span className="text-xs font-bold text-primary">
            {t("copilot.getConsensus") || "Get Multi-Agent Consensus"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
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
              className="p-3 rounded-xl bg-card border border-border text-left hover:bg-card-hover hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`size-3.5 ${agentConfig?.color || "text-primary"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  {agentConfig?.label}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground line-clamp-2">{action.label}</div>
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
    return <ConsensusBubble data={message.consensusData} timestamp={message.timestamp} onConsultAgent={onConsultAgent} />;
  }

  const agentConfig = AGENTS.find((a) => a.id === message.agent);
  const Icon = isUser ? User : agentConfig?.icon || Bot;
  const iconColor = isError
    ? "text-bearish"
    : isUser
      ? "text-muted-foreground"
      : agentConfig?.color || "text-primary";

  // Detect agent handoff suggestions in the message
  const handoffAgents = detectHandoffAgents(message.content);

  return (
    <div
      className={`flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-card border border-border"
            : isError
              ? "bg-bearish/10 border border-bearish/20"
              : `bg-primary/10 border border-primary/20`
        }`}
      >
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      <div
        className={`max-w-[85%] vixor-card p-4 ${
          isUser ? "bg-primary/5 border-primary/15" : isError ? "border-bearish/20 bg-bearish/5" : ""
        }`}
      >
        {!isUser && !isError && agentConfig && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${agentConfig.color}`}>
              {agentConfig.label}
            </span>
          </div>
        )}
        <div className="text-sm leading-relaxed prose-sm">
          <FormattedContent content={message.content} />
        </div>

        {/* Agent handoff buttons */}
        {!isUser && handoffAgents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border/50">
            {handoffAgents.map((hAgent) => {
              const hConfig = AGENTS.find((a) => a.id === hAgent);
              if (!hConfig) return null;
              const HIcon = hConfig.icon;
              return (
                <button
                  key={hAgent}
                  onClick={() => onConsultAgent(hAgent)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-bold hover:bg-card-hover hover:border-primary/30 transition-all"
                >
                  <HIcon className={`size-3 ${hConfig.color}`} />
                  <span className={hConfig.color}>
                    {t("copilot.consultAgent", { agent: hConfig.label }) || `Consult ${hConfig.label}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={`text-[9px] text-muted-foreground/50 mt-2 ${isUser ? "text-right" : ""}`}>
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
        <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500/20 via-amber-500/20 to-violet-500/20 border border-primary/20 flex items-center justify-center shrink-0">
          <Users className="size-4 text-primary" />
        </div>
        <div className="vixor-card p-4 flex-1 border-primary/15">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="size-3 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
              {t("copilot.synthesis") || "AI Synthesis"}
            </span>
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
                className="w-full flex items-center gap-2 p-3 hover:bg-card-hover transition-colors"
              >
                <div className={`size-6 rounded-lg ${agentConfig.bgColor} flex items-center justify-center`}>
                  <AIcon className={`size-3 ${agentConfig.color}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${agentConfig.color}`}>
                  {agentConfig.label}
                </span>
                <ChevronDown
                  className={`size-3 text-muted-foreground ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in fade-in duration-200">
                  <div className="text-xs leading-relaxed prose-sm">
                    <FormattedContent content={r.response} />
                  </div>
                  <button
                    onClick={() => onConsultAgent(r.agent)}
                    className="mt-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-bold hover:bg-card-hover transition-all"
                  >
                    <AIcon className={`size-3 ${agentConfig.color}`} />
                    <span className={agentConfig.color}>
                      {t("copilot.consultAgent", { agent: agentConfig.label }) || `Consult ${agentConfig.label}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[9px] text-muted-foreground/50 mt-2 ml-11">
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
  if (lower.includes("consult the strategy builder") || lower.includes("consult strategy builder")) {
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
                <h3 key={lineIdx} className="text-sm font-bold text-foreground mt-2 mb-1">
                  {formatInline(line.slice(3))}
                </h3>
              );
            if (line.startsWith("# "))
              return (
                <h3 key={lineIdx} className="text-sm font-bold text-primary mt-2 mb-1">
                  {formatInline(line.slice(2))}
                </h3>
              );
            if (line.startsWith("> "))
              return (
                <div
                  key={lineIdx}
                  className="pl-3 border-l-2 border-primary/40 my-1 text-muted-foreground"
                >
                  {formatInline(line.slice(2))}
                </div>
              );
            if (line.match(/^[-*•]\s/))
              return (
                <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span>{formatInline(line.replace(/^[-*•]\s/, ""))}</span>
                </div>
              );
            if (line.match(/^\d+\.\s/)) {
              const match = line.match(/^(\d+\.)\s(.*)$/);
              if (match)
                return (
                  <div key={lineIdx} className="flex items-start gap-1.5 my-0.5">
                    <span className="text-primary font-bold text-xs mt-0.5 shrink-0">
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
        <strong key={key++} className="font-bold text-foreground">
          {match[2]}
        </strong>,
      );
    else if (match[3])
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold"
        >
          {match[3]}
        </code>,
      );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return parts;
}
