// Reference: SYSTEM.md#Unit-Testing
import { describe, expect, it } from "vitest";
import { ENEMIES, LEVELS, TOWERS } from "../src/data.js";

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
});
