// ============================================================================
// VIXOR FX — component smoke tests (v2 P2)
// ============================================================================
//
// jsdom ships without a 2D canvas context, which is exactly the environment
// these tests are valuable for: the FX components must render their markup,
// degrade gracefully (no effect loop), and unmount cleanly when the canvas
// API is unavailable. In real browsers the guards enable the animation
// instead of exiting — the branch logic is identical.
//
// ============================================================================

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { ParticleNetwork } from "@/components/vixor/fx/ParticleNetwork";
import { EnergyOrb } from "@/components/vixor/fx/EnergyOrb";

describe("ParticleNetwork", () => {
  afterEach(() => cleanup());

  it("renders a decorative canvas bound to the canonical token", () => {
    const { container, unmount } = render(
      <div className="relative">
        <ParticleNetwork colorVar="--char-vigo" />
      </div>,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute("data-fx", "particle-network");
    expect(canvas).toHaveAttribute("data-fx-color", "--char-vigo");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    unmount(); // must not throw without a 2D context
  });

  it("applies density/opacity props without crashing", () => {
    const { container, unmount } = render(
      <div className="relative">
        <ParticleNetwork colorVar="--char-dex" density={0.5} opacity={0.25} />
      </div>,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas?.style.opacity).toBe("0.25");
    unmount();
  });
});

describe("EnergyOrb", () => {
  afterEach(() => cleanup());

  it("renders a decorative orb bound to the canonical token", () => {
    const { container, unmount } = render(
      <div className="relative">
        <EnergyOrb colorVar="--char-moxi" size={280} opacity={0.45} />
      </div>,
    );
    const orb = container.querySelector("[data-fx='energy-orb']");
    expect(orb).not.toBeNull();
    expect(orb).toHaveAttribute("data-fx-color", "--char-moxi");
    expect(orb).toHaveAttribute("aria-hidden", "true");
    expect(orb?.style.width).toBe("280px");
    expect(orb?.style.height).toBe("280px");
    // Color flows through the CSS var — no hex literal in the gradient
    expect(orb?.style.background).toContain("var(--char-moxi)");
    unmount();
  });

  it("supports positional className (RTL-safe logical utilities)", () => {
    const { container, unmount } = render(
      <div className="relative">
        <EnergyOrb className="-end-16 -top-20" />
      </div>,
    );
    const orb = container.querySelector("[data-fx='energy-orb']");
    expect(orb?.className).toContain("-end-16");
    unmount();
  });
});
