import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Moon, Sun, Globe, Volume2, Smartphone,
  FileText, LogOut, ChevronRight, Shield, Bell, Palette,
  TrendingUp, Zap, Info, Key, HelpCircle, Star
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [sound, setSound] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleSignOut = async () => {
    setSigning(true);
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <Link to="/profile" className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-bold text-lg tracking-tight">Settings</h1>
        <div className="size-10" />
      </div>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <Row icon={dark ? Moon : Sun} label="Dark Mode" iconColor="text-info">
          <Toggle on={dark} onChange={v => {
            setDark(v);
            document.documentElement.classList.toggle("light", !v);
          }} />
        </Row>
        <Row icon={Globe} label="Language" value="English" iconColor="text-primary" />
      </Section>

      {/* Trading Profile */}
      <Section title="Trading Profile" icon={TrendingUp}>
        <Row icon={TrendingUp} label="Risk Tolerance" value="Moderate" iconColor="text-neutral-wait" />
        <Row icon={Star} label="Preferred Pairs" value="BTC, ETH, EUR/USD" iconColor="text-primary" />
        <Row icon={Zap} label="Trading Style" value="Swing" iconColor="text-bullish" />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Row icon={Volume2} label="Sound Effects" iconColor="text-primary">
          <Toggle on={sound} onChange={setSound} />
        </Row>
        <Row icon={Smartphone} label="Haptic Feedback" iconColor="text-info">
          <Toggle on={haptics} onChange={setHaptics} />
        </Row>
        <Row icon={Bell} label="Price Alerts" iconColor="text-neutral-wait">
          <Toggle on={priceAlerts} onChange={setPriceAlerts} />
        </Row>
        <Row icon={Globe} label="News Alerts" iconColor="text-bullish">
          <Toggle on={newsAlerts} onChange={setNewsAlerts} />
        </Row>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <Row icon={Shield} label="Two-Factor Auth" value="Off" iconColor="text-bearish" />
        <Row icon={Key} label="Active Sessions" value="1 device" iconColor="text-neutral-wait" />
      </Section>

      {/* About */}
      <Section title="About" icon={Info}>
        <Row icon={FileText} label="Terms of Service" iconColor="text-muted-foreground" />
        <Row icon={Shield} label="Privacy Policy" iconColor="text-muted-foreground" />
        <Row icon={HelpCircle} label="Help & Support" iconColor="text-info" />
        <Row icon={Info} label="Version" value="2.0.0 · build 42" iconColor="text-muted-foreground" noArrow />
      </Section>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signing}
        className="w-full h-13 rounded-2xl bg-bearish/10 border border-bearish/20 text-bearish font-bold flex items-center justify-center gap-2 hover:bg-bearish hover:text-white transition-all duration-200 disabled:opacity-50"
      >
        <LogOut className="size-4" />
        {signing ? "Signing out…" : "Sign Out"}
      </button>
    </div>
  );
}

function Section({
  title, icon: Icon, children
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">{title}</div>
      </div>
      <div className="vixor-card divide-y divide-border overflow-hidden">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon, label, value, children, iconColor = "text-muted-foreground", noArrow
}: {
  icon?: React.ElementType;
  label: string;
  value?: string;
  children?: React.ReactNode;
  iconColor?: string;
  noArrow?: boolean;
}) {
  return (
    <div className="p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer group">
      {Icon && (
        <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      )}
      <div className="text-sm font-medium flex-1">{label}</div>
      {value && <span className="text-xs text-muted-foreground font-medium">{value}</span>}
      {children}
      {!children && value === undefined && !noArrow && (
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
      <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
