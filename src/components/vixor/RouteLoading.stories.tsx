import type { Meta, StoryObj } from "@storybook/react";

// ─── RouteLoading component (inline definition) ──────────────────
// A lightweight full-screen loading indicator used during route transitions.

function RouteLoading({
  message = "Loading…",
  color = "var(--color-primary)",
}: {
  message?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 200,
        gap: 16,
        background: "var(--color-background)",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: `2px solid var(--color-border)`,
          borderTopColor: color,
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: "var(--color-muted-foreground)",
          fontWeight: 500,
        }}
      >
        {message}
      </span>
    </div>
  );
}

const meta: Meta<typeof RouteLoading> = {
  title: "Vixor/RouteLoading",
  component: RouteLoading,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof RouteLoading>;

export const Default: Story = {
  args: { message: "Loading…" },
};

export const WithMessage: Story = {
  args: { message: "Fetching signals…" },
};

export const CustomColor: Story = {
  args: {
    message: "Connecting to feed…",
    color: "var(--color-info)",
  },
};

export const ShortMessage: Story = {
  args: { message: "…" },
};

export const LongMessage: Story = {
  args: {
    message: "Loading market data. This may take a moment on slow connections.",
  },
};