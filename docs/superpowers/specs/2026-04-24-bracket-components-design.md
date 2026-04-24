# FoodFighter — Bracket UI Components

**Date:** 2026-04-24
**Scope:** Build `<BracketView />`, `<MatchupCard />`, `<ChampionScreen />` per SPEC.md §6, rewire `<App />` with `useReducer`, and add per-component smoke tests. Bonus features from SPEC.md §8 (custom creator, URL sharing, category filter, sound) remain out of scope.

## 1. Goal

Turn the current placeholder `<App />` into a functioning bracket-voting experience that matches SPEC.md §3 (Bracket Generation, Voting, Bracket Display, Champion Screen, Food Database). A successful round-trip:

1. Open the app → see a bracket view plus the current matchup as two large clickable buttons.
2. Click one → that food advances, the other is visually eliminated, next matchup appears.
3. Keep clicking until the final vote → transition to full-screen champion with confetti.
4. Click "Restart" → reseeded fresh bracket.

`pnpm dev`, `pnpm build`, `pnpm type-check`, and `pnpm test` all pass.

## 2. Decisions

| Decision | Choice | Reasoning |
| --- | --- | --- |
| State management | Single `useReducer` at `<App />` | SPEC.md §4 mandates it. |
| Confetti | `canvas-confetti` | Named in SPEC.md §3.4. |
| Component testing | Smoke tests only via `@testing-library/react` + `jsdom` | User chose option B: safety net without interaction-test overhead. |
| Styling | Per-component global CSS files imported by each component | User chose option B: file-scoped without CSS Modules complexity. |
| Vitest env | Engine spec stays Node; component specs use `// @vitest-environment jsdom` file-level directive | Avoids global jsdom cost for pure-engine tests. |
| Confetti in tests | Mocked via `vi.mock("canvas-confetti", …)` | Test environment has no canvas. |

## 3. File Structure

```
src/
├── App.tsx                           (rewrite: adds useReducer + view switching)
├── App.css                           (unchanged from scaffold)
├── bracketReducer.ts                 (new)
├── main.tsx                          (unchanged)
├── foods.ts, tournament.ts, types.ts (unchanged)
├── tournament.spec.ts                (unchanged)
└── components/
    ├── BracketView.tsx
    ├── BracketView.css
    ├── BracketView.spec.tsx
    ├── MatchupCard.tsx
    ├── MatchupCard.css
    ├── MatchupCard.spec.tsx
    ├── ChampionScreen.tsx
    ├── ChampionScreen.css
    └── ChampionScreen.spec.tsx
```

Pattern: each component lives in one `.tsx`, imports its sibling `.css`, and has a sibling `.spec.tsx`. Small files, one responsibility each.

## 4. Reducer

`src/bracketReducer.ts`:

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

Consumers pass `initialBracket` as the lazy initializer to `useReducer`.

## 5. Components

### 5.1 `<App />`

Responsibilities:
- Own the bracket state via `useReducer(bracketReducer, undefined, initialBracket)`.
- If `getChampion(bracket)` is non-null → render `<ChampionScreen winner={…} onRestart={…} />`.
- Otherwise render `<BracketView bracket={…} />` and `<MatchupCard matchup={current} progress={…} onVote={…} />`.
- Compute `progress` as `{ matchIndex, matchesInRound, roundIndex, totalRounds }` for the MatchupCard header.
- If `getCurrentMatchup` returns `null` but there's no champion (shouldn't happen with the reducer's auto-advance logic, but guard for safety) → render a neutral "Advancing..." message.

### 5.2 `<BracketView bracket />`

Props: `{ bracket: Bracket }`.

Renders a horizontal flex of round columns. Each column is a vertical stack of matchup boxes. A matchup box shows `foodA` on top and `foodB` below (or "(bye)" if `foodB` is null), each with emoji + name.

Visual states per food slot:
- **Undecided + not current** — normal color.
- **Winner of decided matchup** — highlighted (green border or bold).
- **Loser of decided matchup** — strikethrough + muted gray.
- **Current matchup** (the matchup returned by `getCurrentMatchup`) — the whole box gets a colored ring.

Read-only: no click handlers. `BracketView` receives the bracket; it computes the current matchup internally via `getCurrentMatchup(bracket)` to avoid threading more props.

### 5.3 `<MatchupCard matchup progress onVote />`

Props:
```ts
{
  matchup: Matchup;
  progress: { matchIndex: number; matchesInRound: number; roundIndex: number; totalRounds: number };
  onVote: (winnerId: string) => void;
}
```

Renders:
- A progress line: `"Match {matchIndex+1} of {matchesInRound} — Round {roundIndex+1} of {totalRounds}"`.
- Two big buttons side-by-side, each showing emoji (large) + name. Clicking calls `onVote(food.id)`.
- If `matchup.foodB` is `null` (bye), the second button is disabled and shows "(bye)". In practice the reducer auto-resolves byes, so this is defensive.

### 5.4 `<ChampionScreen winner onRestart />`

Props: `{ winner: Food; onRestart: () => void }`.

Renders a full-viewport container with the winner's emoji (huge) and name, plus a "Play Again" button that calls `onRestart`.

Fires confetti once from `useEffect(() => { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } }); }, [])`.

## 6. Tests

### 6.1 Engine spec — unchanged

`src/tournament.spec.ts` stays as-is. Still runs under the default Node environment.

### 6.2 Reducer spec (new)

`src/bracketReducer.spec.ts` — three tests, Node env:
1. `vote` resolves a matchup.
2. `vote` advances the round when all matchups in the round are decided.
3. `restart` returns a fresh bracket (different object identity, round 0, no champion).

### 6.3 Component smoke tests

Each `*.spec.tsx` starts with `// @vitest-environment jsdom` and uses `@testing-library/react`.

**`BracketView.spec.tsx`:** renders with a freshly seeded bracket; asserts the document contains a known food name from the first matchup.

**`MatchupCard.spec.tsx`:** renders with a canned matchup + progress; asserts both food names are in the document and clicking one of them triggers `onVote` with the right id.

**`ChampionScreen.spec.tsx`:** `vi.mock("canvas-confetti")` before the import. Renders with a canned winner; asserts winner name is shown and that `confetti` mock was called once.

## 7. New Dependencies

Runtime:
- `canvas-confetti@^1.9.3`

Dev:
- `@testing-library/react@^16.0.0`
- `jsdom@^25.0.0`
- `@types/canvas-confetti@^1.9.0`

Added via `pnpm add` (commands appear in the plan).

## 8. Verification

1. `pnpm type-check` clean.
2. `pnpm test` — 4 engine tests + 3 reducer tests + 3 component smoke tests = 10 passing tests.
3. `pnpm build` succeeds.
4. `pnpm dev` manual smoke: bracket renders, voting advances through rounds, champion screen appears after final vote with visible confetti, restart resets.

## 9. Out of Scope (deferred)

- SPEC.md §8 bonuses (custom creator, shareable URL, category filter, sound effects).
- Full interaction tests simulating an entire tournament.
- Accessibility work (SPEC.md §2 explicitly lists as out of scope for the hackathon build).
- Mobile-specific layouts beyond whatever flex + sensible min-widths provide.
