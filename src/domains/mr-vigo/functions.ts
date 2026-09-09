// ============================================================================
// MR.VIGO — Investigation Domain — Server Functions
// ============================================================================
//
// Server function that aggregates evidence from Shield, Hunt, and Market
// domains into a single InvestigationResult. Each piece of evidence is
// tagged with its source, timestamp, and confidence status.
//
// Design rules:
//   1. Every claim must have a source (no anonymous facts).
//   2. Every claim must have a fetchedAt timestamp (no stale data masquerading as fresh).
//   3. Unknowns are returned explicitly — never silently omitted.
//   4. The verdict is derived from the evidence, not a single black-box score.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { scanToken } from "@/domains/shield/functions";
import { getTokenDetail } from "@/domains/hunt/functions";
import type {
  Evidence,
  EvidenceStatus,
  EvidenceValue,
  InvestigationResult,
  Unknown,
} from "./types";

// ── Helper: Build an Evidence item with a timestamp ──────────────────────────

function evidence(params: {
  label: string;
  value: EvidenceValue;
  source: string;
  status: EvidenceStatus;
  detail?: string;
}): Evidence {
  return {
    label: params.label,
    value: params.value,
    source: params.source,
    status: params.status,
    fetchedAt: new Date().toISOString(),
    detail: params.detail,
  };
}

// ── Server Function: investigateToken ────────────────────────────────────────

