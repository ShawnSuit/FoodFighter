import { useLayoutEffect, useRef, useState } from "react";
import type { Bracket, Matchup, Food } from "../types";
import { getCurrentMatchup } from "../tournament";
import "./BracketView.css";

interface Props {
  bracket: Bracket;
}

interface Connector {
  from: { x: number; y: number };
  to: { x: number; y: number };
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const matchupRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const [connectors, setConnectors] = useState<Connector[]>([]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const compute = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const next: Connector[] = [];
      for (let r = 0; r < bracket.rounds.length - 1; r++) {
        const round = bracket.rounds[r];
        const nextRound = bracket.rounds[r + 1];
        for (let i = 0; i < round.length; i++) {
          const src = matchupRefs.current.get(round[i].id);
          const dst = matchupRefs.current.get(nextRound[Math.floor(i / 2)].id);
          if (!src || !dst) continue;
          const s = src.getBoundingClientRect();
          const d = dst.getBoundingClientRect();
          next.push({
            from: {
              x: s.right - canvasRect.left,
              y: s.top + s.height / 2 - canvasRect.top,
            },
            to: {
              x: d.left - canvasRect.left,
              y: d.top + d.height / 2 - canvasRect.top,
            },
          });
        }
      }
      setConnectors(next);
    };

    compute();
    // ResizeObserver isn't available in jsdom; guard so component tests don't crash.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(compute);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [bracket]);

  return (
    <div className="bracket-view" aria-label="Tournament bracket">
      <div className="bracket-view__canvas" ref={canvasRef}>
        <svg className="bracket-view__connectors" aria-hidden>
          {connectors.map((c, i) => {
            const midX = (c.from.x + c.to.x) / 2;
            const d = `M ${c.from.x} ${c.from.y} H ${midX} V ${c.to.y} H ${c.to.x}`;
            return <path key={i} d={d} />;
          })}
        </svg>
        {bracket.rounds.map((round, roundIndex) => (
          <div className="bracket-view__round" key={roundIndex}>
            <h2 className="bracket-view__round-title">Round {roundIndex + 1}</h2>
            <ul
              className="bracket-view__matchups"
              style={{ gap: `${roundIndex === 0 ? 0.5 : 3 ** roundIndex}rem` }}
            >
              {round.map((matchup) => {
                const isCurrent = matchup.id === currentMatchupId;
                return (
                  <li
                    key={matchup.id}
                    ref={(el) => {
                      if (el) matchupRefs.current.set(matchup.id, el);
                      else matchupRefs.current.delete(matchup.id);
                    }}
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
    </div>
  );
}
