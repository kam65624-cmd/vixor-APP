import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun, Globe, Volume2, Smartphone, FileText, LogOut, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(true);
  const [haptics, setHaptics] = useState(true);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/profile" className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><ArrowLeft className="size-4"/></Link>
        <h1 className="font-semibold">Settings</h1>
        <div className="size-9"/>
      </div>

      <Section title="Appearance">
        <Row icon={dark ? Moon : Sun} label="Dark mode">
          <Toggle on={dark} onChange={setDark}/>
        </Row>
        <Row icon={Globe} label="Language" value="English"/>
      </Section>

      <Section title="Trading profile">
        <Row label="Risk tolerance" value="Moderate"/>
        <Row label="Preferred pairs" value="BTC, ETH, EUR/USD"/>
        <Row label="Trading style" value="Swing"/>
      </Section>

      <Section title="Notifications">
        <Row icon={Volume2} label="Sound"><Toggle on={true}/></Row>
        <Row icon={Smartphone} label="Haptics"><Toggle on={haptics} onChange={setHaptics}/></Row>
        <Row label="Price alerts" value="On"/>
        <Row label="Daily bonus reminder" value="9:00 AM"/>
      </Section>

      <Section title="About">
        <Row icon={FileText} label="Terms of service"/>
        <Row icon={FileText} label="Privacy policy"/>
        <Row icon={FileText} label="Risk disclaimer"/>
        <Row label="Version" value="1.0.0 · build 26"/>
      </Section>

      <button className="w-full h-12 rounded-xl bg-bearish/15 text-bearish font-semibold flex items-center justify-center gap-2">
        <LogOut className="size-4"/> Sign out
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 px-1">{title}</div>
      <div className="vixor-card divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value, children }: { icon?: any; label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="p-3.5 flex items-center gap-3">
      {Icon && <div className="size-9 rounded-lg bg-muted flex items-center justify-center"><Icon className="size-4 text-muted-foreground"/></div>}
      <div className="text-sm flex-1">{label}</div>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      {children}
      {!children && value === undefined && <ChevronRight className="size-4 text-muted-foreground"/>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange?.(!on)} className={`w-10 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"} relative`}>
      <div className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`}/>
    </button>
  );
}
