# FoodFighter Bracket UI Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the placeholder scaffold into a working bracket-voting experience: `<BracketView />`, `<MatchupCard />`, `<ChampionScreen />` driven by a `useReducer` inside `<App />`, per SPEC.md §3/§4/§6.

**Architecture:** One reducer (`bracketReducer.ts`) wraps the engine's `pickWinner` + `advanceRound`. `<App />` dispatches actions and decides which view to show. Each component lives in its own file with a sibling CSS file and a sibling smoke test. Engine files stay untouched.

**Tech Stack:** React 19, TypeScript (strict minus `noUncheckedIndexedAccess`), Vitest, `@testing-library/react` + `jsdom` for component tests (file-level `// @vitest-environment jsdom` directives), `canvas-confetti` for the champion reveal.

**Spec:** `docs/superpowers/specs/2026-04-24-bracket-components-design.md`

**Working directory:** `/Users/lawangin.khan/Documents/code/FoodFighter`

**Branch strategy:** Continue on `main` (consistent with the scaffold work).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/bracketReducer.ts` | Reducer + `BracketAction` type + `initialBracket` helper. |
| `src/bracketReducer.spec.ts` | Three reducer tests (Node env). |
| `src/components/BracketView.tsx` | Read-only overview of all rounds/matchups. Computes current matchup internally. |
| `src/components/BracketView.css` | Styles for BracketView. |
| `src/components/BracketView.spec.tsx` | Smoke test (jsdom). |
| `src/components/MatchupCard.tsx` | Two-button vote UI + round progress header. |
| `src/components/MatchupCard.css` | Styles for MatchupCard. |
| `src/components/MatchupCard.spec.tsx` | Smoke test + click triggers onVote (jsdom). |
| `src/components/ChampionScreen.tsx` | Full-screen winner reveal + confetti + restart button. |
| `src/components/ChampionScreen.css` | Styles for ChampionScreen. |
| `src/components/ChampionScreen.spec.tsx` | Smoke test + confetti mock called (jsdom). |
| `src/App.tsx` | **Rewritten** — useReducer, view switching, progress calc. |

Untouched: `src/foods.ts`, `src/tournament.ts`, `src/types.ts`, `src/tournament.spec.ts`, `src/main.tsx`, `src/App.css`, all scaffold configs.

---

## Task 1: Install new dependencies

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install runtime dep**

Run:
```bash
pnpm add canvas-confetti
```

Expected: `package.json` `dependencies` gains `canvas-confetti` at ^1.9.x. Exit 0.

- [ ] **Step 2: Install dev deps**

Run:
```bash
pnpm add -D @types/canvas-confetti @testing-library/react jsdom
```

Expected: `package.json` `devDependencies` gains `@types/canvas-confetti`, `@testing-library/react`, `jsdom`. Exit 0.

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: 4 engine tests still pass, exit 0.

- [ ] **Step 4: Verify type-check still clean**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add canvas-confetti, testing-library/react, jsdom"
```

---

## Task 2: bracketReducer + tests (TDD)

**Files:**
- Create: `src/bracketReducer.ts`
- Create: `src/bracketReducer.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/bracketReducer.spec.ts`:

```ts
import { describe, it, expect } from "vitest";
import { bracketReducer, initialBracket } from "./bracketReducer";
import { seedBracket } from "./tournament";
import type { Food } from "./types";

const makeFoods = (n: number): Food[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    name: `Food ${i}`,
    emoji: "🍽️",
    category: "fast-food" as const,
  }));

describe("bracketReducer", () => {
  it("'vote' resolves the targeted matchup", () => {
    const state = seedBracket(makeFoods(4));
    const matchup = state.rounds[0][0];
    const winnerId = matchup.foodA.id;

    const next = bracketReducer(state, {
      type: "vote",
      matchupId: matchup.id,
      winnerId,
    });

    const resolved = next.rounds[0].find((m) => m.id === matchup.id);
    expect(resolved?.winner?.id).toBe(winnerId);
  });

  it("'vote' auto-advances when the last matchup in a non-final round is decided", () => {
    // 4 foods → 2 first-round matchups, 2 rounds total.
    let state = seedBracket(makeFoods(4));
    const [m0, m1] = state.rounds[0];

    state = bracketReducer(state, {
      type: "vote",
      matchupId: m0.id,
      winnerId: m0.foodA.id,
    });
    state = bracketReducer(state, {
      type: "vote",
      matchupId: m1.id,
      winnerId: m1.foodA.id,
    });

    expect(state.currentRound).toBe(1);
  });

  it("'restart' returns a fresh bracket with no champion and round 0", () => {
    const state = initialBracket();
    const mutated = { ...state, currentRound: 99, champion: state.rounds[0][0].foodA };
    const fresh = bracketReducer(mutated, { type: "restart" });

    expect(fresh.currentRound).toBe(0);
    expect(fresh.champion).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm test src/bracketReducer.spec.ts`
