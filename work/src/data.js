// Reference: SYSTEM.md#Data-Configuration
export const CELL = 52;
export const GRID = { cols: 10, rows: 6 };

export const PATH = [
  [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [4, 3], [5, 3], [6, 3],
  [6, 2], [7, 2], [8, 2], [9, 2]
];

export const BUILDABLE = [
  [1, 0], [2, 0], [4, 0], [7, 0], [8, 0],
  [0, 4], [2, 4], [4, 5], [5, 1], [7, 4], [9, 4]
];

export const ENEMIES = {
  chip: { name: "Hollow Imp", hp: 22, speed: 0.92, reward: 9, color: "#d9a441" },
  bolt: { name: "Mire Brute", hp: 52, speed: 0.55, reward: 18, color: "#8f4f31" },
  glass: { name: "Wisp Strider", hp: 30, speed: 1.25, reward: 13, color: "#74d6c5" },
  vault: { name: "Stoneback", hp: 94, speed: 0.38, reward: 31, color: "#7f8b69" },
  static: { name: "Hex Acolyte", hp: 66, speed: 0.72, reward: 24, color: "#b07acb" }
};

export const LEVELS = [
  {
    id: 1,
    name: "Level 1: Briar Glen",
    startingMoney: 86,
    lives: 12,
    waves: [
      ["chip", "chip", "glass", "chip", "bolt", "chip", "glass"],
      ["chip", "bolt", "bolt", "glass", "static", "chip"]
    ]
  },
  {
    id: 2,
    name: "Level 2: Mossgate Ford",
    startingMoney: 112,
    lives: 10,
    waves: [
      ["glass", "chip", "bolt", "glass", "static", "bolt", "chip"],
      ["vault", "bolt", "glass", "static", "bolt", "vault"]
    ]
  },
  {
    id: 3,
    name: "Level 3: Elderfen Crossing",
    startingMoney: 147,
    lives: 9,
    waves: [
      ["static", "glass", "bolt", "vault", "glass", "static"],
      ["vault", "vault", "static", "bolt", "glass", "vault", "static"]
    ]
  }
];

export const TOWERS = {
  punch: {
    name: "Stoneguard Post",
    cost: 28,
    range: 1.8,
    damage: 14,
    cooldown: 0.58,
    color: "#6f5138",
    upgrades: [
      { name: "Oath Stones", cost: 35, damage: 12 },
      { name: "Twin Watch", cost: 56, cooldown: -0.16 }
    ]
  },
  radio: {
    name: "Arcane Spire",
    cost: 42,
    range: 2.55,
    damage: 8,
    cooldown: 0.34,
    color: "#386fb0",
    upgrades: [
      { name: "Rune Lens", cost: 28, range: 0.45 },
      { name: "Storm Choir", cost: 63, damage: 7 },
      { name: "Quickened Glyph", cost: 84, cooldown: -0.08 }
    ]
  },
  tax: {
    name: "Bounty Ballista",
    cost: 49,
    range: 2.05,
    damage: 20,
    cooldown: 1.05,
    color: "#a85c2a",
    upgrades: [
      { name: "Hunter's Mark", cost: 42, damage: 18 },
      { name: "Longbow Winch", cost: 70, range: 0.65 }
    ]
  },
  freezer: {
    name: "Frost Obelisk",
    cost: 63,
    range: 1.95,
    damage: 7,
    cooldown: 0.48,
    slow: 0.34,
    color: "#4f8fc7",
    upgrades: [
      { name: "Winter Bite", cost: 49, slow: 0.16 },
      { name: "Rime Shards", cost: 77, damage: 10 },
      { name: "Glacier Crown", cost: 98, range: 0.55 }
    ]
  }
};
