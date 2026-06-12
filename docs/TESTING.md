# Testing Guide

Runehold TD uses Vitest for deterministic rules and Playwright for browser-facing player scenarios.

## Commands

Run from `work/`:

```powershell
npm run test
npm run test:e2e
npm run test:all
```

`npm run test:all` is the preferred verification command before handing off work. It runs:

1. Unit tests.
2. Production build.
3. Playwright E2E tests.

## Unit Tests

Location:

```text
work/tests/
```

Current coverage:

* `data.test.js`
  * Confirms there are exactly 3 levels, 5 enemies, and 4 towers.
  * Confirms every tower has 2-3 upgrade tiers and two branch choices per tier.
  * Confirms trait metadata exists and every enemy uses known traits.
  * Confirms every authored level has an elite finale wave.
* `economy.test.js`
  * Confirms base-7 denomination formatting.
  * Confirms affordability checks.
* `sound.test.js`
  * Confirms sound enabled state and channel volumes persist.
  * Confirms cue playback uses master and category volume.
* `statComparison.test.js`
  * Confirms baseline tower stat formatting for placement.
  * Confirms upgrade gains, tradeoffs, and counterplay tags.
* `engine.test.js`
  * Confirms path/build-pad legality.
  * Confirms placement rules and currency charges.
  * Confirms upgrade order and stat changes.
  * Confirms wave progression and reward gain.
  * Confirms loss state when enemies escape.
  * Confirms sell/refund calculation.
  * Confirms speed multiplier and pause behavior.
  * Confirms wave preview summaries.
  * Confirms armor, shields, and elite leak penalties.
  * Confirms alternate upgrade branch choices apply distinct stat changes and record history.
  * Confirms branch counterplay properties merge across tiers.
* `simulation.test.js`
  * Confirms at least three deterministic Level 1 build strategies can clear.
  * Confirms a weak Level 2 coverage plan leaks.
  * Confirms Shield Breaker counters shielded acolytes efficiently.

## E2E Tests

Location:

```text
work/e2e/game.spec.js
```

Current browser scenarios:

* Initial game content loads.
* Next-wave preview displays wave number, reward, creep counts, and trait tags.
* Player can inspect pre-placement stats, then place and upgrade a tower.
* Player can choose an alternate upgrade branch and receive its counterplay stat.
* Player can start a wave and observe combat progression.
* Player can switch levels and see level-specific money/lives.
* Player can inspect an authored finale preview with Elite Stoneback pressure.
* Invalid placement shows feedback.
* Player can demolish/sell a tower and see refunded currency.
* Player can toggle 2x, Pause, and 1x speed states.

## What To Test Next

When adding **per-level geometry**:

* Unit-test every path is continuous.
* Unit-test every build pad is inside the grid and not on the path.
* E2E-test that levels visibly use different route/build layouts.

When expanding **balance simulations**:

* Use deterministic seeds for endless/procedural cases.
* Test small sets of known strategies instead of relying on browser tests.
* Assert broad outcomes: clear, lose, money remaining, lives remaining, and tower mix.

When changing **audio controls**:

* Unit-test persistence and volume math in `SoundSystem`.
* E2E-test only the visible controls and stored values; do not depend on real audio output.

## Test Design Principles

* Keep engine tests fast and deterministic.
* Keep browser tests focused on player-observable behavior.
* Use `data-testid` for stable UI selectors.
* Avoid asserting exact animation timing unless timing is the feature.
* Do not use Playwright for rules that can be tested directly through `GameEngine`.
* Do not depend on sound output in automated tests; verify sound controls and event emission instead.

## Manual Verification

For layout, sound, and visual feel, run the dev server and inspect:

```powershell
npm run dev -- --port 4174
```

Manual checks:

* Board dominates first viewport.
* Range preview is visible but does not hide enemies.
* Floating combat text is legible and disappears quickly.
* Particles do not obscure the route.
* Sound toggle works after user interaction.
* Pause truly freezes combat.
* 2x speed remains readable.
* Selling a tower clears inspection and updates currency.
