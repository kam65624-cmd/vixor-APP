import type { Meta, StoryObj } from "@storybook/react";
import { MiniSparkline } from "./MiniSparkline";

const meta: Meta<typeof MiniSparkline> = {
  title: "Vixor/MiniSparkline",
  component: MiniSparkline,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof MiniSparkline>;

const bullishData = [100, 102, 101, 105, 108, 106, 110, 115, 118, 122, 120, 125, 130];
const bearishData = [130, 128, 125, 127, 122, 118, 120, 115, 110, 108, 112, 105, 100];
const flatData = [100, 101, 99, 102, 100, 101, 99, 100, 102, 100, 99, 101, 100];

export const Bullish: Story = {
  args: {
    data: bullishData,
    color: "var(--bullish)",
    width: 120,
    height: 32,
  },
};

export const Bearish: Story = {
  args: {
    data: bearishData,
    color: "var(--bearish)",
    width: 120,
    height: 32,
  },
};

export const Flat: Story = {
  args: {
    data: flatData,
    color: "var(--neutral-wait)",
    width: 120,
    height: 32,
  },
};

export const InlinePriceCards: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <div className="flex items-center gap-2">
        <MiniSparkline data={bullishData} color="var(--bullish)" width={80} height={24} />
        <div>
          <div className="text-xs font-mono font-bold text-bullish">+24.5%</div>
          <div className="text-[10px] text-muted-foreground">SOL</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MiniSparkline data={bearishData} color="var(--bearish)" width={80} height={24} />
        <div>
          <div className="text-xs font-mono font-bold text-bearish">-12.8%</div>
          <div className="text-[10px] text-muted-foreground">ETH</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MiniSparkline data={flatData} color="var(--neutral-wait)" width={80} height={24} />
        <div>
          <div className="text-xs font-mono font-bold text-neutral-wait">+0.3%</div>
          <div className="text-[10px] text-muted-foreground">BTC</div>
        </div>
      </div>
    </div>
  ),
};

export const CompactRow: StoryObj = {
  render: () => (
    <div className="space-y-2">
      {[
        { sym: "BTC/USDT", data: bullishData, color: "var(--bullish)", pct: "+24.5%" },
        { sym: "ETH/USDT", data: bearishData, color: "var(--bearish)", pct: "-12.8%" },
        { sym: "SOL/USDT", data: flatData, color: "var(--neutral-wait)", pct: "+0.3%" },
      ].map((item) => (
        <div
          key={item.sym}
          className="flex items-center justify-between px-3 py-2 rounded border border-border"
        >
          <span className="text-xs font-semibold w-24">{item.sym}</span>
          <MiniSparkline data={item.data} color={item.color} width={100} height={24} />
          <span
            className="text-xs font-mono font-bold w-16 text-right"
            style={{ color: item.color }}
          >
            {item.pct}
          </span>
        </div>
      ))}
    </div>
  ),
};