Expected: FAIL — imports from `./bracketReducer` resolve to nothing.

- [ ] **Step 3: Implement the reducer**

Create `src/bracketReducer.ts`:

```ts
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
```

- [ ] **Step 4: Run tests — expect 3 passing**

Run: `pnpm test src/bracketReducer.spec.ts`
Expected: 3 passing tests.

- [ ] **Step 5: Full test + type-check**

Run: `pnpm test && pnpm type-check`
Expected: 4 engine + 3 reducer = 7 passing tests, type-check clean.

- [ ] **Step 6: Commit**

```bash
git add src/bracketReducer.ts src/bracketReducer.spec.ts
git commit -m "feat: add bracketReducer with vote/restart actions"
```

---

## Task 3: MatchupCard component + smoke test

**Files:**
- Create: `src/components/MatchupCard.tsx`
- Create: `src/components/MatchupCard.css`
- Create: `src/components/MatchupCard.spec.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/components/MatchupCard.spec.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchupCard } from "./MatchupCard";
import type { Matchup } from "../types";

const matchup: Matchup = {
  id: "r0-m0",
  foodA: { id: "pizza", name: "Pizza", emoji: "🍕", category: "fast-food" },
  foodB: { id: "burger", name: "Burger", emoji: "🍔", category: "fast-food" },
  winner: null,
};

const progress = {
  matchIndex: 0,
  matchesInRound: 4,
  roundIndex: 0,
  totalRounds: 3,
};

describe("MatchupCard", () => {
  it("renders both foods and a progress line, and fires onVote with the clicked food's id", () => {
    const onVote = vi.fn();
    render(<MatchupCard matchup={matchup} progress={progress} onVote={onVote} />);

    expect(screen.getByText("Pizza")).toBeDefined();
    expect(screen.getByText("Burger")).toBeDefined();
    expect(screen.getByText(/Match 1 of 4/)).toBeDefined();

    fireEvent.click(screen.getByText("Pizza"));
    expect(onVote).toHaveBeenCalledWith("pizza");
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test src/components/MatchupCard.spec.tsx`
Expected: FAIL — module `./MatchupCard` not found.

- [ ] **Step 3: Implement `MatchupCard.tsx`**

Create `src/components/MatchupCard.tsx`:

```tsx
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
        <button
          type="button"
          className="matchup-card__option"
          onClick={() => onVote(foodA.id)}
        >
          <span className="matchup-card__emoji" aria-hidden>{foodA.emoji}</span>
          <span className="matchup-card__name">{foodA.name}</span>
        </button>
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
          <div className="matchup-card__option matchup-card__option--bye">
            (bye)
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create the stylesheet**

Create `src/components/MatchupCard.css`:

```css
.matchup-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1rem;
}

.matchup-card__progress {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  letter-spacing: 0.02em;
}

.matchup-card__options {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.matchup-card__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  min-width: 8rem;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s, transform 0.1s;
}

.matchup-card__option:hover {
  border-color: #4a90e2;
  transform: translateY(-2px);
}

.matchup-card__option--bye {
  cursor: default;
  color: #999;
  border-style: dashed;
}

.matchup-card__emoji {
  font-size: 2.5rem;
}

