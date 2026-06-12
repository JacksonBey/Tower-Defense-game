# Active Task Queue

This queue tracks project work at a product level. Keep the top section small and actionable. Move finished items to Completed Work with the date when known.

## Now

- `[ ]` Task 11: Rich Ambient Audio & Codex Panels (ambient map loops, Creep Codex details overlay, toggleable coordinate grid).
- `[ ]` Task 12: E2E and Unit Tests for new AAA features.

## Next

- `[ ]` Add damage types and tower/enemy counter rules.
- `[ ]` Add an area-of-effect Mortar tower once enemy traits exist.
- `[ ]` Improve Endless Mode UI with current endless wave, best wave, and upcoming generated wave preview.

## Later

- `[ ]` Add a background grid-line animation that does not reduce board readability.
- `[ ]` Add touch-friendly mobile placement/inspection improvements.
- `[ ]` Add exportable balance report generated from simulation tests.
- `[ ]` Consider global leaderboards only after local strategy depth is stable.

## Completed Work

- [x] Added advanced canvas animation and map secrets: engine-backed tower fire pulses for recoil, deterministic decorative prop generation, clickable hidden gold chests, bonus-gold feedback, and unit/E2E coverage (June 12, 2026).
- [x] Added AAA tower targeting and strategic controls: First/Last/Strongest/Weakest tower priorities, lifetime damage counters in the inspection panel, post-wave build timers, and early-start rush rewards, with unit and E2E coverage (June 12, 2026).
- [x] Overhauled the UI with an immersive Main Menu/Title Screen warpath selector, custom Victory and Defeat overlay screens with stats breakdown, active player Hero Spells (Meteor Strike & Frost Nova), keyboard hotkeys, creep walk angle rotation, scale bobbing, themed projectiles (boulders, spears, ice crystals), status effect overlays, and decorative environmental map props, with full E2E coverage (June 12, 2026).

- [x] Moved path and build pads into per-level configurations so each level (Briar Glen, Mossgate Ford, Elderfen Crossing) has distinct, continuous geometries and build plots, with full unit test coverage (June 12, 2026).
- [x] Added compact tower stat comparisons showing deltas and new trait badges before placement and before upgrade selection, with full unit test coverage (June 12, 2026).
- [x] Overhauled audio engine to synthesize specialized sound effects per tower and creep type (stone rumbles, magic chirps, plucks, high-pass shatters) and integrated browser-native SpeechSynthesis narrator for cinematic level intros, wave start announcements, elite warnings, and low-lives alerts (June 11, 2026).
- [x] Added elite finale waves to all three authored levels, surfaced a Finale badge in the wave preview, and covered the data, engine preview, and browser scenario (June 11, 2026).
- [x] Implemented channel-specific volume controls (Master, Combat, Build, System) with range sliders, localStorage state persistence, environment checks, and unit/E2E coverage (June 11, 2026).
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
