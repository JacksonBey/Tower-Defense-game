# Runehold TD

Runehold TD is a fantasy RTS-inspired browser tower defense game built with Vite, canvas, Web Audio, Vitest, and Playwright. It began as a neo-brutalist prototype, but the active direction is now readable custom-map-style fantasy tower defense.

The economy still uses awkward denominations of 7 for personality.

## Current Features

* 3 authored war paths with elite finale waves.
* 5 creep types with distinct stats and canvas silhouettes.
* Enemy trait system with swarm, armor, shields, slow resistance, and elite leak penalties.
* Next-wave preview showing creep counts, reward, and trait tags.
* 4 tower types with 2-3 branching upgrade tiers each, including trait-counter choices.
* Base-7 currency:
  * `C` Crown = 49 Bolts
  * `S` Slab = 7 Bolts
  * `B` Bolt = 1 Bolt
* Grid-based tower placement on rune build plots.
* Compact stat comparisons before tower placement and upgrade selection.
* Tower targeting modes: First, Last, Strongest, and Weakest.
* Lifetime tower damage counters in the inspection panel.
* Tower range preview on hover and selection.
* Salvage/sell with 70% total investment refund.
* Early-start rush rewards for beginning the next wave during the build timer.
* Hidden map gold chests that can be clicked for bonus base-7 currency.
* Speed controls: 1x, 2x, Pause.
* Sound toggle plus master, combat, build, and system SFX channel controls.
* Endless Mode with procedurally scaling waves.
* Per-level high scores persisted in `localStorage`.
* Floating combat text, particle bursts, screen shake, synthesized sounds, terrain board, RTS panels, and custom canvas graphics.
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
|-- AGENT.md              Agent workflow and documentation maintenance guide
|-- PLAN.md               Product vision, current state, roadmap
|-- SYSTEM.md             Architecture and file responsibility reference
|-- TASKS.md              Prioritized backlog and completed work
|-- docs/
|   |-- GAME_DESIGN.md    Mechanics, design gaps, balance direction
|   |-- STYLE_GUIDE.md    Fantasy RTS visual and naming direction
|   `-- TESTING.md        Test strategy and coverage notes
|-- outputs/              Generated deliverables
`-- work/
    |-- src/              Game source
    |-- tests/            Vitest unit tests
    |-- e2e/              Playwright tests
    `-- package.json      Scripts and dependencies
```

## Source Map

* `work/src/data.js`: static game data and balance values.
* `work/src/economy.js`: base-7 currency formatting.
* `work/src/engine.js`: deterministic simulation and game rules.
* `work/src/main.js`: DOM controls, canvas rendering, visual effects, high scores.
* `work/src/mapSecrets.js`: deterministic decorative props and clickable gold chest rules.
* `work/src/sound.js`: Web Audio sound system.
* `work/src/styles.css`: fantasy RTS layout and responsive styling.

See `SYSTEM.md` for the full architecture reference.

## Design Direction

The current priority is making the WC3-inspired fantasy RTS direction feel cohesive without copying Warcraft names, assets, icons, sounds, maps, factions, or lore.

Next priorities:

1. Distinct level geometry.
2. Compact tower stat comparison before placement and upgrades.
3. Tune branch counterplay from simulation outcomes.
4. Better endless-mode preview and high-score presentation.
5. Boss/elite finale tuning after per-level geometry lands.

See `docs/GAME_DESIGN.md`, `docs/STYLE_GUIDE.md`, and `TASKS.md` for the detailed roadmap.
