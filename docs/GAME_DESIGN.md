# Game Design Notes

Runehold TD already has a playable tower defense loop. The current product direction is shifting away from neo-brutalist industrial styling toward a WC3-inspired fantasy RTS tower defense feel, then deepening planning, tradeoffs, and counterplay.

## Player Fantasy

The player is defending a fantasy lane like a classic RTS custom map: placing chunky towers on build plots, reading incoming creep waves, spending odd denominations, and surviving through precise placement and upgrade choices.

The game should feel:

* Tactical and readable.
* Warm, map-like, and fantasy RTS inspired.
* Fast to understand.
* Uncomfortable to optimize.
* Punchy without becoming unreadable.

## Art Direction Pivot

The prototype began with neo-brutalist industrial shapes and copy. That style was distinctive, but it fought the tower defense fantasy. The active target is WC3-inspired fantasy RTS tower defense:

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

The current tower retheme preserves gameplay roles:

* **Stoneguard Post**: low-cost direct damage tower.
* **Arcane Spire**: fast-firing range-oriented tower.
* **Bounty Ballista**: slower heavy-hit tower.
* **Frost Obelisk**: low-damage tower with slow effect.

Each tower now has two or three upgrade tiers, and every tier offers two mutually exclusive choices.

### Enemies

The current enemy retheme uses fantasy creeps:

* **Hollow Imp**: baseline lightweight creep.
* **Mire Brute**: slower high-HP creep.
* **Wisp Strider**: fast fragile creep.
* **Stoneback**: very slow heavy creep.
* **Hex Acolyte**: mid-speed durable creep.

Current trait assignments:

* **Swarm**: Hollow Imp and Wisp Strider.
* **Armored**: Mire Brute and Stoneback.
* **Shielded**: Hex Acolyte.
* **Slow-Resistant**: Stoneback.
* **Elite**: Stoneback.

Enemies differ by stats, silhouette, and trait rules that drive first-pass counterplay.

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

* The initial fantasy RTS shell is more genre-aligned than the original industrial style.
* The board-first layout makes the game feel playable rather than like a UI mockup.
* Range preview and sell/refund reduce frustration.
* Speed controls support repeated play.
* Particles, floating text, sound, and shake make combat readable and satisfying.
* Existing tests make mechanics safer to change.

## Design Gaps

### 1. Theme Needs Retargeting

The first priority is continuing the WC3-inspired fantasy RTS overhaul. Preserve mechanics and tests, but keep improving names, visuals, UI treatment, and sounds.

The retheme should happen before adding lots of new mechanics so future tower/enemy identities are designed for the final fantasy direction.

### 2. Planning Needs More Depth

The first-pass wave preview now shows counts, total reward, and trait tags. Next it should become more strategic: include icons, clearer threat ratings, and generated endless previews.

### 3. Enemies Need Tactical Identity

Enemies now have a first-pass trait model and tower counters for armor, shields, swarm pressure, slow resistance, and elite threats. The next step is tuning those counters so wave previews translate into clearer build decisions.

Candidate traits:

* **Armored**: reduces small hits; weak to heavy-hit towers.
* **Shielded**: absorbs first hit or first damage chunk.
* **Swarm**: many cheap bodies; weak to splash or chain effects.
* **Slow Resistant**: reduced effect from Frost Obelisk.
* **Regenerating**: heals if not damaged recently.
* **Boss/Elite**: visible finale threat with special behavior.

### 4. Towers Need Sharper Roles

Current towers can blur together. Future balance should give each a job:

* Stoneguard Post: efficient single-target burst and armor cracking.
* Arcane Spire: fast hits, chain damage, anti-swarm.
* Bounty Ballista: reward manipulation, mark effects, heavy damage.
* Frost Obelisk: slow, control, setup for other towers.

### 5. Upgrade Choices Need Balance

Branching upgrades now exist and include first-pass counterplay hooks such as armor pierce, shield breaking, swarm bonuses, elite bonuses, marks, bounty bonuses, multishot, splash, chain damage, and frost resistance bypass. The next step is balance testing those branches against authored waves.

Example directions:

* Stoneguard Post: armor breaker vs. double-hit.
* Arcane Spire: longer range vs. chain arcs.
* Bounty Ballista: bonus reward marks vs. execution damage.
* Frost Obelisk: stronger slow vs. small area freeze.

### 6. Level Geometry Needs Variety

The same route structure makes levels feel like stat changes. Each level should eventually define:

* Path.
* Build pads.
* Starting money.
* Lives.
* Authored waves.
* Optional environmental rule or constraint.

### 7. Balance Needs Simulation

Manual playtesting is not enough once branching upgrades and traits arrive. Deterministic simulations now verify three viable level 1 strategies, a weak level 2 plan that leaks, and a shield-breaker counter case. Continue expanding them to verify:

* At least three viable strategies can clear level 1.
* No single tower type clears every level alone without meaningful tradeoff.
* Enemy traits are actually countered by intended towers.
* Endless Mode scales without impossible spikes in the first few generated waves.

## Recommended Next Implementation Order

1. **Tower Roles**
   Tune existing towers around counters before expanding tower count.

2. **Branching Upgrade Balance**
   Tune existing branches around trait counters and level pressure.

3. **Per-Level Geometry**
   Make authored levels feel different after core counters exist.

4. **Balance Simulation**
   Expand the strategy layer tests with level 2, level 3, and endless-mode cases.

5. **Preview Polish**
   Improve wave preview icons, endless preview behavior, and threat readability.

## Design Rules For Future Work

* Add mechanics that create decisions, not only visual noise.
* Keep enemy intent readable before and during the wave.
* Keep the route visible even during effects.
* Prefer compact UI over explanatory panels.
* Every new mechanic needs either a unit test, E2E flow, or deterministic simulation test.
