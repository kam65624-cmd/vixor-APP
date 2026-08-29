import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";

interface BackHeaderProps {
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  isComplete: boolean;
  handleShareX: () => void;
  handleShareTelegram: () => void;
}

export function BackHeader({
  shareOpen,
  setShareOpen,
  isComplete,
  handleShareX,
  handleShareTelegram,
}: BackHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 4px",
      }}
    >
      <Link
        to="/"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-foreground)",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={20} />
      </Link>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--color-card)",
            border: `1px solid ${"var(--color-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-muted-foreground)",
            cursor: "pointer",
          }}
        >
          <Bookmark size={16} />
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShareOpen(!shareOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--color-card)",
              border: `1px solid ${"var(--color-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
          </button>
          {shareOpen && isComplete && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
                background: "var(--color-card)",
                border: `1px solid var(--color-border)`,
                borderRadius: "12px",
                boxShadow: "0 8px 32px -8px oklch(0 0 0 / 0.5)",
                padding: "6px",
                zIndex: 50,
                minWidth: "140px",
              }}
            >
              <button
                onClick={handleShareX}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                X (Twitter)
              </button>
              <button
                onClick={handleShareTelegram}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Telegram
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
