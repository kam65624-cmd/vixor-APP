import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendArrow } from "./TrendArrow";

describe("TrendArrow", () => {
  it("renders with up direction and correct aria-label", () => {
    render(<TrendArrow direction="up" />);
    const svg = screen.getByRole("img", { name: "Trending up" });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveStyle({ color: "var(--color-bullish)" });
  });

  it("renders with down direction and rotated", () => {
    render(<TrendArrow direction="down" />);
    const svg = screen.getByRole("img", { name: "Trending down" });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveStyle({ transform: "rotate(180deg)" });
  });

  it("renders neutral with muted color", () => {
    render(<TrendArrow direction="neutral" />);
    const svg = screen.getByRole("img", { name: "Flat" });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveStyle({ color: "var(--color-muted-foreground)" });
  });

  it("respects custom size", () => {
    const { container } = render(<TrendArrow direction="up" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("applies custom className", () => {
    const { container } = render(<TrendArrow direction="up" className="my-class" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("my-class")).toBe(true);
  });
});
