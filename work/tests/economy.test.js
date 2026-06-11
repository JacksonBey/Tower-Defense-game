// Reference: SYSTEM.md#Unit-Testing
import { describe, expect, it } from "vitest";
import { canAfford, formatMoney, toDenominations } from "../src/economy.js";

describe("economy", () => {
  it("formats currency into denominations of seven", () => {
    expect(formatMoney(86)).toBe("1C 5S 2B");
    expect(toDenominations(147).map((item) => item.count)).toEqual([3, 0, 0]);
  });

  it("prevents purchases above balance", () => {
    expect(canAfford(49, 49)).toBe(true);
    expect(canAfford(48, 49)).toBe(false);
  });
});
