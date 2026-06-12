// Reference: SYSTEM.md#Stat-Comparison
import { applyUpgradeStats } from "./engine.js";

const STAT_DEFS = [
  { key: "damage", label: "DMG", decimals: 0, higherIsBetter: true },
  { key: "range", label: "RNG", decimals: 1, higherIsBetter: true },
  { key: "cooldown", label: "CD", decimals: 2, suffix: "s", higherIsBetter: false },
  { key: "slow", label: "SLOW", decimals: 0, percent: true, higherIsBetter: true }
];

const COUNTER_DEFS = [
  { key: "bonusVsArmored", label: (value) => `Armor +${value}` },
  { key: "bonusVsSwarm", label: (value) => `Swarm +${value}` },
  { key: "bonusVsShielded", label: (value) => `Shield +${value}` },
  { key: "bonusVsElite", label: (value) => `Elite +${value}` },
  { key: "armorPierce", label: () => "Armor Pierce" },
  { key: "shieldBreaker", label: () => "Shield Break" },
  { key: "appliesMark", label: () => "Hunter Mark" },
  { key: "bountyBonus", label: (value) => `Bounty +${value}` },
  { key: "multishot", label: (value) => `Targets ${value}` },
  { key: "splashRadius", label: () => "Splash" },
  { key: "chainTargets", label: (value) => `Chain ${value}` },
  { key: "executePercent", label: (value) => `Execute ${Math.round(value * 100)}%` },
  { key: "shatterDamage", label: (value) => `Shatter +${value}` },
  { key: "bypassSlowResistance", label: () => "Bypass Resist" },
  { key: "aoeSlowRadius", label: () => "Area Slow" }
];

export function formatStatValue(def, value = 0) {
  const normalized = def.percent ? value * 100 : value;
  return `${normalized.toFixed(def.decimals)}${def.percent ? "%" : def.suffix ?? ""}`;
}

export function getTowerStatRows(stats, upgrade = null) {
  const nextStats = upgrade ? applyUpgradeStats(stats, upgrade) : stats;
  return STAT_DEFS.map((def) => {
    const before = stats[def.key] ?? 0;
    const after = nextStats[def.key] ?? 0;
    const delta = after - before;
    const changed = Math.abs(delta) > 0.0001;
    const favorable = changed && (def.higherIsBetter ? delta > 0 : delta < 0);
    return {
      key: def.key,
      label: def.label,
      before: formatStatValue(def, before),
      after: formatStatValue(def, after),
      changed,
      favorable
    };
  });
}

export function getTowerCounterTags(stats, upgrade = null) {
  const target = upgrade ? applyUpgradeStats(stats, upgrade) : stats;
  return COUNTER_DEFS
    .filter((def) => Boolean(target[def.key]))
    .map((def) => def.label(target[def.key]));
}
