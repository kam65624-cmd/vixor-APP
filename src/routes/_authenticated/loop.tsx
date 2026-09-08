import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShieldCheck, Activity, BarChart3, ArrowRight, GitBranch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/loop")({
  head: () => ({ meta: [{ title: "Decision Loop — VIXOR" }] }),
  component: LoopOnboardingPage,
});

// ─── Route type (re-exported from routeTree.gen to avoid importing from .gen directly) ─
type RouteId = "/alpha" | "/investigate" | "/risk" | "/echo";

// ─── Character definitions ──────────────────────────────────────────────────

const CHARACTERS: Array<{
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  tagline: string;
  description: string;
  routeId: RouteId;
  surfaceLabel: string;
}> = [
  {
    id: "moxi",
    name: "MOXI",
    role: "Discovery",
    icon: Activity,
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    tagline: "Finds the opportunity",
    description:
      "Scans the market and surfaces tokens that match your criteria — momentum, volume, whale activity, or custom filters.",
    routeId: "/alpha",
    surfaceLabel: "Open MOXI",
  },
  {
    id: "mr-vigo",
    name: "MR.VIGO",
    role: "Investigation",
    icon: Search,
    color: "#6366F1",
    bgColor: "rgba(99,102,241,0.08)",
    borderColor: "rgba(99,102,241,0.25)",
    tagline: "Gathers the evidence",
    description:
      "Aggregates security signals from Shield, whale movements from Hunt, and market context — then builds a structured evidence file.",
    routeId: "/investigate",
    surfaceLabel: "Open MR.VIGO",
  },
  {
    id: "dr-dex",
    name: "DR.DEX",
    role: "Risk Assessment",
    icon: ShieldCheck,
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.25)",
    tagline: "Quantifies the risk",
    description:
      "Runs the RiskGovernor engine against the evidence file. Outputs position sizing, maximum exposure, and a clear GO / WAIT / BLOCK verdict.",
    routeId: "/risk",
    surfaceLabel: "Open DR.DEX",
  },
  {
    id: "echo",
    name: "ECHO",
    role: "Tracking & Learning",
    icon: BarChart3,
    color: "#EC4899",
    bgColor: "rgba(236,72,153,0.08)",
    borderColor: "rgba(236,72,153,0.25)",
    tagline: "Records the outcome",
    description:
      "Tracks every decision, its rationale, and the actual result. Weekly summaries show what is working and what needs adjustment.",
    routeId: "/echo",
    surfaceLabel: "Open ECHO",
  },
];

// ─── Flow arrow ─────────────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="h-6 w-px bg-gradient-to-b from-[var(--color-border)] to-[var(--color-muted)]" />
    </div>
  );
}

// ─── Character card ─────────────────────────────────────────────────────────

function CharacterCard({ char, index }: { char: (typeof CHARACTERS)[number]; index: number }) {
  const Icon = char.icon;
  return (
    <div
      className="rounded-2xl border p-5 transition-all"
      style={{
        background: char.bgColor,
        borderColor: char.borderColor,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${char.color} 15%, transparent)` }}
          >
            <Icon size={18} style={{ color: char.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide" style={{ color: char.color }}>
                {char.name}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `color-mix(in srgb, ${char.color} 12%, transparent)`,
                  color: char.color,
                }}
              >
                {char.role}
              </span>
            </div>
            <p
              className="mt-0.5 text-xs font-medium"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {char.tagline}
            </p>
          </div>
        </div>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: char.color,
            color: "#fff",
          }}
        >
          {index + 1}
        </span>
      </div>

      {/* Description */}
      <p
        className="mb-4 text-sm leading-relaxed"
        style={{ color: "var(--color-muted-foreground)" }}
      >
        {char.description}
      </p>

      {/* CTA */}
      <Link
        to={char.routeId as any}
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: `color-mix(in srgb, ${char.color} 15%, transparent)`,
          color: char.color,
          border: `1px solid ${char.borderColor}`,
        }}
      >
        {char.surfaceLabel}
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// ─── The loop ───────────────────────────────────────────────────────────────

function LoopFlowDiagram() {
  return (
    <div className="flex flex-col items-center gap-0">
      {CHARACTERS.map((char, i) => (
        <div key={char.id} className="w-full max-w-sm">
          <CharacterCard char={char} index={i} />
          {i < CHARACTERS.length - 1 && <FlowArrow />}
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function LoopOnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <GitBranch size={20} style={{ color: "var(--color-primary)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            The VIXOR Decision Loop
          </h1>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          Every trade starts here. Four characters, each with a clear role — from discovery to
          outcome tracking. No black boxes, no guessing.
        </p>
      </div>

      {/* Paper-only notice */}
      <div className="rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 px-4 py-3">
        <p className="text-xs font-medium" style={{ color: "var(--color-warning)" }}>
          ⚠️ Paper trading only — no real execution. All surfaces use sample data unless explicitly
          connected to your wallet.
        </p>
      </div>

      {/* Loop diagram */}
      <div className="flex justify-center">
        <LoopFlowDiagram />
      </div>

      {/* Summary table */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--color-border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--color-muted)" }}>
              <th
                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Character
              </th>
              <th
                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Role
              </th>
              <th
                className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                Surface
              </th>
            </tr>
          </thead>
          <tbody>
            {CHARACTERS.map((char) => {
              const Icon = char.icon;
              return (
                <tr
                  key={char.id}
                  className="border-t"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: char.color }} />
                      <span className="font-semibold" style={{ color: char.color }}>
                        {char.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-muted-foreground)" }}>
                    {char.role}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-muted-foreground)" }}>
                    <span className="rounded bg-[var(--color-muted)] px-2 py-0.5 font-mono text-xs">
                      {char.routeId}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Your role */}
      <div
        className="rounded-2xl border border-[var(--color-border)] p-5"
        style={{ background: "var(--color-card)" }}
      >
        <h2 className="mb-2 text-sm font-bold" style={{ color: "var(--color-foreground)" }}>
          Your role in the loop
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          After MR.VIGO investigates and DR.DEX assesses,{" "}
          <strong style={{ color: "var(--color-foreground)" }}>you make the final call</strong>.
          Record your decision with rationale — ECHO tracks it so you can review what worked. The
          loop closes when you learn from the outcome.
        </p>
      </div>
    </div>
  );
}
