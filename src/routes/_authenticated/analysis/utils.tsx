import React from "react";

const SMC_TERMS = [
  "Order Block",
  "Fair Value Gap",
  "FVG",
  "Liquidity",
  "BOS",
  "ChoCh",
  "CHOCH",
  "ICT",
  "SMC",
  "Sweep",
  "Mitigation",
  "Break of Structure",
  "Change of Character",
  "Imbalance",
  "Premium",
  "Discount",
  "OB",
  "NWOG",
  "NDOG",
];

const SMC_REGEX = new RegExp(
  `(${SMC_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "gi",
);

/** Highlights SMC/ICT terminology in text with colored spans. */
export function highlightSMC(text: string): React.ReactNode[] {
  const parts = text.split(SMC_REGEX);
  return parts.map((part, i) => {
    if (SMC_TERMS.some((t) => t.toLowerCase() === part.toLowerCase())) {
      return (
        <span
          key={i}
          style={{
            color: "var(--color-bullish)",
            fontWeight: 700,
            background: `color-mix(in srgb, var(--color-bullish) 10%, transparent)`,
            padding: "0 2px",
            borderRadius: "2px",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/** Returns a human-readable relative time string from an ISO date. */
export function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
