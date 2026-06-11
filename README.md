# Concrete Panic TD

Concrete Panic TD is a neo-brutalist browser tower defense game built with Vite, canvas, Web Audio, Vitest, and Playwright. It is intentionally loud, chunky, and slightly confusing: the economy uses denominations of 7.

## Current Features

* 3 authored levels.
* 5 enemy types with distinct stats and canvas silhouettes.
* 4 tower types with 2-3 upgrades each.
* Base-7 currency:
  * `C` Crown = 49 Bolts
  * `S` Slab = 7 Bolts
  * `B` Bolt = 1 Bolt
* Grid-based tower placement on build pads.
* Tower range preview on hover and selection.
* Demolish/sell with 70% total investment refund.
* Speed controls: 1x, 2x, Pause.
* Endless Mode with procedurally scaling waves.
* Per-level high scores persisted in `localStorage`.
* Floating combat text, particle bursts, screen shake, synthesized sounds, and custom canvas graphics.
* Unit and Playwright E2E coverage.

## Play

From `work/`:

```powershell
npm install
npm run dev -- --port 4174
```

Open:

```text
http://127.0.0.1:4174/
```

## Build

From `work/`:

```powershell
npm run build
```

The production build is written to:

```text
outputs/game/
```

## Test

From `work/`:

```powershell
npm run test
npm run test:e2e
npm run test:all
```

`npm run test:all` runs unit tests, production build, and Playwright scenarios.

## Project Layout

```text
.
├─ AGENT.md              Agent workflow and documentation maintenance guide
├─ PLAN.md               Product vision, current state, roadmap
├─ SYSTEM.md             Architecture and file responsibility reference
├─ TASKS.md              Prioritized backlog and completed work
├─ docs/
│  ├─ GAME_DESIGN.md     Mechanics, design gaps, balance direction
│  └─ TESTING.md         Test strategy and coverage notes
├─ outputs/              Generated deliverables
└─ work/
   ├─ src/               Game source
   ├─ tests/             Vitest unit tests
   ├─ e2e/               Playwright tests
   └─ package.json       Scripts and dependencies
```

## Source Map

* `work/src/data.js`: static game data and balance values.
* `work/src/economy.js`: base-7 currency formatting.
* `work/src/engine.js`: deterministic simulation and game rules.
* `work/src/main.js`: DOM controls, canvas rendering, visual effects, high scores.
* `work/src/sound.js`: Web Audio sound system.
* `work/src/styles.css`: visual layout and responsive styling.

See `SYSTEM.md` for the full architecture reference.

## Design Direction

The next major step is deeper strategy, not more surface polish. Priorities:

1. Next-wave preview.
2. Enemy traits.
3. Tower counterplay and branching upgrades.
4. Distinct level geometry.
5. Balance simulation tests.

See `docs/GAME_DESIGN.md` and `TASKS.md` for the detailed roadmap.
