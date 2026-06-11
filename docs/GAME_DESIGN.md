# Game Design Notes

Concrete Panic TD already has a playable tower defense loop. The current product direction is shifting away from neo-brutalist industrial styling toward a WC3-inspired fantasy RTS tower defense feel, then deepening planning, tradeoffs, and counterplay.

## Player Fantasy

The player is defending a fantasy lane like a classic RTS custom map: placing chunky towers on build plots, reading incoming creep waves, spending odd denominations, and surviving through precise placement and upgrade choices.

The game should feel:

* Tactical and readable.
* Warm, map-like, and fantasy RTS inspired.
* Fast to understand.
* Uncomfortable to optimize.
* Punchy without becoming unreadable.

## Art Direction Pivot

The current prototype uses neo-brutalist industrial shapes and copy. That style is distinctive, but it may fight the tower defense fantasy. The new target is WC3-inspired fantasy RTS tower defense:

* Terrain tiles instead of brutalist slabs.
* Build plots/rune circles instead of orange industrial pads.
* Creep waves instead of abstract industrial enemies.
* Fantasy tower archetypes instead of machines.
* Compact RTS command-panel UI instead of poster-like brutalist chrome.
* Magic, wood, stone, frost, coin, and bow-like sound cues instead of purely synth-industrial cues.

Do not copy Warcraft names, assets, icons, models, maps, factions, or lore. Use the genre language and usability lessons, not protected content.

## Current Core Loop

1. Choose a level.
2. Inspect starting currency and lives.
3. Select a tower type.
4. Hover build pads to preview range.
5. Place towers on legal pads.
6. Start wave.
7. Enemies follow the path from IN to OUT.
8. Towers attack automatically.
9. Defeated enemies award currency.
10. Escaped enemies cost lives.
11. Between waves, upgrade, demolish, or build more.
12. Clear authored waves or continue in Endless Mode.

## Current Mechanics

### Towers

Current industrial names should be rethemed while preserving gameplay roles:

* **Punch Press**: low-cost direct damage tower; fantasy candidate: Guard Tower, Stone Fist, or Watch Post.
* **Radio Spike**: fast-firing range-oriented tower; fantasy candidate: Arcane Spire, Storm Totem, or Rune Needle.
* **Tax Stamp**: slower heavy-hit tower; fantasy candidate: Bounty Ballista, Warden Mark, or Siege Ledger.
* **Freezer Staple**: low-damage tower with slow effect; fantasy candidate: Frost Obelisk, Ice Snare, or Winter Totem.

Each tower currently has a linear upgrade path with two or three upgrades.

### Enemies

Current industrial enemies should become fantasy creeps:

* **Chip Runner**: baseline lightweight creep; fantasy candidate: Gnarl Scout or Hollow Imp.
* **Bolt Bruiser**: slower high-HP creep; fantasy candidate: Mire Brute or Ironhide.
* **Glass Skater**: fast fragile creep; fantasy candidate: Wisp Strider or Moon Hare.
* **Vault Crawler**: very slow heavy creep; fantasy candidate: Stoneback or Siege Beetle.
* **Static Saint**: mid-speed durable creep; fantasy candidate: Hex Acolyte or Stormbound.

Enemies currently differ by stats and silhouette. They do not yet have deeper traits.

### Economy

The economy is stored internally as Bolts and formatted into three denominations:

* Crown = 49
* Slab = 7
* Bolt = 1

Demolish refunds 70% of total tower investment, including upgrades.

### Progression

* Three authored levels define starting money, lives, and wave composition.
* Endless Mode continues beyond authored waves with procedural scaling.
* High scores are stored locally per level.

## Design Strengths

* The existing visual identity is distinctive and immediate, even if it is no longer the desired final direction.
* The board-first layout makes the game feel playable rather than like a UI mockup.
* Range preview and sell/refund reduce frustration.
* Speed controls support repeated play.
* Particles, floating text, sound, and shake make combat readable and satisfying.
* Existing tests make mechanics safer to change.

## Design Gaps

### 1. Theme Needs Retargeting

The first priority is now the WC3-inspired fantasy RTS overhaul. Preserve mechanics and tests, but replace names, visuals, UI treatment, and sounds.

The retheme should happen before adding lots of new mechanics so future tower/enemy identities are designed for the final fantasy direction.

### 2. Planning Is Too Thin

Players do not yet know what is coming next. This weakens the core tower defense decision: preparing for a known threat with limited resources.

Add a wave preview that shows enemy icons, counts, total reward, and traits.

### 3. Enemies Need Tactical Identity

Current enemies are stat variants. They need traits that force different tower responses.

Candidate traits:

* **Armored**: reduces small hits; weak to heavy-hit towers.
* **Shielded**: absorbs first hit or first damage chunk.
* **Swarm**: many cheap bodies; weak to splash or chain effects.
* **Slow Resistant**: reduced effect from Freezer Staple.
* **Regenerating**: heals if not damaged recently.
* **Boss/Elite**: visible finale threat with special behavior.

### 4. Towers Need Sharper Roles

Current towers can blur together. Future balance should give each a job:

* Punch Press: efficient single-target burst and armor cracking.
* Radio Spike: fast hits, chain damage, anti-swarm.
* Tax Stamp: reward manipulation, mark effects, heavy damage.
* Freezer Staple: slow, control, setup for other towers.

### 5. Upgrades Need Choices

Linear upgrades are useful for a prototype, but branching upgrades make planning more interesting.

Example directions:

* Punch Press: armor breaker vs. double-hit.
* Radio Spike: longer range vs. chain arcs.
* Tax Stamp: bonus reward marks vs. execution damage.
* Freezer Staple: stronger slow vs. small area freeze.

### 6. Level Geometry Needs Variety

The same route structure makes levels feel like stat changes. Each level should eventually define:

* Path.
* Build pads.
* Starting money.
* Lives.
* Authored waves.
* Optional environmental rule or constraint.

### 7. Balance Needs Simulation

Manual playtesting is not enough once branching upgrades and traits arrive. Add deterministic simulations that verify:

* At least three viable strategies can clear level 1.
* No single tower type clears every level alone without meaningful tradeoff.
* Enemy traits are actually countered by intended towers.
* Endless Mode scales without impossible spikes in the first few generated waves.

## Recommended Next Implementation Order

1. **WC3-Inspired Retheme**
   Lock the fantasy RTS style and retheme data, UI, canvas art, and sound while preserving current mechanics.

2. **Wave Preview**
   Build the planning surface first. It makes future traits visible and useful.

3. **Enemy Traits**
   Add data model and rendering labels before adding more enemies.

4. **Tower Roles**
   Tune existing towers around counters before expanding tower count.

5. **Branching Upgrades**
   Add strategic choice once towers have clear roles.

6. **Per-Level Geometry**
   Make authored levels feel different after core counters exist.

7. **Balance Simulation**
   Lock the new strategy layer down with tests.

## Design Rules For Future Work

* Add mechanics that create decisions, not only visual noise.
* Keep enemy intent readable before and during the wave.
* Keep the route visible even during effects.
* Prefer compact UI over explanatory panels.
* Every new mechanic needs either a unit test, E2E flow, or deterministic simulation test.
