import type { Meta, StoryObj } from "@storybook/react";
import { LiveDot } from "./LiveDot";

const meta: Meta<typeof LiveDot> = {
  title: "Vixor/LiveDot",
  component: LiveDot,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof LiveDot>;

export const BullLive: Story = {
  args: { color: "bull", size: 8, pulse: true, label: "Bullish live" },
};

export const BearLive: Story = {
  args: { color: "bear", size: 8, pulse: true, label: "Bearish live" },
};

export const NeutralPaused: Story = {
  args: { color: "neutral", size: 8, pulse: false, label: "Neutral paused" },
};

export const InfoLive: Story = {
  args: { color: "info", size: 8, pulse: true, label: "Info feed" },
};

export const SizeVariants: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <LiveDot color="bull" size={4} pulse />
        <span className="text-xs text-muted-foreground">4px</span>
      </div>
      <div className="flex items-center gap-2">
        <LiveDot color="bull" size={6} pulse />
        <span className="text-xs text-muted-foreground">6px</span>
      </div>
      <div className="flex items-center gap-2">
        <LiveDot color="bull" size={8} pulse />
        <span className="text-xs text-muted-foreground">8px</span>
      </div>
      <div className="flex items-center gap-2">
        <LiveDot color="bull" size={12} pulse />
        <span className="text-xs text-muted-foreground">12px</span>
      </div>
    </div>
  ),
};

export const PulseVsStatic: StoryObj = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <LiveDot color="bull" size={8} pulse />
        <span className="text-xs text-muted-foreground">Live (pulsing)</span>
      </div>
      <div className="flex items-center gap-2">
        <LiveDot color="neutral" size={8} pulse={false} />
        <span className="text-xs text-muted-foreground">Paused (static)</span>
      </div>
    </div>
  ),
};