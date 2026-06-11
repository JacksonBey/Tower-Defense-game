# Active Task Queue

This queue tracks project work at a product level. Keep the top section small and actionable. Move finished items to Completed Work with the date when known.

## Now

- `[ ]` Move path and build pads into per-level configuration so each level has distinct geometry.
- `[ ]` Add deterministic balance simulation tests for at least three viable build strategies.
- `[/]` Improve the new fantasy silhouettes at small sizes, especially tower list icons and in-combat overlap readability. (In progress by Gemini)
- `[/]` Improve next-wave preview with creep silhouette icons, threat ratings, and generated endless-wave preview behavior. (In progress by Gemini)
- `[/]` Tune branching upgrade choices so each branch clearly counters different traits or wave shapes. (In progress by Gemini)

## Next

- `[ ]` Add boss or elite finale wave to each authored level.
- `[ ]` Add compact tower stat comparison before placement and before upgrade selection.
- `[ ]` Add damage types and tower/enemy counter rules.
- `[ ]` Add an area-of-effect Mortar tower once enemy traits exist.
- `[ ]` Improve Endless Mode UI with current endless wave, best wave, and upcoming generated wave preview.
- `[ ]` Add sound channel controls for SFX categories if the mix becomes crowded.

## Later

- `[ ]` Add a background grid-line animation that does not reduce board readability.
- `[ ]` Add title, level-complete, and game-over screens.
- `[ ]` Add keyboard shortcuts for speed, pause, sell, and start wave.
- `[ ]` Add touch-friendly mobile placement/inspection improvements.
- `[ ]` Add exportable balance report generated from simulation tests.
- `[ ]` Consider global leaderboards only after local strategy depth is stable.

## Completed Work

- `[x]` Created initial 3-level, 5-enemy, 4-tower tower defense prototype.
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
