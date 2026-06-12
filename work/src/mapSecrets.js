// Reference: SYSTEM.md#Map-Secrets
export const GOLD_CHEST_REWARD = 21;

export function mapNoise(levelId, x, y) {
  const seed = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + levelId * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
}

export function createMapProps({ levelId, cols, rows, isPath, isBuildable }) {
  const props = [];
  const chestCandidates = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (isPath(x, y) || isBuildable(x, y)) continue;

      const r = mapNoise(levelId, x, y);
      chestCandidates.push({ x, y, score: r });

      if (r < 0.22) {
        let propType = "grass_tuft";
        if (r < 0.06) propType = "tree";
        else if (r < 0.12) propType = "rock";
        else if (r < 0.17) propType = "flower";

        props.push({
          x,
          y,
          type: propType,
          scale: 0.85 + ((r * 100) % 0.3),
          variant: Math.floor(r * 1000) % 3
        });
      }
    }
  }

  const chest = chestCandidates
    .filter((candidate) => candidate.score > 0.35)
    .sort((a, b) => b.score - a.score)[0] ?? chestCandidates[0];

  if (chest) {
    props.push({
      x: chest.x,
      y: chest.y,
      type: "gold_chest",
      scale: 1,
      variant: levelId % 3,
      reward: GOLD_CHEST_REWARD,
      opened: false
    });
  }

  return props;
}

export function findPropAtCell(props, x, y, type = null) {
  return props.find((prop) => prop.x === x && prop.y === y && (!type || prop.type === type));
}

export function openGoldChest(props, x, y) {
  const chest = findPropAtCell(props, x, y, "gold_chest");
  if (!chest || chest.opened) return { ok: false };
  chest.opened = true;
  return { ok: true, reward: chest.reward ?? GOLD_CHEST_REWARD, prop: chest };
}
