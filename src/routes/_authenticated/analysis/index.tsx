import { Link, useParams } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { AlertTriangle, BookOpen, Zap, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getAnalysis } from "@/domains/analysis/functions";
import { createSignalTracking } from "@/domains/signal-tracking/functions";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";
import { PageLayout, ScrollArea } from "@/components/vixor/PageLayout";

import { TABS, GREEN_GRAD, CARD } from "./constants";
import { BackHeader } from "./BackHeader";
import { ChartCanvasOverlay } from "./ChartCanvasOverlay";
import { HeroSignalCard, VixorVerdictBox } from "./HeroSignalCard";
import { AnalysisNotesSection } from "./AnalysisNotesSection";
import { NewsImpactSection } from "./NewsImpactSection";
import { TradeSetupTab } from "./TradeSetupTab";
import { MarketContextTab } from "./MarketContextTab";
import { ManagementTab } from "./ManagementTab";

export function AnalysisResult() {
  const { id } = useParams({ from: "/_authenticated/analysis/$id" });
  const fetchAnalysis = useStableServerFn(getAnalysis);

  const queryOpts = useMemo(
    () => ({
      queryKey: ["analysis", id] as const,
      queryFn: () => fetchAnalysis({ data: { id } }),
      enabled: !!id,
      staleTime: 10_000,
      refetchInterval: (query: { state: { data?: { status?: string } } }) => {
        const s = query.state.data?.status;
        if (s === "complete") return 300_000;
        if (s === "failed") return false;
        return 3000;
      },
    }),
    [id, fetchAnalysis],
  );

  const q = useQuery(queryOpts);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Trade Setup");
  const [imgZoom, setImgZoom] = useState(false);

  const a = q.data as any;
  const isLoading = q.isLoading || !a || (a.status !== "complete" && a.status !== "failed");
  const isFailed = a?.status === "failed";
  const isComplete = a?.status === "complete";

  // signal_badge may be in a top-level column or inside raw_ai_response
  const raw = (a?.raw_ai_response ?? {}) as Record<string, any>;
  const signalBadge = (a?.signal_badge ?? raw.signal_badge ?? null) as {
    direction: "BUY" | "SELL" | "WAIT";
    entry: string;
    stop_loss: string;
    take_profit: string;
    rr: string;
  } | null;
  const vixorMsg = a?.vixor_message ?? raw.vixor_message ?? null;
  const scenarios = (a?.scenarios ?? raw.scenarios ?? null) as {
    conservative: import("./constants").Scenario;
    balanced: import("./constants").Scenario;
    aggressive: import("./constants").Scenario;
  } | null;
  const management = (a?.management ?? raw.management ?? []) as string[];
  const isBullish = a?.recommendation === "BUY";
  const isBearish = a?.recommendation === "SELL";
  const isWait = a?.recommendation === "WAIT";

  const [shareOpen, setShareOpen] = useState(false);

  const shareSignal: ShareableSignal = useMemo(
    () => ({
      pair: a?.pair ?? "",
      direction: (a?.recommendation ?? "WAIT") as "BUY" | "SELL" | "WAIT",
      confidence: a?.confidence ?? undefined,
      entry: typeof a?.entry === "number" ? a.entry : null,
      stopLoss: typeof a?.stop_loss === "number" ? a.stop_loss : null,
      takeProfit: Array.isArray(a?.take_profit) ? a.take_profit : null,
      pattern: a?.pattern ?? null,
      reasons: Array.isArray(a?.reasons) ? a.reasons : null,
      timeframe: a?.timeframe ?? undefined,
      source: "VIXOR AI",
    }),
    [a],
  );

  const handleShareX = useCallback(() => {
    shareOnX(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);

  const handleShareTelegram = useCallback(() => {
    shareOnTelegram(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);

  // ── Track as Signal mutation ──
  const stableCreateTracking = useStableServerFn(createSignalTracking);
  const trackMutation = useMutation({
    mutationFn: () =>
      stableCreateTracking({
        data: {
          pair: a.pair,
          direction: a.recommendation as "BUY" | "SELL",
          sourceType: "analysis",
          signalId: id,
          entryPrice: a.entry != null ? parseFloat(String(a.entry)) : undefined,
          stopLoss: a.stop_loss != null ? parseFloat(String(a.stop_loss)) : undefined,
          takeProfit: Array.isArray(a.take_profit)
            ? a.take_profit.map((v: unknown) => parseFloat(String(v)))
            : undefined,
        },
      }),
  });

  // ── Analysis source & data quality (grounded analysis v2) ──
  const analysisSource = (a?.analysis_source ?? raw.analysis_source ?? null) as
    "openrouter" | "local_engine" | "local_fallback" | null;
  const dataQuality = (a?.data_quality ?? raw.data_quality ?? null) as {
    candleCount: number;
    dataSource: string;
    usedRealData: boolean;
  } | null;
  const reasoningTrail = (a?.reasoning_trail ?? raw.reasoning_trail ?? null) as Array<{
    claim: string;
    sourceField: string;
  }> | null;

  const recColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";

  const pageTitle = a?.pair ?? "Analysis";
  const pageBadge = isComplete ? (a.recommendation ?? undefined) : undefined;
  const pageBadgeColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";
  const pageDescription = isComplete ? (a.pattern ?? "Signal Analysis") : undefined;

  return (
    <PageLayout
      title={pageTitle}
      badge={pageBadge}
      badgeColor={pageBadgeColor}
      description={pageDescription}
      tabs={[...TABS]}
      activeTab={tab}
      onTabChange={(t) => setTab(t as (typeof TABS)[number])}
      loading={isLoading}
      loadingColor={"var(--color-bullish)"}
    >
      {/* ── Not Found ── */}
      {!q.isLoading && !a && (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <div style={{ ...CARD, padding: "24px", fontWeight: 500 }}>Analysis not found.</div>
        </div>
      )}

      {/* ── Failed State ── */}
      {isFailed && (
        <div style={{ padding: "16px" }}>
          <BackHeader
            shareOpen={shareOpen}
            setShareOpen={setShareOpen}
            isComplete={isComplete}
            handleShareX={handleShareX}
            handleShareTelegram={handleShareTelegram}
          />
          <div
            style={{
              ...CARD,
              padding: "32px",
              textAlign: "center",
              borderColor: "color-mix(in srgb, var(--color-bearish) 30%, transparent)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--color-bearish) 10%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={32} style={{ color: "var(--color-bearish)" }} />
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>Analysis Failed</div>
            <div
              style={{ fontSize: "14px", color: "var(--color-muted-foreground)", marginTop: "8px" }}
            >
              {a.error_message ?? "The AI encountered an issue reading this chart."}
            </div>
            <Link
              to="/analyze"
              search={{ screenshot: undefined, pair: undefined }}
              style={{
                display: "inline-flex",
                marginTop: "24px",
                padding: "0 24px",
                height: "48px",
                borderRadius: "12px",
                background: GREEN_GRAD,
                color: "var(--color-foreground)",
                fontWeight: 700,
                alignItems: "center",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Try another chart
            </Link>
          </div>
        </div>
      )}

      {/* ── Complete State ── */}
      {isComplete && (
        <ScrollArea>
          <div style={{ padding: "0 0 24px" }}>
            {/* ── Back Header ── */}
            <BackHeader
              shareOpen={shareOpen}
              setShareOpen={setShareOpen}
              isComplete={isComplete}
              handleShareX={handleShareX}
              handleShareTelegram={handleShareTelegram}
            />

            {/* ═══════════════════════════════════════
                HERO SIGNAL CARD — THE MAIN EVENT
            ═══════════════════════════════════════ */}
            <HeroSignalCard
              a={a}
              recColor={recColor}
              isBullish={isBullish}
              isBearish={isBearish}
              isWait={isWait}
              signalBadge={signalBadge}
              vixorMsg={vixorMsg}
              analysisSource={analysisSource}
              dataQuality={dataQuality}
              trackMutation={trackMutation}
            />

            {/* ═══════════════════════════════════════
                VIXOR VERDICT BOX
            ═══════════════════════════════════════ */}
            {vixorMsg && <VixorVerdictBox a={a} recColor={recColor} vixorMsg={vixorMsg} />}

            {/* Chart Image with Canvas Annotations */}
            {a.imageUrl && (
              <ChartCanvasOverlay
                imageUrl={a.imageUrl}
                analysis={a}
                onZoom={() => setImgZoom(!imgZoom)}
              />
            )}

            {/* Image zoom overlay */}
            {imgZoom && a.imageUrl && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  background: "oklch(0 0 0 / 0.95)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                }}
                onClick={() => setImgZoom(false)}
              >
                <button
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-foreground)",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
                <img
                  src={a.imageUrl}
                  alt="Chart"
                  style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                margin: "0 16px 16px",
              }}
            >
              <Link
                to="/trade-desk"
                style={{
                  height: "48px",
                  borderRadius: "12px",
                  background: GREEN_GRAD,
                  color: "var(--color-foreground)",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Zap size={16} /> Use in Calculator
              </Link>
              <Link
                to="/journal"
                style={{
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--color-card)",
                  border: `1px solid ${"var(--color-border)"}`,
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "var(--color-foreground)",
                }}
              >
                <BookOpen size={16} style={{ color: "var(--color-muted-foreground)" }} /> Journal
              </Link>
              <AnalysisNotesSection analysisId={id} pair={a.pair} />
            </div>

            {/* ═══ TAB: Trade Setup ═══ */}
            {tab === "Trade Setup" && (
              <TradeSetupTab a={a} scenarios={scenarios} reasoningTrail={reasoningTrail} />
            )}

            {/* ═══ TAB: Market Context ═══ */}
            {tab === "Market Context" && <MarketContextTab a={a} />}

            {/* ═══ TAB: News Impact ═══ */}
            {tab === "News Impact" && (
              <NewsImpactSection
                newsImpact={(a.news as any) || (a.raw_ai_response as any)?.news_impact}
              />
            )}

            {/* ═══ TAB: Management ═══ */}
            {tab === "Management" && <ManagementTab a={a} management={management} />}
          </div>
        </ScrollArea>
      )}
    </PageLayout>
  );
}
