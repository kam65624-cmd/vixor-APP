import { useState, useEffect, useCallback } from "react";
import { Flame, Zap, CheckCircle2, Gift, Circle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface DailyTask {
  id: string;
  label: string;
  shortLabel: string;
  completed: boolean;
  xp: number;
  route?: string; // Navigate to this route on click (for engagement)
}

interface EngagementState {
  streak: number;
  xp: number;
  level: number;
  tasks: DailyTask[];
  lastDate?: string;
  totalCompletedAllTime: number;
}

// ── Task Definitions ─────────────────────────────────────────────────────
// More varied tasks that encourage exploration of different features.
// Tasks are shuffled randomly each day so it feels fresh.

const ALL_TASKS: DailyTask[] = [
  { id: "open_app", label: "Open VIXOR", shortLabel: "Open", completed: false, xp: 5, route: "/" },
  {
    id: "check_chart",
    label: "View a chart",
    shortLabel: "Chart",
    completed: false,
    xp: 10,
    route: "/charts",
  },
  {
    id: "read_signal",
    label: "Check signals",
    shortLabel: "Signals",
    completed: false,
    xp: 10,
    route: "/signals",
  },
  {
    id: "discover_tokens",
    label: "Explore DEX tokens",
    shortLabel: "Discover",
    completed: false,
    xp: 10,
    route: "/discover",
  },
  {
    id: "check_whale",
    label: "Check whale alerts",
    shortLabel: "Whale",
    completed: false,
    xp: 10,
    route: "/whale",
  },
  {
    id: "analyze_chart",
    label: "AI chart analysis",
    shortLabel: "Analyze",
    completed: false,
    xp: 15,
    route: "/analyze",
  },
  {
    id: "check_pnl",
    label: "Review PnL",
    shortLabel: "PnL",
    completed: false,
    xp: 10,
    route: "/pnl",
  },
  {
    id: "check_bags",
    label: "View holdings",
    shortLabel: "Bags",
    completed: false,
    xp: 10,
    route: "/bags",
  },
  {
    id: "check_rewards",
    label: "Check rewards",
    shortLabel: "Rewards",
    completed: false,
    xp: 5,
    route: "/rewards",
  },
];

// Pick 4 random tasks per day (always include "open_app" as auto-completed)
function getDailyTasks(): DailyTask[] {
  const today = new Date().toDateString();
  // Simple seeded shuffle based on date string
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);

  const shuffled = [...ALL_TASKS].sort(() => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280 - 0.5;
  });

  // Always include open_app (auto-completed), then 3 more
  const openTask = ALL_TASKS.find((t) => t.id === "open_app")!;
  const others = shuffled.filter((t) => t.id !== "open_app").slice(0, 3);
  return [openTask, ...others];
}

// ── State Management ─────────────────────────────────────────────────────

const STORAGE_KEY = "vixor-engagement";
const XP_PER_LEVEL = 100;

function loadState(): EngagementState {
  if (typeof window === "undefined") {
    return { streak: 0, xp: 0, level: 1, tasks: getDailyTasks(), totalCompletedAllTime: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = new Date().toDateString();

      if (parsed.lastDate !== today) {
        // New day — streak logic
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const keptStreak = parsed.lastDate === yesterday ? parsed.streak + 1 : 1;
        const bonusXP = keptStreak > 1 ? keptStreak * 2 : 0; // Streak bonus!

        return {
          streak: keptStreak,
          xp: (parsed.xp || 0) + bonusXP,
          level: Math.floor(((parsed.xp || 0) + bonusXP) / XP_PER_LEVEL) + 1,
          tasks: getDailyTasks(),
          lastDate: today,
          totalCompletedAllTime: parsed.totalCompletedAllTime || 0,
        };
      }
      return {
        ...parsed,
        tasks: parsed.tasks?.length ? parsed.tasks : getDailyTasks(),
        level: Math.floor((parsed.xp || 0) / XP_PER_LEVEL) + 1,
      };
    }
  } catch {
    // noop
  }
  return {
    streak: 1,
    xp: 0,
    level: 1,
    tasks: getDailyTasks(),
    lastDate: new Date().toDateString(),
    totalCompletedAllTime: 0,
  };
}

function saveState(state: EngagementState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // noop
  }
}

// ── Export task completion helper for cross-component use ────────────────

let globalState: EngagementState | null = null;
const listeners: Set<() => void> = new Set();

export function getEngagementState(): EngagementState | null {
  return globalState;
}

