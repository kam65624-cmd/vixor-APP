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
import { useState } from "react";
import { supabase } from "@/shared/supabase/client";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { t, lang, setLang, isRTL } = useI18n();
  const [dark, setDark] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [sound, setSound] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleSignOut = async () => {
    setSigning(true);
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const languages = [
    { code: "en" as const, label: "English", nativeLabel: "English" },
    { code: "ar" as const, label: "Arabic", nativeLabel: "العربية" },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/profile"
          className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-bold text-lg tracking-tight">{t("settings.settings")}</h1>
        <div className="size-10" />
      </div>

      {/* Language Picker Modal */}
      {showLangPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLangPicker(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-t-3xl p-6 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{t("settings.selectLanguage")}</h2>
              <button
                onClick={() => setShowLangPicker(false)}
                className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-card-hover transition-colors"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
            <div className="space-y-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangPicker(false);
                  }}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                    lang === l.code
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-card-hover border-2 border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe
                      className={`size-5 ${lang === l.code ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="text-left">
                      <div
                        className={`font-bold text-sm ${lang === l.code ? "text-primary" : "text-foreground"}`}
                      >
                        {l.nativeLabel}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{l.label}</div>
                    </div>
                  </div>
                  {lang === l.code && (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {lang === "ar" && (
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground text-center">
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
        <Row icon={dark ? Moon : Sun} label={t("settings.darkMode")} iconColor="text-info">
          <Toggle
            on={dark}
            onChange={(v) => {
              setDark(v);
              document.documentElement.classList.toggle("light", !v);
            }}
          />
        </Row>
        <Row
          icon={Globe}
          label={t("settings.language")}
          value={lang === "ar" ? t("settings.arabic") : t("settings.english")}
          iconColor="text-primary"
          onClick={() => setShowLangPicker(true)}
        />
      </Section>

      {/* Trading Profile */}
      <Section title={t("settings.tradingProfile")} icon={TrendingUp}>
        <Row
          icon={TrendingUp}
          label={t("settings.riskTolerance")}
          value={t("settings.moderate")}
          iconColor="text-neutral-wait"
        />
        <Row
          icon={Star}
          label={t("settings.preferredPairs")}
          value="BTC, ETH, EUR/USD"
          iconColor="text-primary"
        />
        <Row
          icon={Zap}
          label={t("settings.tradingStyle")}
          value={t("settings.swing")}
          iconColor="text-bullish"
        />
      </Section>

      {/* Notifications */}
      <Section title={t("settings.notifications")} icon={Bell}>
        <Row icon={Volume2} label={t("settings.soundEffects")} iconColor="text-primary">
          <Toggle on={sound} onChange={setSound} />
        </Row>
        <Row icon={Smartphone} label={t("settings.hapticFeedback")} iconColor="text-info">
          <Toggle on={haptics} onChange={setHaptics} />
        </Row>
        <Row icon={Bell} label={t("settings.priceAlerts")} iconColor="text-neutral-wait">
          <Toggle on={priceAlerts} onChange={setPriceAlerts} />
        </Row>
        <Row icon={Globe} label={t("settings.newsAlerts")} iconColor="text-bullish">
          <Toggle on={newsAlerts} onChange={setNewsAlerts} />
        </Row>
      </Section>

      {/* Security */}
      <Section title={t("settings.security")} icon={Shield}>
        <Row
          icon={Shield}
          label={t("settings.twoFactorAuth")}
          value={t("settings.off")}
          iconColor="text-bearish"
        />
        <Row
          icon={Key}
          label={t("settings.activeSessions")}
          value={t("settings.oneDevice")}
          iconColor="text-neutral-wait"
        />
      </Section>

      {/* About */}
      <Section title={t("settings.about")} icon={Info}>
        <Row
          icon={FileText}
          label={t("settings.termsOfService")}
          iconColor="text-muted-foreground"
        />
        <Row icon={Shield} label={t("settings.privacyPolicy")} iconColor="text-muted-foreground" />
        <Row icon={HelpCircle} label={t("settings.helpSupport")} iconColor="text-info" />
        <Row
          icon={Info}
          label={t("settings.version")}
          value="2.0.0 · build 42"
          iconColor="text-muted-foreground"
          noArrow
        />
      </Section>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signing}
        className="w-full h-13 rounded-2xl bg-bearish/10 border border-bearish/20 text-bearish font-bold flex items-center justify-center gap-2 hover:bg-bearish hover:text-white transition-all duration-200 disabled:opacity-50"
      >
        <LogOut className="size-4" />
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
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="vixor-card divide-y divide-border overflow-hidden">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  children,
  iconColor = "text-muted-foreground",
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
  return (
    <div
      className={`p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors ${onClick ? "cursor-pointer" : "group"}`}
      onClick={onClick}
    >
      {Icon && (
        <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      )}
      <div className="text-sm font-medium flex-1">{label}</div>
      {value && <span className="text-xs text-muted-foreground font-medium">{value}</span>}
      {children}
      {!children && value === undefined && !noArrow && (
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors rtl:rotate-180" />
      )}
      {!children && !value && !noArrow && onClick && (
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors rtl:rotate-180" />
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      className={`w-11 h-6 rounded-full transition-all duration-300 shrink-0 relative ${on ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? (document.documentElement.dir === "rtl" ? "right-[22px]" : "left-[22px]") : document.documentElement.dir === "rtl" ? "right-0.5" : "left-0.5"}`}
      />
    </button>
  );
}
