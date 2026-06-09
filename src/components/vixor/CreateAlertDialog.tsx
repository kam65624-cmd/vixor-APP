"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAlert } from "@/lib/vixor.functions";
import { toTradingViewSymbol } from "./TradingViewChart";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pair: string;
  currentPrice: number;
  onSuccess?: () => void;
}

const CONDITIONS = [
  { value: "above", label: "Price goes above" },
  { value: "below", label: "Price goes below" },
  { value: "crosses_up", label: "Price crosses up" },
  { value: "crosses_down", label: "Price crosses down" },
];

export function CreateAlertDialog({
  open,
  onOpenChange,
  pair,
  currentPrice,
  onSuccess,
}: CreateAlertDialogProps) {
  const [condition, setCondition] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [note, setNote] = useState("");
  const [timeframe, setTimeframe] = useState("1H");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAlertFn = useStableServerFn(createAlert);

  const handleCreate = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAlertFn({
        data: {
          symbol: toTradingViewSymbol(pair),
          pair,
          condition: condition as "above" | "below" | "crosses_up" | "crosses_down",
          targetPrice: price,
          currentPrice,
          note: note || undefined,
          timeframe,
        },
      });
      onOpenChange(false);
      setTargetPrice("");
      setNote("");
      setCondition("above");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setLoading(false);
    }
  }; 

  // Quick price suggestions based on condition
  const suggestedPrices = condition === "above"
    ? [currentPrice * 1.01, currentPrice * 1.02, currentPrice * 1.05]
    : condition === "below"
    ? [currentPrice * 0.99, currentPrice * 0.98, currentPrice * 0.95]
    : [currentPrice * 1.01, currentPrice * 0.99, currentPrice * 1.02];

  const formatSuggestedPrice = (p: number) => {
    if (pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT")) {
      return p.toFixed(2);
    }
    return p.toFixed(4);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bell className="size-5 text-primary" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Get notified when {pair} reaches your target price
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current price display */}
          <div className="vixor-card p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Price</div>
              <div className="text-xl font-bold font-mono text-foreground">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pair.includes("JPY") ? 2 : 4 })}
              </div>
            </div>
            <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">{pair}</div>
          </div>

          {/* Condition select */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Condition</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-background border-border rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target price input */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Target Price</label>
            <input
              type="number"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              placeholder="0.00"
              step={pair.includes("JPY") ? "0.01" : pair === "XAU/USD" ? "0.01" : "0.0001"}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-1.5 mt-2">
              {suggestedPrices.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setTargetPrice(formatSuggestedPrice(p))}
                  className="flex-1 h-8 rounded-lg bg-muted text-xs font-mono font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  ${formatSuggestedPrice(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Timeframe</label>
            <div className="flex gap-1.5">
              {["15M", "1H", "4H", "1D"].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                    timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Breakout play"
              maxLength={200}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <div className="p-3 bg-bearish/10 border border-bearish/30 text-bearish text-xs font-bold rounded-xl">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleCreate}
            disabled={loading || !targetPrice}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Bell className="size-5" />}
            Create Alert
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
