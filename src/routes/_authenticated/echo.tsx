// ============================================================================
// ECHO — Tracking & Outcome & Learning Surface
// ============================================================================
//
// Route: /echo
// Purpose: Aggregate the user's decisions, trades, notes, watchlist, and
//          daily-loop into a unified timeline. Read-only by design.
//
// This is the fourth character surface in the VIXOR decision loop:
//   MOXI (Discovery) → MR.VIGO (Investigation) → DR.DEX (Risk & Decision)
//                                                       ↓
//                                              ECHO (Tracking & Learning)
//
// Design rules:
//   1. No 3D character, no decorative UI
//   2. Read-only — every action redirects to its owning surface
//   3. Timeline-first — the most recent activity is always visible
// ============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  TrendingUp,
  TrendingDown,
  FileText,
  Star,
  Calendar,
  Activity,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getEchoOverview } from "@/domains/echo";
import type { EchoOverview, TimelineEntry, WeeklySummary } from "@/domains/echo";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";

// ── Route Definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/echo")({
  head: () => ({
    meta: [{ title: "Tracking & Outcomes — ECHO — VIXOR" }],
  }),
  component: EchoPage,
});

// ── Helpers ────────────────────────────────────────────────────────────────

function typeIcon(t: TimelineEntry["type"]) {
  switch (t) {
    case "DECISION":
      return TrendingUp;
    case "TRADE":
      return TrendingDown;
    case "NOTE":
      return FileText;
    case "WATCHLIST":
      return Star;
    case "LOOP":
      return Calendar;
  }
}

function typeColor(t: TimelineEntry["type"]) {
  switch (t) {
    case "DECISION":
      return "var(--color-primary)";
    case "TRADE":
      return "var(--color-bullish)";
    case "NOTE":
      return "var(--color-gold, #F59E0B)";
    case "WATCHLIST":
      return "var(--color-accent, #8B5CF6)";
    case "LOOP":
      return "var(--color-neutral-wait, #F59E0B)";
  }
}

