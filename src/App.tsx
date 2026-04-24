import { useState } from "react";
import { foods } from "./foods";
import { seedBracket, getCurrentMatchup } from "./tournament";

export function App() {
  const [bracket] = useState(() => seedBracket(foods));
  const current = getCurrentMatchup(bracket);
  return (
    <main>
      <h1>FoodFighter — scaffold OK</h1>
      <p>
        Round {bracket.currentRound + 1} of {bracket.rounds.length}
      </p>
      {current ? (
        <p>
          First matchup: {current.foodA?.name ?? "(tbd)"} vs{" "}
          {current.foodB?.name ?? "(bye)"}
        </p>
      ) : (
        <p>No active matchup.</p>
      )}
    </main>
  );
}