.matchup-card__name {
  font-weight: 600;
}

.matchup-card__vs {
  font-weight: 700;
  color: #999;
}
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test src/components/MatchupCard.spec.tsx`
Expected: 1 passing test.

- [ ] **Step 6: Full test + type-check**

Run: `pnpm test && pnpm type-check`
Expected: 8 tests pass (4 engine + 3 reducer + 1 component). Type-check clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/MatchupCard.tsx src/components/MatchupCard.css src/components/MatchupCard.spec.tsx
git commit -m "feat: add MatchupCard component with vote buttons"
```

---

## Task 4: BracketView component + smoke test

**Files:**
- Create: `src/components/BracketView.tsx`
- Create: `src/components/BracketView.css`
- Create: `src/components/BracketView.spec.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/components/BracketView.spec.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BracketView } from "./BracketView";
import { seedBracket } from "../tournament";
import type { Food } from "../types";

describe("BracketView", () => {
  it("renders every food in the seeded bracket", () => {
    const foods: Food[] = Array.from({ length: 4 }, (_, i) => ({
      id: `f${i}`,
      name: `Food${i}`,
      emoji: "🍽️",
      category: "fast-food" as const,
    }));
    const bracket = seedBracket(foods);
    render(<BracketView bracket={bracket} />);

    expect(screen.getAllByText(/Food[0-3]/)).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test src/components/BracketView.spec.tsx`
Expected: FAIL — module `./BracketView` not found.

- [ ] **Step 3: Implement `BracketView.tsx`**

Create `src/components/BracketView.tsx`:

```tsx
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

function renderFood(food: Food | null) {
  if (!food) return <span className="bracket-view__bye">(bye)</span>;
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
                    {renderFood(matchup.foodA)}
                  </div>
                  <div className={slotClass(matchup, "B")}>
                    {renderFood(matchup.foodB)}
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
```

- [ ] **Step 4: Create the stylesheet**

Create `src/components/BracketView.css`:

```css
.bracket-view {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.bracket-view__round {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 9rem;
}

.bracket-view__round-title {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
}

.bracket-view__matchups {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bracket-view__matchup {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.3rem;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.bracket-view__matchup--current {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

.bracket-view__slot {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.bracket-view__slot--winner {
  background: #e7f4ea;
  font-weight: 600;
}

.bracket-view__slot--loser {
  color: #aaa;
  text-decoration: line-through;
}

.bracket-view__slot--bye {
  color: #bbb;
  font-style: italic;
}

.bracket-view__emoji {
  font-size: 1.1rem;
}

.bracket-view__bye {
  color: #bbb;
  font-style: italic;
}
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test src/components/BracketView.spec.tsx`
Expected: 1 passing test.

- [ ] **Step 6: Full test + type-check**

Run: `pnpm test && pnpm type-check`
Expected: 9 passing tests (4 engine + 3 reducer + 2 component). Type-check clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/BracketView.tsx src/components/BracketView.css src/components/BracketView.spec.tsx
git commit -m "feat: add BracketView component with round/matchup visualization"
```

---

## Task 5: ChampionScreen component + smoke test

**Files:**
- Create: `src/components/ChampionScreen.tsx`
- Create: `src/components/ChampionScreen.css`
- Create: `src/components/ChampionScreen.spec.tsx`

- [ ] **Step 1: Write the failing smoke test**

Create `src/components/ChampionScreen.spec.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Food } from "../types";

const confettiMock = vi.fn();
vi.mock("canvas-confetti", () => ({
  default: (...args: unknown[]) => confettiMock(...args),
}));

import { ChampionScreen } from "./ChampionScreen";

const winner: Food = {
  id: "pizza",
  name: "Pizza",
  emoji: "🍕",
  category: "fast-food",
};