function formatPnl(value: number, unit: string): { text: string; color: string } {
  if (value > 0) {
    return { text: `+${value.toFixed(2)} ${unit}`, color: "var(--color-bullish)" };
  }
  if (value < 0) {
    return { text: `${value.toFixed(2)} ${unit}`, color: "var(--color-bearish)" };
  }
  return { text: `0 ${unit}`, color: "var(--color-muted-foreground)" };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString();
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "var(--color-foreground)",
  Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  Icon: React.ElementType;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--color-muted-foreground)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color,
            marginTop: 2,
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklySummaryCard({ week }: { week: WeeklySummary }) {
  const pnl = formatPnl(week.netPnlUsd, "USD");
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: `color-mix(in srgb, ${pnl.color} 5%, var(--color-card))`,
        border: `1px solid color-mix(in srgb, ${pnl.color} 20%, var(--color-border))`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-foreground)",
          }}
        >
          This Week
        </h3>
        <span
          style={{
            fontSize: 10,
            color: "var(--color-muted-foreground)",
          }}
        >
          {new Date(week.weekStart).toLocaleDateString()} –{" "}
          {new Date(week.weekEnd).toLocaleDateString()}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
            }}
          >
            Net P&L
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: pnl.color,
              marginTop: 2,
            }}
          >
            {pnl.text}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
            }}
          >
            Win Rate
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
              marginTop: 2,
            }}
          >
            {week.winRate.toFixed(0)}%
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
            }}
          >
            Trades
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
              marginTop: 2,
            }}
          >
            {week.wins}/{week.totalTrades}
          </div>
        </div>
      </div>

      {(week.bestTrade || week.worstTrade) && (
        <div
          style={{
            paddingTop: 10,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {week.bestTrade && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--color-foreground)",
              }}
            >
              <span style={{ color: "var(--color-muted-foreground)" }}>Best:</span>
              <span style={{ color: "var(--color-bullish)", fontFamily: "var(--font-mono)" }}>
                {week.bestTrade.title} +{week.bestTrade.pnlUsd.toFixed(2)}
              </span>
            </div>
          )}
          {week.worstTrade && week.worstTrade !== week.bestTrade && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--color-foreground)",
              }}
            >
              <span style={{ color: "var(--color-muted-foreground)" }}>Worst:</span>
              <span style={{ color: "var(--color-bearish)", fontFamily: "var(--font-mono)" }}>
                {week.worstTrade.title} {week.worstTrade.pnlUsd.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TodayLoopCard({ loop }: { loop: EchoOverview["todayLoop"] }) {
  const phases = [
    { label: "Morning Prep", done: loop.morningPrep },
    { label: "Session", done: loop.sessionTracking },
    { label: "EOD Review", done: loop.eodReview },
  ];

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Calendar size={14} style={{ color: "var(--color-primary)" }} />
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-foreground)",
          }}
        >
          Today's Daily Loop
        </h3>
        {loop.completed && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: "color-mix(in srgb, var(--color-bullish) 12%, transparent)",
              color: "var(--color-bullish)",
              border: "1px solid color-mix(in srgb, var(--color-bullish) 25%, transparent)",
            }}
          >
            COMPLETED
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {phases.map((p) => (
          <div
            key={p.label}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              background: p.done
                ? "color-mix(in srgb, var(--color-bullish) 8%, transparent)"
                : "var(--color-muted, rgba(255,255,255,0.03))",
              border: p.done
                ? "1px solid color-mix(in srgb, var(--color-bullish) 25%, transparent)"
                : "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {p.done ? (
              <CheckCircle2 size={12} style={{ color: "var(--color-bullish)" }} />
            ) : (
              <Clock size={12} style={{ color: "var(--color-muted-foreground)" }} />
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: p.done ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const Icon = typeIcon(entry.type);
  const color = typeColor(entry.type);
  const pnl = entry.value !== undefined ? formatPnl(entry.value, entry.unit ?? "") : null;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {entry.title}
          </span>
          {entry.tag && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "1px 5px",
                borderRadius: 4,
                background: "var(--color-muted)",
                color: "var(--color-muted-foreground)",
              }}
            >
              {entry.tag}
            </span>
          )}
          {pnl && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: pnl.color,
                marginLeft: "auto",
              }}
            >
              {pnl.text}
            </span>
          )}
        </div>
        {entry.summary && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {entry.summary}
          </div>
        )}
        <div
          style={{
            fontSize: 10,
            color: "var(--color-muted-foreground)",
            marginTop: 4,
          }}
        >
          {formatDate(entry.occurredAt)}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function EchoPage() {
  const [filter, setFilter] = useState<"ALL" | TimelineEntry["type"]>("ALL");

  const fetchOverview = useStableServerFn(getEchoOverview);
  const query = useQuery({
    queryKey: ["echo-overview"],
    queryFn: () => fetchOverview({}),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const handleRefresh = useCallback(() => {
    query.refetch();
  }, [query]);

  const result = query.data;
  const isLoading = query.isPending;
  const isError = query.isError;
  const error = query.error;

  const filteredTimeline =
    result?.timeline.filter((e) => filter === "ALL" || e.type === filter) ?? [];

  return (
    <PageLayout
      title="ECHO"
      badge="TRACKING & LEARNING"
      badgeColor="var(--color-primary)"
      description="Your decision/outcome timeline. Read-only view of everything you've done."
    >
      <PageScrollArea>
        <div
          style={{
            padding: 16,
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ── Header bar with refresh ──────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-muted-foreground)",
              }}
            >
              {result ? (
                <span>Updated {new Date(result.fetchedAt).toLocaleTimeString()}</span>
              ) : isLoading ? (
                "Loading your timeline…"
              ) : (
                ""
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-foreground)",
                fontSize: 11,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Refresh
            </button>
          </div>

          {/* ── Error state ───────────────────────────────────────────── */}
          {isError && (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: "color-mix(in srgb, var(--color-bearish) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-bearish) 25%, transparent)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={18} style={{ color: "var(--color-bearish)", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-bearish)",
                  }}
                >
                  Couldn't load your timeline
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-muted-foreground)",
                    marginTop: 4,
                  }}
                >
                  {error instanceof Error ? error.message : "Unknown error."}
                </div>
              </div>
            </div>
          )}

          {/* ── Stat cards ───────────────────────────────────────────── */}
          {result && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <StatCard
                  Icon={Activity}
                  label="Active Trackings"
                  value={result.activeTrackings}
                  sub="Tokens you're monitoring"
                  color="var(--color-primary)"
                />
                <StatCard
                  Icon={TrendingUp}
                  label="Closed Trades"
                  value={result.totalTrades}
                  sub="All-time"
                  color="var(--color-bullish)"
                />
                <StatCard
                  Icon={Star}
                  label="Watchlist"
                  value={result.watchlistCount}
                  color="var(--color-accent, #8B5CF6)"
                />
                <StatCard
                  Icon={FileText}
                  label="Recent Notes"
                  value={result.recentNotesCount}
                  sub="Last 20"
                  color="var(--color-gold, #F59E0B)"
                />
              </div>

              {/* Weekly summary */}
              {result.recentWeek && result.recentWeek.totalTrades > 0 && (
                <WeeklySummaryCard week={result.recentWeek} />
              )}

              {/* Today loop */}
              <TodayLoopCard loop={result.todayLoop} />
            </>
          )}

          {/* ── Timeline ─────────────────────────────────────────────── */}
          {result && result.timeline.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <History size={14} style={{ color: "var(--color-primary)" }} />
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-foreground)",
                  }}
                >
                  Recent Activity
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--color-muted)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {filteredTimeline.length}
                </span>
              </div>

              {/* Filter tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 12,
                  overflowX: "auto",
                  paddingBottom: 2,
                }}
              >
                {(["ALL", "DECISION", "TRADE", "NOTE", "WATCHLIST", "LOOP"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border:
                        filter === f
                          ? "1px solid var(--color-primary)"
                          : "1px solid var(--color-border)",
                      background:
                        filter === f
                          ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                          : "transparent",
                      color:
                        filter === f ? "var(--color-primary)" : "var(--color-muted-foreground)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Timeline rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {filteredTimeline.map((entry) => (
                  <TimelineRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state ──────────────────────────────────────────── */}
          {!isLoading && !isError && result && result.timeline.length === 0 && (
            <div
              style={{
                padding: 40,
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px dashed var(--color-border)",
                textAlign: "center",
              }}
            >
              <History
                size={32}
                style={{
                  color: "var(--color-muted-foreground)",
                  margin: "0 auto 12px",
                  display: "block",
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                  marginBottom: 6,
                }}
              >
                No activity yet
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  maxWidth: 400,
                  margin: "0 auto",
                  lineHeight: 1.5,
                }}
              >
                Start by investigating a token with MR.VIGO, logging a Paper Decision in DR.DEX, or
                adding to your watchlist. Your timeline will populate as you use the app.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                <a
                  href="/investigate"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "var(--color-primary)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <TrendingUp size={12} />
                  Start with MR.VIGO
                </a>
                <a
                  href="/risk"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ArrowUpRight size={12} />
                  Log Decision (DR.DEX)
                </a>
              </div>
            </div>
          )}
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}
