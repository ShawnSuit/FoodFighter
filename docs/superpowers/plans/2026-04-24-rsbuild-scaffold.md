# FoodFighter rsbuild + React Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current FoodFighter directory (pure-TS tournament engine + SPEC docs, no build tooling) into a runnable rsbuild + React 19 + TypeScript project with Vitest wired up, preserving all existing engine files untouched.

**Architecture:** Hand-write every config file (rsbuild CLI refuses non-empty dirs). React entry renders a placeholder `<App />` that imports the existing engine to prove wiring. Vitest runs in Node environment — no jsdom needed because the first spec file only exercises the pure engine.

**Tech Stack:** rsbuild (`@rsbuild/core` + `@rsbuild/plugin-react`), React 19, TypeScript 5 (strict, `moduleResolution: bundler`), Vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-24-rsbuild-scaffold-design.md`

**Working directory:** `/Users/lawangin.khan/Documents/code/FoodFighter`

**Note on TDD posture:** The one spec file added here (`src/tournament.spec.ts`) tests the *existing* engine, so tests pass on first run rather than red-then-green. That's expected and correct for "add tests for already-shipped code." The TDD discipline kicks in later when UI tasks are planned.

---

## File Structure

Files created by this plan:

| File | Responsibility |
| --- | --- |
| `.gitignore` | Ignore `node_modules/`, `dist/`, `.DS_Store`, `*.log`. |
| `package.json` | Dependency manifest, scripts, `"type": "module"`. |
| `tsconfig.json` | App-side TS config: strict, React JSX, ES2022, bundler resolution, references `tsconfig.node.json`. |
| `tsconfig.node.json` | Config-file-side TS config for `rsbuild.config.ts` and `vitest.config.ts`. |
| `rsbuild.config.ts` | rsbuild entry + React plugin + HTML template. |
| `vitest.config.ts` | Vitest config: Node env, globals enabled, `src/**/*.spec.ts` matcher. |
| `index.html` | HTML template with `<div id="root"></div>`. |
| `src/main.tsx` | React 19 root — calls `createRoot` and renders `<App />`. |
| `src/App.tsx` | Placeholder component proving engine is wired. |
| `src/App.css` | Minimal baseline styling. |
| `src/tournament.spec.ts` | Four Vitest tests covering the existing engine's guarantees. |

Files *not* touched: `src/foods.ts`, `src/tournament.ts`, `src/types.ts`, `SPEC.md`, `food-fighter-spec.docx`.

---

## Task 1: package.json, .gitignore, and dependency install

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Write `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "food-fighter",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "rsbuild dev",
    "build": "rsbuild build",
    "preview": "rsbuild preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@rsbuild/core": "^1.1.0",
    "@rsbuild/plugin-react": "^1.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`
Expected: creates `node_modules/` and `pnpm-lock.yaml`, exits 0.

If pnpm isn't installed, run `npm install -g pnpm` first.

- [ ] **Step 4: Verify rsbuild binary is available**

Run: `pnpm exec rsbuild --help`
Expected: prints rsbuild CLI help text, exits 0.

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml
git commit -m "chore: init package.json, install rsbuild + React + Vitest"
```

---

## Task 2: TypeScript configuration

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "skipLibCheck": true,
    "types": ["vitest/globals", "node"],
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["rsbuild.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Verify the existing engine still type-checks**

Run: `pnpm type-check`
Expected: exits 0 with no errors. Warnings OK.

Note: `tsc` will complain that `rsbuild.config.ts` and `vitest.config.ts` are listed in `tsconfig.node.json` but don't exist yet. Expected — they're created in Tasks 3 and 6. If the error text matches "file not found", skip and proceed. If the engine files themselves have type errors, stop and investigate.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json tsconfig.node.json
git commit -m "chore: add TypeScript configs (strict, react-jsx, bundler resolution)"
```

---

## Task 3: rsbuild config and HTML template

**Files:**
- Create: `rsbuild.config.ts`
- Create: `index.html`

- [ ] **Step 1: Write `index.html`**

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

- [ ] **Step 2: Write `rsbuild.config.ts`**

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  html: { template: "./index.html" },
  source: { entry: { index: "./src/main.tsx" } },
});
```

- [ ] **Step 3: Commit (no build yet — entry file doesn't exist until Task 4)**

```bash
git add rsbuild.config.ts index.html
git commit -m "chore: add rsbuild config and HTML template"
```

---

## Task 4: React entry and placeholder App

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`

- [ ] **Step 1: Write `src/App.css`**

```css
:root {
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  line-height: 1.5;
  color: #1a1a1a;
  background: #fafafa;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

main {
  max-width: 640px;
  width: 100%;
}

h1 {
  margin-top: 0;
}
```

