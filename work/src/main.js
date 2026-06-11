// Reference: SYSTEM.md#Main-Logic
import "./styles.css";
import { ENEMIES, GRID, LEVELS, PATH, TOWERS, CELL, BUILDABLE, TRAITS } from "./data.js";
import { formatMoney } from "./economy.js";
import { GameEngine, isPath, isBuildable } from "./engine.js";
import { SoundSystem } from "./sound.js";

import punchIconUrl from "./assets/stoneguard_post_icon.png";
import radioIconUrl from "./assets/arcane_spire_icon.png";
import taxIconUrl from "./assets/bounty_ballista_icon.png";
import freezerIconUrl from "./assets/frost_obelisk_icon.png";

const TOWER_ICONS = {
  punch: punchIconUrl,
  radio: radioIconUrl,
  tax: taxIconUrl,
  freezer: freezerIconUrl
};

function getTowerIconHtml(type) {
  return `<img class="tower-icon-img" src="${TOWER_ICONS[type]}" alt="${TOWERS[type].name}" />`;
}

const app = document.querySelector("#app");
const engine = new GameEngine(1);
const sounds = new SoundSystem();
let selectedTowerType = "punch";
let selectedTowerIndex = -1;
let last = performance.now();
let inspectKey = "";
let hoveredCell = null;
let floatingTexts = [];
let particles = [];
let shakeTimer = 0;
let firstAnnounce = false;

function announceLevel(levelId) {
  if (levelId === 1) {
    sounds.speak("Briar Glen. Raise towers. Hold the lane.");
  } else if (levelId === 2) {
    sounds.speak("Mossgate Ford. Secure the crossing.");
  } else if (levelId === 3) {
    sounds.speak("Elderfen Crossing. The final stand.");
  }
}

app.innerHTML = `
  <main class="shell">
    <section class="topbar">
      <div>
        <h1>Runehold TD</h1>
        <p>Fantasy RTS tower defense with awkward old-kingdom coinage.</p>
      </div>
      <div class="meters" aria-live="polite">
        <span data-testid="money"></span>
        <span data-testid="lives"></span>
        <span data-testid="wave"></span>
        <div class="speed-group" data-testid="speed-group">
          <button data-speed="1" class="speed-btn active" data-testid="speed-1">1x</button>
          <button data-speed="2" class="speed-btn" data-testid="speed-2">2x</button>
          <button data-speed="0" class="speed-btn pause-btn" data-testid="speed-0">Pause</button>
        </div>
        <button class="sound" data-testid="sound-toggle">Sound Off</button>
      </div>
    </section>
    <section class="game-wrap">
      <aside class="panel">
        <h2>War Paths</h2>
        <div class="level-list" data-testid="levels"></div>
        <div class="toggle-row">
          <input type="checkbox" id="endless-toggle" data-testid="endless-toggle" />
          <label for="endless-toggle">Endless Mode</label>
        </div>
        <h2>Audio Settings</h2>
        <div class="audio-panel">
          <div class="slider-row">
            <label>Master</label>
            <input type="range" min="0" max="100" data-volume-channel="master" data-testid="volume-master" />
          </div>
          <div class="slider-row">
            <label>Combat</label>
            <input type="range" min="0" max="100" data-volume-channel="combat" data-testid="volume-combat" />
          </div>
          <div class="slider-row">
            <label>Build</label>
            <input type="range" min="0" max="100" data-volume-channel="build" data-testid="volume-build" />
          </div>
          <div class="slider-row">
            <label>System</label>
            <input type="range" min="0" max="100" data-volume-channel="system" data-testid="volume-system" />
          </div>
        </div>
        <h2>Next Wave</h2>
        <div class="wave-preview" data-testid="wave-preview"></div>
        <h2>Build Towers</h2>
        <div class="tower-list" data-testid="towers"></div>
        <button class="start" data-testid="start-wave">Start Wave</button>
        <button class="reset" data-testid="reset-level">Reset Level</button>
        <div class="inspect" data-testid="inspect"></div>
      </aside>
      <div class="board-frame">
        <canvas width="${GRID.cols * CELL}" height="${GRID.rows * CELL}" data-testid="game-canvas" aria-label="Runehold tower defense board"></canvas>
        <div class="message" data-testid="message" aria-live="polite"></div>
      </div>
      <aside class="panel codex">
        <h2>Creep Ledger</h2>
        <div class="enemy-list"></div>
      </aside>
    </section>
  </main>
`;

