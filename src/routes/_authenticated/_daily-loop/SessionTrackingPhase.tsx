"use client";

import { useState, useCallback, useMemo } from "react";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import type { DailyLoop, TradingSession } from "@/domains/daily-loop/types";
import { ExpandableWidget } from "@/components/vixor/ExpandableWidget";
import { INPUT_STYLE, SECTION_LABEL_STYLE, SESSIONS, getActiveSession } from "./constants";

// ═══════════════════════════════════════════════
// PHASE 2: SESSION TRACKING
// ═══════════════════════════════════════════════

export function SessionTrackingPhase({
  loop,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isSaving: boolean;
  onSubmit: (data: { session: TradingSession; traded: boolean; notes: string }) => void;
}) {
  const activeSession = getActiveSession();
  const [savingSession, setSavingSession] = useState<TradingSession | null>(null);

  const handleSessionToggle = useCallback(
    (session: TradingSession, traded: boolean, notes: string) => {
      setSavingSession(session);
      onSubmit({ session, traded, notes });
    },
    [onSubmit],
  );

  return (
    <ExpandableWidget
      title="Session Tracking"
      subtitle="Track your trading sessions"
      icon={Clock}
      variant="info"
      defaultExpanded={true}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SESSIONS.map((session) => {
          const tradedField = `${session.key}_session_traded` as keyof DailyLoop;
          const notesField = `${session.key}_session_notes` as keyof DailyLoop;
          const isTraded = (loop?.[tradedField] as boolean) ?? false;
          const notes = (loop?.[notesField] as string) ?? "";
          const isActive = activeSession === session.key;

          return (
            <SessionCard
              key={session.key}
              session={session}
              isActive={isActive}
              isTraded={isTraded}
              notes={notes}
              isSaving={isSaving && savingSession === session.key}
              onToggle={(traded, notesVal) => handleSessionToggle(session.key, traded, notesVal)}
            />
          );
        })}
      </div>
    </ExpandableWidget>
  );
}

// ═══════════════════════════════════════════════
// SESSION CARD
// ═══════════════════════════════════════════════

function SessionCard({
  session,
  isActive,
  isTraded,
  notes,
  isSaving,
  onToggle,
}: {
  session: { key: TradingSession; label: string; hours: string };
  isActive: boolean;
  isTraded: boolean;
  notes: string;
  isSaving: boolean;
  onToggle: (traded: boolean, notes: string) => void;
}) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [localTraded, setLocalTraded] = useState(isTraded);

  // Sync from props
  useMemo(() => {
    setLocalNotes(notes);
    setLocalTraded(isTraded);
  }, [isTraded, notes]);

  const handleSave = useCallback(() => {
    onToggle(localTraded, localNotes);
  }, [localTraded, localNotes, onToggle]);

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isActive ? `${"var(--color-bullish)"}66` : "var(--color-border)"}`,
        background: isActive ? `${"var(--color-bullish)"}0D` : "var(--color-card)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock
            size={12}
            style={{ color: isActive ? "var(--color-bullish)" : "var(--color-muted-foreground)" }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
            {session.label}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {session.hours}
          </span>
        </div>
        {isActive && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              background: `${"var(--color-bullish)"}26`,
              color: "var(--color-bullish)",
              border: `1px solid ${"var(--color-bullish)"}4D`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ACTIVE
          </span>
        )}
      </div>

      {/* Did you trade toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={SECTION_LABEL_STYLE}>Did you trade?</span>
        <button
          onClick={() => setLocalTraded(!localTraded)}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            border: `1px solid ${
              localTraded ? `${"var(--color-bullish)"}66` : "var(--color-border)"
            }`,
            background: localTraded ? `${"var(--color-bullish)"}26` : "var(--color-card)",
            color: localTraded ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          {localTraded ? "✓ Yes" : "No"}
        </button>
      </div>

      {/* Notes */}
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder={`Notes for ${session.label} session...`}
        style={{
          ...INPUT_STYLE,
          borderRadius: 6,
          fontSize: 11,
          padding: "8px 10px",
          height: 56,
        }}
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          color: "var(--color-foreground)",
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "all var(--transition-fast)",
          opacity: isSaving ? 0.5 : 1,
        }}
      >
        {isSaving ? (
          <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <CheckCircle2 size={10} />
        )}
        Save {session.label} Session
      </button>
    </div>
  );
}
