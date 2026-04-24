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
  if (!current) {
    throw new Error("No current matchup and no champion — bracket state is inconsistent");
  }

  const roundMatchups = bracket.rounds[bracket.currentRound];
  const progress = {
    matchIndex: bracket.currentMatchup,
    matchesInRound: roundMatchups.length,
    roundIndex: bracket.currentRound,
    totalRounds: bracket.rounds.length,
  };

  return (
    <main>
      <h1>FoodFighter</h1>
      <MatchupCard
        matchup={current}
        progress={progress}
        onVote={(winnerId) =>
          dispatch({ type: "vote", matchupId: current.id, winnerId })
        }
      />
      <BracketView bracket={bracket} />
    </main>
  );
}
