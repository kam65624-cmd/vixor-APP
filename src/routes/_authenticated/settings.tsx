import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { PageLayout,  ScrollArea } from "@/components/vixor/PageLayout";
import {
  getExchangeCredentials,
  saveExchangeCredentials,
  testExchangeConnection,
  deleteExchangeCredentials,
  EXCHANGES,
  type ExchangeCredentialView,
  type TestConnectionResult,
} from "@/domains/trading/gateway/functions";

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

interface UserSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  compactMode: boolean;
  showChartOnHover: boolean;
  autoRefresh: boolean;
  tradeConfirmations: boolean;
  twoFactor: boolean;
  slippageIdx: number;
  chainIdx: number;
}

const SETTINGS_STORAGE_KEY = "vixor:user-settings";

function loadLocalSettings(): Partial<UserSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSettings(settings: Partial<UserSettings>) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable in private browsing
  }
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
        background: enabled ? "var(--color-bullish)" : "rgba(255,255,255,0.1)",
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
          background: "var(--color-foreground)",
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
        <div style={{ fontSize: "9px", color: "var(--color-muted-foreground)", marginTop: "2px" }}>{item.desc}</div>
      </div>
      {children}
    </div>
  );
}

// ── Exchange Card ─────────────────────────────────────────────────────────────

interface ExchangeFormState {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  label: string;
  isTestnet: boolean;
  showSecret: boolean;
}

