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
});
