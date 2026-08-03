import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveDot } from "./LiveDot";

describe("LiveDot", () => {
  it("renders with default size", () => {
    render(<LiveDot />);
    const dot = screen.getByRole("status");
    expect(dot).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    const { container } = render(<LiveDot size={12} />);
    const dot = container.firstElementChild as HTMLElement;
    expect(dot.style.width).toBe("12px");
    expect(dot.style.height).toBe("12px");
  });

  it("has correct aria-label for color", () => {
    render(<LiveDot color="bear" />);
    const dot = screen.getByRole("status", { name: /bear/i });
    expect(dot).toBeInTheDocument();
  });

  it("applies custom label", () => {
    render(<LiveDot label="Market open" />);
    const dot = screen.getByRole("status", { name: "Market open" });
    expect(dot).toBeInTheDocument();
  });
});
