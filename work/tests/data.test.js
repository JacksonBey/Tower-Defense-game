// Reference: SYSTEM.md#Unit-Testing
import { describe, expect, it } from "vitest";
import { ENEMIES, LEVELS, TOWERS, TRAITS } from "../src/data.js";

describe("game content", () => {
  it("has exactly the requested level, enemy, and tower counts", () => {
    expect(LEVELS).toHaveLength(3);
    expect(Object.keys(ENEMIES)).toHaveLength(5);
    expect(Object.keys(TOWERS)).toHaveLength(4);
  });

  it("gives every tower two or three upgrades", () => {
    for (const tower of Object.values(TOWERS)) {
      expect(tower.upgrades.length).toBeGreaterThanOrEqual(2);
      expect(tower.upgrades.length).toBeLessThanOrEqual(3);
    }
  });

  it("gives every upgrade tier two branch choices with costs and summaries", () => {
    for (const tower of Object.values(TOWERS)) {
      for (const tier of tower.upgrades) {
        expect(tier).toHaveLength(2);
        for (const option of tier) {
          expect(option.cost).toBeGreaterThan(0);
          expect(option.summary.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("defines known trait metadata and assigns traits to every enemy", () => {
    expect(Object.keys(TRAITS)).toEqual(["swarm", "armored", "shielded", "slowResistant", "elite"]);
    for (const enemy of Object.values(ENEMIES)) {
      expect(enemy.traits.length).toBeGreaterThanOrEqual(1);
      for (const trait of enemy.traits) expect(TRAITS[trait]).toBeTruthy();
    }
  });

  it("gives every authored level an elite finale wave", () => {
    for (const level of LEVELS) {
      expect(level.waves.length).toBeGreaterThanOrEqual(3);
      const finale = level.waves.at(-1);
      expect(finale.some((type) => ENEMIES[type].traits.includes("elite"))).toBe(true);
    }
  });

  it("defines distinct, continuous paths and valid build pads for all levels", () => {
    const pathStrings = LEVELS.map(lvl => JSON.stringify(lvl.path));
    const buildableStrings = LEVELS.map(lvl => JSON.stringify(lvl.buildable));
    expect(new Set(pathStrings).size).toBe(3);
    expect(new Set(buildableStrings).size).toBe(3);

    for (const level of LEVELS) {
      expect(level.path).toBeDefined();
      expect(level.path.length).toBeGreaterThan(0);
      expect(level.buildable).toBeDefined();
      expect(level.buildable.length).toBeGreaterThan(0);

      // Verify path continuity (adjacent moves only)
      for (let i = 0; i < level.path.length - 1; i++) {
        const [x1, y1] = level.path[i];
        const [x2, y2] = level.path[i + 1];
        const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
        expect(dist).toBe(1);
      }

      // Verify build pads are legal (in bounds and no path overlap)
      const pathSet = new Set(level.path.map(([x, y]) => `${x},${y}`));
      for (const [x, y] of level.buildable) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(12);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(8);
        expect(pathSet.has(`${x},${y}`)).toBe(false);
      }
    }
  });
});