function ExchangeCard({
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
    fontSize: "10px",
    fontWeight: 500,
    padding: "5px 8px",
    borderRadius: "4px",
    border: "1px solid var(--color-border)",
    background: "color-mix(in oklab, var(--color-foreground) 4%, transparent)",
    color: "var(--color-foreground)",
    width: "100%",
    outline: "none",
    font: "inherit",
    boxSizing: "border-box",
  };

  const monoInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: "9px",
  };

  return (
    <div
      style={{
        background: "var(--color-card-hover)",
        borderRadius: "8px",
        border: "1px solid var(--color-border)",
        padding: "10px 12px",
        marginBottom: "8px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isConnected ? "4px" : "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>{exchange.icon}</span>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>{exchange.name}</span>
          {isConnected ? (
            <span style={{ fontSize: "10px", color: "var(--color-bullish)", fontWeight: 600 }}>✓</span>
          ) : null}
          {form.isTestnet && (
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: "3px",
                background: "color-mix(in oklab, var(--color-primary) 15%, transparent)",
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
                fontSize: "9px",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-muted-foreground)",
                marginRight: "4px",
              }}
            >
              {view?.maskedKey}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)", fontWeight: 500 }}>Not configured</span>
        )}
      </div>

      {/* Connected state: actions row */}
      {isConnected && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <button
            onClick={onTest}
            disabled={isTesting}
            style={{
              fontSize: "9px",
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
              fontSize: "9px",
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
            <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)", marginLeft: "auto" }}>
              Last: {new Date(view.lastConnectedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          style={{
            fontSize: "9px",
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
              placeholder="API Secret"
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
                fontSize: "11px",
                padding: "0",
                lineHeight: 1,
              }}
              title={form.showSecret ? "Hide" : "Show"}
            >
              {form.showSecret ? "◉" : "○"}
            </button>
          </div>
          {/* Passphrase (OKX only) */}
          {(exchange.fields as readonly string[]).includes("passphrase") && (
            <input
              type={form.showSecret ? "text" : "password"}
              value={form.passphrase}
              onChange={(e) => onFormChange({ ...form, passphrase: e.target.value })}
              placeholder="Passphrase"
              style={monoInputStyle}
            />
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
              <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)" }}>Testnet</span>
            </div>
            <button
              onClick={onSave}
              disabled={isSaving || !form.apiKey || !form.apiSecret}
              style={{
                fontSize: "10px",
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

  // ── Local UI preferences (persisted to localStorage) ───────────────────────
  const stored = loadLocalSettings();
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({
    soundEnabled: stored.soundEnabled ?? false,
    darkMode: stored.darkMode ?? true,
    compactMode: stored.compactMode ?? false,
    showChartOnHover: stored.showChartOnHover ?? true,
    autoRefresh: stored.autoRefresh ?? true,
    tradeConfirmations: stored.tradeConfirmations ?? true,
    twoFactor: stored.twoFactor ?? false,
  });

  const [slippageIdx, setSlippageIdx] = useState(stored.slippageIdx ?? 1);
  const [chainIdx, setChainIdx] = useState(stored.chainIdx ?? 0);

  const toggleLocal = (id: string) => {
    setLocalToggles((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveLocalSettings({ ...loadLocalSettings(), ...next, slippageIdx, chainIdx });
      showSavedToast();
      return next;
    });
  };

  const handleSlippageChange = (i: number) => {
    setSlippageIdx(i);
    saveLocalSettings({ ...loadLocalSettings(), ...localToggles, slippageIdx: i, chainIdx });
    showSavedToast();
  };

  const handleChainChange = (i: number) => {
    setChainIdx(i);
    saveLocalSettings({ ...loadLocalSettings(), ...localToggles, slippageIdx, chainIdx: i });
    showSavedToast();
  };

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

  // ── Exchange credentials ────────────────────────────────────────────────
  const fetchExchCreds = useStableServerFn(getExchangeCredentials);
  const saveExchCreds = useStableServerFn(saveExchangeCredentials);
  const testExchConn = useStableServerFn(testExchangeConnection);
  const deleteExchCreds = useStableServerFn(deleteExchangeCredentials);

  const exchQuery = useQuery({
    queryKey: ["exchange-credentials"],
    queryFn: () => fetchExchCreds({}),
    staleTime: 30_000,
  });

  const saveExchMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (payload: any) => (saveExchCreds as any)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-credentials"] });
      showSavedToast();
    },
  });

  const testExchMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (payload: any) => (testExchConn as any)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-credentials"] });
    },
  });

  const deleteExchMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (payload: any) => (deleteExchCreds as any)(payload),
    onSuccess: (_data: unknown, variables: { exchangeId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["exchange-credentials"] });
      // Clear test result for this exchange
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[variables.exchangeId];
        return next;
      });
    },
  });

  // Exchange form state (one per exchange)
  const [exchForms, setExchForms] = useState<Record<string, ExchangeFormState>>(() => {
    const init: Record<string, ExchangeFormState> = {};
    for (const ex of EXCHANGES) {
      init[ex.id] = { apiKey: "", apiSecret: "", passphrase: "", label: "", isTestnet: true, showSecret: false };
    }
    return init;
  });

  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult | null>>({});

  const exchViews = exchQuery.data?.exchanges ?? [];

  const getExchView = (id: string): ExchangeCredentialView | undefined =>
    exchViews.find((v: ExchangeCredentialView) => v.exchangeId === id);

  // ── Section definitions ────────────────────────────────────────────────────
  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Trading",
      items: [
        { type: "select", label: "Default Slippage", desc: "Maximum slippage tolerance for trades", options: ["0.5%", "1.0%", "2.0%", "3.0%"], current: slippageIdx, onChange: handleSlippageChange },
        { type: "select", label: "Default Chain", desc: "Blockchain for trading", options: ["Solana", "Ethereum", "Base", "Arbitrum"], current: chainIdx, onChange: handleChainChange },
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
        { type: "button", label: "Change Password", desc: "Update your account password", btnText: "Change", btnColor: "var(--color-bullish)" },
        { type: "button", label: "Export Data", desc: "Download your trading history and portfolio data", btnText: "Export", btnColor: "var(--color-primary)" },
        { type: "button", label: "Delete Account", desc: "Permanently delete your account and all data", btnText: "Delete", btnColor: "var(--color-bearish)" },
      ],
    },
  ];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 500,
    padding: "4px 8px",
    borderRadius: "4px",
    border: `1px solid ${"var(--color-border)"}`,
    background: "color-mix(in oklab, var(--color-foreground) 4%, transparent)",
    color: "var(--color-foreground)",
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
                  color: oi === item.current ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  background: oi === item.current ? `${"var(--color-bullish)"}26` : "color-mix(in oklab, var(--color-foreground) 4%, transparent)",
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
    <PageLayout title="⚙ Settings" loading={settingsQuery.isLoading} loadingColor={"var(--color-bullish)"}>
      {/* Toast indicator */}
      {showToast && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: `${"var(--color-bullish)"}26`,
            border: `1px solid ${"var(--color-bullish)"}4D`,
            color: "var(--color-bullish)",
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
            background: `${"var(--color-bearish)"}1A`,
            borderBottom: `1px solid ${"var(--color-bearish)"}33`,
            color: "var(--color-bearish)",
            fontSize: "10px",
            fontWeight: 500,
          }}
        >
          Failed to save settings. Please try again.
        </div>
      )}

      {/* Save button toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px 16px",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          flexShrink: 0,
        }}
      >
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
            background: updateMutation.isPending ? `${"var(--color-bullish)"}66` : "var(--color-bullish)",
            color: "var(--color-foreground)",
            transition: "background 0.2s, opacity 0.2s",
            opacity: updateMutation.isPending ? 0.7 : 1,
          }}
        >
          {updateMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Scrollable sections */}
      <ScrollArea style={{ padding: "8px 16px" }}>
        {/* Exchange Connections section — rendered outside the typed sections array */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              padding: "6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Exchange Connections
          </div>
          {EXCHANGES.map((ex: (typeof EXCHANGES)[number]) => (
            <ExchangeCard
              key={ex.id}
              exchange={ex}
              view={getExchView(ex.id)}
              testResult={testResults[ex.id] ?? null}
              isSaving={saveExchMutation.isPending}
              isTesting={testExchMutation.isPending}
              isDeleting={deleteExchMutation.isPending}
              form={exchForms[ex.id]}
              onFormChange={(f) => setExchForms((prev) => ({ ...prev, [ex.id]: f }))}
              onSave={() => {
                const f = exchForms[ex.id];
                saveExchMutation.mutate(
                  {
                    exchangeId: ex.id,
                    apiKey: f.apiKey,
                    apiSecret: f.apiSecret,
                    ...(f.passphrase ? { passphrase: f.passphrase } : {}),
                    ...(f.label ? { label: f.label } : {}),
                    isTestnet: f.isTestnet,
                  },
                  {
                    onSuccess: () => {
                      // Reset form
                      setExchForms((prev) => ({
                        ...prev,
                        [ex.id]: { apiKey: "", apiSecret: "", passphrase: "", label: "", isTestnet: true, showSecret: false },
                      }));
                    },
                  },
                );
              }}
              onTest={() => {
                setTestResults((prev) => ({ ...prev, [ex.id]: null }));
                testExchMutation.mutate(
                  { exchangeId: ex.id },
                  {
                    onSuccess: (result: unknown) => {
                      setTestResults((prev) => ({ ...prev, [ex.id]: result as TestConnectionResult }));
                    },
                    onError: (err) => {
                      setTestResults((prev) => ({
                        ...prev,
                        [ex.id]: { success: false, error: err instanceof Error ? err.message : String(err) },
                      }));
                    },
                  },
                );
              }}
              onDelete={() => {
                deleteExchMutation.mutate({ exchangeId: ex.id });
              }}
            />
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--color-muted-foreground)",
                padding: "6px 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {section.title}
            </div>
            <div
              style={{
                background: "var(--color-card-hover)",
                borderRadius: "8px",
                border: `1px solid ${"var(--color-border)"}`,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, i) => (
                <div
                  key={item.type === "input" ? item.id : item.type === "toggle-local" || item.type === "toggle-server" ? item.id : i}
                  style={{
                    borderBottom: i < section.items.length - 1 ? `1px solid ${"color-mix(in oklab, var(--color-foreground) 4%, transparent)"}` : "none",
                  }}
                >
                  <SettingRow item={item}>{renderItemControl(item)}</SettingRow>
                </div>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </PageLayout>
  );
}