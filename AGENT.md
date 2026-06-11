# AI Orientation Guide

This file is the first stop for any agent working on Concrete Panic TD. It explains how to regain context quickly, which documents own which decisions, and how to keep future changes discoverable.

## Core Reference Files

* **`README.md`**: Human-facing overview, install instructions, commands, and feature summary.
* **`PLAN.md`**: Product vision, current state, design pillars, and roadmap priorities.
* **`SYSTEM.md`**: Architecture reference and source-file map. Use it when changing code.
* **`TASKS.md`**: Active backlog, completed work, and priority order for upcoming implementation.
* **`docs/GAME_DESIGN.md`**: Gameplay design notes, current mechanics, missing depth, and balancing direction.
* **`docs/TESTING.md`**: Test strategy, commands, current coverage, and gaps.

## File-Level Context

First-party source and test files include a header comment that points to a matching section in `SYSTEM.md`, for example:

```js
// Reference: SYSTEM.md#Engine-Simulation
```

When opening a file, read that `SYSTEM.md` section before making changes. If a new first-party file is added, give it a similar reference header and add or update the matching `SYSTEM.md` section.

Files that cannot contain comments, such as `package.json`, should be covered by the closest relevant `SYSTEM.md` tooling section.

## Project Shape

Concrete Panic TD is a Vite web game in `work/`. The production build is emitted to `outputs/game/`. Runtime code is intentionally small and mostly framework-free:

* `work/src/data.js` holds levels, enemy profiles, tower stats, paths, and build pads.
* `work/src/engine.js` owns deterministic simulation state.
* `work/src/main.js` owns DOM events, canvas drawing, visual effects, high scores, and browser-facing UI.
* `work/src/sound.js` owns synthesized Web Audio cues.
* `work/src/economy.js` owns the intentionally confusing base-7 currency formatting.

## Workflow

1. Read `PLAN.md` to align with the project goal and current roadmap.
2. Use file reference headers to read the relevant `SYSTEM.md` sections before editing.
3. Keep simulation rules in `engine.js`; keep rendering and browser-only concerns in `main.js`.
4. Update `SYSTEM.md` when structure, data flow, or file responsibilities change.
5. Update `TASKS.md` when a task is completed, added, or reprioritized.
6. Add or update tests with behavior changes. Prefer unit tests for engine/economy/data rules and Playwright tests for player-facing flows.
7. Run `npm run test:all` from `work/` before reporting completion unless the change is documentation-only.

## Quality Bar

* Player-facing changes should improve strategic clarity or tactile feedback, not only add decoration.
* Canvas interactions must remain testable through stable `data-testid` hooks and `window.__game` inspection where appropriate.
* The board should stay visually dominant. UI panels are support surfaces, not the main event.
* Currency should remain formatted in denominations of 7: Crowns (`C` = 49), Slabs (`S` = 7), Bolts (`B` = 1).
* New systems should be deterministic enough to test, especially endless-wave generation and balance logic.

## Common Commands

Run from `work/`:

```powershell
npm install
npm run dev -- --port 4174
npm run test
npm run test:e2e
npm run test:all
npm run build
```

## Documentation Maintenance

When making a meaningful change:

* Update `README.md` if setup, commands, or headline features change.
* Update `PLAN.md` if the product direction or roadmap changes.
* Update `SYSTEM.md` if architecture, source ownership, public state, or data flow changes.
* Update `docs/GAME_DESIGN.md` if mechanics, balance, enemies, towers, or progression change.
* Update `docs/TESTING.md` if tests, scenarios, tools, or verification expectations change.
* Update `TASKS.md` whenever backlog status changes.
