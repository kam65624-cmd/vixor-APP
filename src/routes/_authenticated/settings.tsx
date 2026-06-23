import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────
interface NotificationChannels {
  price_alerts?: boolean;
  whale_alerts?: boolean;
  signal_notifications?: boolean;
}

type SettingItem =
  | { type: "toggle-server"; id: string; label: string; desc: string; key: keyof NotificationChannels }
  | { type: "toggle-local"; id: string; label: string; desc: string }
  | { type: "select"; label: string; desc: string; options: string[]; current: number; onChange: (i: number) => void }
  | { type: "input"; id: string; label: string; desc: string; value: string; onChange: (v: string) => void; placeholder: string }
  | { type: "button"; label: string; desc: string; btnText: string; btnColor: string };

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        cursor: "pointer",
        background: enabled ? "#10B981" : "rgba(255,255,255,0.1)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "2px",
          left: enabled ? "18px" : "2px",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

// ── Setting Row ───────────────────────────────────────────────────────────────
function SettingRow({ item, children }: { item: SettingItem; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
      }}
    >
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600 }}>{item.label}</div>
        <div style={{ fontSize: "9px", color: "#9CA3AF", marginTop: "2px" }}>{item.desc}</div>
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function SettingsPage() {
  const queryClient = useQueryClient();

  // Server function wrappers (stable references)
  const fetchSettings = useStableServerFn(getUserSettings);
  const updateSettings = useStableServerFn(updateUserSettings);

  // ── Server-side data fetching ──────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ["user-settings"],
    queryFn: () => fetchSettings({}),
    staleTime: 30_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateMutation = useMutation({
    mutationFn: (payload: any) => (updateSettings as any)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      showSavedToast();
    },
  });

  // ── Local UI preferences (not persisted to server) ─────────────────────────
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({
    soundEnabled: false,
    darkMode: true,
    compactMode: false,
    showChartOnHover: true,
    autoRefresh: true,
    tradeConfirmations: true,
    twoFactor: false,
  });

  const [slippageIdx, setSlippageIdx] = useState(1);
  const [chainIdx, setChainIdx] = useState(0);

  const toggleLocal = (id: string) =>
    setLocalToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Server-side editable state ─────────────────────────────────────────────
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannels>({
    price_alerts: true,
    whale_alerts: true,
    signal_notifications: true,
  });
  const [llmProvider, setLlmProvider] = useState("openai");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const llmOptions = ["openai", "anthropic", "google", "local"];

  // Sync server data into local state when it arrives
  const initializedRef = useRef(false);
  useEffect(() => {
    const s = settingsQuery.data?.settings;
    if (!s) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (s.notification_channels && typeof s.notification_channels === "object") {
      setNotificationChannels(s.notification_channels as NotificationChannels);
    }
    if (s.preferred_llm_provider) {
      setLlmProvider(s.preferred_llm_provider);
    }
    if (s.telegram_chat_id != null) {
      setTelegramChatId(s.telegram_chat_id);
    }
    if (s.webhook_url != null) {
      setWebhookUrl(s.webhook_url);
    }
  }, [settingsQuery.data?.settings]);

  // Reset the initialized flag when a fresh fetch starts so updated data flows in
  useEffect(() => {
    if (settingsQuery.isFetching && !settingsQuery.isLoading) {
      initializedRef.current = false;
    }
  }, [settingsQuery.isFetching, settingsQuery.isLoading]);

  // ── Toggle helpers for server-side notification channels ────────────────────
  const toggleNotification = (key: keyof NotificationChannels) => {
    setNotificationChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = () => {
    updateMutation.mutate({
      notification_channels: notificationChannels,
      preferred_llm_provider: llmProvider,
      telegram_chat_id: telegramChatId || null,
      webhook_url: webhookUrl || null,
    });
  };

  // ── "Saved!" toast ─────────────────────────────────────────────────────────
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSavedToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 2200);
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (settingsQuery.isLoading) {
    return (
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "#10B981",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Loading settings…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Section definitions ────────────────────────────────────────────────────
  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Trading",
      items: [
        { type: "select", label: "Default Slippage", desc: "Maximum slippage tolerance for trades", options: ["0.5%", "1.0%", "2.0%", "3.0%"], current: slippageIdx, onChange: setSlippageIdx },
        { type: "select", label: "Default Chain", desc: "Blockchain for trading", options: ["Solana", "Ethereum", "Base", "Arbitrum"], current: chainIdx, onChange: setChainIdx },
        { type: "toggle-local", id: "tradeConfirmations", label: "Trade Confirmations", desc: "Show confirmation dialog before executing trades" },
        { type: "toggle-local", id: "autoRefresh", label: "Auto Refresh Data", desc: "Automatically refresh token prices and data" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { type: "toggle-server", id: "priceAlerts", label: "Price Alerts", desc: "Get notified when tokens hit your price targets", key: "price_alerts" },
        { type: "toggle-server", id: "whaleAlerts", label: "Whale Alerts", desc: "Large transaction notifications", key: "whale_alerts" },
        { type: "toggle-server", id: "signalNotifications", label: "AI Signal Alerts", desc: "New AI trading signal notifications", key: "signal_notifications" },
        { type: "toggle-local", id: "soundEnabled", label: "Sound Effects", desc: "Play sounds for notifications and alerts" },
      ],
    },
    {
      title: "AI Provider",
      items: [
        { type: "select", label: "LLM Provider", desc: "Preferred large language model provider", options: llmOptions, current: llmOptions.indexOf(llmProvider) >= 0 ? llmOptions.indexOf(llmProvider) : 0, onChange: (i) => setLlmProvider(llmOptions[i]) },
      ],
    },
    {
      title: "Integrations",
      items: [
        { type: "input", id: "telegramChatId", label: "Telegram Chat ID", desc: "Your Telegram chat ID for bot notifications", value: telegramChatId, onChange: setTelegramChatId, placeholder: "e.g. 123456789" },
        { type: "input", id: "webhookUrl", label: "Webhook URL", desc: "Custom webhook endpoint for notifications", value: webhookUrl, onChange: setWebhookUrl, placeholder: "https://..." },
      ],
    },
    {
      title: "Display",
      items: [
        { type: "toggle-local", id: "darkMode", label: "Dark Mode", desc: "Use dark theme (recommended for trading)" },
        { type: "toggle-local", id: "compactMode", label: "Compact Mode", desc: "Reduce spacing for more data density" },
        { type: "toggle-local", id: "showChartOnHover", label: "Chart on Hover", desc: "Show mini chart when hovering over tokens" },
      ],
    },
    {
      title: "Security & Account",
      items: [
        { type: "toggle-local", id: "twoFactor", label: "Two-Factor Auth", desc: "Add an extra layer of security to your account" },
        { type: "button", label: "Change Password", desc: "Update your account password", btnText: "Change", btnColor: "#10B981" },
        { type: "button", label: "Export Data", desc: "Download your trading history and portfolio data", btnText: "Export", btnColor: "#22C55E" },
        { type: "button", label: "Delete Account", desc: "Permanently delete your account and all data", btnText: "Delete", btnColor: "#EF4444" },
      ],
    },
  ];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 500,
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#FFFFFF",
    width: "160px",
    outline: "none",
    font: "inherit",
  };

  // ── Render item right-hand control ─────────────────────────────────────────
  const renderItemControl = (item: SettingItem) => {
    switch (item.type) {
      case "toggle-server":
        return <ToggleSwitch enabled={!!notificationChannels[item.key]} onClick={() => toggleNotification(item.key)} />;
      case "toggle-local":
        return <ToggleSwitch enabled={!!localToggles[item.id]} onClick={() => toggleLocal(item.id)} />;
      case "select":
        return (
          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            {item.options.map((opt, oi) => (
              <button
                key={opt}
                onClick={() => item.onChange(oi)}
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  color: oi === item.current ? "#fff" : "#9CA3AF",
                  background: oi === item.current ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case "input":
        return (
          <input
            type="text"
            value={item.value}
            onChange={(e) => item.onChange(e.target.value)}
            placeholder={item.placeholder}
            style={item.id === "webhookUrl" ? { ...inputStyle, width: "180px" } : inputStyle}
          />
        );
      case "button":
        return (
          <button
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: "4px",
              border: "none",
              background: `${item.btnColor}20`,
              color: item.btnColor,
              cursor: "pointer",
            }}
          >
            {item.btnText}
          </button>
        );
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#FFFFFF", position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#9881;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Settings</span>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "5px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: updateMutation.isPending ? "wait" : "pointer",
            background: updateMutation.isPending ? "rgba(16,185,129,0.4)" : "#10B981",
            color: "#fff",
            transition: "background 0.2s, opacity 0.2s",
            opacity: updateMutation.isPending ? 0.7 : 1,
          }}
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Toast indicator */}
      {showToast && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22C55E",
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 14px",
            borderRadius: "6px",
            zIndex: 10,
            animation: "fadeInOut 2.2s ease-in-out forwards",
            pointerEvents: "none",
          }}
        >
          ✓ Saved!
        </div>
      )}
      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>

      {/* Error indicator */}
      {updateMutation.isError && (
        <div
          style={{
            padding: "6px 12px",
            background: "rgba(239,68,68,0.1)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444",
            fontSize: "10px",
            fontWeight: 500,
          }}
        >
          Failed to save settings. Please try again.
        </div>
      )}

      <div style={{ padding: "8px 12px", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#9CA3AF",
                padding: "6px 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {section.title}
            </div>
            <div
              style={{
                background: "#1E1E1E",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => (
                <div
                  key={item.type === "input" ? item.id : item.type === "toggle-local" || item.type === "toggle-server" ? item.id : i}
                  style={{
                    borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <SettingRow item={item}>{renderItemControl(item)}</SettingRow>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}