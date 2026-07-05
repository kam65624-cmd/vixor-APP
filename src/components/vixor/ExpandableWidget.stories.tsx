import type { Meta, StoryObj } from "@storybook/react";
import { ExpandableWidget, MiniWidget, WidgetGroup } from "./ExpandableWidget";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";

const meta: Meta<typeof ExpandableWidget> = {
  title: "Vixor/ExpandableWidget",
  component: ExpandableWidget,
  tags: ["autodocs"],
};
export default meta;

type EWStory = StoryObj<typeof ExpandableWidget>;

export const Bullish: EWStory = {
  args: {
    title: "Order Block — BTC/USDT",
    subtitle: "4H timeframe • Bearish OB",
    variant: "bullish",
    icon: TrendingUp,
    badge: "BUY",
    metric: "1:3.2",
    metricLabel: "R:R",
    children: (
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          Entry: <span className="text-bullish font-mono">$62,450</span>
        </p>
        <p>
          Stop: <span className="text-bearish font-mono">$61,200</span>
        </p>
        <p>
          TP: <span className="text-bullish font-mono">$66,240</span>
        </p>
      </div>
    ),
  },
};

export const Bearish: EWStory = {
  args: {
    title: "Liquidity Sweep — ETH/USDT",
    subtitle: "Equal highs target above",
    variant: "bearish",
    icon: TrendingDown,
    badge: "SELL",
    metric: "82%",
    metricLabel: "Confidence",
    children: (
      <div className="text-xs text-muted-foreground">
        BSL sweep at $3,480 with ChoCh confirmation on 15m.
      </div>
    ),
  },
};

export const InfoCompact: EWStory = {
  args: {
    title: "FVG Retest Zone",
    variant: "info",
    icon: Activity,
    compact: true,
    children: (
      <div className="text-[11px] text-muted-foreground">
        Fair Value Gap from $2.95 → $3.05 partially filled.
      </div>
    ),
  },
};

export const Aggressive: EWStory = {
  args: {
    title: "High-Risk Setup — SOL Perp",
    subtitle: "Leveraged position",
    variant: "aggressive",
    icon: AlertTriangle,
    badge: "CAUTION",
    metric: "+$480",
    metricLabel: "P&L",
    children: (
      <div className="text-xs text-muted-foreground">
        Aggressive entry on 1m BOS. Use strict risk management.
      </div>
    ),
  },
};

// ─── MiniWidget ───────────────────────────────────────────────────

export const MiniWidgetShowcase: StoryObj = {
  render: () => (
    <div className="w-72 space-y-2">
      <MiniWidget title="Win Rate" value="72.3%" variant="bullish" icon={TrendingUp} />
      <MiniWidget title="Avg Loss" value="-1.8%" variant="bearish" icon={TrendingDown} />
      <MiniWidget title="Signals Today" value="14" variant="info" icon={Activity} />
    </div>
  ),
};

// ─── WidgetGroup ──────────────────────────────────────────────────

export const WidgetGroupShowcase: StoryObj = {
  render: () => (
    <div className="w-80">
      <WidgetGroup
        title="Performance"
        icon={Activity}
        action={<button className="text-[11px] text-primary hover:underline">Details</button>}
      >
        <MiniWidget title="Sharpe" value="1.84" variant="bullish" />
        <MiniWidget title="Max DD" value="-6.2%" variant="bearish" />
        <MiniWidget title="Profit Factor" value="2.1" variant="neutral" />
      </WidgetGroup>
    </div>
  ),
};
