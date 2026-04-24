export type Category = "fast-food" | "world-cuisine" | "snacks" | "desserts";

export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: Category;
}

export interface Matchup {
  id: string;
  foodA: Food;
  foodB: Food | null;
  winner: Food | null;
}

export interface Bracket {
  rounds: Matchup[][];
  currentRound: number;
  currentMatchup: number;
  champion: Food | null;
}
