// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchupCard } from "./MatchupCard";
import type { Matchup } from "../types";

const matchup: Matchup = {
  id: "r0-m0",
  foodA: { id: "pizza", name: "Pizza", emoji: "🍕", category: "fast-food" },
  foodB: { id: "burger", name: "Burger", emoji: "🍔", category: "fast-food" },
  winner: null,
};

const progress = {
  matchIndex: 0,
  matchesInRound: 4,
  roundIndex: 0,
  totalRounds: 3,
};

describe("MatchupCard", () => {
  it("renders both foods and a progress line, and fires onVote with the clicked food's id", () => {
    const onVote = vi.fn();
    render(<MatchupCard matchup={matchup} progress={progress} onVote={onVote} />);

    expect(screen.getByText("Pizza")).toBeDefined();
    expect(screen.getByText("Burger")).toBeDefined();
    expect(screen.getByText(/Match 1 of 4/)).toBeDefined();

    fireEvent.click(screen.getByText("Pizza"));
    expect(onVote).toHaveBeenCalledWith("pizza");
  });
});
