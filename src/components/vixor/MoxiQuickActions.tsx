// ── MOXI Quick Actions ──────────────────────────────────────────────
// A 3×2 grid of quick action buttons that pre-fill MOXI chat prompts.
// Each button triggers MOXI with a pre-written prompt.
// ─────────────────────────────────────────────────────────────────────────

import { memo, useCallback } from "react";
import { BarChart3, Radio, Search, Calendar, Shield, BookOpen } from "lucide-react";

// ── Quick Actions Config ─────────────────────────────────────────────

export interface MoxiQuickAction {
  id: string;
  label: string;
  icon: typeof BarChart3;
  prompt: string;
}

export const MOXI_QUICK_ACTIONS: MoxiQuickAction[] = [
  {
    id: "market",
    label: "Market Summary",
    icon: BarChart3,
    prompt: "What's the market doing right now?",
  },
  {
    id: "signals",
    label: "My Signals",
    icon: Radio,
    prompt: "Show me my active signals and their status",
  },
  {
    id: "scan",
    label: "Scan Opportunities",
    icon: Search,
    prompt: "Scan the market for high-confidence setups",
  },
  {
    id: "calendar",
    label: "Economic Calendar",
    icon: Calendar,
    prompt: "What upcoming events should I be aware of?",
  },
  { id: "risk", label: "Risk Check", icon: Shield, prompt: "Am I overexposed in any currency?" },
  {
    id: "journal",
    label: "Trade Journal",
    icon: BookOpen,
    prompt: "Help me write a journal entry for today",
  },
];

// ── Component ──────────────────────────────────────────────────────────

interface MoxiQuickActionsProps {
  onAction?: (prompt: string) => void;
}

export const MoxiQuickActions = memo(function MoxiQuickActions({
  onAction,
}: MoxiQuickActionsProps) {
  const handleClick = useCallback(
    (action: MoxiQuickAction) => {
      onAction?.(action.prompt);
    },
    [onAction],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
        padding: "8px 16px 12px",
      }}
    >
      {MOXI_QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "12px 6px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              minHeight: "44px",
            }}
          >
            <Icon
              size={18}
              style={{
                color: "var(--color-primary)",
                strokeWidth: 2,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--color-foreground)",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default MoxiQuickActions;
