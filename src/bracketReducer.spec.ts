import { describe, it, expect } from "vitest";
import { bracketReducer, initialBracket } from "./bracketReducer";
import { seedBracket } from "./tournament";
import type { Food } from "./types";

const makeFoods = (n: number): Food[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    name: `Food ${i}`,
    emoji: "🍽️",
    category: "fast-food" as const,
  }));

describe("bracketReducer", () => {
  it("'vote' resolves the targeted matchup", () => {
    const state = seedBracket(makeFoods(4));
    const matchup = state.rounds[0][0];
    if (!matchup.foodA) throw new Error("expected foodA present");
    const winnerId = matchup.foodA.id;

    const next = bracketReducer(state, {
      type: "vote",
      matchupId: matchup.id,
      winnerId,
    });

    const resolved = next.rounds[0].find((m) => m.id === matchup.id);
    expect(resolved?.winner?.id).toBe(winnerId);
  });

  it("'vote' auto-advances when the last matchup in a non-final round is decided", () => {
    // 4 foods → 2 first-round matchups, 2 rounds total.
    let state = seedBracket(makeFoods(4));
    const [m0, m1] = state.rounds[0];
    if (!m0.foodA || !m1.foodA) throw new Error("expected paired matchups");

    state = bracketReducer(state, {
      type: "vote",
      matchupId: m0.id,
      winnerId: m0.foodA.id,
    });
    state = bracketReducer(state, {
      type: "vote",
      matchupId: m1.id,
      winnerId: m1.foodA.id,
    });

    expect(state.currentRound).toBe(1);
  });

  it("'restart' returns a fresh bracket with no champion and round 0", () => {
    const state = initialBracket();
    const firstMatchup = state.rounds[0][0];
    if (!firstMatchup.foodA) throw new Error("expected foodA in first matchup");
    const mutated = {
      ...state,
      currentRound: 99,
      champion: firstMatchup.foodA,
    };
    const fresh = bracketReducer(mutated, { type: "restart" });

    expect(fresh.currentRound).toBe(0);
    expect(fresh.champion).toBeNull();
  });
});