- [ ] **Step 2: Write `src/App.tsx`**

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
          First matchup: {current.foodA.name} vs{" "}
          {current.foodB?.name ?? "(bye)"}
        </p>
      ) : (
        <p>No active matchup.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Write `src/main.tsx`**

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./App.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");
createRoot(container).render(<App />);
```

Note: the explicit null check is needed because `noUncheckedIndexedAccess` and strict mode flag the non-null assertion as unsafe in some configs — this keeps `pnpm type-check` clean without a bang.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: exits 0 with no errors.

- [ ] **Step 5: Smoke-test the dev server**

Run: `pnpm dev`
Expected: server starts (default `http://localhost:3000`), no compile errors in terminal. Open the URL in a browser — page shows:
- "FoodFighter — scaffold OK"
- "Round 1 of 5" (bracket of 32 → log2(32) = 5 rounds)
- "First matchup: <FoodA> vs <FoodB>" with two random food names

Stop the dev server with Ctrl+C once confirmed.

- [ ] **Step 6: Production build smoke test**

Run: `pnpm build`
Expected: exits 0, `dist/` directory created with `index.html` and hashed JS bundles.

- [ ] **Step 7: Commit**

```bash
git add src/main.tsx src/App.tsx src/App.css
git commit -m "feat: add React entry and placeholder App wired to engine"
```

---

## Task 5: Vitest config and engine spec file

**Files:**
- Create: `vitest.config.ts`
- Create: `src/tournament.spec.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

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

- [ ] **Step 2: Write `src/tournament.spec.ts`**

```ts
import { describe, it, expect } from "vitest";
import { seedBracket, pickWinner, getCurrentMatchup } from "./tournament";
import type { Food } from "./types";

const makeFoods = (n: number): Food[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    name: `Food ${i}`,
    emoji: "🍽️",
    category: "fast-food" as const,
  }));

describe("seedBracket", () => {
  it("pads the bracket to the next power of 2 when input isn't one", () => {
    const bracket = seedBracket(makeFoods(6));
    // 6 foods → bracket size 8 → 4 first-round matchups
    expect(bracket.rounds[0]).toHaveLength(4);
  });

  it("produces log2(size) rounds", () => {
    const bracket = seedBracket(makeFoods(8));
    // size 8 → log2(8) = 3 rounds
    expect(bracket.rounds).toHaveLength(3);
  });
});

describe("pickWinner", () => {
  it("returns a new bracket with the matchup resolved and does not mutate input", () => {
    const original = seedBracket(makeFoods(4));
    const matchup = original.rounds[0]![0]!;
    const winnerId = matchup.foodA.id;

    const updated = pickWinner(original, matchup.id, winnerId);

    // Input untouched
    expect(original.rounds[0]![0]!.winner).toBeNull();
    // Output has resolved winner
    const updatedMatchup = updated.rounds[0]!.find((m) => m.id === matchup.id)!;
    expect(updatedMatchup.winner?.id).toBe(winnerId);
  });
});

describe("getCurrentMatchup", () => {
  it("returns null once a champion is set", () => {
    const bracket = seedBracket(makeFoods(2));
    const final = bracket.rounds[0]![0]!;
    const resolved = pickWinner(bracket, final.id, final.foodA.id);

    expect(resolved.champion).not.toBeNull();
    expect(getCurrentMatchup(resolved)).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `pnpm test`
Expected: 4 passing tests across 3 describe blocks, exit 0.

If any fail: the engine's behavior may differ from the spec claims — stop and surface the discrepancy to the user rather than editing the engine.

- [ ] **Step 4: Verify type-check still clean**

Run: `pnpm type-check`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/tournament.spec.ts
git commit -m "test: add Vitest config and engine spec covering seedBracket/pickWinner/getCurrentMatchup"
```

---

## Task 6: Final verification sweep

No new files — this task confirms everything in Section 5 of the spec still holds together.

- [ ] **Step 1: Clean install from scratch**

Run:
```bash
rm -rf node_modules dist
pnpm install
```
Expected: clean install, no errors.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: exits 0, no errors.

- [ ] **Step 3: Tests**

Run: `pnpm test`
Expected: 4 passing tests, exit 0.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: exits 0, `dist/index.html` and hashed JS/CSS bundles present.

- [ ] **Step 5: Dev server smoke test**

Run: `pnpm dev`
Expected: server listens on localhost (usually :3000). Open in a browser:
- No console errors
- "FoodFighter — scaffold OK" heading
- "Round 1 of N" where N is `log2(nextPowerOf2(foods.length))` = 5 for the 32-item default list
- A "First matchup: X vs Y" line naming two foods from `src/foods.ts`

Stop with Ctrl+C.

- [ ] **Step 6: Final commit (only if anything changed)**

If the verification sweep produced no file changes, skip. Otherwise:

```bash
git status           # inspect
git add -A           # stage intentional changes only
git commit -m "chore: verify scaffold end-to-end"
```

---

## Acceptance criteria (mirrors spec section 5)

- [x] `pnpm install` clean
- [x] `pnpm type-check` clean
- [x] `pnpm test` reports 4 passing tests in `src/tournament.spec.ts`
- [x] `pnpm dev` shows "FoodFighter — scaffold OK" plus round + matchup lines with no console errors
- [x] `pnpm build` produces `dist/`
- [x] `src/foods.ts`, `src/tournament.ts`, `src/types.ts`, `SPEC.md`, `food-fighter-spec.docx` are unchanged (verify with `git log --follow <path>` showing no commits from this plan touching them)
