import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Moon,
  Sun,
  Globe,
  Volume2,
  Smartphone,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Palette,
  TrendingUp,
  Zap,
  Info,
  Key,
  HelpCircle,
  Star,
  Check,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getSupabaseOrNull } from "@/shared/supabase/client";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

// ── Axiom Design System ──
const S = {
  bg: "#0A0E1A",
  card: "#111827",
  cardBorder: "1px solid rgba(255,255,255,0.06)",
  divider: "1px solid rgba(255,255,255,0.06)",
  text1: "#F0F4FC",
  text2: "#7B8BA8",
  text3: "#4A5568",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  bullish: "#22C55E",
  bearish: "#EF4444",
  warning: "#F59E0B",
  font: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  radius: 8,
  badgeRadius: 6,
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Phase 0 fix (audit §15 issue #7): settings toggles are now persisted to
// localStorage and READ by the relevant components at runtime. Previously
// they were local-only React state — flipping "Price alerts" off had no effect.
// ───────────────────────────────────────────────────────────────────────────

/** Theme is persisted to localStorage so it survives reloads */
const THEME_KEY = "vixor-theme";
/** Settings toggles — read by alert checker, news fetcher, haptics util, etc. */
const PREFS_KEY = "vixor-prefs";

interface VixorPrefs {
  /** Whether haptic feedback is enabled (mobile only) */
  haptics: boolean;
  /** Whether UI sound effects are enabled */
  sound: boolean;
  /** Whether price alert notifications should fire (read by /api/check-alerts) */
  priceAlerts: boolean;
  /** Whether market news notifications should fire (read by /api/generate-signals) */
  newsAlerts: boolean;
}

const DEFAULT_PREFS: VixorPrefs = {
  haptics: true,
  sound: true,
  priceAlerts: true,
  newsAlerts: false,
};

function getStoredTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

function applyTheme(theme: "dark" | "light") {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("light", !isDark);
  document.documentElement.classList.toggle("dark", isDark);
}

function getStoredPrefs(): VixorPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<VixorPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function persistPrefs(prefs: VixorPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    // Dispatch a custom event so other components (alert checker, news
    // fetcher) can react to preference changes without a page reload.
    window.dispatchEvent(new CustomEvent("vixor-prefs-changed", { detail: prefs }));
  } catch (e) {
    console.warn("[Settings] Failed to persist prefs:", e);
  }
}

function SettingsPage() {
  const navigate = useNavigate();
  const { t, lang, setLang, isRTL } = useI18n();
  // Initialize from localStorage so the toggle reflects the user's saved choice
  const [dark, setDark] = useState(true);
  const [prefs, setPrefs] = useState<VixorPrefs>(DEFAULT_PREFS);
  const [signing, setSigning] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  // On mount, load saved theme + prefs from localStorage
  useEffect(() => {
    const stored = getStoredTheme();
    setDark(stored === "dark");
    applyTheme(stored);
    setPrefs(getStoredPrefs());
  }, []);

  // Helper: update a single pref and persist
  const updatePref = useCallback((key: keyof VixorPrefs, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      persistPrefs(next);
      return next;
    });
  }, []);

  const handleSignOut = async () => {
    setSigning(true);
    const client = getSupabaseOrNull();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn("[Settings] signOut failed:", e);
      }
    }
    navigate({ to: "/auth" });
  };

  const languages = [
    { code: "en" as const, label: "English", nativeLabel: "English" },
    { code: "ar" as const, label: "Arabic", nativeLabel: "العربية" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 32, fontFamily: S.font }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
        <Link
          to="/profile"
          style={{
            width: 40, height: 40, borderRadius: S.radius, background: S.card, border: S.cardBorder,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            color: S.text2, textDecoration: "none",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <h1 style={{ fontWeight: 700, fontSize: 18, color: S.text1, margin: 0, letterSpacing: "-0.02em" }}>{t("settings.title")}</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Language Picker Modal */}
      {showLangPicker && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowLangPicker(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 448, background: S.card, border: S.cardBorder,
              borderRadius: "24px 24px 0 0", padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: S.text1, margin: 0 }}>{t("settings.selectLanguage")}</h2>
              <button
                onClick={() => setShowLangPicker(false)}
                style={{
                  width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  border: "none", color: S.text2, fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {languages.map((l) => {
                const isActive = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangPicker(false);
                    }}
                    style={{
                      width: "100%", padding: 16, borderRadius: S.radius, display: "flex", alignItems: "center",
                      justifyContent: "space-between", cursor: "pointer",
                      background: isActive ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
                      border: isActive ? "2px solid rgba(59,130,246,0.5)" : "2px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Globe
                        style={{ width: 20, height: 20, color: isActive ? S.accentLight : S.text2 }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: isActive ? S.accentLight : S.text1 }}>
                          {l.nativeLabel}
                        </div>
                        <div style={{ fontSize: 11, color: S.text2 }}>{l.label}</div>
                      </div>
                    </div>
                    {isActive && (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: S.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check style={{ width: 14, height: 14, color: "#fff", strokeWidth: 3 }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {lang === "ar" && (
              <div style={{
                marginTop: 16, padding: 12, borderRadius: S.radius,
                background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)",
                fontSize: 12, color: S.text2, textAlign: "center",
              }}>
                {isRTL
                  ? "سيتم عكس اتجاه التطبيق بالكامل"
                  : "The app direction will fully reverse to RTL"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appearance */}
      <Section title={t("settings.appearance")} icon={Palette}>
        <Row icon={dark ? Moon : Sun} label={t("settings.darkMode")} iconColor={S.accent}>
          <Toggle
            on={dark}
            onChange={(v) => {
              setDark(v);
              const theme = v ? "dark" : "light";
              applyTheme(theme);
              localStorage.setItem(THEME_KEY, theme);
            }}
          />
        </Row>
        <Row
          icon={Globe}
          label={t("settings.language")}
          value={lang === "ar" ? t("settings.arabic") : t("settings.english")}
          iconColor={S.accent}
          onClick={() => setShowLangPicker(true)}
        />
      </Section>

      {/* Trading Profile */}
      <Section title={t("settings.tradingProfile")} icon={TrendingUp}>
        <Row
          icon={TrendingUp}
          label={t("settings.riskTolerance")}
          value={t("settings.moderate")}
          iconColor={S.warning}
        />
        <Row
          icon={Star}
          label={t("settings.preferredPairs")}
          value="BTC, ETH, EUR/USD"
          iconColor={S.accent}
        />
        <Row
          icon={Zap}
          label={t("settings.tradingStyle")}
          value={t("settings.swing")}
          iconColor={S.bullish}
        />
      </Section>

      {/* Notifications */}
      <Section title={t("settings.notifications")} icon={Bell}>
        <Row icon={Volume2} label={t("settings.soundEffects")} iconColor={S.accent}>
          <Toggle on={prefs.sound} onChange={(v) => updatePref("sound", v)} />
        </Row>
        <Row icon={Smartphone} label={t("settings.hapticFeedback")} iconColor={S.accent}>
          <Toggle on={prefs.haptics} onChange={(v) => updatePref("haptics", v)} />
        </Row>
        <Row icon={Bell} label={t("settings.priceAlerts")} iconColor={S.warning}>
          <Toggle on={prefs.priceAlerts} onChange={(v) => updatePref("priceAlerts", v)} />
        </Row>
        <Row icon={Globe} label={t("settings.newsAlerts")} iconColor={S.bullish}>
          <Toggle on={prefs.newsAlerts} onChange={(v) => updatePref("newsAlerts", v)} />
        </Row>
      </Section>

      {/* Security */}
      <Section title={t("settings.security")} icon={Shield}>
        <Row
          icon={Shield}
          label={t("settings.twoFactorAuth")}
          value={t("settings.off")}
          iconColor={S.bearish}
        />
        <Row
          icon={Key}
          label={t("settings.activeSessions")}
          value={t("settings.oneDevice")}
          iconColor={S.warning}
        />
      </Section>

      {/* About */}
      <Section title={t("settings.about")} icon={Info}>
        <Row
          icon={FileText}
          label={t("settings.termsOfService")}
          iconColor={S.text2}
        />
        <Row icon={Shield} label={t("settings.privacyPolicy")} iconColor={S.text2} />
        <Row icon={HelpCircle} label={t("settings.helpSupport")} iconColor={S.accent} />
        <Row
          icon={Info}
          label={t("settings.version")}
          value="2.0.0 · build 42"
          iconColor={S.text2}
          noArrow
        />
      </Section>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signing}
        style={{
          width: "100%", height: 52, borderRadius: S.radius,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: S.bearish, fontWeight: 700, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, cursor: "pointer",
          opacity: signing ? 0.5 : 1, fontFamily: S.font, fontSize: 14,
        }}
      >
        <LogOut style={{ width: 16, height: 16 }} />
        {signing ? t("settings.signingOut") : t("settings.signOut")}
      </button>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 }}>
        {Icon && <Icon style={{ width: 12, height: 12, color: S.text3 }} />}
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: S.text3 }}>
          {title}
        </div>
      </div>
      <div style={{ ...{ background: S.card, border: S.cardBorder, borderRadius: S.radius, overflow: "hidden" } }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  children,
  iconColor = S.text2,
  noArrow,
  onClick,
}: {
  icon?: React.ElementType;
  label: string;
  value?: string;
  children?: React.ReactNode;
  iconColor?: string;
  noArrow?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        padding: "14px 14px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: S.divider, cursor: onClick ? "pointer" : "default",
        background: hover ? "rgba(255,255,255,0.02)" : "transparent",
        transition: "background 150ms",
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {Icon && (
        <div style={{
          width: 36, height: 36, borderRadius: S.radius,
          background: "rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon style={{ width: 16, height: 16, color: iconColor }} />
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 500, flex: 1, color: S.text1 }}>{label}</div>
      {value && <span style={{ fontSize: 12, color: S.text2, fontWeight: 500 }}>{value}</span>}
      {children}
      {!children && value === undefined && !noArrow && (
        <ChevronRight style={{ width: 16, height: 16, color: hover ? S.text1 : S.text3, transition: "color 150ms" }} />
      )}
      {!children && !value && !noArrow && onClick && (
        <ChevronRight style={{ width: 16, height: 16, color: hover ? S.text1 : S.text3, transition: "color 150ms" }} />
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, transition: "background 300ms", flexShrink: 0,
        position: "relative", border: "none", cursor: "pointer",
        background: on ? S.accent : S.text3,
      }}
    >
      <div
        style={{
          position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 300ms",
          left: on ? 22 : 2,
        }}
      />
    </button>
  );
}