import { describe, it, expect } from "vitest";
import { seedBracket, pickWinner, getCurrentMatchup } from "./tournament";
import type { Food } from "./types";

const makeFoods = (n: number): Food[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    name: `Food ${i}`,
    emoji: "🍽️",
    category: "fast-food" as const,
  }));

describe("seedBracket", () => {
  it("pads the bracket to the next power of 2 when input isn't one", () => {
    const bracket = seedBracket(makeFoods(6));
    // 6 foods → bracket size 8 → 4 first-round matchups
    expect(bracket.rounds[0]).toHaveLength(4);
  });

  it("produces log2(size) rounds", () => {
    const bracket = seedBracket(makeFoods(8));
    // size 8 → log2(8) = 3 rounds
    expect(bracket.rounds).toHaveLength(3);
  });
});

describe("pickWinner", () => {
  it("returns a new bracket with the matchup resolved and does not mutate input", () => {
    const original = seedBracket(makeFoods(4));
    const matchup = original.rounds[0][0];
    if (!matchup.foodA) throw new Error("expected foodA present in paired matchup");
    const winnerId = matchup.foodA.id;

    const updated = pickWinner(original, matchup.id, winnerId);

    // Input untouched
    expect(original.rounds[0][0].winner).toBeNull();
    // Output has resolved winner
    const updatedMatchup = updated.rounds[0].find((m) => m.id === matchup.id);
    expect(updatedMatchup?.winner?.id).toBe(winnerId);
  });
});

describe("getCurrentMatchup", () => {
  it("returns null once a champion is set", () => {
    const bracket = seedBracket(makeFoods(2));
    const final = bracket.rounds[0][0];
    if (!final.foodA) throw new Error("expected foodA present in paired matchup");
    const resolved = pickWinner(bracket, final.id, final.foodA.id);

    expect(resolved.champion).not.toBeNull();
    expect(getCurrentMatchup(resolved)).toBeNull();
  });
});
