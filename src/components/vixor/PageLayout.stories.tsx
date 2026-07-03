import type { Meta, StoryObj } from "@storybook/react";
import {
  PageLayout,
  StatsRow,
  DataRow,
  DataRowTwoLine,
  LabelValue,
  PageBadge,
  ProgressBar,
  TableHeader,
  ProfileCard,
  SkeletonRow,
  PageScrollArea,
  MiniBar,
} from "./PageLayout";
const meta: Meta<typeof PageLayout> = {
  title: "Vixor/PageLayout",
  component: PageLayout,
  tags: ["autodocs"],
};
export default meta;

// ─── PageLayout ───────────────────────────────────────────────────

export const FullPage: StoryObj = {
  render: () => (
    <div className="w-[390px] h-[700px] rounded-lg overflow-hidden border border-border">
      <PageLayout
        title="Whale Alerts"
        badge="LIVE"
        badgeColor="var(--color-bullish)"
        description="Track large transactions in real-time"
        tabs={["All", "Buys", "Sells"] as const}
        activeTab="All"
        onTabChange={() => {}}
        tabCounts={{ All: 24, Buys: 16, Sells: 8 }}
      >
        <StatsRow
          stats={[
            { label: "24h Volume", value: "$4.2B", color: "var(--color-bullish)" },
            { label: "Alerts", value: "24", color: "var(--color-foreground)" },
            { label: "Avg Size", value: "$1.8M" },
          ]}
        />
        <PageScrollArea>
          <DataRowTwoLine
            topContent={
              <>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>SOL/USDT</span>
                <PageBadge label="BUY" color="var(--color-bullish)" small />
              </>
            }
            bottomContent={
              <>
                <LabelValue label="Size" value="$2.4M" valueColor="var(--color-bullish)" mono />
                <LabelValue label="Price" value="$142.50" mono />
                <LabelValue label="2m ago" value="" />
              </>
            }
          />
          <DataRowTwoLine
            topContent={
              <>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>ETH/USDT</span>
                <PageBadge label="SELL" color="var(--color-bearish)" small />
              </>
            }
            bottomContent={
              <>
                <LabelValue label="Size" value="$890K" valueColor="var(--color-bearish)" mono />
                <LabelValue label="Price" value="$3,125.00" mono />
                <LabelValue label="5m ago" value="" />
              </>
            }
          />
        </PageScrollArea>
      </PageLayout>
    </div>
  ),
};

export const LoadingState: StoryObj = {
  render: () => (
    <div className="w-[390px] h-[400px] rounded-lg overflow-hidden border border-border">
      <PageLayout title="Signals" loading>{null as any}</PageLayout>
    </div>
  ),
};

// ─── StatsRow ────────────────────────────────────────────────────

export const StatsRowShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px]">
      <StatsRow
        stats={[
          { label: "Total P&L", value: "+$12,480", color: "var(--color-bullish)", sub: "+8.4% this week" },
          { label: "Win Rate", value: "72.3%", color: "var(--color-info)" },
          { label: "Trades", value: "148", sub: "32 this week" },
        ]}
      />
    </div>
  ),
};

// ─── ProgressBar ──────────────────────────────────────────────────

export const ProgressBarShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px] space-y-1">
      <ProgressBar
        label="Accuracy"
        value={78}
        max={100}
        labelRight="78%"
        color="var(--color-bullish)"
      />
      <ProgressBar
        label="Completion"
        value={45}
        max={100}
        labelRight="45%"
        color="var(--color-info)"
      />
      <ProgressBar
        label="Risk Used"
        value={88}
        max={100}
        labelRight="88%"
        color="var(--color-bearish)"
      />
    </div>
  ),
};

// ─── PageBadge ───────────────────────────────────────────────────

