import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PaginationBar } from "./PaginationBar";

const meta: Meta<typeof PaginationBar> = {
  title: "Vixor/PaginationBar",
  component: PaginationBar,
  tags: ["autodocs"],
  argTypes: {
    onPageChange: { action: "page changed" },
  },
};
export default meta;

type Story = StoryObj<typeof PaginationBar>;

export const FirstPage: Story = {
  args: {
    page: 1,
    pageSize: 10,
    total: 95,
    onPageChange: () => {},
  },
};

export const MiddlePage: Story = {
  args: {
    page: 5,
    pageSize: 10,
    total: 95,
    onPageChange: () => {},
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    pageSize: 10,
    total: 95,
    onPageChange: () => {},
  },
};

export const SmallDataset: Story = {
  args: {
    page: 1,
    pageSize: 10,
    total: 15,
    onPageChange: () => {},
  },
};

export const LargeDataset: Story = {
  args: {
    page: 25,
    pageSize: 20,
    total: 1000,
    onPageChange: () => {},
  },
};

export const SingleItem: Story = {
  args: {
    page: 1,
    pageSize: 10,
    total: 8,
    onPageChange: () => {},
  },
};

// ─── Interactive demo ─────────────────────────────────────────────

function PaginationDemo() {
  const [page, setPage] = useState(1);
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Current page: <span className="font-mono font-bold text-foreground">{page}</span>
      </div>
      <PaginationBar page={page} pageSize={10} total={95} onPageChange={setPage} />
    </div>
  );
}

export const Interactive: StoryObj = {
  render: () => <PaginationDemo />,
};
