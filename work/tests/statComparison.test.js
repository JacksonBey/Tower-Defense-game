// Reference: SYSTEM.md#Unit-Testing
import { describe, expect, it } from "vitest";
import { TOWERS } from "../src/data.js";
import { getTowerCounterTags, getTowerStatRows } from "../src/statComparison.js";

describe("tower stat comparison", () => {
  it("formats baseline tower stats for pre-placement comparison", () => {
    const rows = getTowerStatRows(TOWERS.punch);
    expect(rows.map((row) => row.label)).toEqual(["DMG", "RNG", "CD", "SLOW"]);
    expect(rows.map((row) => row.after)).toEqual(["14", "1.8", "0.58s", "0%"]);
    expect(rows.every((row) => row.changed === false)).toBe(true);
  });

  it("marks upgrade gains and tradeoffs", () => {
    const tower = { ...TOWERS.tax };
    const siegeBolt = TOWERS.tax.upgrades[1][1];
    const rows = getTowerStatRows(tower, siegeBolt);
    const damage = rows.find((row) => row.key === "damage");
    const cooldown = rows.find((row) => row.key === "cooldown");

    expect(damage.after).toBe("46");
    expect(damage.changed).toBe(true);
    expect(damage.favorable).toBe(true);
    expect(cooldown.after).toBe("1.23s");
    expect(cooldown.changed).toBe(true);
    expect(cooldown.favorable).toBe(false);
  });

  it("summarizes counterplay tags after an upgrade", () => {
    const tags = getTowerCounterTags(TOWERS.radio, TOWERS.radio.upgrades[0][0]);
    expect(tags).toContain("Shield Break");
  });
});
