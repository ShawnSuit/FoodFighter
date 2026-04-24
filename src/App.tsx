import { useReducer } from "react";
import { bracketReducer, initialBracket } from "./bracketReducer";
import { getChampion, getCurrentMatchup } from "./tournament";
import { BracketView } from "./components/BracketView";
import { MatchupCard } from "./components/MatchupCard";
import { ChampionScreen } from "./components/ChampionScreen";

export function App() {
  const [bracket, dispatch] = useReducer(bracketReducer, undefined, initialBracket);
  const champion = getChampion(bracket);

  if (champion) {
    return (
      <ChampionScreen
        winner={champion}
        onRestart={() => dispatch({ type: "restart" })}
      />
    );
  }

  const current = getCurrentMatchup(bracket);
  const roundMatchups = bracket.rounds[bracket.currentRound];
  const progress = current
    ? {
        matchIndex: roundMatchups.findIndex((m) => m.id === current.id),
        matchesInRound: roundMatchups.length,
        roundIndex: bracket.currentRound,
        totalRounds: bracket.rounds.length,
      }
    : null;

  return (
    <main>
      <h1>FoodFighter</h1>
      <BracketView bracket={bracket} />
      {current && progress ? (
        <MatchupCard
          matchup={current}
          progress={progress}
          onVote={(winnerId) =>
            dispatch({ type: "vote", matchupId: current.id, winnerId })
          }
        />
      ) : (
        <p>Advancing…</p>
      )}
    </main>
  );
}
