import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMe, listAnalyses } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, Camera, Activity, Zap, AlertTriangle, Clock, 
  ArrowUpRight, ArrowDownRight, Newspaper, ChevronRight, TrendingUp, BarChart2 
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Command Center — Vixor" }] }),
  component: CommandCenter,
});

function CommandCenter() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchRecent = useServerFn(listAnalyses);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const recent = useQuery({ queryKey: ["analyses", 5], queryFn: () => fetchRecent({ data: { limit: 5 } }) });

  const name = me.data?.profile?.display_name?.split(" ")[0] || "Trader";
  const xp = (me.data?.profile as any)?.xp ?? 1250;
  const isPremium = !!me.data?.isPremium;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      
      {/* 1. TOP SECTION */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Good Evening, Trader</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {name} <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPremium && (
            <div className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest glow-primary">
              PRO
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-[10px] font-bold text-foreground">
            <Zap className="size-3 text-info" /> {xp} pts
          </div>
        </div>
      </div>

      {/* 2. QUICK ANALYZE CTA */}
      <div 
        onClick={() => navigate({ to: "/analyze" })}
        className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group active:scale-[0.98] transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#059669]/90 to-[#064e3b]/90" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <Sparkles className="size-5 text-emerald-200 mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Analyze Your Chart</h2>
            <p className="text-xs text-emerald-100 font-medium opacity-90">SMC and ICT-powered signal in seconds</p>
          </div>
          <div className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="size-5 text-white" />
          </div>
        </div>
      </div>

      {/* 3. MARKET PULSE */}
      <div className="vixor-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Market Pulse</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Live</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <PulseItem pair="XAU/USD" price="2,348.50" change="+0.42%" up />
          <PulseItem pair="EUR/USD" price="1.0842" change="0.02%" neutral />
          <PulseItem pair="BTC/USD" price="64,210" change="+1.85%" up />
          <PulseItem pair="GBP/JPY" price="192.45" change="-0.31%" down />
        </div>
      </div>

      {/* 4. AI DAILY FOCUS */}
      <div className="vixor-card p-4 border-l-4 border-l-primary relative overflow-hidden">
        <div className="absolute right-0 top-0 size-32 bg-primary/5 blur-2xl rounded-full" />
        <div className="flex items-center gap-2 mb-2 relative">
          <Zap className="size-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Daily Focus</span>
        </div>
        <p className="text-sm font-medium text-foreground leading-relaxed relative">
          CPI volatility expected in NY Session. Liquidity clusters detected at $64,200. Consider tightening stops on active USD pairs.
        </p>
      </div>

      {/* 5. HIGH IMPACT EVENTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-bearish" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">High Impact Events</h3>
          </div>
        </div>
        <div className="vixor-card divide-y divide-border">
          <EventRow time="14:00" currency="USD" name="FOMC Meeting" />
          <EventRow time="08:30" currency="USD" name="NFP Report" />
          <EventRow time="10:45" currency="EUR" name="ECB Press Conf" />
        </div>
      </div>

      {/* 6. ACTIVE TRADES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Active Trades</h3>
          </div>
          <Link to="/trade-desk" className="text-[10px] font-bold text-primary flex items-center hover:underline">
            View All <ChevronRight className="size-3" />
          </Link>
        </div>
        
        <div className="space-y-2">
          {/* Mock Trade 1 */}
          <div className="vixor-card p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-bullish/10 text-bullish uppercase">LONG</span>
                <span className="font-bold font-mono text-sm">XAU/USD</span>
              </div>
              <span className="font-bold font-mono text-sm text-bullish">+$1,240.45</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Entry: 2348.50</span>
              <span>Curr: 2354.20</span>
            </div>
            <div className="h-1 bg-card-hover rounded-full overflow-hidden">
              <div className="h-full bg-bullish rounded-full w-[72%]" />
            </div>
          </div>

          {/* Mock Trade 2 */}
          <div className="vixor-card p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-bearish/10 text-bearish uppercase">SHORT</span>
                <span className="font-bold font-mono text-sm">EUR/USD</span>
              </div>
              <span className="font-bold font-mono text-sm text-bearish">-$210.12</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Entry: 1.0842</span>
              <span>Curr: 1.0865</span>
            </div>
            <div className="h-1 bg-card-hover rounded-full overflow-hidden">
              <div className="h-full bg-bearish rounded-full w-[18%]" />
            </div>
          </div>
        </div>
      </div>

      {/* 7. MARKET NEWS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Newspaper className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Market News</h3>
          </div>
        </div>
        <div className="space-y-2">
          <NewsCard source="Reuters" time="2h ago" headline="Gold prices hit record high as investors digest Fed minutes" />
          <NewsCard source="Bloomberg" time="4h ago" headline="Euro struggles to maintain momentum ahead of critical ECB decision" />
          <NewsCard source="CoinDesk" time="5h ago" headline="Bitcoin liquidations surpass $200M after sudden price swing" />
        </div>
      </div>

    </div>
  );
}

// Subcomponents

function PulseItem({ pair, price, change, up, down, neutral }: any) {
  const color = up ? "text-bullish" : down ? "text-bearish" : "text-muted-foreground";
  const bg = up ? "bg-bullish/10" : down ? "bg-bearish/10" : "bg-card-hover";
  
  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="text-xs font-bold text-foreground mb-1">{pair}</div>
      <div className="font-mono text-sm font-semibold mb-1.5">{price}</div>
      <div className={`flex items-center gap-1 text-[10px] font-bold ${color}`}>
        {up && <ArrowUpRight className="size-3" />}
        {down && <ArrowDownRight className="size-3" />}
        {!up && !down && <div className="size-1.5 rounded-full bg-muted-foreground mx-1" />}
        {change}
      </div>
    </div>
  );
}

function EventRow({ time, currency, name }: { time: string, currency: string, name: string }) {
  return (
    <div className="p-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-bearish/10 flex items-center justify-center">
          <Clock className="size-4 text-bearish" />
        </div>
        <div>
          <div className="font-bold text-sm">{name}</div>
          <div className="text-[10px] font-mono text-muted-foreground">{time} | {currency}</div>
        </div>
      </div>
      <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-bearish/10 text-bearish border border-bearish/20">
        HIGH
      </div>
    </div>
  );
}

function NewsCard({ source, headline, time }: { source: string, headline: string, time: string }) {
  return (
    <div className="vixor-card p-3.5 flex items-start gap-3 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">{source}</span>
          <span className="text-[10px] font-bold text-muted-foreground">{time}</span>
        </div>
        <h4 className="text-sm font-bold leading-snug line-clamp-2">{headline}</h4>
      </div>
      <div className="size-14 rounded-lg bg-card-hover border border-border shrink-0 flex items-center justify-center">
        <Newspaper className="size-5 text-muted-foreground/30" />
      </div>
    </div>
  );
}
