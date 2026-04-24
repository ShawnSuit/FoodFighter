import type { Matchup } from "../types";
import "./MatchupCard.css";

export interface MatchupProgress {
  matchIndex: number;
  matchesInRound: number;
  roundIndex: number;
  totalRounds: number;
}

interface Props {
  matchup: Matchup;
  progress: MatchupProgress;
  onVote: (winnerId: string) => void;
}

export function MatchupCard({ matchup, progress, onVote }: Props) {
  const { foodA, foodB } = matchup;
  const progressLine = `Match ${progress.matchIndex + 1} of ${progress.matchesInRound} — Round ${progress.roundIndex + 1} of ${progress.totalRounds}`;

  return (
    <section className="matchup-card">
      <p className="matchup-card__progress">{progressLine}</p>
      <div className="matchup-card__options">
        {foodA ? (
          <button
            type="button"
            className="matchup-card__option"
            onClick={() => onVote(foodA.id)}
          >
            <span className="matchup-card__emoji" aria-hidden>{foodA.emoji}</span>
            <span className="matchup-card__name">{foodA.name}</span>
          </button>
        ) : (
          <div className="matchup-card__option matchup-card__option--bye">(tbd)</div>
        )}
        <span className="matchup-card__vs">vs</span>
        {foodB ? (
          <button
            type="button"
            className="matchup-card__option"
            onClick={() => onVote(foodB.id)}
          >
            <span className="matchup-card__emoji" aria-hidden>{foodB.emoji}</span>
            <span className="matchup-card__name">{foodB.name}</span>
          </button>
        ) : (
          <div className="matchup-card__option matchup-card__option--bye">(bye)</div>
        )}
      </div>
    </section>
  );
}
