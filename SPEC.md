# Food Fighter

## Product Specification

**Hackathon Build — v1.0**

## 1. Overview

Food Fighter is a single-page bracket tournament app that lets a group settle food debates once and for all. Users vote head-to-head between two foods per round, advancing winners until one champion is crowned. The app is designed to be built in 90 minutes by a team of four, demoed live, and played in a group setting.

| Field             | Value                              |
| ----------------- | ---------------------------------- |
| Project name      | Food Fighter                       |
| Event             | 90-minute hackathon                |
| Team size         | 4 people                           |
| Target platform   | Web browser (desktop + mobile)     |
| Intended use      | Group play, live demo              |

## 2. Goals & Non-Goals

### Goals

- Run a single-elimination bracket tournament between 8–32 food items
- Let users vote on one matchup at a time, advancing the winner to the next round
- Display a visual bracket that updates in real time as votes are cast
- Reveal a champion with a celebratory end screen
- Be completable and demoable within the 90-minute build window

### Non-Goals

- User accounts, login, or persistent storage — all state lives in memory
- Multiplayer or networked voting — one device drives the session
- Backend, database, or API — fully client-side
- Mobile app — browser only
- Accessibility compliance — out of scope for the hackathon build

## 3. Features

### 3.1 Bracket Generation

- On load, the app seeds a default food list into a single-elimination bracket
- Bracket size must be a power of 2 (8, 16, or 32). If the food list has an odd count, one food receives a bye and auto-advances
- Seeding is randomised on each page load so matchups differ between sessions
- A custom mode (bonus) allows users to type in their own food names before the bracket is generated

### 3.2 Voting

- Each round presents one matchup at a time: two foods, side by side
- The user taps or clicks a food to vote for it — it advances, the other is eliminated
- No undo — once a vote is cast, it is final for that session
- Round progress is shown (e.g. "Match 3 of 4 — Round 1")
- After all matchups in a round are decided, the bracket automatically advances to the next round

### 3.3 Bracket Display

- A persistent bracket view shows all rounds and matchups
- Eliminated foods are visually distinguished from active and undecided slots
- The current matchup is highlighted so users can see where they are
- The bracket is read-only during voting — users navigate it but cannot click past the current round

### 3.4 Champion Screen

- When the final vote is cast, the app transitions to a full-screen champion reveal
- The winning food's name and emoji are displayed prominently
- A confetti animation fires on reveal (canvas-confetti)
- A restart button resets state and re-seeds a fresh bracket

### 3.5 Food Database

- The default food list contains 16–32 items with a name, emoji, and category
- Categories include: fast food, world cuisine, snacks, desserts
- The list is hardcoded in a JS module and imported by the tournament engine
- No external data fetching — all data is bundled at build time

## 4. Data Model

All state is held in a single bracket object managed by a `useReducer` at the app root. No external state library is used.

| Field                   | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `id`                    | Unique string identifier for the food item                                  |
| `name`                  | Display name (e.g. "Tacos")                                                 |
| `emoji`                 | Single emoji representing the food                                          |
| `category`              | One of: `fast-food` \| `world-cuisine` \| `snacks` \| `desserts`           |
| `bracket.rounds`        | Array of rounds, each containing an array of matchups                       |
| `bracket.currentRound`  | Zero-based index of the active round                                        |
| `bracket.currentMatchup`| Index of the active matchup within the current round                        |
| `bracket.champion`      | `null` until the final vote is cast; then the winning food object           |
| `matchup.foodA`         | First food in the pair                                                      |
| `matchup.foodB`         | Second food in the pair (`null` if bye)                                     |
| `matchup.winner`        | `null` until voted; then the winning food object                            |

## 5. Function Contracts

The tournament engine must export the following functions.

| Function | Signature & Behaviour |
| --- | --- |
| `seedBracket(foods)` | Takes an array of food objects. Returns an initial bracket object with round 1 matchups randomised. Pads to the nearest power of 2 with byes if needed. |
| `pickWinner(bracket, matchupId, winnerId)` | Returns a new bracket object with the given matchup resolved. Advances the winner to the next round. Does not mutate the input. |
| `getCurrentMatchup(bracket)` | Returns the matchup object the user should vote on next, or `null` if the round is complete. |
| `advanceRound(bracket)` | Returns a new bracket object with `currentRound` incremented and the next round's matchups seeded from the previous round's winners. |
| `getChampion(bracket)` | Returns the winning food object if the tournament is complete, otherwise `null`. |

## 6. Component Boundaries

The UI is split into four React components.

| Component | Responsibility |
| --- | --- |
| `<App />` | Root. Owns bracket state via `useReducer`. Passes state and dispatch to children. Decides which view to render (voting vs champion screen). |
| `<BracketView />` | Renders the full bracket tree, all rounds, all matchups. Read-only. Highlights the active matchup. |
| `<MatchupCard />` | Renders the current head-to-head vote. Two food options, click to vote. Fires callback with winner ID. |
| `<ChampionScreen />` | Shown when `getChampion(bracket)` is non-null. Displays winner, fires confetti, provides restart button. |

## 7. Known Limitations

- State is lost on page refresh — there is no persistence layer
- Only one active tournament at a time — no save/resume
- Voting is not authenticated — anyone with the screen can cast votes
- Bracket size is fixed at generation time — foods cannot be added mid-tournament
- No tie-breaking logic — the first click wins

## 8. Bonus Features (time permitting)

These should only be attempted after core integration is stable.

- **Custom matchup creator** — text inputs to enter your own food names before the bracket seeds
- **Shareable results** — encode the champion and bracket outcome in a URL query string
- **Category filter** — toggle which food categories are included before seeding
- **Sound effects** — short audio cues on vote and on champion reveal
