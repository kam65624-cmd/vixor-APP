import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CharacterGuide } from "@/components/characters/CharacterGuide";
import {
  CHARACTERS,
  CHARACTER_MAP,
  characterMonogram,
  getCharacterPresentation,
} from "@/shared/characters";

describe("CharacterGuide + character bridge", () => {
  // vitest runs with globals:false → RTL auto-cleanup is disabled; clean up explicitly
  afterEach(() => cleanup());

  it("renders all four characters with registry-consistent identity", () => {
    for (const char of CHARACTERS) {
      const { unmount } = render(<CharacterGuide character={char.id} />);
      // Display name and monogram come from the canonical registry
      expect(screen.getByText(char.displayName)).toBeInTheDocument();
      expect(screen.getByText(characterMonogram(char.id))).toBeInTheDocument();
      // Role badge matches the registry role mapping
      expect(screen.getByText(char.roleLabel)).toBeInTheDocument();
      // Idle state shows the tagline and long-form description
      expect(screen.getByText(char.tagline)).toBeInTheDocument();
      expect(screen.getByText(char.description)).toBeInTheDocument();
      unmount();
    }
  });

  it("binds every character to the canonical --char-* design tokens", () => {
    // The v2 audit found four conflicting color systems; this protects the unification.
    const expected: Record<string, string> = {
      moxi: "moxi",
      mrVigo: "vigo",
      drDex: "dex",
      echo: "echo",
    };
    for (const id of Object.keys(expected) as Array<keyof typeof expected>) {
      const char = getCharacterPresentation(id);
      const token = expected[id];
      expect(char.token).toBe(token);
      expect(char.colorVar).toBe(`var(--char-${token})`);
      expect(char.dimVar).toBe(`var(--char-${token}-dim)`);
      expect(char.borderVar).toBe(`var(--char-${token}-border)`);
      expect(char.glowVar).toBe(`var(--char-${token}-glow)`);
    }
    // No hex literals may leak into the presentation layer
    for (const char of CHARACTERS) {
      expect(char.colorVar).not.toMatch(/^#/);
    }
  });

  it("points each character CTA at its Decision Loop surface", () => {
    const loopOrder = ["/alpha", "/investigate", "/risk", "/echo"];
    expect(CHARACTERS.map((c) => c.route)).toEqual(loopOrder);

    const moxi = getCharacterPresentation("moxi");
    render(
      <CharacterGuide
        character={moxi.id}
        action={{ label: moxi.surfaceLabel, href: moxi.route }}
      />,
    );
    const link = screen.getByRole("link", { name: moxi.surfaceLabel });
    expect(link).toHaveAttribute("href", "/alpha");
  });

  it("hides actions in async states and offers retry on error", () => {
    // loading: busy flagged, no action rendered
    const { container, rerender } = render(
      <CharacterGuide
        character="echo"
        state="loading"
        action={{ label: "Open ECHO", href: "/echo" }}
      />,
    );
    expect(container.querySelector("[data-character='echo']")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    // error: retry button fires onRetry
    const onRetry = vi.fn();
    rerender(<CharacterGuide character="echo" state="error" onRetry={onRetry} />);
    expect(container.querySelector("[data-character='echo']")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    const retry = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("compact variant trims long-form copy and keeps identity", () => {
    const moxi = CHARACTER_MAP.moxi;
    render(<CharacterGuide character={moxi.id} compact />);
    expect(screen.getByText(moxi.displayName)).toBeInTheDocument();
    expect(screen.queryByText(moxi.description)).not.toBeInTheDocument();
    // State changes stay announced through the polite live region
    expect(screen.getByRole("status")).toHaveTextContent(moxi.tagline);
  });
});