export function completeEngagementTask(taskId: string): void {
  if (!globalState) return;
  const task = globalState.tasks.find((t) => t.id === taskId);
  if (!task || task.completed) return;

  const xpGain = task.xp;
  const completedToday = globalState.tasks.filter((t) => t.completed).length;
  // Bonus XP for completing all tasks
  const allDoneBonus = completedToday === globalState.tasks.length - 1 ? 25 : 0;

  const updated = {
    ...globalState,
    tasks: globalState.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
    xp: globalState.xp + xpGain + allDoneBonus,
    level: Math.floor((globalState.xp + xpGain + allDoneBonus) / XP_PER_LEVEL) + 1,
    totalCompletedAllTime: (globalState.totalCompletedAllTime || 0) + 1,
  };

  globalState = updated;
  saveState(updated);
  listeners.forEach((fn) => fn());
}

// ── Component ────────────────────────────────────────────────────────────

export function EngagementBar() {
  const [state, setState] = useState<EngagementState | null>(null);

  useEffect(() => {
    const loaded = loadState();
    globalState = loaded;
    setState(loaded);

    const listener = () => setState({ ...globalState! });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!state) return null;

  const completedCount = state.tasks.filter((t) => t.completed).length;
  const totalCount = state.tasks.length;
  const allDone = completedCount === totalCount;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const xpToNextLevel = XP_PER_LEVEL - (state.xp % XP_PER_LEVEL);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "6px 12px 8px",
        background: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Top row: Streak + XP + Level + Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Streak fire */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
          <Flame
            size={14}
            style={{ color: state.streak > 1 ? "#F97316" : "var(--color-muted-foreground)" }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: state.streak > 1 ? "#F97316" : "var(--color-muted-foreground)",
            }}
          >
            {state.streak}d
          </span>
        </div>

        {/* XP + Level */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
          <Zap size={13} style={{ color: "var(--color-primary)" }} />
          <span
            style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>{state.xp}</span> XP
          </span>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 700,
              padding: "1px 4px",
              borderRadius: "3px",
              background: "rgba(124,155,196,0.15)",
              color: "var(--color-primary)",
              marginLeft: "2px",
            }}
          >
            Lv.{state.level}
          </span>
        </div>

        {/* XP to next level */}
        <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)", flexShrink: 0 }}>
          {xpToNextLevel} XP to next
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Task progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 600,
              color: allDone ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            }}
          >
            {completedCount}/{totalCount}
          </span>
          <div
            style={{
              width: "48px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: allDone ? "var(--color-bullish)" : "var(--color-primary)",
                borderRadius: "2px",
                transition: "width 0.3s",
              }}
            />
          </div>
          {allDone && <Gift size={12} style={{ color: "var(--color-neutral-wait)" }} />}
        </div>
      </div>

      {/* Task pills row */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {state.tasks.map((task) => (
          <TaskPill key={task.id} task={task} allDone={allDone} />
        ))}
      </div>

      {/* All-done celebration message */}
      {allDone && (
        <div
          style={{
            fontSize: "9px",
            fontWeight: 600,
            color: "var(--color-bullish)",
            textAlign: "center",
            padding: "2px 0",
          }}
        >
          All tasks complete! +25 bonus XP
        </div>
      )}
    </div>
  );
}

// ── Task Pill ────────────────────────────────────────────────────────────

function TaskPill({ task, allDone }: { task: DailyTask; allDone: boolean }) {
  const handleComplete = useCallback(() => {
    if (!task.completed && !allDone) {
      completeEngagementTask(task.id);
    }
  }, [task.id, task.completed, allDone]);

  const bg = task.completed
    ? "rgba(14,203,129,0.12)"
    : allDone
      ? "rgba(124,155,196,0.03)"
      : "var(--color-card-hover)";

  const color = task.completed
    ? "var(--color-bullish)"
    : allDone
      ? "var(--color-muted-foreground)"
      : "var(--color-muted-foreground)";

  return (
    <button
      onClick={handleComplete}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        padding: "3px 8px",
        borderRadius: "10px",
        border: "none",
        fontSize: "9px",
        fontWeight: 600,
        cursor: task.completed || allDone ? "default" : "pointer",
        background: bg,
        color,
        opacity: task.completed || allDone ? 0.7 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        flexShrink: 0,
        minWidth: task.completed ? "28px" : "44px",
        minHeight: "24px",
      }}
    >
      {task.completed ? (
        <CheckCircle2 size={11} />
      ) : (
        <>
          <span style={{ color: "var(--color-neutral-wait)", fontSize: "8px", fontWeight: 700 }}>
            +{task.xp}
          </span>
          <span>{task.shortLabel}</span>
        </>
      )}
    </button>
  );
}

export default EngagementBar;
