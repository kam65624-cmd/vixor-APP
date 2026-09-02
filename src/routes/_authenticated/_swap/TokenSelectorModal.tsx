import { useState, useMemo, useEffect, useRef } from "react";
import { TokenDef, TOKENS, FALLBACK_PRICES, formatBalance, formatUSD } from "./constants";
import { TokenIcon } from "./TokenIcon";

// ── Token Selector Modal ────────────────────────────────────────────────────
export function TokenSelectorModal({
  open,
  onSelect,
  onClose,
  excludeSymbol,
}: {
  open: boolean;
  onSelect: (token: TokenDef) => void;
  onClose: () => void;
  excludeSymbol?: string;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TOKENS.filter((t) => t.symbol !== excludeSymbol);
    return TOKENS.filter(
      (t) =>
        t.symbol !== excludeSymbol &&
        (t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)),
    );
  }, [search, excludeSymbol]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          maxHeight: "70vh",
          background: "var(--color-card-solid, #101317)",
          borderRadius: "16px 16px 0 0",
          border: "1px solid var(--color-border)",
          borderBottom: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid var(--color-border)` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-foreground)" }}>
              Select Token
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              background: "var(--color-muted, #16181C)",
              color: "var(--color-foreground)",
              fontSize: "14px",
              outline: "none",
              fontFamily: "var(--font-sans)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Token List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--color-muted-foreground)",
                fontSize: "13px",
              }}
            >
              No tokens found
            </div>
          )}
          {filtered.map((token) => (
            <button
              key={token.symbol}
              onClick={() => onSelect(token)}
              style={{
                width: "100%",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-foreground)",
                transition: "background 0.1s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <TokenIcon symbol={token.symbol} color={token.color} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{token.symbol}</div>
                <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                  {token.name}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {formatBalance(0, token.symbol)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                  {formatUSD(0 * (FALLBACK_PRICES[token.symbol] || 0))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
