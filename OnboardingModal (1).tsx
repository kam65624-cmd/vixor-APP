import { useState } from "react";
import { Sparkles, Upload, Calculator, Gift, ChevronRight } from "lucide-react";

const slides = [
  { icon: Sparkles, title: "Welcome to Vixor", body: "AI-powered chart analysis built for Telegram traders. Smarter setups in seconds." },
  { icon: Upload, title: "Drop a chart, get a plan", body: "Upload any chart image. Get entry, stop loss, take profits, and confidence in under 10 seconds." },
  { icon: Calculator, title: "Trade with discipline", body: "Built-in lot calculator and risk management keep your account safe — every trade." },
  { icon: Gift, title: "Earn as you trade", body: "Daily bonuses, streaks, and referrals turn into points you can spend on analyses." },
];

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const Icon = s.icon;
  const last = i === slides.length - 1;
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="vixor-card w-full max-w-md p-6 space-y-6 animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-1.5 bg-muted"}`} />
            ))}
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Skip</button>
        </div>

        <div className="flex flex-col items-center text-center gap-4 py-6">
          <div className="size-20 rounded-3xl gradient-primary glow-primary flex items-center justify-center">
            <Icon className="size-9 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
          <p className="text-muted-foreground text-sm max-w-xs">{s.body}</p>
        </div>

        <button
          onClick={() => last ? onClose() : setI(i + 1)}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary"
        >
          {last ? "Claim +10 points" : "Continue"}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
