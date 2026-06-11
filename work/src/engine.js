// Reference: SYSTEM.md#Engine-Simulation
import { BUILDABLE, CELL, ENEMIES, GRID, LEVELS, PATH, TOWERS } from "./data.js";

const keyOf = ([x, y]) => `${x},${y}`;
const pathKeys = new Set(PATH.map(keyOf));
const buildKeys = new Set(BUILDABLE.map(keyOf));
const UPGRADE_META_KEYS = new Set(["id", "name", "cost", "summary"]);
const ADDITIVE_UPGRADE_KEYS = new Set([
  "damage",
  "range",
  "cooldown",
  "slow",
  "bonusVsArmored",
  "bonusVsSwarm",
  "bonusVsShielded",
  "bonusVsElite",
  "bountyBonus",
  "shatterDamage"
]);
const MAX_UPGRADE_KEYS = new Set(["multishot", "chainTargets", "splashRadius", "executePercent", "aoeSlowRadius"]);

export function isBuildable(x, y) {
  return x >= 0 && y >= 0 && x < GRID.cols && y < GRID.rows && buildKeys.has(`${x},${y}`);
}

export function isPath(x, y) {
  return pathKeys.has(`${x},${y}`);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function hasTrait(enemyOrData, trait) {
  return (enemyOrData.traits ?? []).includes(trait);
}

export function summarizeWave(wave, enemyCatalog = ENEMIES) {
  const counts = {};
  let totalReward = 0;
  const traits = new Set();
  for (const type of wave ?? []) {
    const enemy = enemyCatalog[type];
    if (!enemy) continue;
    counts[type] = (counts[type] ?? 0) + 1;
    totalReward += enemy.reward;
    for (const trait of enemy.traits ?? []) traits.add(trait);
  }
  return { counts, totalReward, traits: [...traits] };
}

export function upgradeOptionsFor(towerOrType, level = 0) {
  const type = typeof towerOrType === "string" ? towerOrType : towerOrType?.type;
  const towerLevel = typeof towerOrType === "string" ? level : towerOrType?.level ?? level;
  const tier = TOWERS[type]?.upgrades[towerLevel];
  if (!tier) return [];
  return Array.isArray(tier) ? tier : [tier];
}

export function applyUpgradeStats(stats, upgrade) {
  const next = { ...stats };
  for (const [key, value] of Object.entries(upgrade)) {
    if (UPGRADE_META_KEYS.has(key)) continue;
    if (ADDITIVE_UPGRADE_KEYS.has(key)) {
      next[key] = (next[key] ?? 0) + value;
    } else if (MAX_UPGRADE_KEYS.has(key)) {
      next[key] = Math.max(next[key] ?? 0, value);
    } else if (typeof value === "boolean") {
      next[key] = next[key] || value;
    }
  }
  next.cooldown = Math.max(0.16, next.cooldown);
  next.slow = Math.min(0.75, next.slow ?? 0);
  return next;
}

export class GameEngine {
  constructor(levelId = 1) {
    this.loadLevel(levelId);
  }

  loadLevel(levelId) {
    const level = LEVELS.find((item) => item.id === levelId) ?? LEVELS[0];
    this.level = {
      ...level,
      waves: [...level.waves]
    };
    this.money = level.startingMoney;
    this.lives = level.lives;
    this.waveIndex = 0;
    this.spawnIndex = 0;
    this.spawnTimer = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.events = [];
    this.status = "build";
    this.message = "Raise towers. Hold the lane.";
    this.time = 0;
    this.speedMultiplier = 1;
    this.endlessMode = false;
  }

  generateEndlessWave(waveIndex) {
    const count = 6 + waveIndex * 2;
    const types = ["chip", "bolt", "glass", "vault", "static"];
    const wave = [];
    for (let i = 0; i < count; i++) {
      const maxIndex = Math.min(types.length, Math.floor(2 + waveIndex * 0.4));
      const type = types[Math.floor(Math.random() * maxIndex)];
      wave.push(type);
    }
    this.level.waves.push(wave);
  }

  get occupiedCells() {
    return new Set(this.towers.map((tower) => `${tower.x},${tower.y}`));
  }

  placeTower(type, x, y) {
    const blueprint = TOWERS[type];
    if (!blueprint) return { ok: false, reason: "unknown tower" };
    if (!isBuildable(x, y) || this.occupiedCells.has(`${x},${y}`)) {
      return { ok: false, reason: "invalid pad" };
    }
    if (this.money < blueprint.cost) return { ok: false, reason: "not enough currency" };
    this.money -= blueprint.cost;
    this.towers.push({
      id: `tower-${Date.now()}-${this.towers.length}`,
      type,
      x,
      y,
      level: 0,
      upgradeHistory: [],
      cooldownLeft: 0,
      stats: { ...blueprint }
    });
    this.message = `${blueprint.name} stands ready.`;
    this.events.push({ type: "place", tower: type });
    return { ok: true };
  }

  getUpgradeOptions(indexOrTower) {
    const tower = typeof indexOrTower === "number" ? this.towers[indexOrTower] : indexOrTower;
    return upgradeOptionsFor(tower);
  }

  upgradeTower(index, choiceIndex = 0) {
    const tower = this.towers[index];
    if (!tower) return { ok: false, reason: "missing tower" };
    const options = this.getUpgradeOptions(tower);
    const upgrade = options[choiceIndex];
    if (!upgrade) return { ok: false, reason: "fully upgraded" };
    if (this.money < upgrade.cost) return { ok: false, reason: "not enough currency" };
    this.money -= upgrade.cost;
    tower.level += 1;
    tower.upgradeHistory.push(upgrade);
    tower.stats = applyUpgradeStats(tower.stats, upgrade);
    this.message = `${tower.stats.name} got ${upgrade.name}.`;
    this.events.push({ type: "upgrade", tower: tower.type });
    return { ok: true };
  }

  sellTower(index) {
    const tower = this.towers[index];
    if (!tower) return { ok: false, reason: "missing tower" };
    const blueprint = TOWERS[tower.type];
    const totalCost = blueprint.cost + (tower.upgradeHistory ?? []).reduce((sum, upgrade) => sum + upgrade.cost, 0);
    const refund = Math.floor(totalCost * 0.7);
    this.money += refund;
    this.towers.splice(index, 1);
    this.message = `${tower.stats.name} salvaged. Recovered ${refund}.`;
    this.events.push({ type: "sell", tower: tower.type });
    return { ok: true, refund };
  }

  startWave() {
    if (this.status === "running") return { ok: false, reason: "wave already running" };
    if (this.waveIndex >= this.level.waves.length) return { ok: false, reason: "no waves left" };
    this.status = "running";
    this.spawnIndex = 0;
    this.spawnTimer = 0;
    this.message = `Wave ${this.waveIndex + 1} enters the path.`;
    this.events.push({ type: "wave" });
    return { ok: true };
  }

  enemyCenter(enemy) {
    const seg = Math.min(Math.floor(enemy.progress), PATH.length - 1);
    const next = Math.min(seg + 1, PATH.length - 1);
    const t = Math.min(1, enemy.progress - seg);
    const [ax, ay] = PATH[seg];
    const [bx, by] = PATH[next];
    return { x: ax + (bx - ax) * t + 0.5, y: ay + (by - ay) * t + 0.5 };
  }

  spawnEnemy(type) {
    const data = ENEMIES[type];
    this.enemies.push({
      id: `enemy-${this.time}-${this.enemies.length}`,
      type,
      hp: data.hp,
      maxHp: data.hp,
      shield: data.shield ?? 0,
      reward: data.reward,
      traits: [...(data.traits ?? [])],
      progress: 0,
      slowTimer: 0,
      slowFactor: 0,
      markedTimer: 0
    });
    this.events.push({ type: "spawn", enemy: type });
  }

  previewWave(index = this.waveIndex) {
    while (index >= this.level.waves.length) {
      this.generateEndlessWave(this.level.waves.length);
    }
    return summarizeWave(this.level.waves[index], ENEMIES);
  }

  applyTowerDamage(tower, target) {
    let damage = tower.stats.damage;

    // 1. Hunter's Mark modifier
    if (target.markedTimer > 0) {
      damage = Math.ceil(damage * 1.3);
    }

    // 2. Trait bonuses
    if (hasTrait(target, "armored") && tower.stats.bonusVsArmored) {
      damage += tower.stats.bonusVsArmored;
    }
    if (hasTrait(target, "swarm") && tower.stats.bonusVsSwarm) {
      damage += tower.stats.bonusVsSwarm;
    }
    if (target.shield > 0 && tower.stats.bonusVsShielded) {
      damage += tower.stats.bonusVsShielded;
    }
    if (hasTrait(target, "elite") && tower.stats.bonusVsElite) {
      damage += tower.stats.bonusVsElite;
    }

    // 3. Shatter bonus
    if (target.slowTimer > 0 && tower.stats.shatterDamage) {
      damage += tower.stats.shatterDamage;
    }

    // 4. Execute modifier
    if (tower.stats.executePercent && (target.hp / target.maxHp) <= tower.stats.executePercent) {
      damage = Math.ceil(damage * 1.5);
    }

    // 5. Armor reduction
    if (hasTrait(target, "armored") && !tower.stats.armorPierce) {
      damage = Math.max(1, Math.ceil(damage * 0.65));
    }

    // 6. Shield absorption
    const shieldBefore = target.shield ?? 0;
    if (shieldBefore > 0) {
      let shieldDamage = damage;
      if (tower.stats.shieldBreaker) {
        shieldDamage *= 2;
      }
      const absorbed = Math.min(shieldBefore, shieldDamage);
      target.shield -= absorbed;
      if (tower.stats.shieldBreaker) {
        damage -= Math.ceil(absorbed / 2);
      } else {
        damage -= absorbed;
      }
    }

    target.hp -= damage;
    return { damage, absorbed: shieldBefore - (target.shield ?? 0) };
  }

  tick(dt = 0.1) {
    this.events = [];
    if (this.speedMultiplier === 0) return;
    const adjustedDt = dt * this.speedMultiplier;
    this.time += adjustedDt;
    if (this.status !== "running") return;
    const wave = this.level.waves[this.waveIndex];
    this.spawnTimer -= adjustedDt;
    if (this.spawnIndex < wave.length && this.spawnTimer <= 0) {
      this.spawnEnemy(wave[this.spawnIndex]);
      this.spawnIndex += 1;
      this.spawnTimer = 0.68;
    }

    for (const enemy of this.enemies) {
      const speed = ENEMIES[enemy.type].speed * (enemy.slowTimer > 0 ? 1 - enemy.slowFactor : 1);
      enemy.progress += speed * adjustedDt;
      enemy.slowTimer = Math.max(0, enemy.slowTimer - adjustedDt);
      enemy.markedTimer = Math.max(0, (enemy.markedTimer ?? 0) - adjustedDt);
    }

    const escaped = this.enemies.filter((enemy) => enemy.progress >= PATH.length - 1);
    if (escaped.length) {
      const livesLost = escaped.reduce((sum, enemy) => sum + (hasTrait(enemy, "elite") ? 2 : 1), 0);
      this.lives -= livesLost;
      this.events.push({ type: "escape", count: escaped.length, livesLost });
    }
    this.enemies = this.enemies.filter((enemy) => enemy.progress < PATH.length - 1);

    for (const tower of this.towers) {
      tower.cooldownLeft -= adjustedDt;
      if (tower.cooldownLeft > 0) continue;
      const origin = { x: tower.x + 0.5, y: tower.y + 0.5 };
      const targetsInRange = this.enemies
        .map((enemy) => ({ enemy, dist: distance(origin, this.enemyCenter(enemy)) }))
        .filter((item) => item.dist <= tower.stats.range)
        .sort((a, b) => b.enemy.progress - a.enemy.progress);

      if (targetsInRange.length === 0) continue;

      const multishotCount = tower.stats.multishot ?? 1;
      const chosenTargets = targetsInRange.slice(0, multishotCount).map((item) => item.enemy);

      for (const target of chosenTargets) {
        const targetPos = this.enemyCenter(target);

        // Apply Hunter's Mark
        if (tower.stats.appliesMark) {
          target.markedTimer = 3.0;
        }

        // Apply Bounty Bonus
        if (tower.stats.bountyBonus && !target.bountyAdded) {
          target.bountyAdded = true;
          target.reward += tower.stats.bountyBonus;
        }

        const hit = this.applyTowerDamage(tower, target);

        // Apply Slow / Control
        if (tower.stats.slow) {
          const applySlow = (t) => {
            const hasResistance = hasTrait(t, "slowResistant") && !tower.stats.bypassSlowResistance;
            const resistance = hasResistance ? 0.45 : 1;
            t.slowTimer = 1.1;
            t.slowFactor = Math.max(t.slowFactor, tower.stats.slow * resistance);
          };
          applySlow(target);

          if (tower.stats.aoeSlowRadius) {
            const targetPosOther = this.enemyCenter(target);
            for (const other of this.enemies) {
              if (other.id === target.id) continue;
              const otherPos = this.enemyCenter(other);
              if (distance(targetPosOther, otherPos) <= tower.stats.aoeSlowRadius) {
                applySlow(other);
              }
            }
          }
        }

        // Apply Splash / AoE
        if (tower.stats.splashRadius) {
          for (const other of this.enemies) {
            if (other.id === target.id) continue;
            const otherPos = this.enemyCenter(other);
            if (distance(targetPos, otherPos) <= tower.stats.splashRadius) {
              this.applyTowerDamage({ stats: { damage: Math.ceil(tower.stats.damage * 0.5) } }, other);
            }
          }
        }

        // Apply Chain Lightning
        if (tower.stats.chainTargets) {
          let current = target;
          let chainCount = tower.stats.chainTargets;
          let chainDamage = tower.stats.damage;
          const hitEnemies = new Set([current.id]);
          while (chainCount > 0) {
            chainDamage = Math.ceil(chainDamage * 0.65);
            const currentPos = this.enemyCenter(current);
            const nextTarget = this.enemies
              .filter((e) => !hitEnemies.has(e.id))
              .map((e) => ({ enemy: e, dist: distance(currentPos, this.enemyCenter(e)) }))
              .filter((item) => item.dist <= 1.5)
              .sort((a, b) => a.dist - b.dist)[0]?.enemy;
            if (!nextTarget) break;
            current = nextTarget;
            hitEnemies.add(current.id);
            this.applyTowerDamage({ stats: { damage: chainDamage } }, current);
            this.projectiles.push({ from: currentPos, to: this.enemyCenter(current), life: 0.15, color: "#74d6c5" });
            chainCount--;
          }
        }

        this.projectiles.push({ from: origin, to: targetPos, life: 0.18, color: tower.stats.color });
        this.events.push({ type: "shoot", tower: tower.type, targetX: targetPos.x, targetY: targetPos.y, damage: hit.damage, absorbed: hit.absorbed });
      }

      tower.cooldownLeft = tower.stats.cooldown;
    }

    for (const enemy of this.enemies.filter((enemy) => enemy.hp <= 0)) {
      const pos = this.enemyCenter(enemy);
      const reward = enemy.reward;
      this.money += reward;
      this.events.push({ type: "defeat", enemy: enemy.type, x: pos.x, y: pos.y, reward });
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    this.projectiles = this.projectiles.map((p) => ({ ...p, life: p.life - adjustedDt })).filter((p) => p.life > 0);

    if (this.lives <= 0) {
      this.status = "lost";
      this.message = "The hold has fallen. Rally and rebuild.";
      this.events.push({ type: "lost" });
    } else if (this.spawnIndex >= wave.length && this.enemies.length === 0) {
      this.waveIndex += 1;
      if (this.endlessMode || this.waveIndex < this.level.waves.length) {
        this.status = "build";
        this.message = "Wave broken. Spend wisely.";
        this.events.push({ type: "waveClear" });
        if (this.waveIndex >= this.level.waves.length) {
          this.generateEndlessWave(this.waveIndex);
        }
      } else {
        this.status = "won";
        this.message = `${this.level.name} cleared.`;
        this.events.push({ type: "won" });
      }
    }
  }

  cellToPixels(x, y) {
    return { x: x * CELL, y: y * CELL };
  }
}
