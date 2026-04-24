# FoodFighter — rsbuild + React Scaffold

**Date:** 2026-04-24
**Scope:** Scaffold-only. No UI features from `SPEC.md` section 3 are implemented by this work.

## 1. Goal

Turn the current FoodFighter directory — which contains a pure-TypeScript tournament engine (`src/foods.ts`, `src/tournament.ts`, `src/types.ts`), a product spec (`SPEC.md`, `food-fighter-spec.docx`), and no build tooling — into a runnable rsbuild + React + TypeScript project with Vitest wired up. The existing engine files and spec docs are preserved verbatim.

A successful scaffold lets someone run:

- `pnpm install` → clean install
- `pnpm dev` → serves a placeholder page confirming the engine is wired in
- `pnpm test` → runs engine unit tests
- `pnpm type-check` → clean
- `pnpm build` → produces a `dist/` bundle

Actually building the bracket UI, voting flow, and champion screen described in `SPEC.md` is out of scope for this work and will be a separate follow-up.

## 2. Decisions

| Decision | Choice | Reasoning |
| --- | --- | --- |
| Build tool | rsbuild (`@rsbuild/core` + `@rsbuild/plugin-react`) | User-specified. |
| UI framework | React 19 | Latest stable; matches `SPEC.md` component plan. |
| Language | TypeScript, strict | Existing engine is already TS. |
| Test runner | Vitest | Engine code is pure TS with no rsbuild-specific loaders, so Rstest's aligned-transformer advantage doesn't apply. Vitest is more mature and has the widest ecosystem. |
| Package manager | pnpm | Standard in the rsbuild/Rspack ecosystem. |
| Engine location | Stays at `src/` root | Minimal churn to the three existing files' import paths. |
| Init approach | Hand-write all config files | Avoids the rsbuild CLI's refusal to scaffold into a non-empty directory, and gives explicit version control. |

## 3. Final Directory Layout

```
FoodFighter/
├── .gitignore                  (new)
├── package.json                (new)
├── tsconfig.json               (new)
├── tsconfig.node.json          (new)
├── rsbuild.config.ts           (new)
├── vitest.config.ts            (new)
├── index.html                  (new)
├── SPEC.md                     (kept, untouched)
├── food-fighter-spec.docx      (kept, untouched)
├── docs/
│   └── superpowers/specs/
│       └── 2026-04-24-rsbuild-scaffold-design.md   (this file)
└── src/
    ├── main.tsx                (new — React entry)
    ├── App.tsx                 (new — placeholder)
    ├── App.css                 (new — minimal baseline)
    ├── foods.ts                (existing, untouched)
    ├── tournament.ts           (existing, untouched)
    ├── types.ts                (existing, untouched)
    └── tournament.spec.ts      (new — engine tests)
```

## 4. File Contents

### 4.1 `package.json`

- `private: true`
- `type: "module"`
- `dependencies`: `react@^19`, `react-dom@^19`
- `devDependencies`: `@rsbuild/core`, `@rsbuild/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `vitest`
- Scripts:
  - `dev` → `rsbuild dev`
  - `build` → `rsbuild build`
  - `preview` → `rsbuild preview`
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `type-check` → `tsc --noEmit`

No jsdom, no `@testing-library/react` yet — the initial spec file only tests the pure engine, so a Node test environment is sufficient. Add those when UI tests appear.

### 4.2 `rsbuild.config.ts`

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  html: { template: "./index.html" },
  source: { entry: { index: "./src/main.tsx" } },
});
```

### 4.3 `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    globals: true,
  },
});
```

### 4.4 `tsconfig.json`

Posture:

- `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`
- `jsx: "react-jsx"`
- `strict: true`, `noUncheckedIndexedAccess: true`, `noFallthroughCasesInSwitch: true`
- `types: ["vitest/globals", "node"]`
- `skipLibCheck: true`
- `include: ["src"]`
- `references: [{ "path": "./tsconfig.node.json" }]`

### 4.5 `tsconfig.node.json`

For the rsbuild/vitest config files themselves:

- `composite: true`
- `module: "ESNext"`, `moduleResolution: "bundler"`
- `include: ["rsbuild.config.ts", "vitest.config.ts"]`

### 4.6 `index.html`

Standard rsbuild template:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FoodFighter</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### 4.7 `src/main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./App.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### 4.8 `src/App.tsx`

Placeholder that proves the engine is wired in without implementing any real UI:

```tsx
import { useState } from "react";
import { foods } from "./foods";
import { seedBracket, getCurrentMatchup } from "./tournament";

export function App() {
  const [bracket] = useState(() => seedBracket(foods));
  const current = getCurrentMatchup(bracket);
  return (
    <main>
      <h1>FoodFighter — scaffold OK</h1>
      <p>
        Round {bracket.currentRound + 1} of {bracket.rounds.length}
      </p>
      {current ? (
        <p>
          First matchup: {current.foodA.name} vs {current.foodB?.name ?? "(bye)"}
        </p>
      ) : (
        <p>No active matchup.</p>
      )}
    </main>
  );
}
```

### 4.9 `src/App.css`

Minimal reset and centered layout — around a dozen lines. Sets a system font stack, centers `<main>`, and gives the page a bit of padding.

### 4.10 `src/tournament.spec.ts`

Four tests that exercise the engine's guarantees:

1. `seedBracket` pads the bracket to the next power of 2 when `foods.length` isn't already a power of 2.
2. `seedBracket` produces `log2(size)` rounds total.
3. `pickWinner` returns a new bracket (input not mutated) with the given matchup resolved to the chosen winner.
4. `getCurrentMatchup` returns `null` once `bracket.champion` is set.

### 4.11 `.gitignore`

```
node_modules/
dist/
.DS_Store
*.log
```

## 5. Verification

After applying the scaffold, the following must hold before the work is considered complete:

1. `pnpm install` completes without errors.
2. `pnpm type-check` exits clean.
3. `pnpm test` reports 4 passing tests in `src/tournament.spec.ts`.
4. `pnpm dev` starts the dev server and the page renders "FoodFighter — scaffold OK" plus a round indicator and a matchup line, with no console errors.
5. `pnpm build` produces a `dist/` directory.

## 6. Explicit Non-Goals

- No `<BracketView />`, `<MatchupCard />`, or `<ChampionScreen />` components (these are `SPEC.md` section 6 and belong to a follow-up).
- No voting interaction.
- No confetti, no sounds, no custom-matchup creator, no shareable URL (`SPEC.md` section 8 bonuses).
- No ESLint or Prettier setup — can be added later when the team decides on a style.
- No CI config.
- No Docker, no deploy config.
