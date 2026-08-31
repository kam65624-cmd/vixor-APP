import { Newspaper, Activity } from "lucide-react";
import { CARD, LABEL } from "./constants";
import { highlightSMC } from "./utils";

export interface NewsImpact {
  relevant_news: Array<{
    headline: string;
    source: string;
    impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    explanation: string;
  }>;
  overall_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  verdict: string;
}

export function NewsImpactSection({ newsImpact }: { newsImpact: NewsImpact | null }) {
  if (!newsImpact) {
    return (
      <div className="animate-in fade-in duration-300" style={{ padding: "16px" }}>
        <div
          style={{
            ...CARD,
            padding: "32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Newspaper
            size={40}
            style={{ color: "var(--color-muted-foreground)", margin: "0 auto" }}
          />
          <p style={{ fontSize: "14px", color: "var(--color-muted-foreground)" }}>
            No fundamental news analysis for this session.
          </p>
        </div>
      </div>
    );
  }

  const { relevant_news = [], overall_sentiment = "NEUTRAL", verdict = "" } = newsImpact;
  const isBullish = overall_sentiment === "BULLISH";
  const isBearish = overall_sentiment === "BEARISH";

  const sentColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ padding: "0 16px" }}
    >
      {/* Sentiment Overview */}
      <div
        style={{
          ...CARD,
          padding: "20px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
            }}
          >
            <Activity size={16} style={{ color: "var(--color-bullish)" }} /> Fundamental Sentiment
          </h3>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "1px solid",
              color: sentColor,
              background: isBullish
                ? "color-mix(in srgb, var(--color-bullish) 6%, transparent)"
                : isBearish
                  ? "color-mix(in srgb, var(--color-bearish) 6%, transparent)"
                  : "color-mix(in srgb, var(--color-neutral-wait) 6%, transparent)",
              borderColor: isBullish
                ? "color-mix(in srgb, var(--color-bullish) 30%, transparent)"
                : isBearish
                  ? "color-mix(in srgb, var(--color-bearish) 30%, transparent)"
                  : "color-mix(in srgb, var(--color-neutral-wait) 30%, transparent)",
            }}
          >
            {overall_sentiment}
          </span>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            borderLeft: `4px solid ${sentColor}`,
            background: isBullish
              ? "color-mix(in srgb, var(--color-bullish) 5%, transparent)"
              : isBearish
                ? "color-mix(in srgb, var(--color-bearish) 5%, transparent)"
                : "color-mix(in srgb, var(--color-neutral-wait) 5%, transparent)",
          }}
        >
          <span style={{ ...LABEL, letterSpacing: "0.1em", display: "block", marginBottom: "4px" }}>
            AI Confluence Verdict
          </span>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.6,
              color: "var(--color-foreground)",
            }}
          >
            {highlightSMC(verdict)}
          </p>
        </div>
      </div>

      {/* News Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-muted-foreground)",
            marginLeft: "4px",
          }}
        >
          <Newspaper size={16} style={{ color: "var(--color-bullish)" }} /> Key News Drivers
        </h3>
        {relevant_news.map((n, i) => {
          const impactColor =
            n.impact === "POSITIVE"
              ? "var(--color-bullish)"
              : n.impact === "NEGATIVE"
                ? "var(--color-bearish)"
                : "var(--color-neutral-wait)";
          return (
            <div
              key={i}
              style={{
                ...CARD,
                padding: "16px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: impactColor,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  paddingLeft: "4px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-muted-foreground)",
                      textTransform: "uppercase",
                      background: "var(--color-muted)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {n.source}
                  </span>
                  <h4
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--color-foreground)",
                      marginTop: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.headline}
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    flexShrink: 0,
                    textTransform: "uppercase",
                    color: impactColor,
                    background: `${impactColor}15`,
                  }}
                >
                  {n.impact}
                </span>
              </div>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--overlay-secondary)",
                  border: `1px solid ${"var(--color-border)"}`,
                  fontSize: "12px",
                  color: "var(--color-muted-foreground)",
                  lineHeight: 1.6,
                  marginLeft: "4px",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-foreground)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Technical Impact
                </strong>
                {highlightSMC(n.explanation)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