describe("ChampionScreen", () => {
  beforeEach(() => {
    confettiMock.mockClear();
  });

  it("renders the winner and fires confetti on mount", () => {
    const onRestart = vi.fn();
    render(<ChampionScreen winner={winner} onRestart={onRestart} />);

    expect(screen.getByText("Pizza")).toBeDefined();
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it("calls onRestart when the restart button is clicked", () => {
    const onRestart = vi.fn();
    render(<ChampionScreen winner={winner} onRestart={onRestart} />);

    fireEvent.click(screen.getByRole("button", { name: /play again/i }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test src/components/ChampionScreen.spec.tsx`
Expected: FAIL — module `./ChampionScreen` not found.

- [ ] **Step 3: Implement `ChampionScreen.tsx`**

Create `src/components/ChampionScreen.tsx`:

```tsx
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
```

- [ ] **Step 4: Create the stylesheet**

Create `src/components/ChampionScreen.css`:

```css
.champion-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #fff 0%, #f4f4f4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  z-index: 10;
}

.champion-screen__label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #888;
  font-size: 0.9rem;
}

.champion-screen__emoji {
  font-size: 8rem;
  line-height: 1;
}

.champion-screen__name {
  margin: 0;
  font-size: 3rem;
}

.champion-screen__restart {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  font: inherit;
  font-weight: 600;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.champion-screen__restart:hover {
  background: #3a7dcf;
}
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test src/components/ChampionScreen.spec.tsx`
Expected: 2 passing tests.

- [ ] **Step 6: Full test + type-check**

Run: `pnpm test && pnpm type-check`
Expected: 11 passing tests (4 engine + 3 reducer + 4 component). Type-check clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/ChampionScreen.tsx src/components/ChampionScreen.css src/components/ChampionScreen.spec.tsx
git commit -m "feat: add ChampionScreen with canvas-confetti and restart"
```

---

## Task 6: Rewire `<App />` to drive the reducer and all three components

**Files:**
- Modify: `src/App.tsx` (complete rewrite)

- [ ] **Step 1: Replace `src/App.tsx` with the reducer-driven version**

Overwrite the file with:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: 11 tests still pass.

- [ ] **Step 4: Production build smoke**

Run: `pnpm build`
Expected: exit 0.

- [ ] **Step 5: Dev server HTTP smoke**

Run:
```bash
pnpm dev > /tmp/ff-dev.log 2>&1 &
DEV_PID=$!
sleep 5
URL=$(grep -oE "http://localhost:[0-9]+" /tmp/ff-dev.log | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "$URL"
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

Expected: prints `200`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App to bracketReducer with BracketView/MatchupCard/ChampionScreen"
```

---

## Task 7: Final verification sweep

- [ ] **Step 1: Clean install**

Run:
```bash
rm -rf node_modules dist
pnpm install
```
Expected: clean, exit 0.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 3: All tests**

Run: `pnpm test`
Expected: 11 passing tests (4 engine + 3 reducer + 4 component).

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: exit 0, `dist/` populated.

- [ ] **Step 5: Dev server HTTP smoke**

Run:
```bash
pnpm dev > /tmp/ff-dev.log 2>&1 &
DEV_PID=$!
sleep 5
URL=$(grep -oE "http://localhost:[0-9]+" /tmp/ff-dev.log | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "$URL"
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```
Expected: `200`.

- [ ] **Step 6: Verify untouched files**

Run:
```bash
git log --oneline --follow src/foods.ts
git log --oneline --follow src/tournament.ts
git log --oneline --follow src/types.ts
git log --oneline --follow src/tournament.spec.ts
git log --oneline --follow src/main.tsx
git log --oneline --follow src/App.css
```
Expected: none of these should list any commits from this plan's work (only pre-existing commits).

- [ ] **Step 7: No final commit needed**

If the verification above produced no changes, skip. Otherwise investigate before committing anything.

---

## Acceptance criteria

- [x] `pnpm test` — 11 passing tests (4 engine + 3 reducer + 4 component).
- [x] `pnpm type-check` clean.
- [x] `pnpm build` succeeds.
- [x] `pnpm dev` serves the app; bracket is visible, voting advances, champion screen appears at the end with confetti, restart reseeds.
- [x] Engine files (`foods.ts`, `tournament.ts`, `types.ts`) unchanged.
- [x] Engine spec (`tournament.spec.ts`) unchanged.
