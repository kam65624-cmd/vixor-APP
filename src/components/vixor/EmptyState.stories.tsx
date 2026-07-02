import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Inbox, Search, ShieldAlert } from "lucide-react";

const meta: Meta<typeof EmptyState> = {
  title: "Vixor/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <Inbox className="size-5" />,
    title: "No signals found",
    description: "Check back later or adjust your filters to see new signals.",
  },
};

export const WithPrimaryAction: Story = {
  args: {
    icon: <Search className="size-5" />,
    title: "No trade journal entries",
    description:
      "Start logging your trades to build a performance track record.",
    action: {
      label: "Create First Entry",
      onClick: () => {},
      variant: "primary",
    },
  },
};

export const WithDefaultAction: Story = {
  args: {
    icon: <ShieldAlert className="size-5" />,
    title: "No active positions",
    description: "You have no open positions at this time.",
    action: {
      label: "Browse Signals",
      onClick: () => {},
      variant: "default",
    },
  },
};

export const Minimal: Story = {
  args: {
    title: "Nothing here yet",
  },
};