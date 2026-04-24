import type { Bracket, Matchup, Food } from "../types";
import { getCurrentMatchup } from "../tournament";
import "./BracketView.css";

interface Props {
  bracket: Bracket;
}

function slotClass(matchup: Matchup, slot: "A" | "B"): string {
  const food = slot === "A" ? matchup.foodA : matchup.foodB;
  if (!food) return "bracket-view__slot bracket-view__slot--bye";
  if (!matchup.winner) return "bracket-view__slot";
  return matchup.winner.id === food.id
    ? "bracket-view__slot bracket-view__slot--winner"
    : "bracket-view__slot bracket-view__slot--loser";
}

function renderFood(food: Food | null, emptyLabel: string) {
  if (!food) return <span className="bracket-view__bye">{emptyLabel}</span>;
  return (
    <>
      <span className="bracket-view__emoji" aria-hidden>{food.emoji}</span>
      <span className="bracket-view__name">{food.name}</span>
    </>
  );
}

export function BracketView({ bracket }: Props) {
  const currentMatchupId = getCurrentMatchup(bracket)?.id ?? null;

  return (
    <div className="bracket-view" aria-label="Tournament bracket">
      {bracket.rounds.map((round, roundIndex) => (
        <div className="bracket-view__round" key={roundIndex}>
          <h2 className="bracket-view__round-title">Round {roundIndex + 1}</h2>
          <ul className="bracket-view__matchups">
            {round.map((matchup) => {
              const isCurrent = matchup.id === currentMatchupId;
              return (
                <li
                  key={matchup.id}
                  className={
                    "bracket-view__matchup" +
                    (isCurrent ? " bracket-view__matchup--current" : "")
                  }
                >
                  <div className={slotClass(matchup, "A")}>
                    {renderFood(matchup.foodA, "(tbd)")}
                  </div>
                  <div className={slotClass(matchup, "B")}>
                    {renderFood(matchup.foodB, "(bye)")}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