const canvas = app.querySelector("canvas");
const ctx = canvas.getContext("2d");
const THEME = {
  ink: "#21170f",
  grassA: "#4f7f3d",
  grassB: "#5f9147",
  path: "#9b6f3c",
  pathLight: "#c29a5b",
  stone: "#7e745f",
  rune: "#8bd6ff",
  gold: "#f0c45c",
  panel: "#2d2118"
};

function saveHighScore(levelId, waveIndex) {
  const key = `runehold-highscore-level-${levelId}`;
  const currentMax = Number(localStorage.getItem(key) ?? 0);
  if (waveIndex > currentMax) {
    localStorage.setItem(key, waveIndex);
  }
}

function addFloatingText(x, y, text, color = "#111827") {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    life: 0.6,
    maxLife: 0.6,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.6 - Math.random() * 0.4
  });
}

function updateFloatingTexts(dt) {
  floatingTexts = floatingTexts.filter(t => {
    t.life -= dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    return t.life > 0;
  });
}

function drawFloatingTexts() {
  ctx.save();
  for (const t of floatingTexts) {
    const opacity = t.life / t.maxLife;
    ctx.fillStyle = t.color;
    ctx.font = "900 13px 'Cinzel', 'Outfit', system-ui, sans-serif";
    ctx.globalAlpha = opacity;
    ctx.textAlign = "center";
    const px = t.x * CELL;
    const py = t.y * CELL;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, px, py);
    ctx.fillText(t.text, px, py);
  }
  ctx.restore();
}

function addExplosion(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7
    });
  }
}

function updateParticles(dt) {
  particles = particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 1.5 * dt;
    return p.life > 0;
  });
}

function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.5;
    const px = p.x * CELL;
    const py = p.y * CELL;
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
    ctx.strokeRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
  }
  ctx.restore();
}

function processEvents(events) {
  let needsScoreSave = false;
  for (const event of events) {
    if (event.type === "shoot") {
      sounds.play(event.type, 1.0, event.tower);
      const text = event.damage > 0 ? `-${event.damage}` : "Ward";
      addFloatingText(event.targetX, event.targetY - 0.2, text, event.damage > 0 ? "#f35f5f" : "#78c7e8");
      addExplosion(event.targetX, event.targetY, "#111827", 3);
    } else if (event.type === "defeat") {
      sounds.play(event.type, 1.0, event.enemy);
      addFloatingText(event.x, event.y - 0.4, `+${formatMoney(event.reward)}`, "#ea580c");
      addExplosion(event.x, event.y, ENEMIES[event.enemy].color, 10);
    } else if (event.type === "escape") {
      sounds.play(event.type);
      shakeTimer = 0.35;
      if (engine.lives > 0 && engine.lives <= 2) {
        sounds.speak("Our defenses are collapsing!");
      }
    } else if (event.type === "spawn") {
      sounds.play(event.type, 1.0, event.enemy);
      const creep = ENEMIES[event.enemy];
      if (creep && creep.traits.includes("elite")) {
        sounds.speak("Warning. Elite creep detected.");
      }
    } else if (event.type === "wave") {
      sounds.play(event.type);
      sounds.speak(`Wave ${engine.waveIndex + 1} approaches!`);
    } else if (event.type === "won") {
      sounds.play(event.type);
      sounds.speak("Runehold stands victorious!");
      needsScoreSave = true;
    } else if (event.type === "lost") {
      sounds.play(event.type);
      sounds.speak("Defeat. The hold has fallen.");
      needsScoreSave = true;
    } else if (event.type === "waveClear") {
      sounds.play(event.type);
      needsScoreSave = true;
    } else if (event.type === "place") {
      sounds.play(event.type, 1.0, event.tower);
    } else if (event.type === "upgrade") {
      sounds.play(event.type, 1.0, event.tower);
    } else if (event.type === "sell") {
      sounds.play(event.type, 1.0, event.tower);
    } else {
      sounds.play(event.type);
    }
  }
  if (sounds.enabled) {
    sounds.setDroneIntensity(engine.status === "running");
  }
  if (needsScoreSave) {
    saveHighScore(engine.level.id, engine.waveIndex);
    renderControls();
  }
}

