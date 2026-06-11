# Active Task Queue

This queue tracks project work at a product level. Keep the top section small and actionable. Move finished items to Completed Work with the date when known.

## Now

- [/] Move path and build pads into per-level configuration so each level has distinct geometry. (In progress by Gemini)
- [/] Add boss or elite finale wave to each authored level. (In progress by Codex)
- [/] Add sound channel controls for SFX categories if the mix becomes crowded. (In progress by Codex)

## Next

- `[ ]` Add compact tower stat comparison before placement and before upgrade selection.
- `[ ]` Add damage types and tower/enemy counter rules.
- `[ ]` Add an area-of-effect Mortar tower once enemy traits exist.
- `[ ]` Improve Endless Mode UI with current endless wave, best wave, and upcoming generated wave preview.

## Later

- `[ ]` Add a background grid-line animation that does not reduce board readability.
- `[ ]` Add title, level-complete, and game-over screens.
- `[ ]` Add keyboard shortcuts for speed, pause, sell, and start wave.
- `[ ]` Add touch-friendly mobile placement/inspection improvements.
- `[ ]` Add exportable balance report generated from simulation tests.
- `[ ]` Consider global leaderboards only after local strategy depth is stable.

## Completed Work

- [x] Implemented channel-specific volume controls (Master, Combat, Build, System) with range sliders, localStorage state persistence, and environment checks for testing (June 11, 2026).
- [x] Generated high-fidelity fantasy RTS tower icons, integrated them into the build selection panel, and overhauled the HUD layout with a premium mahogany board frame, distinct color-coded status meters, custom scrollbars, and customized trait chip colors. Resolved Playwright click instability on the start button (June 11, 2026).
- [x] Added deterministic balance simulation tests for three viable build strategies (physical, magic, and combo) and trait counterplay (June 11, 2026).
- [x] Improved the new fantasy silhouettes at small sizes, adding tower list icons, semi-transparent base shadows, aura/bubble overlays, and progress-sorted rendering order (June 11, 2026).
- [x] Improved next-wave preview with SVG creep silhouettes, dynamic threat ratings (Low, Moderate, High, Deadly), and auto-generation for endless-mode previews (June 11, 2026).
- [x] Tuned branching upgrade choices to implement deep tactical counters (Multi-shot, Splash, Chain Lightning, Shield Breaker, Hunter's Mark, Armor Pierce, Shatter, Slow Resistance Bypass) with full unit test coverage (June 11, 2026).
- [x] Created initial 3-level, 5-enemy, 4-tower tower defense prototype.
- `[x]` Added base-7 currency denominations: Crowns, Slabs, Bolts.
- `[x]` Added canvas rendering for grid, path, towers, enemies, projectiles, and HUD state.
- `[x]` Added Web Audio synthesized sound cues with a Sound On/Off toggle.
- `[x]` Made the game board visually dominate the first viewport.
- `[x]` Added custom tower and enemy canvas graphics.
- `[x]` Implemented Tower Range Visualizer with dashed circular outline on hover/select.
- `[x]` Implemented Demolish/Sell Tower option with 70% total investment refund.
- `[x]` Implemented Speed Controls: 1x, 2x, Pause.
- `[x]` Integrated Space Grotesk and Outfit Google Fonts.
- `[x]` Added floating combat text for damage and rewards.
- `[x]` Added hit/kill particle explosions.
- `[x]` Added canvas screen shake on life loss.
- `[x]` Rendered explicit IN and OUT path endpoints.
- `[x]` Added Endless Mode with procedurally scaling waves.
- `[x]` Persisted high scores per level in LocalStorage.
- `[x]` Added unit and E2E coverage for game settings, sell mechanics, and core gameplay.
- `[x]` Expanded project documentation: README, plan, system reference, game design notes, testing guide, and task queue.
- `[x]` Began WC3-inspired fantasy RTS overhaul with Runehold TD title, fantasy tower/creep/level names, terrain board, rune build plots, command panels, and retuned synthesized cues.
- `[x]` Added non-infringing fantasy RTS style guide for naming, colors, tower archetypes, creep archetypes, and UI copy.
- `[x]` Resized the game board to 12x8, extended path routing and buildable pads, adjusted canvas aspect ratios in styles, and updated E2E Playwright click coordinates dynamically (June 11, 2026).
- `[x]` Added next-wave preview with creep counts, total reward, and trait labels.
- `[x]` Added first-pass enemy trait system: armored, shielded, swarm, slow-resistant, and elite.
- `[x]` Added branching upgrade choices for every tower, with unit and E2E coverage.
