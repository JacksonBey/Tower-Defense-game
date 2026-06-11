// Reference: SYSTEM.md#Data-Configuration
export const CELL = 52;
export const GRID = { cols: 12, rows: 8 };

export const PATH = [
  [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [4, 3], [5, 3], [6, 3],
  [6, 2], [7, 2], [8, 2], [9, 2],
  [9, 3], [9, 4], [9, 5], [9, 6], [10, 6], [11, 6], [11, 5], [11, 4], [11, 3], [11, 2]
];

export const BUILDABLE = [
  [1, 0], [2, 0], [4, 0], [7, 0], [8, 0],
  [0, 4], [2, 4], [4, 5], [5, 1], [7, 4], [9, 4],
  [1, 6], [2, 6], [4, 6], [5, 6], [7, 6],
  [2, 7], [3, 7], [5, 7], [6, 7], [8, 7],
  [10, 1], [10, 3], [10, 5], [11, 0], [11, 7]
];

export const TRAITS = {
  swarm: { label: "Swarm", description: "Small bodies arrive cheaply and punish weak coverage." },
  armored: { label: "Armored", description: "Reduces incoming tower damage." },
  shielded: { label: "Shielded", description: "Starts with a ward that absorbs damage." },
  slowResistant: { label: "Slow-Resistant", description: "Shrugs off part of frost control." },
  elite: { label: "Elite", description: "Costs extra lives if it reaches the exit." }
};

export const ENEMIES = {
  chip: { name: "Hollow Imp", hp: 22, speed: 0.92, reward: 9, color: "#d9a441", traits: ["swarm"] },
  bolt: { name: "Mire Brute", hp: 52, speed: 0.55, reward: 18, color: "#8f4f31", traits: ["armored"] },
  glass: { name: "Wisp Strider", hp: 30, speed: 1.25, reward: 13, color: "#74d6c5", traits: ["swarm"] },
  vault: { name: "Stoneback", hp: 94, speed: 0.38, reward: 31, color: "#7f8b69", traits: ["armored", "slowResistant", "elite"] },
  static: { name: "Hex Acolyte", hp: 66, speed: 0.72, reward: 24, color: "#b07acb", traits: ["shielded"], shield: 18 }
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
      [
        { id: "oath-stones", name: "Oath Stones", cost: 35, damage: 12, summary: "+12 damage" },
        { id: "watchfire", name: "Watchfire", cost: 35, range: 0.35, cooldown: -0.04, summary: "+0.4 range, faster" }
      ],
      [
        { id: "twin-watch", name: "Twin Watch", cost: 56, cooldown: -0.16, summary: "Much faster attacks" },
        { id: "crag-hammer", name: "Crag Hammer", cost: 56, damage: 18, summary: "+18 damage" }
      ]
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
      [
        { id: "rune-lens", name: "Rune Lens", cost: 28, range: 0.45, summary: "+0.5 range" },
        { id: "blue-spark", name: "Blue Spark", cost: 28, damage: 4, summary: "+4 damage" }
      ],
      [
        { id: "storm-choir", name: "Storm Choir", cost: 63, damage: 7, summary: "+7 damage" },
        { id: "wide-sigil", name: "Wide Sigil", cost: 63, range: 0.65, summary: "+0.7 range" }
      ],
      [
        { id: "quickened-glyph", name: "Quickened Glyph", cost: 84, cooldown: -0.08, summary: "Faster casting" },
        { id: "deep-focus", name: "Deep Focus", cost: 84, damage: 10, cooldown: 0.08, summary: "+10 damage, slower" }
      ]
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
      [
        { id: "hunters-mark", name: "Hunter's Mark", cost: 42, damage: 18, summary: "+18 damage" },
        { id: "rangefinder", name: "Rangefinder", cost: 42, range: 0.45, cooldown: -0.08, summary: "+0.5 range, faster" }
      ],
      [
        { id: "longbow-winch", name: "Longbow Winch", cost: 70, range: 0.65, summary: "+0.7 range" },
        { id: "siege-bolt", name: "Siege Bolt", cost: 70, damage: 26, cooldown: 0.18, summary: "+26 damage, slower" }
      ]
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
      [
        { id: "winter-bite", name: "Winter Bite", cost: 49, slow: 0.16, summary: "+16% slow" },
        { id: "cold-reach", name: "Cold Reach", cost: 49, range: 0.45, summary: "+0.5 range" }
      ],
      [
        { id: "rime-shards", name: "Rime Shards", cost: 77, damage: 10, summary: "+10 damage" },
        { id: "deep-freeze", name: "Deep Freeze", cost: 77, slow: 0.2, cooldown: 0.08, summary: "Stronger slow, slower" }
      ],
      [
        { id: "glacier-crown", name: "Glacier Crown", cost: 98, range: 0.55, summary: "+0.6 range" },
        { id: "ice-heart", name: "Ice Heart", cost: 98, damage: 16, slow: 0.08, summary: "+16 damage, more slow" }
      ]
    ]
  }
};