function getEnemySvg(type, color = ENEMIES[type]?.color) {
  if (type === "chip") {
    return `
      <svg class="creep-icon" width="20" height="20" viewBox="-20 -20 40 40">
        <circle cx="0" cy="2" r="13" fill="${color}" stroke="#120c08" stroke-width="3"/>
        <path d="M -8 -9 L -4 -22 L 1 -8 M 8 -9 L 4 -22 L -1 -8" fill="none" stroke="#120c08" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  } else if (type === "bolt") {
    return `
      <svg class="creep-icon" width="20" height="20" viewBox="-20 -20 40 40">
        <path d="M -18 15 L -14 -7 L 0 -20 L 14 -7 L 18 15 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-8" y="-2" width="16" height="7" fill="#3d291c" rx="1"/>
      </svg>
    `;
  } else if (type === "glass") {
    return `
      <svg class="creep-icon" width="20" height="20" viewBox="-20 -20 40 40">
        <ellipse cx="0" cy="0" rx="12" ry="20" transform="rotate(20)" fill="${color}" stroke="#120c08" stroke-width="3"/>
        <path d="M -15 8 L 15 -12 M -8 16 L 13 2" fill="none" stroke="#e8ffff" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  } else if (type === "vault") {
    return `
      <svg class="creep-icon" width="20" height="20" viewBox="-20 -20 40 40">
        <ellipse cx="0" cy="4" rx="20" ry="14" fill="${color}" stroke="#120c08" stroke-width="3"/>
        <circle cx="-8" cy="-4" r="7" fill="#d1c8a8" stroke="#120c08" stroke-width="3"/>
        <circle cx="7" cy="-5" r="8" fill="#d1c8a8" stroke="#120c08" stroke-width="3"/>
      </svg>
    `;
  } else {
    return `
      <svg class="creep-icon" width="20" height="20" viewBox="-20 -20 40 40">
        <path d="M 0 -21 L 16 -4 L 10 18 L -10 18 L -16 -4 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="6" fill="#f6e3a4" stroke="#120c08" stroke-width="2"/>
      </svg>
    `;
  }
}