export const PageBadgeShowcase: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap p-4">
      <PageBadge label="BUY" color="var(--color-bullish)" />
      <PageBadge label="SELL" color="var(--color-bearish)" />
      <PageBadge label="WAIT" color="var(--color-neutral-wait)" />
      <PageBadge label="LIVE" color="var(--color-bullish)" small />
      <PageBadge label="NEW" color="var(--color-info)" small />
      <PageBadge label="HIGH RISK" color="var(--color-bearish)" small />
    </div>
  ),
};

// ─── LabelValue ──────────────────────────────────────────────────

export const LabelValueShowcase: StoryObj = {
  render: () => (
    <div className="flex gap-6 flex-wrap p-4">
      <LabelValue label="Entry" value="$142.50" mono />
      <LabelValue label="Stop" value="$138.20" valueColor="var(--color-bearish)" mono />
      <LabelValue label="P&L" value="+$2,480" valueColor="var(--color-bullish)" mono />
      <LabelValue label="Status" value="Active" valueColor="var(--color-info)" />
    </div>
  ),
};

// ─── TableHeader ─────────────────────────────────────────────────

export const TableHeaderShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px]">
      <TableHeader
        columns={[
          { label: "Pair", width: "80px" },
          { label: "Side", width: "50px", align: "left" as const },
          { label: "Entry", width: "80px", align: "right" },
          { label: "P&L", width: "70px", align: "right" },
          { label: "Time", width: "60px", align: "right" },
        ]}
      />
    </div>
  ),
};

// ─── DataRow ─────────────────────────────────────────────────────

export const DataRowShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px]">
      <TableHeader
        columns={[
          { label: "Pair", width: "80px" },
          { label: "Side", width: "50px", align: "left" as const },
          { label: "P&L", width: "70px", align: "right" },
          { label: "Time", width: "60px", align: "right" },
        ]}
      />
      <DataRow leftAccent="var(--color-bullish)">
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ width: 80, fontWeight: 700 }}>SOL/USDT</span>
          <span style={{ width: 50, textAlign: "center", color: "var(--color-bullish)", fontWeight: 700 }}>BUY</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--color-bullish)" }}>+$1,240</span>
          <span style={{ width: 60, textAlign: "right", color: "var(--color-muted-foreground)", fontSize: "12px" }}>2m</span>
        </div>
      </DataRow>
      <DataRow leftAccent="var(--color-bearish)">
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ width: 80, fontWeight: 700 }}>ETH/USDT</span>
          <span style={{ width: 50, textAlign: "center", color: "var(--color-bearish)", fontWeight: 700 }}>SELL</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--color-bearish)" }}>-$320</span>
          <span style={{ width: 60, textAlign: "right", color: "var(--color-muted-foreground)", fontSize: "12px" }}>15m</span>
        </div>
      </DataRow>
    </div>
  ),
};

// ─── ProfileCard ─────────────────────────────────────────────────

export const ProfileCardShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px]">
      <ProfileCard
        displayName="NightOwl Trader"
        username="nightowl_sol"
        xp={2450}
        streak={12}
        tradeCount={148}
      />
    </div>
  ),
};

// ─── SkeletonRow ─────────────────────────────────────────────────

export const SkeletonLoading: StoryObj = {
  render: () => (
    <div className="w-[390px]">
      <TableHeader
        columns={[
          { label: "Pair", width: "100px" },
          { label: "Status", width: "80px" },
          { label: "P&L", width: "100px" },
        ]}
      />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  ),
};

// ─── MiniBar ─────────────────────────────────────────────────────

export const MiniBarShowcase: StoryObj = {
  render: () => (
    <div className="w-[390px] space-y-4 p-4">
      <div>
        <LabelValue label="Buy/Sell Ratio" value="68 / 32" mono />
        <MiniBar leftPct={68} />
      </div>
      <div>
        <LabelValue label="Long/Short" value="45 / 55" mono />
        <MiniBar leftPct={45} />
      </div>
      <div>
        <LabelValue label="Retail/Smart" value="82 / 18" mono />
        <MiniBar leftPct={82} leftColor="var(--color-info)" rightColor="var(--color-bearish)" />
      </div>
    </div>
  ),
};