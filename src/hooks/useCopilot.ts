import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Which agent produced this response (if any) */
  agent?: "analyst" | "hunter" | "coach" | "moxi";
}

interface CopilotStore {
  /** Whether the drawer is currently open */
  isOpen: boolean;
  toggleOpen: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  /** Chat messages */
  messages: CopilotMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;

  /** Loading state */
  isLoading: boolean;

  /** Signal notification flag */
  hasNewSignal: boolean;
  setHasNewSignal: (value: boolean) => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

let msgCounter = 0;
function uid(): string {
  return `copilot-${Date.now()}-${++msgCounter}`;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCopilot = create<CopilotStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),

      messages: [],
      isLoading: false,

      hasNewSignal: false,
      setHasNewSignal: (value: boolean) => set({ hasNewSignal: value }),

      clearMessages: () => set({ messages: [] }),

      sendMessage: async (content: string) => {
        const userMsg: CopilotMessage = {
          id: uid(),
          role: "user",
          content,
          timestamp: Date.now(),
        };

        set((s) => ({
          messages: [...s.messages, userMsg],
          isLoading: true,
        }));

        try {
          // Call the server-side MOXI chat function
          const mod = await import("@/domains/moxi/functions");
          const fn = mod.getMoxiInsights;
          // getMoxiInsights is a TanStack server fn — call with no args
          const result = await fn({} as any);

          const responseText =
            typeof result === "string"
              ? result
              : (result as any)?.response ||
                (result as any)?.message ||
                (result as any)?.insight ||
                "MOXI is processing your request. For full analysis, use the Analyze page.";

          const agent: CopilotMessage["agent"] = (result as any)?.agent || "moxi";

          const assistantMsg: CopilotMessage = {
            id: uid(),
            role: "assistant",
            content: responseText,
            timestamp: Date.now(),
            agent,
          };

          set((s) => ({
            messages: [...s.messages, assistantMsg],
            isLoading: false,
          }));

          // If the response came from analyst or hunter, flash a signal notification
          if (agent === "analyst" || agent === "hunter") {
            set({ hasNewSignal: true });
            setTimeout(() => set({ hasNewSignal: false }), 5000);
          }
        } catch {
          const errorMsg: CopilotMessage = {
            id: uid(),
            role: "assistant",
            content: "Connection error. Please try again.",
            timestamp: Date.now(),
            agent: "moxi",
          };
          set((s) => ({
            messages: [...s.messages, errorMsg],
            isLoading: false,
          }));
        }
      },
    }),
    {
      name: "vixor-copilot-storage",
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
