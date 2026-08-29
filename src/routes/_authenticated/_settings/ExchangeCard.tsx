import React from "react";
import {
  EXCHANGES,
  type ExchangeCredentialView,
  type TestConnectionResult,
} from "@/domains/trading/gateway/functions";
import type { ExchangeFormState } from "./constants";

// ── Exchange Card ─────────────────────────────────────────────────────────────

export function ExchangeCard({
  exchange,
  view,
  testResult,
  isSaving,
  isTesting,
  isDeleting,
  form,
  onFormChange,
  onSave,
  onTest,
  onDelete,
}: {
  exchange: (typeof EXCHANGES)[number];
  view: ExchangeCredentialView | undefined;
  testResult: TestConnectionResult | null;
  isSaving: boolean;
  isTesting: boolean;
  isDeleting: boolean;
  form: ExchangeFormState;
  onFormChange: (f: ExchangeFormState) => void;
  onSave: () => void;
  onTest: () => void;
  onDelete: () => void;
}) {
  const isConnected = view?.isConnected ?? false;

  const inputStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    padding: "5px 8px",
    borderRadius: "6px",
    border: "1px solid var(--color-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--color-foreground)",
    width: "100%",
    outline: "none",
    font: "inherit",
    boxSizing: "border-box",
    transition: "border-color var(--transition-fast)",
  };

  const monoInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  };

  return (
    <div
      style={{
        background: "var(--color-card-hover)",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        padding: "10px 12px",
        marginBottom: "8px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isConnected ? "4px" : "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>{exchange.icon}</span>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>{exchange.name}</span>
          {isConnected ? (
            <span style={{ fontSize: "12px", color: "var(--color-bullish)", fontWeight: 600 }}>
              ✓
            </span>
          ) : null}
          {form.isTestnet && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: "3px",
                background: "rgba(99,102,241,0.15)",
                color: "var(--color-primary)",
              }}
            >
              TESTNET
            </span>
          )}
        </div>
        {isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-muted-foreground)",
                marginRight: "4px",
              }}
            >
              {view?.maskedKey}
            </span>
          </div>
        ) : (
          <span
            style={{ fontSize: "12px", color: "var(--color-muted-foreground)", fontWeight: 500 }}
          >
            Not configured
          </span>
        )}
      </div>

      {/* Connected state: actions row */}
      {isConnected && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <button
            onClick={onTest}
            disabled={isTesting}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "4px",
              border: "none",
              cursor: isTesting ? "wait" : "pointer",
              background: `${"var(--color-bullish)"}20`,
              color: "var(--color-bullish)",
              opacity: isTesting ? 0.6 : 1,
            }}
          >
            {isTesting ? "Testing…" : "Test Connection"}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: "4px",
              border: "none",
              cursor: isDeleting ? "wait" : "pointer",
              background: `${"var(--color-bearish)"}20`,
              color: "var(--color-bearish)",
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            {isDeleting ? "Removing…" : "Disconnect"}
          </button>
          {view?.lastConnectedAt && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--color-muted-foreground)",
                marginLeft: "auto",
              }}
            >
              Last: {new Date(view.lastConnectedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: "4px",
            marginBottom: isConnected && !testResult.success ? "6px" : "6px",
            background: testResult.success
              ? `${"var(--color-bullish)"}15`
              : `${"var(--color-bearish)"}15`,
            color: testResult.success ? "var(--color-bullish)" : "var(--color-bearish)",
          }}
        >
          {testResult.success
            ? `Connected — Balance: ${testResult.balance?.toFixed(2) ?? "N/A"} USDT`
            : `Failed: ${testResult.error}`}
        </div>
      )}

      {/* Form (always visible when not connected) */}
      {!isConnected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Label */}
          <input
            type="text"
            value={form.label}
            onChange={(e) => onFormChange({ ...form, label: e.target.value })}
            placeholder="Label (optional, e.g. Main Account)"
            style={inputStyle}
          />
          {/* API Key */}
          <input
            type="text"
            value={form.apiKey}
            onChange={(e) => onFormChange({ ...form, apiKey: e.target.value })}
            placeholder="API Key"
            style={monoInputStyle}
          />
          {/* API Secret + show/hide */}
          <div style={{ position: "relative" }}>
            <input
              type={form.showSecret ? "text" : "password"}
              value={form.apiSecret}
              onChange={(e) => onFormChange({ ...form, apiSecret: e.target.value })}
              placeholder={exchange.id === "exness" ? "Account ID" : "API Secret"}
              style={{ ...monoInputStyle, paddingRight: "28px" }}
            />
            <button
              type="button"
              onClick={() => onFormChange({ ...form, showSecret: !form.showSecret })}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
                fontSize: "12px",
                padding: "0",
                lineHeight: 1,
              }}
              title={form.showSecret ? "Hide" : "Show"}
            >
              {form.showSecret ? "◉" : "○"}
            </button>
          </div>
          {/* Passphrase (OKX only — Exness uses MT Type toggle instead) */}
          {(exchange.fields as readonly string[]).includes("passphrase") &&
            exchange.id !== "exness" && (
              <input
                type={form.showSecret ? "text" : "password"}
                value={form.passphrase}
                onChange={(e) => onFormChange({ ...form, passphrase: e.target.value })}
                placeholder="Passphrase"
                style={monoInputStyle}
              />
            )}
          {/* MT Type selector (Exness only) */}
          {exchange.id === "exness" && (
            <div style={{ display: "flex", gap: "4px" }}>
              {(["mt4", "mt5"] as const).map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => onFormChange({ ...form, mtType: mt })}
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 0",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    color:
                      form.mtType === mt
                        ? "var(--color-foreground)"
                        : "var(--color-muted-foreground)",
                    background:
                      form.mtType === mt ? `${"var(--color-bullish)"}26` : "rgba(99,102,241,0.04)",
                  }}
                >
                  {mt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {/* Testnet toggle + Save */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              onClick={() => onFormChange({ ...form, isTestnet: !form.isTestnet })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "16px",
                  borderRadius: "8px",
                  background: form.isTestnet ? "var(--color-primary)" : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "var(--color-foreground)",
                    position: "absolute",
                    top: "2px",
                    left: form.isTestnet ? "16px" : "2px",
                    transition: "left 0.2s",
                  }}
                />
              </div>
              <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                Testnet
              </span>
            </div>
            <button
              onClick={onSave}
              disabled={isSaving || !form.apiKey || !form.apiSecret}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: "5px",
                border: "none",
                cursor: isSaving || !form.apiKey || !form.apiSecret ? "not-allowed" : "pointer",
                background:
                  isSaving || !form.apiKey || !form.apiSecret
                    ? `${"var(--color-bullish)"}33`
                    : "var(--color-bullish)",
                color: "var(--color-foreground)",
                opacity: isSaving || !form.apiKey || !form.apiSecret ? 0.5 : 1,
              }}
            >
              {isSaving ? "Saving…" : "Connect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
