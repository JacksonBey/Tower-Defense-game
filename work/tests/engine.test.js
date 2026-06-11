// Reference: SYSTEM.md#Unit-Testing
import { describe, expect, it } from "vitest";
import { applyUpgradeStats, GameEngine, hasTrait, isBuildable, isPath, summarizeWave } from "../src/engine.js";

describe("engine", () => {
  it("knows path and build pad cells", () => {
    expect(isPath(0, 2)).toBe(true);
    expect(isBuildable(1, 0)).toBe(true);
    expect(isBuildable(0, 2)).toBe(false);
  });

  it("places towers only on legal cells and charges currency", () => {
    const game = new GameEngine(1);
    expect(game.placeTower("punch", 0, 2).ok).toBe(false);
    expect(game.placeTower("punch", 1, 0).ok).toBe(true);
    expect(game.money).toBe(58);
    expect(game.events).toContainEqual({ type: "place", tower: "punch" });
    expect(game.placeTower("punch", 1, 0).ok).toBe(false);
  });

  it("upgrades towers in order", () => {
    const game = new GameEngine(1);
    game.placeTower("punch", 1, 0);
    expect(game.upgradeTower(0).ok).toBe(true);
    expect(game.towers[0].level).toBe(1);
    expect(game.towers[0].stats.damage).toBe(26);
    expect(game.events).toContainEqual({ type: "upgrade", tower: "punch" });
  });

  it("supports mutually exclusive upgrade branch choices", () => {
    const game = new GameEngine(1);
    game.placeTower("punch", 1, 0);
    const options = game.getUpgradeOptions(0);
    expect(options.map((option) => option.name)).toEqual(["Oath Stones", "Watchfire"]);
    expect(game.upgradeTower(0, 1).ok).toBe(true);
    expect(game.towers[0].level).toBe(1);
    expect(game.towers[0].stats.damage).toBe(14);
    expect(game.towers[0].stats.range).toBeCloseTo(2.15);
    expect(game.towers[0].stats.cooldown).toBeCloseTo(0.54);
    expect(game.towers[0].stats.bonusVsSwarm).toBe(6);
    expect(game.towers[0].upgradeHistory.map((upgrade) => upgrade.id)).toEqual(["watchfire"]);
  });

  it("merges branching upgrade counterplay stats", () => {
    const stats = applyUpgradeStats(
      { damage: 8, range: 2, cooldown: 0.4, slow: 0 },
      { damage: 4, chainTargets: 2, shieldBreaker: true, bonusVsShielded: 12 }
    );
    expect(stats.damage).toBe(12);
    expect(stats.chainTargets).toBe(2);
    expect(stats.shieldBreaker).toBe(true);
    expect(stats.bonusVsShielded).toBe(12);
  });

  it("carries branch counterplay through multiple tiers", () => {
    const game = new GameEngine(1);
    game.money = 999;
    game.placeTower("radio", 1, 0);
    expect(game.upgradeTower(0, 1).ok).toBe(true);
    expect(game.towers[0].stats.chainTargets).toBe(2);
    expect(game.upgradeTower(0, 0).ok).toBe(true);
    expect(game.towers[0].stats.chainTargets).toBe(3);
    expect(game.towers[0].stats.bonusVsShielded).toBe(12);
  });

  it("runs a wave and awards rewards for defeated enemies", () => {
    const game = new GameEngine(1);
    game.placeTower("radio", 2, 0);
    game.placeTower("punch", 4, 0);
    const before = game.money;
    game.startWave();
    expect(game.events).toContainEqual({ type: "wave" });
    for (let i = 0; i < 500 && game.status === "running"; i += 1) game.tick(0.1);
    expect(game.status).not.toBe("running");
    expect(game.money).toBeGreaterThan(before);
  });

  it("can lose when enemies escape", () => {
    const game = new GameEngine(3);
    game.lives = 1;
    game.startWave();
    for (let i = 0; i < 400 && game.status === "running"; i += 1) game.tick(0.1);
    expect(game.status).toBe("lost");
  });

  it("calculates refund correctly when selling a tower", () => {
    const game = new GameEngine(1);
    game.placeTower("punch", 1, 0); // cost: 28. money left: 86 - 28 = 58
    expect(game.money).toBe(58);
    game.upgradeTower(0); // cost: 35. money left: 58 - 35 = 23
    expect(game.money).toBe(23);

    // Total invested: 28 + 35 = 63. 70% refund: Math.floor(63 * 0.7) = 44
    const sellRes = game.sellTower(0);
    expect(sellRes.ok).toBe(true);
    expect(sellRes.refund).toBe(44);
    expect(game.money).toBe(23 + 44); // 67
    expect(game.towers).toHaveLength(0);
    expect(game.events).toContainEqual({ type: "sell", tower: "punch" });
  });

  it("scales game ticks correctly with speedMultiplier", () => {
    const game = new GameEngine(1);
    game.placeTower("punch", 1, 0);
    game.status = "running";
    
    // Set cooldown to trigger
    const tower = game.towers[0];
    tower.cooldownLeft = 1.0;

    // Paused state
    game.speedMultiplier = 0;
    game.tick(0.1);
    expect(tower.cooldownLeft).toBe(1.0); // no cooldown reduction

    // 2x speed state
    game.speedMultiplier = 2;
    game.tick(0.1);
    expect(tower.cooldownLeft).toBe(0.8); // reduced by 0.2
  });

  it("summarizes upcoming waves for preview", () => {
    const game = new GameEngine(1);
    const preview = game.previewWave();
    expect(preview.counts.chip).toBe(4);
    expect(preview.counts.glass).toBe(2);
    expect(preview.totalReward).toBe(80);
    expect(preview.traits).toContain("swarm");
    expect(summarizeWave(["vault"]).traits).toEqual(["armored", "slowResistant", "elite"]);
  });

  it("applies armor and shields before health damage", () => {
    const game = new GameEngine(1);
    const target = { hp: 50, shield: 10, traits: ["armored"] };
    const hit = game.applyTowerDamage({ stats: { damage: 20 } }, target);
    expect(hit).toEqual({ damage: 3, absorbed: 10 });
    expect(target.hp).toBe(47);
    expect(target.shield).toBe(0);
    expect(hasTrait(target, "armored")).toBe(true);
  });

  it("elite enemies cost extra lives if they escape", () => {
    const game = new GameEngine(3);
    game.status = "running";
    game.spawnIndex = game.level.waves[0].length;
    game.enemies = [{ type: "vault", hp: 94, maxHp: 94, progress: 99, slowTimer: 0, slowFactor: 0, traits: ["elite"] }];
    game.tick(0.1);
    expect(game.lives).toBe(7);
    expect(game.events).toContainEqual({ type: "escape", count: 1, livesLost: 2 });
  });

  it("handles custom branching upgrade combat effects correctly", () => {
    const game = new GameEngine(1);

    // 1. Shield Breaker (rune-lens)
    const target1 = { hp: 50, maxHp: 50, shield: 15, traits: [] };
    const hit1 = game.applyTowerDamage({ stats: { damage: 10, shieldBreaker: true } }, target1);
    expect(hit1.absorbed).toBe(15);
    expect(target1.hp).toBe(48);

    // 2. Hunter's Mark (appliesMark + markedTimer modifier)
    const target2 = { hp: 50, maxHp: 50, shield: 0, traits: [], markedTimer: 2.0 };
    const hit2 = game.applyTowerDamage({ stats: { damage: 10 } }, target2);
    expect(hit2.damage).toBe(13);
    expect(target2.hp).toBe(37);

    // 3. Executioner (executePercent)
    const target3 = { hp: 5, maxHp: 50, shield: 0, traits: [] };
    const hit3 = game.applyTowerDamage({ stats: { damage: 10, executePercent: 0.2 } }, target3);
    expect(hit3.damage).toBe(15);
    expect(target3.hp).toBe(-10);

    // 4. Shatter (shatterDamage vs slowed target)
    const target4 = { hp: 50, maxHp: 50, shield: 0, traits: [], slowTimer: 1.0 };
    const hit4 = game.applyTowerDamage({ stats: { damage: 10, shatterDamage: 15 } }, target4);
    expect(hit4.damage).toBe(25);
    expect(target4.hp).toBe(25);
  });

  it("implements multishot, splash, and chain lightning in simulation tick", () => {
    const game = new GameEngine(1);
    game.status = "running";
    game.towers = [{
      id: "t1",
      type: "punch",
      x: 1,
      y: 0,
      level: 2,
      cooldownLeft: 0,
      stats: { damage: 10, range: 3, cooldown: 0.5, multishot: 2, color: "#6f5138" }
    }];
    game.enemies = [
      { id: "e1", type: "chip", hp: 20, maxHp: 20, progress: 1.5, slowTimer: 0, slowFactor: 0 },
      { id: "e2", type: "chip", hp: 20, maxHp: 20, progress: 1.2, slowTimer: 0, slowFactor: 0 }
    ];
    game.tick(0.1);
    expect(game.enemies[0].hp).toBe(10);
    expect(game.enemies[1].hp).toBe(10);
    expect(game.events.filter(e => e.type === "shoot")).toHaveLength(2);
  });
});
