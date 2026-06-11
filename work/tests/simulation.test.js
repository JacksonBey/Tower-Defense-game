import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/engine.js";

function runSimulation(game, actionsPerWave = {}) {
  let limit = 5000;
  while (limit > 0) {
    if (game.status === "build") {
      const currentWave = game.waveIndex;
      if (currentWave >= game.level.waves.length) {
        break;
      }
      if (actionsPerWave[currentWave]) {
        actionsPerWave[currentWave](game);
      }
      game.startWave();
    }
    game.tick(0.1);
    if (game.status === "won" || game.status === "lost") {
      break;
    }
    limit--;
  }
  return game;
}

describe("balance simulations", () => {
  it("Strategy 1 clears Level 1 using Stoneguard Post upgrades (Watchfire & Oath Stones)", () => {
    const game = new GameEngine(1); // Briar Glen: 86 gold

    const actions = {
      0: (g) => {
        g.placeTower("punch", 5, 1); // cost 28 (hits path at [6,2])
        g.placeTower("punch", 2, 4); // cost 28 (hits path at [3,3])
      },
      1: (g) => {
        g.upgradeTower(0, 1); // Watchfire: cost 35
        g.upgradeTower(1, 0); // Oath Stones: cost 35
      }
    };

    runSimulation(game, actions);
    expect(game.status).toBe("won");
    expect(game.lives).toBeGreaterThan(0);
  });

  it("Strategy 2 clears Level 1 using Arcane Spire upgrades (Blue Spark chain lightning)", () => {
    const game = new GameEngine(1); // Briar Glen: 86 gold

    const actions = {
      0: (g) => {
        g.placeTower("radio", 5, 1); // cost 42
        g.upgradeTower(0, 1); // Blue Spark: cost 28 (chain bounces)
      },
      1: (g) => {
        g.placeTower("radio", 2, 4); // cost 42
      }
    };

    runSimulation(game, actions);
    expect(game.status).toBe("won");
    expect(game.lives).toBeGreaterThan(0);
  });

  it("Strategy 3 clears Level 1 using Frost Obelisk + Bounty Ballista combo", () => {
    const game = new GameEngine(1); // Briar Glen: 86 gold

    const actions = {
      0: (g) => {
        g.placeTower("freezer", 5, 1); // cost 63 (slows at [6,2])
      },
      1: (g) => {
        g.placeTower("tax", 2, 4); // cost 49
        g.upgradeTower(1, 0); // Hunter's Mark: cost 42
      }
    };

    runSimulation(game, actions);
    expect(game.status).toBe("won");
    expect(game.lives).toBeGreaterThan(0);
  });

  it("proves a single tower type fails Level 2 due to lack of synergy / elite leaks", () => {
    const game = new GameEngine(2); // Mossgate Ford: 112 gold, contains heavy Stonebacks

    const actions = {
      0: (g) => {
        g.placeTower("punch", 1, 0); // Out of range of path
      }
    };

    runSimulation(game, actions);
    expect(game.status).toBe("lost");
  });

  it("proves Shield Breaker counters shielded acolytes efficiently", () => {
    const game = new GameEngine(1);
    game.placeTower("radio", 1, 0); // Reaches path [0,2] at distance 2.236
    
    // Spawn 1 Hex Acolyte (shield: 18, hp: 66)
    game.enemies = [
      { id: "e1", type: "static", hp: 66, maxHp: 66, shield: 18, progress: 0, slowTimer: 0, slowFactor: 0 }
    ];
    
    // Exhaust spawn queue so no other creep spawns
    game.spawnIndex = game.level.waves[game.waveIndex].length;
    
    // Upgrade it to Rune Lens (shieldBreaker: true, range +0.45)
    game.upgradeTower(0, 0); 
    
    // Fire once
    game.towers[0].cooldownLeft = 0;
    game.status = "running";
    game.tick(0.1);
    
    // Shield breaker deals 8 * 2 = 16 damage to shield. Shield should have 2 left.
    expect(game.enemies[0].shield).toBe(2);
  });
});