export const investigateToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ address: z.string().min(10), chain: z.string() }))
  .handler(async ({ data, context }): Promise<InvestigationResult> => {
    const { address, chain } = data;
    const investigatedAt = new Date().toISOString();
    const unknowns: Unknown[] = [];

    // ── Step 1: Run Shield security scan (GoPlus/RugCheck) ─────────────
    const securityEvidence: Evidence[] = [];
    let trustScore = 0;
    let trustLevel = "unknown";

    try {
      const scan = await scanToken({ data: { address, chain } });
      if (scan.ok) {
        trustScore = scan.trustScore.score;
        trustLevel = scan.trustScore.level;

        // Honeypot check
        securityEvidence.push(
          evidence({
            label: "Honeypot check",
            value: scan.security.isHoneypot,
            source: chain === "solana" ? "RugCheck" : "GoPlus",
            status: "verified",
            detail: scan.security.isHoneypot
              ? "Token is flagged as a honeypot. Selling is restricted."
              : "No honeypot patterns detected.",
          }),
        );

        // Buy/Sell tax
        if (chain !== "solana") {
          securityEvidence.push(
            evidence({
              label: "Buy tax",
              value: `${scan.security.buyTax}%`,
              source: "GoPlus",
              status: scan.security.buyTax > 10 ? "reported" : "verified",
              detail:
                scan.security.buyTax > 10
                  ? "Unusually high buy tax — may indicate a scam."
                  : "Buy tax is within a normal range.",
            }),
          );
          securityEvidence.push(
            evidence({
              label: "Sell tax",
              value: `${scan.security.sellTax}%`,
              source: "GoPlus",
              status: scan.security.sellTax > 10 ? "reported" : "verified",
              detail:
                scan.security.sellTax > 10
                  ? "Unusually high sell tax — may indicate a scam."
                  : "Sell tax is within a normal range.",
            }),
          );
        }

        // Mintable
        securityEvidence.push(
          evidence({
            label: "Mintable",
            value: scan.security.isMintable,
            source: chain === "solana" ? "RugCheck" : "GoPlus",
            status: "reported",
            detail: scan.security.isMintable
              ? "Token supply can be increased by the owner. Risk of dilution."
              : "Token supply is fixed.",
          }),
        );

        // Ownership renounced
        securityEvidence.push(
          evidence({
            label: "Ownership renounced",
            value: scan.security.ownershipRenounced,
            source: chain === "solana" ? "RugCheck" : "GoPlus",
            status: "reported",
            detail: scan.security.ownershipRenounced
              ? "Owner has renounced contract ownership."
              : "Owner retains contract ownership. Privileged functions are still callable.",
          }),
        );

        // Top-10 holders (only for EVM)
        if (chain !== "solana" && scan.security.top10HolderPct > 0) {
          securityEvidence.push(
            evidence({
              label: "Top-10 holder concentration",
              value: `${scan.security.top10HolderPct.toFixed(1)}%`,
              source: "GoPlus",
              status: scan.security.top10HolderPct > 70 ? "reported" : "verified",
              detail:
                scan.security.top10HolderPct > 70
                  ? "Top-10 holders control a majority of the supply. High rug-pull risk."
                  : "Holder distribution is within a normal range.",
            }),
          );
        }

        // Detected risks
        if (scan.security.risks.length > 0) {
          securityEvidence.push(
            evidence({
              label: "Detected risks",
              value: scan.security.risks,
              source: chain === "solana" ? "RugCheck" : "GoPlus",
              status: "reported",
              detail: `${scan.security.risks.length} risk(s) flagged by the security provider.`,
            }),
          );
        }
      } else {
        unknowns.push({
          topic: "Contract security scan",
          reason: scan.error || "Security provider returned an error.",
          suggestion: "Try again later, or verify the address manually on the chain explorer.",
        });
      }
    } catch (err) {
      unknowns.push({
        topic: "Contract security scan",
        reason: err instanceof Error ? err.message : "Unknown error",
        suggestion: "Try again later, or check the chain explorer directly.",
      });
    }

    // ── Step 2: Run Hunt market detail ────────────────────────────────
    const marketEvidence: Evidence[] = [];
    const liquidityEvidence: Evidence[] = [];
    let tokenName = "Unknown";
    let tokenSymbol = "???";
    let tokenImage: string | undefined;

    try {
      const detail = await getTokenDetail({ data: { address, chain } });
      tokenName = detail.name;
      tokenSymbol = detail.symbol;
      tokenImage = detail.imageUrl ?? undefined;

      // Market data
      marketEvidence.push(
        evidence({
          label: "Current price",
          value: detail.price,
          source: "Birdeye + DexScreener",
          status: "verified",
          detail: `Cross-validated by ${detail.imageUrl ? "Birdeye" : "DexScreener"} and DexScreener.`,
        }),
      );

      marketEvidence.push(
        evidence({
          label: "24h price change",
          value: `${detail.priceChange24h.toFixed(2)}%`,
          source: "DexScreener",
          status: "reported",
        }),
      );

      marketEvidence.push(
        evidence({
          label: "24h volume",
          value: detail.volume24h,
          source: "DexScreener",
          status: "reported",
        }),
      );

      marketEvidence.push(
        evidence({
          label: "Market cap",
          value: detail.marketCap,
          source: detail.marketCap > 0 ? "Birdeye" : "DexScreener",
          status: detail.marketCap > 0 ? "reported" : "unavailable",
          detail: detail.marketCap > 0 ? undefined : "Market cap not exposed by the data provider.",
        }),
      );

      marketEvidence.push(
        evidence({
          label: "Holder count",
          value: detail.holders,
          source: detail.holders > 0 ? "Birdeye" : "DexScreener",
          status: detail.holders > 0 ? "reported" : "unavailable",
          detail:
            detail.holders > 0
              ? undefined
              : "Holder count not exposed by the data provider. This is common for EVM tokens.",
        }),
      );

      // Liquidity
      liquidityEvidence.push(
        evidence({
          label: "Total liquidity (USD)",
          value: detail.liquidity,
          source: "DexScreener",
          status: detail.liquidity > 0 ? "verified" : "unavailable",
          detail:
            detail.liquidity < 10_000
              ? "Very low liquidity — single transactions can move the price significantly."
              : detail.liquidity < 100_000
                ? "Moderate liquidity — be cautious with position size."
                : "Liquidity is sufficient for normal trading.",
        }),
      );

      // Social presence
      if (detail.website || detail.twitter) {
        marketEvidence.push(
          evidence({
            label: "Social presence",
            value: { website: !!detail.website, twitter: !!detail.twitter },
            source: "Birdeye",
            status: "reported",
            detail: detail.website
              ? "Website link found."
              : detail.twitter
                ? "Twitter link found."
                : "No social links.",
          }),
        );
      } else {
        unknowns.push({
          topic: "Social presence",
          reason: "No website or Twitter link was found.",
          suggestion: "Verify the project's legitimacy through other channels.",
        });
      }
    } catch (err) {
      unknowns.push({
        topic: "Market data",
        reason: err instanceof Error ? err.message : "Unknown error",
        suggestion: "Try a different chain or check the address.",
      });
    }

    // ── Step 3: Derive a verdict from the evidence ────────────────────
    // The verdict is computed from the evidence — not a single opaque score.
    let verdict: InvestigationResult["verdict"] = "CAUTION";

    const honeypotEvidence = securityEvidence.find((e) => e.label === "Honeypot check");
    const isHoneypot =
      honeypotEvidence && typeof honeypotEvidence.value === "boolean" && honeypotEvidence.value;

    const mintableEvidence = securityEvidence.find((e) => e.label === "Mintable");
    const isMintable =
      mintableEvidence && typeof mintableEvidence.value === "boolean" && mintableEvidence.value;

    const liquidityEv = liquidityEvidence.find((e) => e.label === "Total liquidity (USD)");
    const lowLiquidity = typeof liquidityEv?.value === "number" && liquidityEv.value < 10_000;

    if (isHoneypot) {
      verdict = "DANGER";
    } else if (trustLevel === "critical" || trustLevel === "danger") {
      verdict = "DANGER";
    } else if (trustLevel === "warning" || isMintable || lowLiquidity) {
      verdict = "SUSPICIOUS";
    } else if (trustScore >= 75 && !lowLiquidity) {
      verdict = "SAFE";
    } else if (securityEvidence.length === 0) {
      verdict = "UNABLE_TO_VERIFY";
    } else {
      verdict = "CAUTION";
    }

    // ── Step 4: Build final result ────────────────────────────────────
    const complete = unknowns.length === 0;

    return {
      token: {
        address,
        chain,
        name: tokenName,
        symbol: tokenSymbol,
        imageUrl: tokenImage,
      },
      verdict,
      evidence: {
        security: securityEvidence,
        liquidity: liquidityEvidence,
        ownership: securityEvidence.filter((e) =>
          ["Mintable", "Ownership renounced"].includes(e.label),
        ),
        market: marketEvidence,
      },
      unknowns,
      investigatedAt,
      complete,
    };
  });
