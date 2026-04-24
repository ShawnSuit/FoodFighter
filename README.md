# 🍕 Food Fighter

**March Madness for what's on your plate.**

Seed a bracket of your favorite foods, fight them head-to-head, crown a
champion. Pizza vs. Sushi. Donut vs. Ramen. Only one survives.

## Why it's good

- **A real tournament, not a toy.** Any number of foods, padded cleanly
  to the next power of two. Byes auto-resolve in round 0 so the bracket
  shape is always honest.
- **Pure engine, predictable UI.** The whole bracket is computed at seed
  time and every state transition is immutable — a natural fit for
  React's `useReducer`, trivial to undo, snapshot, or share.
- **Addressable matchups.** Every fight has a stable ID
  (`r{round}-m{matchup}`) so the UI can deep-link, replay, or animate
  any slot.
- **Tested where it hurts.** Bye math, slot-placement, immutability,
  bad inputs, and full-tournament runs — all covered by the suite.
- **Single page, zero backend.** React + rsbuild, nothing to deploy
  beyond static files.

## The foods

32 contenders, 8 per category:

- 🍔 **Fast Food** — Pizza, Burger, Fries, Hot Dog, ...
- 🍣 **World Cuisine** — Sushi, Tacos, Ramen, Curry, ...
- 🍿 **Snacks** — Popcorn, Pretzel, Chips, Peanuts, ...
- 🍩 **Desserts** — Cake, Ice Cream, Donut, Cookie, ...

## Run it

```bash
pnpm install
pnpm dev
```

Then open the local URL rsbuild prints and start picking winners.
