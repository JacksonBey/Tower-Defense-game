# Project Plan: Runehold TD

## Overall Vision

Runehold TD is a premium-feeling browser tower defense game currently being overhauled from a raw neo-brutalist prototype into a WC3-inspired fantasy RTS tower defense: readable terrain lanes, chunky fantasy towers, creep waves, warm map lighting, ornate but compact panels, and satisfying upgrade identity.

The game should become easy to read moment-to-moment but strategically uncomfortable: players should constantly ask whether to expand, upgrade, sell, pause, speed forward, or save for a better answer to the next wave.

## Design Pillars

### Board First

The game board is the primary screen. Side panels, HUD controls, and text should stay compact and legible so the route, towers, enemies, range previews, and impact feedback dominate the viewport.

### RTS Readability

The game should read like a classic fantasy RTS custom map: clear pathing, obvious creep silhouettes, strong tower silhouettes, compact command panels, visible health bars, and effects that communicate damage without hiding the lane.

### Awkward Economy, Clear Math

Currency uses denominations of 7 for personality and mild confusion:

* Crown (`C`) = 49 Bolts
* Slab (`S`) = 7 Bolts
* Bolt (`B`) = 1 Bolt

The UI should always format prices, rewards, refunds, and balances consistently.

### Strategic Pressure

Future work should prioritize tower/enemy counterplay, wave previews, level geometry, and branching upgrades over purely cosmetic additions.

### Fantasy Retheme Without Rule Loss

The current game rules are useful and tested. Retheme names, visuals, sounds, and UI before rewriting simulation logic. Preserve working mechanics while shifting the feel from industrial/brutalist to fantasy RTS.

## Current Project State

### Core Loop

* Grid-based tower placement on explicit build pads.
* Fixed path traversal with IN/OUT endpoint markers.
* Enemy spawning, movement, escaping, damage, rewards, life loss, wave clear, win, and loss states.
* Four tower types with two or three upgrades each.
* Five enemy types with distinct stats and canvas silhouettes.

### UX Foundation

* Tower range preview on hover, build preview, and selected tower inspection.
* Demolish/sell action with a 70% refund of total tower investment.
* Speed controls: 1x, 2x, and Pause.
* Compact HUD with money, lives, wave, and sound toggle.
* Responsive layout that prioritizes the board in narrow viewports.

### Feedback And Presentation

* Fantasy RTS styling with Cinzel and Outfit typography.
* Terrain board, rune build plots, compact command panels, and canvas tower/creep graphics.
* Retuned Web Audio synthesized cues behind an explicit Sound On/Off toggle and SFX channel controls.
* Floating combat text for damage and rewards.
* Hit and defeat particle bursts.
* Screen shake on life loss.

### Progression

* Three authored levels, each ending with an elite finale wave.
* Endless Mode toggle with procedurally scaling waves after authored content.
* LocalStorage high scores by level.

### Testing

* Vitest unit tests cover data integrity, economy formatting, engine state, refunds, and speed scaling.
* Playwright E2E tests cover loading, placement, upgrades, combat, level switching, invalid placement, selling, and speed controls.
* Production build emits to `outputs/game/`.

## Strategic Gaps

The prototype now has an initial fantasy RTS shell. The first remaining gap is making that art direction more cohesive across every surface; the second is deeper planning.

1. **Theme Fit**: Continue the shift from neo-brutalist industrial to WC3-inspired fantasy RTS tower defense.
2. **Wave Preview**: Players need to see upcoming enemy composition before starting a wave.
3. **Enemy Traits**: Enemies need tactical identities beyond HP/speed/reward, such as armor, shields, swarm behavior, slow resistance, regeneration, or boss traits.
4. **Tower Counterplay**: Towers need clearer roles and synergies so different builds solve different wave problems.
5. **Branching Upgrades**: Linear upgrades should evolve into upgrade choices, for example range vs. damage, slow vs. splash, reward vs. burst.
6. **Level Geometry Variety**: Each level should use different paths and build-pad layouts.
7. **Balance Simulation**: Tests should prove multiple strategies can win and no single tower dominates every scenario.

## Roadmap

### Phase 0: WC3-Inspired Overhaul Plan

Goal: preserve the tested tower defense mechanics while replacing the surface language with a fantasy RTS custom-map feel.

1. **Direction Lock**
   * Rename the project concept from industrial "Concrete Panic" language to a fantasy RTS tower defense working title. Current working title: Runehold TD.
   * Define a small non-infringing style guide: terrain palette, UI panel materials, tower archetypes, creep archetypes, currency names, sound mood, and typography.
   * Keep the board-first layout.

2. **Data Retheme**
   * Retheme towers while preserving their current roles:
     * Stoneguard Post -> melee/guard/boulder tower archetype.
     * Arcane Spire -> arcane/chain/caster tower archetype.
     * Bounty Ballista -> bounty/mark/ballista tower archetype.
     * Frost Obelisk -> frost/snare/control tower archetype.
   * Retheme enemies as creeps with fantasy silhouettes and clearer tactical classes.
   * Retheme levels as fantasy maps or lanes.
   * Decide whether base-7 currency remains as a quirky relic or becomes fantasy denominations.

3. **Visual Retheme**
   * Replace stark brutalist surfaces with grass/dirt/stone terrain tiles. Initial pass complete.
   * Replace orange build pads with fantasy build plots or rune circles. Initial pass complete.
   * Replace hard industrial tower drawings with readable fantasy tower silhouettes. Initial pass complete.
   * Replace enemy visuals with creep silhouettes. Initial pass complete.
   * Replace the HUD/panels with compact RTS-style command panels. Initial pass complete.

4. **Audio Retheme**
   * Retune Web Audio cues toward wood, stone, magic, frost, bow, coin, and wave-start motifs.
   * Preserve explicit Sound On/Off behavior.

5. **Test And Documentation Pass**
   * Update Playwright selectors only if visible names change.
   * Keep engine behavior tests intact unless mechanics change.
   * Update README, GAME_DESIGN, SYSTEM, and TASKS after the retheme.

### Phase 1: Planning Clarity

* Add next-wave preview with enemy counts, icons, and trait labels.
* Add richer tooltips or compact stat rows for tower role, damage type, range, and upgrade impact.
* Make endless-mode status and high scores clearer without adding panel bulk.

### Phase 2: Counterplay

* Add enemy traits and damage-type interactions.
* Add branching upgrade choices for each tower.
* Tune boss or elite waves at the end of each authored level.

### Phase 3: Map Variety

* Move path and build pads into per-level configuration.
* Give each level a distinct route shape and build constraint.
* Add tests that verify all level paths are continuous and all build pads are legal.

### Phase 4: Balance And Progression

* Add deterministic simulation tests for viable builds.
* Tune authored waves around enemy counters.
* Expand persistent progression only after the core strategy is fun.

### Phase 5: Polish

* Add background grid animation if it does not compete with readability.
* Improve audio mix and optional channel controls.
* Add title, level-complete, and game-over presentation screens.
