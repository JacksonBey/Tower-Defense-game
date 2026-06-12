// Reference: SYSTEM.md#Map-Secrets
import { describe, expect, it } from "vitest";
import { GOLD_CHEST_REWARD, createMapProps, findPropAtCell, openGoldChest } from "../src/mapSecrets.js";

describe("map secrets", () => {
  const openGrid = {
    levelId: 1,
    cols: 5,
    rows: 4,
    isPath: (x, y) => x === 0 && y === 0,
    isBuildable: (x, y) => x === 1 && y === 0
  };

  it("generates deterministic props with one unopened gold chest", () => {
    const first = createMapProps(openGrid);
    const second = createMapProps(openGrid);
    const chests = first.filter((prop) => prop.type === "gold_chest");

    expect(first).toEqual(second);
    expect(chests).toHaveLength(1);
    expect(chests[0].opened).toBe(false);
    expect(chests[0].reward).toBe(GOLD_CHEST_REWARD);
    expect(openGrid.isPath(chests[0].x, chests[0].y)).toBe(false);
    expect(openGrid.isBuildable(chests[0].x, chests[0].y)).toBe(false);
  });

  it("opens a gold chest only once", () => {
    const props = createMapProps(openGrid);
    const chest = props.find((prop) => prop.type === "gold_chest");

    expect(findPropAtCell(props, chest.x, chest.y, "gold_chest")).toBe(chest);
    expect(openGoldChest(props, chest.x, chest.y)).toMatchObject({ ok: true, reward: GOLD_CHEST_REWARD });
    expect(chest.opened).toBe(true);
    expect(openGoldChest(props, chest.x, chest.y)).toEqual({ ok: false });
    expect(openGoldChest(props, 0, 0)).toEqual({ ok: false });
  });
});
