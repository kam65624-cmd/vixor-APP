import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { soundManager } from "@/shared/sound-manager";
import { PageLayout, ScrollArea } from "@/components/vixor/PageLayout";
import { toast } from "sonner";
import {
  getExchangeCredentials,
  saveExchangeCredentials,
  testExchangeConnection,
  deleteExchangeCredentials,
  EXCHANGES,
  type ExchangeCredentialView,
  type TestConnectionResult,
} from "@/domains/trading/gateway/functions";

import {
  type NotificationChannels,
  type SettingItem,
  type ExchangeFormState,
  loadLocalSettings,
  saveLocalSettings,
} from "./constants";
import { ToggleSwitch } from "./ToggleSwitch";
import { SettingRow } from "./SettingRow";
import { ExchangeCard } from "./ExchangeCard";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

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
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

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

  const handleTestSound = useCallback(() => {
    soundManager.test("notification");
    setTestSoundPlaying(true);
    setTimeout(() => setTestSoundPlaying(false), 1000);
  }, []);

  // ── Security & Account handlers ──────────────────────────────────────────
  const handleChangePassword = useCallback(() => {
    toast.info("Password change is managed through your Telegram account settings.");
  }, []);

  const handleExportData = useCallback(() => {
    try {
      const settings = loadLocalSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vixor-settings-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Settings exported successfully.");
    } catch {
      toast.error("Failed to export settings.");
    }
  }, []);

  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const handleDeleteAccount = useCallback(() => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      toast.warning("Are you sure? Click Delete again to confirm.");
      setTimeout(() => setDeleteConfirmStep(0), 5000);
    } else {
      setDeleteConfirmStep(0);
      toast.error(
        "Account deletion is managed through Telegram. Please contact support or delete your Telegram account.",
        { duration: 6000 },
      );
    }
  }, [deleteConfirmStep]);

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
    mutationFn: (payload: any) => (saveExchCreds as any)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-credentials"] });
      showSavedToast();
    },
  });

  const testExchMutation = useMutation({
    mutationFn: (payload: any) => (testExchConn as any)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-credentials"] });
    },
  });

  const deleteExchMutation = useMutation({
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
      init[ex.id] = {
        apiKey: "",
        apiSecret: "",
        passphrase: "",
        label: "",
        isTestnet: true,
        showSecret: false,
        mtType: "mt5",
      };
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
        {
          type: "select",
          label: "Default Slippage",
          desc: "Maximum slippage tolerance for trades",
          options: ["0.5%", "1.0%", "2.0%", "3.0%"],
          current: slippageIdx,
          onChange: handleSlippageChange,
        },
        {
          type: "select",
          label: "Default Chain",
          desc: "Blockchain for trading",
          options: ["Solana", "Ethereum", "Base", "Arbitrum"],
          current: chainIdx,
          onChange: handleChainChange,
        },
        {
          type: "toggle-local",
          id: "tradeConfirmations",
          label: "Trade Confirmations",
          desc: "Show confirmation dialog before executing trades",
        },
        {
          type: "toggle-local",
          id: "autoRefresh",
          label: "Auto Refresh Data",
          desc: "Automatically refresh token prices and data",
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          type: "toggle-server",
          id: "priceAlerts",
          label: "Price Alerts",
          desc: "Get notified when tokens hit your price targets",
          key: "price_alerts",
        },
        {
          type: "toggle-server",
          id: "whaleAlerts",
          label: "Whale Alerts",
          desc: "Large transaction notifications",
          key: "whale_alerts",
        },
        {
          type: "toggle-server",
          id: "signalNotifications",
          label: "AI Signal Alerts",
          desc: "New AI trading signal notifications",
          key: "signal_notifications",
        },
        {
          type: "toggle-local",
          id: "soundEnabled",
          label: "Sound Effects",
          desc: "Play sounds for notifications and alerts",
        },
        {
          type: "button",
          label: "Test Sound",
          desc: testSoundPlaying ? "🔊 Playing..." : "Preview the notification sound",
          btnText: testSoundPlaying ? "🔊 Playing..." : "Play",
          btnColor: "var(--color-bullish)",
          onClick: handleTestSound,
        },
      ],
    },
    {
      title: "AI Provider",
      items: [
        {
          type: "select",
          label: "LLM Provider",
          desc: "Preferred large language model provider",
          options: llmOptions,
          current: llmOptions.indexOf(llmProvider) >= 0 ? llmOptions.indexOf(llmProvider) : 0,
          onChange: (i) => setLlmProvider(llmOptions[i]),
        },
      ],
    },
    {
      title: "Integrations",
      items: [
        {
          type: "input",
          id: "telegramChatId",
          label: "Telegram Chat ID",
          desc: "Your Telegram chat ID for bot notifications",
          value: telegramChatId,
          onChange: setTelegramChatId,
          placeholder: "e.g. 123456789",
        },
        {
          type: "input",
          id: "webhookUrl",
          label: "Webhook URL",
          desc: "Custom webhook endpoint for notifications",
          value: webhookUrl,
          onChange: setWebhookUrl,
          placeholder: "https://...",
        },
      ],
    },
    {
      title: "Display",
      items: [
        {
          type: "toggle-local",
          id: "darkMode",
          label: "Dark Mode",
          desc: "Use dark theme (recommended for trading)",
        },
        {
          type: "toggle-local",
          id: "compactMode",
          label: "Compact Mode",
          desc: "Reduce spacing for more data density",
        },
        {
          type: "toggle-local",
          id: "showChartOnHover",
          label: "Chart on Hover",
          desc: "Show mini chart when hovering over tokens",
        },
      ],
    },
    {
      title: "Security & Account",
      items: [
        {
          type: "toggle-local",
          id: "twoFactor",
          label: "Two-Factor Auth",
          desc: "Add an extra layer of security to your account",
        },
        {
          type: "button",
          label: "Change Password",
          desc: "Update your account password",
          btnText: "Change",
          btnColor: "var(--color-bullish)",
          onClick: handleChangePassword,
        },
        {
          type: "button",
          label: "Export Data",
          desc: "Download your trading history and portfolio data",
          btnText: "Export",
          btnColor: "var(--color-primary)",
          onClick: handleExportData,
        },
        {
          type: "button",
          label: "Delete Account",
          desc: "Permanently delete your account and all data",
          btnText: deleteConfirmStep === 1 ? "Confirm Delete" : "Delete",
          btnColor: "var(--color-bearish)",
          onClick: handleDeleteAccount,
        },
      ],
    },
  ];

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    padding: "4px 8px",
    borderRadius: "4px",
    border: `1px solid ${"var(--color-border)"}`,
    background: "rgba(99,102,241,0.04)",
    color: "var(--color-foreground)",
    width: "160px",
    outline: "none",
    font: "inherit",
  };

  // ── Render item right-hand control ─────────────────────────────────────────
  const renderItemControl = (item: SettingItem) => {
    switch (item.type) {
      case "toggle-server":
        return (
          <ToggleSwitch
            enabled={!!notificationChannels[item.key]}
            onClick={() => toggleNotification(item.key)}
          />
        );
      case "toggle-local":
        return (
          <ToggleSwitch enabled={!!localToggles[item.id]} onClick={() => toggleLocal(item.id)} />
        );
      case "select":
        return (
          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            {item.options.map((opt, oi) => (
              <button
                key={opt}
                onClick={() => item.onChange(oi)}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  color:
                    oi === item.current
                      ? "var(--color-foreground)"
                      : "var(--color-muted-foreground)",
                  background:
                    oi === item.current ? `${"var(--color-bullish)"}26` : "rgba(99,102,241,0.04)",
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
            onClick={item.onClick}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: "4px",
              border: "none",
              background: `${item.btnColor}20`,
              color: item.btnColor,
              cursor: item.onClick ? "pointer" : "default",
            }}
          >
            {item.btnText}
          </button>
        );
    }
  };

  return (
    <PageLayout
      title="⚙ Settings"
      loading={settingsQuery.isLoading}
      loadingColor={"var(--color-bullish)"}
    >
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
            fontSize: "12px",
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
            fontSize: "12px",
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
            fontSize: "12px",
            fontWeight: 700,
            padding: "5px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: updateMutation.isPending ? "wait" : "pointer",
            background: updateMutation.isPending
              ? `${"var(--color-bullish)"}66`
              : "var(--color-bullish)",
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
              fontSize: "12px",
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
                    ...(ex.id === "exness"
                      ? { passphrase: f.mtType }
                      : f.passphrase
                        ? { passphrase: f.passphrase }
                        : {}),
                    ...(f.label ? { label: f.label } : {}),
                    isTestnet: f.isTestnet,
                  },
                  {
                    onSuccess: () => {
                      // Reset form
                      setExchForms((prev) => ({
                        ...prev,
                        [ex.id]: {
                          apiKey: "",
                          apiSecret: "",
                          passphrase: "",
                          label: "",
                          isTestnet: true,
                          showSecret: false,
                          mtType: "mt5",
                        },
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
                      setTestResults((prev) => ({
                        ...prev,
                        [ex.id]: result as TestConnectionResult,
                      }));
                    },
                    onError: (err) => {
                      setTestResults((prev) => ({
                        ...prev,
                        [ex.id]: {
                          success: false,
                          error: err instanceof Error ? err.message : String(err),
                        },
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
                fontSize: "12px",
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
                  key={
                    item.type === "input"
                      ? item.id
                      : item.type === "toggle-local" || item.type === "toggle-server"
                        ? item.id
                        : i
                  }
                  style={{
                    borderBottom:
                      i < section.items.length - 1
                        ? `1px solid ${"rgba(99,102,241,0.04)"}`
                        : "none",
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

export { SettingsPage };