function getTowerSvg(type, color = TOWERS[type]?.color) {
  if (type === "punch") {
    return `
      <svg class="tower-icon" width="22" height="22" viewBox="-25 -25 50 50">
        <path d="M -19 16 L -14 -10 L 0 -21 L 14 -10 L 19 16 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-16" y="-4" width="32" height="22" fill="#f5e8b8" stroke="#120c08" stroke-width="3" rx="1"/>
        <rect x="-10" y="-22" width="20" height="18" fill="#f5e8b8" stroke="#120c08" stroke-width="3" rx="1"/>
        <rect x="-4" y="-29" width="8" height="9" fill="#3b2a1a"/>
      </svg>
    `;
  } else if (type === "radio") {
    return `
      <svg class="tower-icon" width="22" height="22" viewBox="-25 -25 50 50">
        <path d="M -19 16 L -14 -10 L 0 -21 L 14 -10 L 19 16 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <path d="M 0 -29 L -13 10 L 13 10 Z" fill="#f5e8b8" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="0" cy="-26" r="6" fill="#a9ddff" stroke="#120c08" stroke-width="2"/>
      </svg>
    `;
  } else if (type === "tax") {
    return `
      <svg class="tower-icon" width="22" height="22" viewBox="-25 -25 50 50">
        <path d="M -19 16 L -14 -10 L 0 -21 L 14 -10 L 19 16 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-18" y="-11" width="36" height="12" fill="#f5e8b8" stroke="#120c08" stroke-width="3" rx="1"/>
        <line x1="-18" y1="-4" x2="18" y2="-4" stroke="#3a2515" stroke-width="5" stroke-linecap="round"/>
        <path d="M 20 -9 L 30 -4 L 20 1 Z" fill="#d7b26b" stroke="#120c08" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  } else {
    return `
      <svg class="tower-icon" width="22" height="22" viewBox="-25 -25 50 50">
        <path d="M -19 16 L -14 -10 L 0 -21 L 14 -10 L 19 16 Z" fill="${color}" stroke="#120c08" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-8" y="-25" width="16" height="43" fill="#f5e8b8" stroke="#120c08" stroke-width="3" rx="1"/>
        <circle cx="0" cy="-7" r="16" fill="none" stroke="#d8f5ff" stroke-width="2.5"/>
      </svg>
    `;
  }
}

function calculateThreatRating(preview) {
  let totalHp = 0;
  let multiplier = 1.0;
  for (const [type, count] of Object.entries(preview.counts)) {
    const enemy = ENEMIES[type];
    if (!enemy) continue;
    let baseEnemyHp = enemy.hp;
    if (enemy.shield) baseEnemyHp += enemy.shield;
    totalHp += baseEnemyHp * count;
  }
  const traits = preview.traits;
  if (traits.includes("elite")) multiplier += 0.35;
  if (traits.includes("slowResistant")) multiplier += 0.15;
  if (traits.includes("shielded")) multiplier += 0.20;
  if (traits.includes("armored")) multiplier += 0.15;
  if (traits.includes("swarm")) multiplier += 0.10;
  
  const score = totalHp * multiplier;
  if (score < 150) return { label: "Low", class: "threat-low" };
  if (score < 350) return { label: "Moderate", class: "threat-mod" };
  if (score < 800) return { label: "High", class: "threat-high" };
  return { label: "Deadly", class: "threat-deadly" };
}

function renderTraitChips(traits) {
  return (traits ?? []).map((trait) => `<span class="trait-chip">${TRAITS[trait]?.label ?? trait}</span>`).join("");
}

function renderWavePreview() {
  const preview = engine.previewWave();
  const wave = engine.level.waves[engine.waveIndex];
  const target = app.querySelector("[data-testid='wave-preview']");
  if (!wave || !target) {
    target.innerHTML = `<p class="muted">No queued wave.</p>`;
    return;
  }
  const threat = calculateThreatRating(preview);
  const isFinale = !engine.endlessMode && engine.waveIndex === engine.level.waves.length - 1;
  const rows = Object.entries(preview.counts).map(([type, count]) => {
    const enemy = ENEMIES[type];
    return `
      <div class="preview-row">
        ${getEnemySvg(type)}
        <span>${count}x ${enemy.name}</span>
        <b>${enemy.hp} HP</b>
      </div>
    `;
  }).join("");
  target.innerHTML = `
    <div class="preview-meta">
      <span>Wave ${engine.waveIndex + 1}</span>
      ${isFinale ? `<span class="threat-badge finale">Finale</span>` : ""}
      <span class="threat-badge ${threat.class}">${threat.label} Threat</span>
      <span>Reward ${formatMoney(preview.totalReward)}</span>
    </div>
    <div class="preview-list">${rows}</div>
    <div class="trait-list">${renderTraitChips(preview.traits)}</div>
  `;
}

function renderControls() {
  app.querySelector("[data-testid='levels']").innerHTML = LEVELS.map((level) => {
    const key = `runehold-highscore-level-${level.id}`;
    const high = localStorage.getItem(key) ?? 0;
    return `
      <button data-level="${level.id}" class="${engine.level.id === level.id ? "active" : ""}">
        <strong>${level.name}</strong>
        ${high > 0 ? `<span class="highscore" style="font-size: 10px; opacity: 0.8; display: block; margin-top: 4px;">Best Wave: ${high}</span>` : ""}
      </button>
    `;
  }).join("");
  app.querySelector("[data-testid='towers']").innerHTML = Object.entries(TOWERS).map(([key, tower]) => `
    <button data-tower="${key}" class="${selectedTowerType === key ? "active" : ""}">
      ${getTowerIconHtml(key)}
      <div class="tower-btn-meta">
        <strong>${tower.name}</strong><span>${formatMoney(tower.cost)}</span>
      </div>
    </button>
  `).join("");
  app.querySelector(".enemy-list").innerHTML = Object.keys(ENEMIES).map((key) => {
    const enemy = ENEMIES[key];
    return `
      <div class="enemy-row">
        ${getEnemySvg(key)}
        <span>${enemy.name}<small>${renderTraitChips(enemy.traits)}</small></span>
        <b>${enemy.hp} HP</b>
      </div>
    `;
  }).join("");
  renderWavePreview();
}

function renderHud() {
  app.querySelector("[data-testid='money']").textContent = `Gold ${formatMoney(engine.money)}`;
  app.querySelector("[data-testid='lives']").textContent = `Lives ${engine.lives}`;
  
  const waveText = engine.endlessMode && engine.waveIndex + 1 > engine.level.waves.length
    ? `Wave ${engine.waveIndex + 1} (Endless)`
    : `Wave ${Math.min(engine.waveIndex + 1, engine.level.waves.length)}/${engine.level.waves.length}`;
  app.querySelector("[data-testid='wave']").textContent = waveText;
  
  app.querySelector("[data-testid='message']").textContent = engine.message;
  const startWaveBtn = app.querySelector("[data-testid='start-wave']");
  startWaveBtn.disabled = engine.status === "running" || engine.status === "won" || engine.status === "lost";
  startWaveBtn.classList.toggle("pulsing", engine.status === "build");
  app.querySelector("[data-testid='endless-toggle']").checked = engine.endlessMode;
  app.querySelector("[data-testid='sound-toggle']").textContent = sounds.enabled ? "Sound On" : "Sound Off";
  
  app.querySelectorAll(".speed-group button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.speed) === engine.speedMultiplier);
  });

  const selected = engine.towers[selectedTowerIndex];
  const nextOptions = selected ? engine.getUpgradeOptions(selected) : [];
  const nextKey = selected ? `${selected.id}-${selected.level}-${engine.money}` : "empty";
  if (nextKey === inspectKey) return;
  inspectKey = nextKey;
  
  let refundText = "";
  if (selected) {
    const blueprint = TOWERS[selected.type];
    const totalCost = blueprint.cost + (selected.upgradeHistory ?? []).reduce((sum, upgrade) => sum + upgrade.cost, 0);
    refundText = formatMoney(Math.floor(totalCost * 0.7));
  }

  app.querySelector("[data-testid='inspect']").innerHTML = selected ? `
    <h2>${selected.stats.name}</h2>
    <p>Rank ${selected.level + 1} / ${TOWERS[selected.type].upgrades.length + 1}</p>
    <p>Damage ${selected.stats.damage} Range ${selected.stats.range.toFixed(1)}</p>
    <div class="upgrade-list">
      ${nextOptions.length ? nextOptions.map((option, index) => `
        <button
          data-testid="${index === 0 ? "upgrade-tower" : `upgrade-tower-${index}`}"
          data-upgrade-choice="${index}">
          <strong>${option.name}</strong>
          <span>${formatMoney(option.cost)} · ${option.summary}</span>
        </button>
      `).join("") : `<button data-testid="upgrade-tower" disabled>Fully Upgraded</button>`}
      <button data-testid="sell-tower" class="demolish">Salvage: +${refundText}</button>
    </div>
  ` : `<h2>Command</h2><p>Select a build plot or tower.</p>`;
}

function drawCell(x, y, fill, stroke = THEME.ink) {
  const px = x * CELL;
  const py = y * CELL;
  ctx.fillStyle = fill;
  ctx.fillRect(px, py, CELL, CELL);
  ctx.strokeStyle = "rgba(33, 23, 15, 0.16)";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(px + 5, py + 5, 10, 2);
  ctx.fillStyle = "rgba(33, 23, 15, 0.12)";
  ctx.fillRect(px + CELL - 14, py + CELL - 9, 8, 2);
  if (stroke !== THEME.ink) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
  }
}

function drawBuildPlot(x, y) {
  const cx = x * CELL + CELL / 2;
  const cy = y * CELL + CELL / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#5b503f";
  ctx.strokeStyle = "#24180f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#c7a05a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = i * Math.PI / 3;
    const px = Math.cos(angle) * 16;
    const py = Math.sin(angle) * 16;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawEndpoint(label, x, y, fill) {
  const px = x * CELL + 5;
  const py = y * CELL + 5;
  ctx.fillStyle = fill;
  ctx.strokeStyle = THEME.ink;
  ctx.lineWidth = 3;
  ctx.fillRect(px, py, CELL - 10, CELL - 10);
  ctx.strokeRect(px, py, CELL - 10, CELL - 10);
  ctx.fillStyle = "#fff7d6";
  ctx.font = "900 12px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x * CELL + CELL / 2, y * CELL + CELL / 2);
}

function drawTowerGraphic(tower, index) {
  const cx = tower.x * CELL + CELL / 2;
  const cy = tower.y * CELL + CELL / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "rgba(255, 244, 190, 0.22)";
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tower.stats.color;
  ctx.strokeStyle = selectedTowerIndex === index ? "#ffffff" : "#111827";
  ctx.lineWidth = selectedTowerIndex === index ? 5 : 3;
  ctx.beginPath();
  ctx.moveTo(-19, 16);
  ctx.lineTo(-14, -10);
  ctx.lineTo(0, -21);
  ctx.lineTo(14, -10);
  ctx.lineTo(19, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f5e8b8";
  ctx.strokeStyle = THEME.ink;
  ctx.lineWidth = 3;
  if (tower.type === "punch") {
    ctx.fillRect(-16, -4, 32, 22);
    ctx.strokeRect(-16, -4, 32, 22);
    ctx.fillRect(-10, -22, 20, 18);
    ctx.strokeRect(-10, -22, 20, 18);
    ctx.fillStyle = "#3b2a1a";
    ctx.fillRect(-4, -29, 8, 9);
  } else if (tower.type === "radio") {
    ctx.beginPath();
    ctx.moveTo(0, -29);
    ctx.lineTo(-13, 10);
    ctx.lineTo(13, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#a9ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -1);
    ctx.lineTo(0, -19);
    ctx.lineTo(9, -1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (tower.type === "tax") {
    ctx.fillRect(-18, -11, 36, 12);
    ctx.strokeRect(-18, -11, 36, 12);
    ctx.strokeStyle = "#3a2515";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -4);
    ctx.lineTo(18, -4);
    ctx.stroke();
    ctx.fillStyle = "#d7b26b";
    ctx.beginPath();
    ctx.moveTo(20, -9);
    ctx.lineTo(30, -4);
    ctx.lineTo(20, 1);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-8, -25, 16, 43);
    ctx.strokeRect(-8, -25, 16, 43);
    ctx.strokeStyle = "#d8f5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -23);
    ctx.lineTo(-7, -8);
    ctx.lineTo(7, -8);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -7, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#fff7d6";
  ctx.strokeStyle = THEME.ink;
  ctx.lineWidth = 3;
  ctx.font = "900 12px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.strokeText(String(tower.level + 1), 0, 7);
  ctx.fillText(String(tower.level + 1), 0, 5);
  ctx.restore();
}

function drawEnemyGraphic(enemy) {
  const p = engine.enemyCenter(enemy);
  const x = p.x * CELL;
  const y = p.y * CELL;
  ctx.save();
  ctx.translate(x, y);

  // 1. Draw base shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Draw slow aura
  if (enemy.slowTimer > 0) {
    ctx.strokeStyle = "rgba(116, 214, 253, 0.75)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Draw hunter's mark crosshair
  if (enemy.markedTimer > 0) {
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(-18, 16);
    ctx.lineTo(-13, 16);
    ctx.moveTo(13, 16);
    ctx.lineTo(18, 16);
    ctx.stroke();
  }

  ctx.fillStyle = ENEMIES[enemy.type].color;
  ctx.strokeStyle = THEME.ink;
  ctx.lineWidth = 3;
  if (enemy.type === "chip") {
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6e3a4";
    ctx.beginPath();
    ctx.moveTo(-8, -9);
    ctx.lineTo(-4, -22);
    ctx.lineTo(1, -8);
    ctx.moveTo(8, -9);
    ctx.lineTo(4, -22);
    ctx.lineTo(-1, -8);
    ctx.stroke();
  } else if (enemy.type === "bolt") {
    ctx.beginPath();
    ctx.moveTo(-18, 15);
    ctx.lineTo(-14, -7);
    ctx.lineTo(0, -20);
    ctx.lineTo(14, -7);
    ctx.lineTo(18, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3d291c";
    ctx.fillRect(-8, -2, 16, 7);
  } else if (enemy.type === "glass") {
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 20, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e8ffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 8);
    ctx.lineTo(15, -12);
    ctx.moveTo(-8, 16);
    ctx.lineTo(13, 2);
    ctx.stroke();
  } else if (enemy.type === "vault") {
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d1c8a8";
    ctx.beginPath();
    ctx.arc(-8, -4, 7, 0, Math.PI * 2);
    ctx.arc(7, -5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(16, -4);
    ctx.lineTo(10, 18);
    ctx.lineTo(-10, 18);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f3d7ff";
    ctx.beginPath();
    ctx.arc(0, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4. Draw shield bubble around the creep
  if (enemy.shield > 0) {
    ctx.strokeStyle = "rgba(176, 122, 203, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(176, 122, 203, 0.15)";
    ctx.fill();
  }

  ctx.restore();
  ctx.fillStyle = "rgba(33, 23, 15, 0.9)";
  ctx.fillRect(x - 20, y - 27, 40, 6);
  ctx.fillStyle = "#61d060";
  ctx.fillRect(x - 20, y - 27, 40 * Math.max(0, enemy.hp / enemy.maxHp), 6);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  if (shakeTimer > 0) {
    const shakeIntensity = 6;
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
  }
  ctx.fillStyle = "#2f522b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < GRID.rows; y += 1) {
    for (let x = 0; x < GRID.cols; x += 1) {
      const grass = (x + y) % 2 === 0 ? THEME.grassA : THEME.grassB;
      drawCell(x, y, isPath(x, y) ? THEME.path : grass);
    }
  }
  ctx.strokeStyle = "#6d4829";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  PATH.forEach(([x, y], index) => {
    const px = x * CELL + CELL / 2;
    const py = y * CELL + CELL / 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.strokeStyle = THEME.pathLight;
  ctx.lineWidth = 11;
  ctx.beginPath();
  PATH.forEach(([x, y], index) => {
    const px = x * CELL + CELL / 2;
    const py = y * CELL + CELL / 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  for (const [x, y] of BUILDABLE) drawBuildPlot(x, y);

  // Draw Entry and Exit labels
  ctx.save();
  ctx.font = "bold 13px 'Cinzel', 'Outfit', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const [ex, ey] = PATH[0];
  drawEndpoint("IN", ex, ey, "#2f6b39");

  const [ox, oy] = PATH[PATH.length - 1];
  drawEndpoint("OUT", ox, oy, "#7d2d24");
  ctx.restore();

  engine.towers.forEach((tower, index) => {
    drawTowerGraphic(tower, index);
  });
  const sortedEnemies = [...engine.enemies].sort((a, b) => a.progress - b.progress);
  for (const enemy of sortedEnemies) {
    drawEnemyGraphic(enemy);
  }
  for (const shot of engine.projectiles) {
    ctx.strokeStyle = shot.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = shot.color;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(shot.from.x * CELL, shot.from.y * CELL);
    ctx.lineTo(shot.to.x * CELL, shot.to.y * CELL);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw Range Overlay
  let rangeToDraw = null;
  let rangeCenter = null;
  let rangeColor = "#111827";

  if (hoveredCell) {
    const existing = engine.towers.find((t) => t.x === hoveredCell.x && t.y === hoveredCell.y);
    if (existing) {
      rangeToDraw = existing.stats.range;
      rangeCenter = { x: hoveredCell.x, y: hoveredCell.y };
      rangeColor = existing.stats.color;
    } else if (isBuildable(hoveredCell.x, hoveredCell.y) && !engine.occupiedCells.has(`${hoveredCell.x},${hoveredCell.y}`)) {
      const blueprint = TOWERS[selectedTowerType];
      if (blueprint) {
        rangeToDraw = blueprint.range;
        rangeCenter = { x: hoveredCell.x, y: hoveredCell.y };
        rangeColor = blueprint.color;
      }
    }
  }

  if (!rangeToDraw && selectedTowerIndex >= 0) {
    const selected = engine.towers[selectedTowerIndex];
    if (selected) {
      rangeToDraw = selected.stats.range;
      rangeCenter = { x: selected.x, y: selected.y };
      rangeColor = selected.stats.color;
    }
  }

  if (rangeToDraw && rangeCenter) {
    ctx.save();
    ctx.beginPath();
    ctx.arc((rangeCenter.x + 0.5) * CELL, (rangeCenter.y + 0.5) * CELL, rangeToDraw * CELL, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139, 214, 255, 0.08)";
    ctx.fill();
    ctx.strokeStyle = rangeColor;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.restore();
  }

  drawParticles();
  drawFloatingTexts();

  ctx.restore();
}

function refresh() {
  renderHud();
  draw();
}

app.addEventListener("click", (event) => {
  // Initialize sound context on first user click if enabled
  if (sounds.enabled && !sounds.ctx) {
    sounds.enable(false);
  }
  if (!firstAnnounce && sounds.enabled) {
    firstAnnounce = true;
    announceLevel(engine.level.id);
  }

  const level = event.target.closest("[data-level]");
  const tower = event.target.closest("[data-tower]");
  const speedBtn = event.target.closest("[data-speed]");
  
  if (level) {
    engine.loadLevel(Number(level.dataset.level));
    selectedTowerIndex = -1;
    inspectKey = "";
    sounds.play("levelSelect");
    renderControls();
    announceLevel(engine.level.id);
  } else if (tower) {
    selectedTowerType = tower.dataset.tower;
    sounds.play("select", 1.2, selectedTowerType);
    renderControls();
  } else if (speedBtn) {
    engine.speedMultiplier = Number(speedBtn.dataset.speed);
    // Play pitch-scaled click for speed adjustment
    const mult = engine.speedMultiplier === 1 ? 1.0 : engine.speedMultiplier === 2 ? 1.4 : 0.8;
    sounds.play("click", mult);
  } else if (event.target.matches("[data-testid='start-wave']")) {
    engine.startWave();
  } else if (event.target.matches("[data-testid='reset-level']")) {
    const prevEndless = engine.endlessMode;
    engine.loadLevel(engine.level.id);
    engine.endlessMode = prevEndless;
    selectedTowerIndex = -1;
    inspectKey = "";
    sounds.play("resetLevel");
    announceLevel(engine.level.id);
  } else if (event.target.matches("[data-testid='upgrade-tower']")) {
    engine.upgradeTower(selectedTowerIndex, Number(event.target.dataset.upgradeChoice ?? 0));
  } else if (event.target.closest("[data-upgrade-choice]")) {
    const choice = event.target.closest("[data-upgrade-choice]");
    engine.upgradeTower(selectedTowerIndex, Number(choice.dataset.upgradeChoice ?? 0));
  } else if (event.target.matches("[data-testid='sell-tower']")) {
    if (selectedTowerIndex >= 0) {
      engine.sellTower(selectedTowerIndex);
      selectedTowerIndex = -1;
      inspectKey = "";
    }
  } else if (event.target.matches("[data-testid='sound-toggle']")) {
    const enabled = sounds.toggle();
    event.target.textContent = enabled ? "Sound On" : "Sound Off";
    if (enabled) {
      firstAnnounce = true;
      announceLevel(engine.level.id);
    }
  }
  processEvents(engine.events);
  refresh();
});

app.addEventListener("change", (event) => {
  if (event.target.matches("[data-testid='endless-toggle']")) {
    engine.endlessMode = event.target.checked;
    sounds.play("click", 0.8);
    refresh();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-volume-channel]")) {
    if (sounds.enabled && !sounds.ctx) {
      sounds.enable(false);
    }
    const channel = event.target.dataset.volumeChannel;
    const value = Number(event.target.value) / 100;
    sounds.setVolume(channel, value);
  }
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (rect.width / GRID.cols));
  const y = Math.floor((event.clientY - rect.top) / (rect.height / GRID.rows));
  const existing = engine.towers.findIndex((tower) => tower.x === x && tower.y === y);
  if (existing >= 0) {
    selectedTowerIndex = existing;
    sounds.play("click", 0.9);
  } else {
    if (selectedTowerType) {
      const result = engine.placeTower(selectedTowerType, x, y);
      selectedTowerIndex = result.ok ? engine.towers.length - 1 : -1;
      if (!result.ok) {
        engine.message = result.reason.toUpperCase();
        sounds.play("error");
      }
    } else {
      selectedTowerIndex = -1;
      sounds.play("click", 0.6);
    }
  }
  processEvents(engine.events);
  refresh();
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (rect.width / GRID.cols));
  const y = Math.floor((event.clientY - rect.top) / (rect.height / GRID.rows));
  if (x >= 0 && y >= 0 && x < GRID.cols && y < GRID.rows) {
    hoveredCell = { x, y };
  } else {
    hoveredCell = null;
  }
  refresh();
});

canvas.addEventListener("mouseleave", () => {
  hoveredCell = null;
  refresh();
});

function loop(now) {
  const dt = Math.min(0.15, (now - last) / 1000);
  last = now;

  const simDt = dt * engine.speedMultiplier;
  updateFloatingTexts(simDt);
  updateParticles(simDt);
  shakeTimer = Math.max(0, shakeTimer - dt);

  engine.tick(dt);
  processEvents(engine.events);
  refresh();
  requestAnimationFrame(loop);
}

window.__game = { engine, TOWERS, LEVELS, refresh, renderControls };

// Initialize volume sliders from persisted state
app.querySelectorAll("[data-volume-channel]").forEach((input) => {
  const channel = input.dataset.volumeChannel;
  input.value = Math.round((sounds.volumes[channel] ?? 0.7) * 100);
});

renderControls();
refresh();
requestAnimationFrame(loop);
