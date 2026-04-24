import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { Food } from "../types";
import "./ChampionScreen.css";

interface Props {
  winner: Food;
  onRestart: () => void;
}

export function ChampionScreen({ winner, onRestart }: Props) {
  useEffect(() => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
  }, []);

  return (
    <section className="champion-screen" role="dialog" aria-label="Champion">
      <p className="champion-screen__label">Champion</p>
      <div className="champion-screen__emoji" aria-hidden>{winner.emoji}</div>
      <h1 className="champion-screen__name">{winner.name}</h1>
      <button
        type="button"
        className="champion-screen__restart"
        onClick={onRestart}
      >
        Play Again
      </button>
    </section>
  );
}
