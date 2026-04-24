// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { Food } from "../types";

const confettiMock = vi.fn();
vi.mock("canvas-confetti", () => ({
  default: (...args: unknown[]) => confettiMock(...args),
}));

import { ChampionScreen } from "./ChampionScreen";

const winner: Food = {
  id: "pizza",
  name: "Pizza",
  emoji: "🍕",
  category: "fast-food",
};

describe("ChampionScreen", () => {
  afterEach(() => {
    cleanup();
    confettiMock.mockClear();
  });

  it("renders the winner and fires confetti on mount", () => {
    const onRestart = vi.fn();
    render(<ChampionScreen winner={winner} onRestart={onRestart} />);

    expect(screen.getByText("Pizza")).toBeDefined();
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it("calls onRestart when the restart button is clicked", () => {
    const onRestart = vi.fn();
    render(<ChampionScreen winner={winner} onRestart={onRestart} />);

    const buttons = screen.getAllByRole("button", { name: /play again/i });
    fireEvent.click(buttons[0]);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
