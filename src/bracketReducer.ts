import type { Bracket } from "./types";
import { pickWinner, advanceRound, seedBracket } from "./tournament";
import { foods } from "./foods";

export type BracketAction =
  | { type: "vote"; matchupId: string; winnerId: string }
  | { type: "restart" };

export function bracketReducer(state: Bracket, action: BracketAction): Bracket {
  switch (action.type) {
    case "vote": {
      const next = pickWinner(state, action.matchupId, action.winnerId);
      const roundMatchups = next.rounds[next.currentRound];
      const allDecided = roundMatchups.every((m) => m.winner !== null);
      const isFinalRound = next.currentRound === next.rounds.length - 1;
      return allDecided && !isFinalRound ? advanceRound(next) : next;
    }
    case "restart":
      return seedBracket(foods);
  }
}

export function initialBracket(): Bracket {
  return seedBracket(foods);
}
