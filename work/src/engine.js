// Reference: SYSTEM.md#Engine-Simulation
import { BUILDABLE, CELL, ENEMIES, GRID, LEVELS, PATH, TOWERS } from "./data.js";

const keyOf = ([x, y]) => `${x},${y}`;
const pathKeys = new Set(PATH.map(keyOf));
const buildKeys = new Set(BUILDABLE.map(keyOf));

export function isBuildable(x, y) {
  return x >= 0 && y >= 0 && x < GRID.cols && y < GRID.rows && buildKeys.has(`${x},${y}`);
}

export function isPath(x, y) {
  return pathKeys.has(`${x},${y}`);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
      cooldownLeft: 0,
      stats: { ...blueprint }
    });
    this.message = `${blueprint.name} stands ready.`;
    this.events.push({ type: "place", tower: type });
    return { ok: true };
  }

  upgradeTower(index) {
    const tower = this.towers[index];
    if (!tower) return { ok: false, reason: "missing tower" };
    const upgrade = TOWERS[tower.type].upgrades[tower.level];
    if (!upgrade) return { ok: false, reason: "fully upgraded" };
    if (this.money < upgrade.cost) return { ok: false, reason: "not enough currency" };
    this.money -= upgrade.cost;
    tower.level += 1;
    tower.stats = {
      ...tower.stats,
      damage: tower.stats.damage + (upgrade.damage ?? 0),
      range: tower.stats.range + (upgrade.range ?? 0),
      cooldown: Math.max(0.16, tower.stats.cooldown + (upgrade.cooldown ?? 0)),
      slow: Math.min(0.75, (tower.stats.slow ?? 0) + (upgrade.slow ?? 0))
    };
    this.message = `${tower.stats.name} got ${upgrade.name}.`;
    this.events.push({ type: "upgrade", tower: tower.type });
    return { ok: true };
  }

  sellTower(index) {
    const tower = this.towers[index];
    if (!tower) return { ok: false, reason: "missing tower" };
    const blueprint = TOWERS[tower.type];
    let totalCost = blueprint.cost;
    for (let i = 0; i < tower.level; i++) {
      totalCost += blueprint.upgrades[i].cost;
    }
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
      progress: 0,
      slowTimer: 0,
      slowFactor: 0
    });
    this.events.push({ type: "spawn", enemy: type });
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
    }

    const escaped = this.enemies.filter((enemy) => enemy.progress >= PATH.length - 1);
    if (escaped.length) {
      this.lives -= escaped.length;
      this.events.push({ type: "escape", count: escaped.length });
    }
    this.enemies = this.enemies.filter((enemy) => enemy.progress < PATH.length - 1);

    for (const tower of this.towers) {
      tower.cooldownLeft -= adjustedDt;
      if (tower.cooldownLeft > 0) continue;
      const origin = { x: tower.x + 0.5, y: tower.y + 0.5 };
      const target = this.enemies
        .map((enemy) => ({ enemy, dist: distance(origin, this.enemyCenter(enemy)) }))
        .filter((item) => item.dist <= tower.stats.range)
        .sort((a, b) => b.enemy.progress - a.enemy.progress)[0]?.enemy;
      if (!target) continue;
      const targetPos = this.enemyCenter(target);
      target.hp -= tower.stats.damage;
      if (tower.stats.slow) {
        target.slowTimer = 1.1;
        target.slowFactor = Math.max(target.slowFactor, tower.stats.slow);
      }
      this.projectiles.push({ from: origin, to: targetPos, life: 0.18, color: tower.stats.color });
      this.events.push({ type: "shoot", tower: tower.type, targetX: targetPos.x, targetY: targetPos.y, damage: tower.stats.damage });
      tower.cooldownLeft = tower.stats.cooldown;
    }

    for (const enemy of this.enemies.filter((enemy) => enemy.hp <= 0)) {
      const pos = this.enemyCenter(enemy);
      const reward = ENEMIES[enemy.type].reward;
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
