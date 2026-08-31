import type { Meta, StoryObj } from "@storybook/react";
import {
  SectionTitle,
  RecBadge,
  ConfidenceBar,
  Stat,
  SetupStrengthBadge,
  BiasIndicator,
  CollapsibleSection,
  EducationLayer,
  PriceCell,
} from "./atoms";
import { BookOpen, Shield } from "lucide-react";

const meta: Meta = {
  title: "Vixor/Atoms",
  tags: ["autodocs"],
};
export default meta;

// ─── SectionTitle ────────────────────────────────────────────────

export const SectionTitleOnly: StoryObj = {
  render: () => <SectionTitle title="Market Structure" />,
};

export const SectionTitleWithSubtitle: StoryObj = {
  render: () => <SectionTitle title="Institutional Flow" subtitle="Last updated 2 min ago" />,
};

export const SectionTitleWithAction: StoryObj = {
  render: () => (
    <SectionTitle
      title="Signal Log"
      action={<button className="text-xs text-primary hover:underline">View All</button>}
    />
  ),
};

// ─── RecBadge ────────────────────────────────────────────────────

export const RecBadgeAll: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <RecBadge rec="BUY" />
      <RecBadge rec="SELL" />
      <RecBadge rec="WAIT" />
      <RecBadge rec="BUY" size="lg" />
      <RecBadge rec="SELL" size="lg" />
    </div>
  ),
};

// ─── ConfidenceBar ───────────────────────────────────────────────

export const ConfidenceBarLevels: StoryObj = {
  render: () => (
    <div className="w-64 space-y-3">
      <div>
        <span className="text-[11px] text-muted-foreground">High (85%)</span>
        <ConfidenceBar value={85} />
      </div>
      <div>
        <span className="text-[11px] text-muted-foreground">Medium (55%)</span>
        <ConfidenceBar value={55} />
      </div>
      <div>
        <span className="text-[11px] text-muted-foreground">Low (25%)</span>
        <ConfidenceBar value={25} />
      </div>
    </div>
  ),
};

// ─── Stat ────────────────────────────────────────────────────────

export const StatAccents: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <Stat label="P&L" value="+$2,480" accent="bullish" />
      <Stat label="Drawdown" value="-4.2%" accent="bearish" />
      <Stat label="Win Rate" value="72.3%" accent="info" />
      <Stat label="Trades" value="148" />
    </div>
  ),
};

// ─── SetupStrengthBadge ──────────────────────────────────────────

export const SetupStrengthAll: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <SetupStrengthBadge strength="STRONG" size="sm" />
      <SetupStrengthBadge strength="STRONG" />
      <SetupStrengthBadge strength="STRONG" size="lg" />
      <SetupStrengthBadge strength="MODERATE" />
      <SetupStrengthBadge strength="WEAK" />
      <SetupStrengthBadge strength="WEAK" size="sm" />
    </div>
  ),
};

// ─── BiasIndicator ───────────────────────────────────────────────

export const BiasAll: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <BiasIndicator direction="BULLISH" />
      <BiasIndicator direction="BEARISH" />
      <BiasIndicator direction="NEUTRAL" />
    </div>
  ),
};

// ─── CollapsibleSection ──────────────────────────────────────────

export const CollapsibleDefault: StoryObj = {
  render: () => (
    <div className="w-80">
      <CollapsibleSection
        title="Order Flow Analysis"
        icon={Shield}
        children={
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              Delta: <span className="text-bullish font-mono">+$1.2M</span>
            </p>
            <p>
              CVD: <span className="text-bearish font-mono">-450K</span>
            </p>
          </div>
        }
      />
    </div>
  ),
};

export const CollapsibleDefaultOpen: StoryObj = {
  render: () => (
    <div className="w-80">
      <CollapsibleSection
        title="SMC Concepts"
        icon={BookOpen}
        defaultOpen={true}
        badge={
          <span className="text-[10px] bg-info/15 text-info px-1.5 py-0.5 rounded">3 terms</span>
        }
        children={
          <div className="text-xs text-muted-foreground">
            Order Block detected at $142.50 — institutional accumulation zone.
          </div>
        }
      />
    </div>
  ),
};

// ─── EducationLayer ──────────────────────────────────────────────

export const EducationMultipleTerms: StoryObj = {
  render: () => (
    <div className="w-96">
      <EducationLayer terms={["Order Block", "FVG", "BOS", "Liquidity", "Sweep", "Mitigation"]} />
    </div>
  ),
};

// ─── PriceCell ───────────────────────────────────────────────────

export const PriceCellAll: StoryObj = {
  render: () => (
    <div className="flex">
      <PriceCell label="Entry" value="$142.50" accent="bullish" />
      <PriceCell label="Stop" value="$138.20" accent="bearish" />
      <PriceCell label="TP" value="$155.00" accent="neutral" />
      <PriceCell label="Vol" value="24.3M" accent="muted" />
    </div>
  ),
};
