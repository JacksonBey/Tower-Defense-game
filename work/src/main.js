// Reference: SYSTEM.md#Main-Logic
import "./styles.css";
import { ENEMIES, GRID, LEVELS, PATH, TOWERS, CELL, BUILDABLE, TRAITS } from "./data.js";
import { formatMoney } from "./economy.js";
import { GameEngine, TARGETING_MODES, isPath, isBuildable } from "./engine.js";
import { SoundSystem } from "./sound.js";
import { getTowerStatRows, getTowerCounterTags } from "./statComparison.js";

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

const TARGETING_LABELS = {
  first: "First",
  last: "Last",
  strongest: "Strongest",
  weakest: "Weakest"
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
let rangeDashOffset = 0;
let bannerText = "";
let bannerSubtext = "";
let bannerTimer = 0;
let bannerMaxTimer = 0;
let bannerColor = "#ffe7a0";
let gameState = "menu";
let activeSpell = null;
let meteorCooldown = 0;
let frostCooldown = 0;

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
        <h2>Hero Spells</h2>
        <div class="spell-list">
          <button class="spell-btn" id="spell-meteor" data-spell="meteor" data-testid="spell-meteor">
            <strong>Meteor Strike</strong>
            <span>25 Gold · CD: 20s</span>
          </button>
          <button class="spell-btn" id="spell-frost" data-spell="frost" data-testid="spell-frost">
            <strong>Frost Nova</strong>
            <span>30 Gold · CD: 30s</span>
          </button>
        </div>
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

  <!-- Title/Main Menu Overlay -->
  <div id="menu-overlay" class="menu-overlay">
    <div class="menu-panel">
      <div class="menu-title">RUNEHOLD TD</div>
      <p class="menu-tagline">Defend the ancient kingdom lanes against the creep onslaught.</p>
      <div class="menu-levels-box">
        <h3>Select a War Path</h3>
        <div class="menu-level-cards" id="menu-level-cards"></div>
      </div>
      <div class="menu-start-row">
        <button id="menu-start-btn" class="menu-start-btn">ENTER RUNEHOLD</button>
      </div>
    </div>
  </div>

  <!-- Game Over Overlay -->
  <div id="game-over-overlay" class="game-over-overlay hidden">
    <div class="game-over-panel">
      <h2 id="game-over-title">VICTORY</h2>
      <p id="game-over-subtitle">The hold stands strong!</p>
      <div class="game-over-stats">
        <div class="stat-box"><b>Level</b><span id="stat-level-name">-</span></div>
        <div class="stat-box"><b>Wave Reached</b><span id="stat-wave-reached">-</span></div>
        <div class="stat-box"><b>Gold Earned</b><span id="stat-gold-earned">-</span></div>
      </div>
      <div class="game-over-actions">
        <button id="game-over-action-btn" class="game-over-btn active">NEXT LEVEL</button>
        <button id="game-over-retry-btn" class="game-over-btn">RETRY</button>
        <button id="game-over-menu-btn" class="game-over-btn">MAIN MENU</button>
      </div>
    </div>
  </div>
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

function spawnTowerParticles(x, y, towerType, count = 15) {
  const blueprint = TOWERS[towerType];
  const color = blueprint ? blueprint.color : "#d7b878";
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      size: 3 + Math.random() * 4,
      color: color,
      life: 0.35 + Math.random() * 0.35,
      maxLife: 0.7
    });
  }
}

function spawnCoinParticles(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
    const speed = 0.6 + Math.random() * 1.2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 3,
      color: "#f0c45c",
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7
    });
  }
}

function showBanner(text, subtext, duration = 2.0, color = "#ffe7a0") {
  bannerText = text;
  bannerSubtext = subtext;
  bannerTimer = duration;
  bannerMaxTimer = duration;
  bannerColor = color;
}

function drawBanner() {
  if (bannerTimer <= 0) return;
  
  ctx.save();
  const halfDuration = bannerMaxTimer / 2;
  const opacity = bannerTimer > halfDuration 
    ? (bannerMaxTimer - bannerTimer) / (bannerMaxTimer - halfDuration) 
    : bannerTimer / halfDuration;
    
  ctx.globalAlpha = Math.min(1.0, opacity * 1.25);
  
  ctx.fillStyle = "rgba(18, 12, 8, 0.82)";
  ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
  ctx.strokeStyle = bannerColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2 - 50);
  ctx.lineTo(canvas.width, canvas.height / 2 - 50);
  ctx.moveTo(0, canvas.height / 2 + 50);
  ctx.lineTo(canvas.width, canvas.height / 2 + 50);
  ctx.stroke();
  
  ctx.font = "900 24px 'Cinzel', Georgia, serif";
  ctx.fillStyle = bannerColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(bannerText, canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillText(bannerText, canvas.width / 2, canvas.height / 2 - 12);
  
  ctx.font = "bold 13px 'Outfit', sans-serif";
  ctx.fillStyle = "#f7dfad";
  ctx.strokeText(bannerSubtext, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText(bannerSubtext, canvas.width / 2, canvas.height / 2 + 20);
  
  ctx.restore();
}

function drawLowLivesVignette() {
  if (engine.lives <= 0 || engine.lives > 2) return;
  
  ctx.save();
  const pulse = 0.25 + 0.15 * Math.sin(performance.now() / 150);
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width / 4,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  grad.addColorStop(0, "rgba(165, 61, 45, 0)");
  grad.addColorStop(1, `rgba(165, 61, 45, ${pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

let mapProps = [];

function generateMapProps() {
  mapProps = [];
  const levelId = engine.level.id;
  
  for (let y = 0; y < GRID.rows; y += 1) {
    for (let x = 0; x < GRID.cols; x += 1) {
      if (!engine.isPath(x, y) && !engine.isBuildable(x, y)) {
        const pseudoRand = Math.sin(x * 12.9898 + y * 78.233 + levelId * 45.164) * 43758.5453;
        const r = pseudoRand - Math.floor(pseudoRand);
        
        if (r < 0.22) {
          let propType = "grass_tuft";
          if (r < 0.06) propType = "tree";
          else if (r < 0.12) propType = "rock";
          else if (r < 0.17) propType = "flower";
          
          mapProps.push({
            x,
            y,
            type: propType,
            scale: 0.85 + (r * 100 % 0.3),
            variant: Math.floor(r * 1000) % 3
          });
        }
      }
    }
  }
}

function drawMapProps() {
  for (const prop of mapProps) {
    const px = prop.x * CELL + CELL / 2;
    const py = prop.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(prop.scale, prop.scale);
    
    if (prop.type === "tree") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#5c4033";
      ctx.fillRect(-3, 6, 6, 9);
      
      ctx.fillStyle = prop.variant === 0 ? "#1e3f20" : prop.variant === 1 ? "#2d5a27" : "#1b4d3e";
      ctx.strokeStyle = "#0d1a0e";
      ctx.lineWidth = 1.5;
      
      // Tier 3
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(-14, 4); ctx.lineTo(14, 4); ctx.closePath();
      ctx.fill(); ctx.stroke();
      
      // Tier 2
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(-11, 9); ctx.lineTo(11, 9); ctx.closePath();
      ctx.fill(); ctx.stroke();
      
      // Tier 1
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-8, 14); ctx.lineTo(8, 14); ctx.closePath();
      ctx.fill(); ctx.stroke();
      
    } else if (prop.type === "rock") {
      ctx.fillStyle = prop.variant === 0 ? "#78716c" : "#57534e";
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, -10);
      ctx.lineTo(6, -8);
      ctx.lineTo(12, 2);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.strokeStyle = "#a8a29e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(-3, -7);
      ctx.lineTo(3, -5);
      ctx.stroke();
      
    } else if (prop.type === "flower") {
      ctx.fillStyle = prop.variant === 0 ? "#ef4444" : "#f59e0b";
      ctx.beginPath();
      const drawPetal = (ox, oy) => {
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      };
      drawPetal(-3, -2);
      drawPetal(3, -2);
      drawPetal(0, 3);
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.quadraticCurveTo(-2, 7, -3, 11);
      ctx.stroke();
      
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 6); ctx.lineTo(-8, -2);
      ctx.moveTo(0, 8); ctx.lineTo(0, -6);
      ctx.moveTo(4, 7); ctx.lineTo(6, -1);
      ctx.stroke();
    }
    
    ctx.restore();
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
      
      const targetEnemy = engine.enemies.find(e => e.id === event.enemyId);
      if (targetEnemy) {
        targetEnemy.flashTimer = 0.08;
      }
    } else if (event.type === "defeat") {
      sounds.play(event.type, 1.0, event.enemy);
      addFloatingText(event.x, event.y - 0.4, `+${formatMoney(event.reward)}`, "#ea580c");
      addExplosion(event.x, event.y, ENEMIES[event.enemy].color, 10);
      spawnCoinParticles(event.x, event.y, 6);
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
      showBanner(`WAVE ${engine.waveIndex + 1}`, "THE ONSLAUGHT BEGINS", 2.2, "#fca5a5");
    } else if (event.type === "earlyStart") {
      addFloatingText(6, 0.7, `Rush +${formatMoney(event.reward)}`, "#ffe7a0");
    } else if (event.type === "won") {
      sounds.play(event.type);
      sounds.speak("Runehold stands victorious!");
      showBanner("VICTORY", "THE HOLD STANDS STRONG", 4.0, "#ffe7a0");
      needsScoreSave = true;
    } else if (event.type === "lost") {
      sounds.play(event.type);
      sounds.speak("Defeat. The hold has fallen.");
      showBanner("DEFEAT", "THE RUNEHOLD HAS FALLEN", 4.0, "#fca5a5");
      needsScoreSave = true;
    } else if (event.type === "waveClear") {
      sounds.play(event.type);
      showBanner(`WAVE ${engine.waveIndex} CLEARED`, "GOLD REWARDS GRANTED", 2.2, "#b7d7c3");
      needsScoreSave = true;
    } else if (event.type === "place") {
      sounds.play(event.type, 1.0, event.tower);
      spawnTowerParticles(event.x, event.y, event.tower, 12);
    } else if (event.type === "upgrade") {
      sounds.play(event.type, 1.0, event.tower);
      spawnTowerParticles(event.x, event.y, event.tower, 15);
    } else if (event.type === "sell") {
      sounds.play(event.type, 1.0, event.tower);
      spawnTowerParticles(event.x, event.y, event.tower, 18);
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

function renderStatRows(stats, upgrade = null, compact = false) {
  return `
    <div class="${compact ? "stat-strip compact" : "stat-strip"}">
      ${getTowerStatRows(stats, upgrade).map((row) => `
        <span class="${row.changed ? (row.favorable ? "gain" : "tradeoff") : ""}">
          <b>${row.label}</b>
          ${row.changed ? `${row.before}->${row.after}` : row.after}
        </span>
      `).join("")}
    </div>
  `;
}

function renderCounterTags(stats, upgrade = null) {
  const tags = getTowerCounterTags(stats, upgrade);
  return tags.length ? `<div class="counter-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div>` : "";
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
      ${renderStatRows(tower, null, true)}
      ${renderCounterTags(tower)}
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
  const earlyReward = engine.getEarlyStartReward();
  startWaveBtn.textContent = earlyReward > 0 ? `Start Wave (+${formatMoney(earlyReward)})` : "Start Wave";
  app.querySelector("[data-testid='endless-toggle']").checked = engine.endlessMode;
  app.querySelector("[data-testid='sound-toggle']").textContent = sounds.enabled ? "Sound On" : "Sound Off";
  
  app.querySelectorAll(".speed-group button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.speed) === engine.speedMultiplier);
  });

  const selected = engine.towers[selectedTowerIndex];
  const nextOptions = selected ? engine.getUpgradeOptions(selected) : [];
  const nextKey = selected
    ? `${selected.id}-${selected.level}-${engine.money}-${selected.targetingMode}-${Math.floor(selected.totalDamage)}`
    : `build-${selectedTowerType}-${engine.money}`;
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
    ${renderStatRows(selected.stats)}
    ${renderCounterTags(selected.stats)}
    <div class="tower-ledger" data-testid="tower-damage">
      <span>Damage Done</span>
      <strong>${Math.floor(selected.totalDamage)}</strong>
    </div>
    <div class="targeting-panel" data-testid="targeting-panel">
      <span>Target</span>
      <div class="targeting-modes">
        ${TARGETING_MODES.map((mode) => `
          <button
            type="button"
            data-target-mode="${mode}"
            data-testid="target-mode-${mode}"
            class="${selected.targetingMode === mode ? "active" : ""}">
            ${TARGETING_LABELS[mode]}
          </button>
        `).join("")}
      </div>
    </div>
    <div class="upgrade-list">
      ${nextOptions.length ? nextOptions.map((option, index) => `
        <button
          data-testid="${index === 0 ? "upgrade-tower" : `upgrade-tower-${index}`}"
          data-upgrade-choice="${index}">
          <strong>${option.name}</strong>
          <span>${formatMoney(option.cost)} · ${option.summary}</span>
          ${renderStatRows(selected.stats, option, true)}
          ${renderCounterTags(selected.stats, option)}
        </button>
      `).join("") : `<button data-testid="upgrade-tower" disabled>Fully Upgraded</button>`}
      <button data-testid="sell-tower" class="demolish">Salvage: +${refundText}</button>
    </div>
  ` : (selectedTowerType ? `
    <h2>Build: ${TOWERS[selectedTowerType].name}</h2>
    <p>Cost: ${formatMoney(TOWERS[selectedTowerType].cost)}</p>
    ${renderStatRows(TOWERS[selectedTowerType])}
    ${renderCounterTags(TOWERS[selectedTowerType])}
    <p class="build-hint">Select a build plot to place.</p>
  ` : `<h2>Command</h2><p>Select a build plot or tower.</p>`);
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

  // 1. Calculate direction of travel
  const path = engine.level.path ?? PATH;
  const seg = Math.min(Math.floor(enemy.progress), path.length - 1);
  const next = Math.min(seg + 1, path.length - 1);
  let dx = 0;
  let dy = 0;
  if (next !== seg) {
    dx = path[next][0] - path[seg][0];
    dy = path[next][1] - path[seg][1];
  } else if (seg > 0) {
    dx = path[seg][0] - path[seg - 1][0];
    dy = path[seg][1] - path[seg - 1][1];
  } else {
    dx = 1;
    dy = 0;
  }
  const angle = Math.atan2(dy, dx);
  ctx.rotate(angle + Math.PI / 2);

  // 2. Apply walking stride bobbing (squash & stretch)
  const speed = ENEMIES[enemy.type]?.speed ?? 1.0;
  const walkCycle = performance.now() * 0.015 * speed;
  const bobX = 1 + 0.08 * Math.sin(walkCycle);
  const bobY = 1 - 0.08 * Math.sin(walkCycle);
  ctx.scale(bobX, bobY);

  // 3. Draw base shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Draw slow aura
  if (enemy.slowTimer > 0) {
    ctx.strokeStyle = "rgba(116, 214, 253, 0.75)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. Draw hunter's mark crosshair (underneath feet)
  if (enemy.markedTimer > 0) {
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-18, 16);
    ctx.lineTo(-13, 16);
    ctx.moveTo(13, 16);
    ctx.lineTo(18, 16);
    ctx.stroke();
  }

  // 6. Draw enemy body
  ctx.fillStyle = enemy.flashTimer > 0 ? "#ffffff" : ENEMIES[enemy.type].color;
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

  // 7. Draw shield bubble around the creep
  if (enemy.shield > 0) {
    ctx.strokeStyle = "rgba(176, 122, 203, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(176, 122, 203, 0.15)";
    ctx.fill();
  }

  // 8. Draw slowed ice crystals floating around
  if (enemy.slowTimer > 0) {
    ctx.save();
    ctx.fillStyle = "#e0f2fe";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    const floatOffset = Math.sin(performance.now() * 0.007) * 3;
    const drawCrystal = (cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx + 2.5, cy);
      ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx - 2.5, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    drawCrystal(-16, -5 + floatOffset);
    drawCrystal(16, 5 - floatOffset);
    drawCrystal(0, -26 + floatOffset);
    ctx.restore();
  }

  // 9. Draw spinning target crosshair above marked creep's head
  if (enemy.markedTimer > 0) {
    ctx.save();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    const cy = -34;
    ctx.beginPath();
    ctx.arc(0, cy, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, cy); ctx.lineTo(-4, cy);
    ctx.moveTo(4, cy); ctx.lineTo(9, cy);
    ctx.moveTo(0, cy - 9); ctx.lineTo(0, cy - 4);
    ctx.moveTo(0, cy + 4); ctx.lineTo(0, cy + 9);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // Draw health bar (unrotated, horizontally flat above creep)
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
      drawCell(x, y, engine.isPath(x, y) ? THEME.path : grass);
    }
  }
  ctx.strokeStyle = "#6d4829";
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  engine.level.path.forEach(([x, y], index) => {
    const px = x * CELL + CELL / 2;
    const py = y * CELL + CELL / 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.strokeStyle = THEME.pathLight;
  ctx.lineWidth = 11;
  ctx.beginPath();
  engine.level.path.forEach(([x, y], index) => {
    const px = x * CELL + CELL / 2;
    const py = y * CELL + CELL / 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  drawMapProps();

  for (const [x, y] of engine.level.buildable) drawBuildPlot(x, y);

  // Draw Entry and Exit labels
  ctx.save();
  ctx.font = "bold 13px 'Cinzel', 'Outfit', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const [ex, ey] = engine.level.path[0];
  drawEndpoint("IN", ex, ey, "#2f6b39");

  const [ox, oy] = engine.level.path[engine.level.path.length - 1];
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
    const maxLife = shot.color === "#74d6c5" ? 0.15 : 0.18;
    const ratio = Math.max(0, Math.min(1.0, shot.life / maxLife));
    const t = 1 - ratio;
    ctx.save();
    ctx.globalAlpha = ratio;

    // Draw projectile contrail
    ctx.strokeStyle = shot.color;
    ctx.lineWidth = 1.2 + ratio * 2.0;
    ctx.beginPath();
    ctx.moveTo(shot.from.x * CELL, shot.from.y * CELL);
    ctx.lineTo(shot.to.x * CELL, shot.to.y * CELL);
    ctx.stroke();

    if (shot.type === "chain") {
      const startX = shot.from.x * CELL;
      const startY = shot.from.y * CELL;
      const endX = shot.to.x * CELL;
      const endY = shot.to.y * CELL;
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.hypot(dx, dy);

      ctx.strokeStyle = "#74d6c5";
      ctx.lineWidth = 3 * ratio;
      ctx.shadowColor = "#74d6c5";
      ctx.shadowBlur = 12 * ratio;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      const steps = 4;
      for (let i = 1; i < steps; i++) {
        const fraction = i / steps;
        const lx = startX + dx * fraction;
        const ly = startY + dy * fraction;
        const nx = -dy / dist;
        const ny = dx / dist;
        const offset = (Math.random() - 0.5) * 16;
        ctx.lineTo(lx + nx * offset, ly + ny * offset);
      }
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else {
      const px = (shot.from.x + (shot.to.x - shot.from.x) * t) * CELL;
      const py = (shot.from.y + (shot.to.y - shot.from.y) * t) * CELL;

      ctx.save();
      if (shot.type === "punch") {
        ctx.translate(px, py);
        ctx.rotate(t * Math.PI * 4);
        ctx.fillStyle = "#7e745f";
        ctx.strokeStyle = "#120c08";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-4, -2); ctx.lineTo(2, 3);
        ctx.moveTo(1, -3); ctx.lineTo(-2, 4);
        ctx.strokeStyle = "#403a2f";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (shot.type === "tax") {
        const angle = Math.atan2(shot.to.y - shot.from.y, shot.to.x - shot.from.x);
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.strokeStyle = "#a85c2a";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        ctx.fillStyle = "#e5e7eb";
        ctx.strokeStyle = "#120c08";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(16, 0);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shot.type === "radio") {
        ctx.translate(px, py);
        ctx.fillStyle = "#386fb0";
        ctx.strokeStyle = "#a9ddff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(169, 221, 255, 0.45)";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      } else if (shot.type === "freezer") {
        ctx.translate(px, py);
        ctx.rotate(performance.now() * 0.01);
        ctx.fillStyle = "#d8f5ff";
        ctx.strokeStyle = "#4f8fc7";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(4, -8);
        ctx.lineTo(8, 0);
        ctx.lineTo(4, 8);
        ctx.lineTo(-4, 8);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
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
    } else if (engine.isBuildable(hoveredCell.x, hoveredCell.y) && !engine.occupiedCells.has(`${hoveredCell.x},${hoveredCell.y}`)) {
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
    ctx.lineDashOffset = rangeDashOffset;
    ctx.stroke();
    ctx.restore();
  }

  drawParticles();
  drawFloatingTexts();
  drawLowLivesVignette();
  drawBanner();

  ctx.restore();
}

function renderSpells() {
  const meteorBtn = app.querySelector("#spell-meteor");
  const frostBtn = app.querySelector("#spell-frost");
  
  if (!meteorBtn || !frostBtn) return;
  
  meteorBtn.classList.toggle("active-cast", activeSpell === "meteor");
  frostBtn.classList.toggle("active-cast", activeSpell === "frost");
  
  const canAffordMeteor = engine.money >= 25;
  const canAffordFrost = engine.money >= 30;
  
  meteorBtn.disabled = meteorCooldown > 0 || !canAffordMeteor || engine.status !== "running";
  frostBtn.disabled = frostCooldown > 0 || !canAffordFrost || engine.status !== "running";
  
  meteorBtn.querySelector("span").textContent = meteorCooldown > 0 
    ? `Cooldown: ${Math.ceil(meteorCooldown)}s`
    : `25 Gold · CD: 20s`;
  frostBtn.querySelector("span").textContent = frostCooldown > 0 
    ? `Cooldown: ${Math.ceil(frostCooldown)}s`
    : `30 Gold · CD: 30s`;
}

function updateOverlays() {
  const menu = app.querySelector("#menu-overlay");
  const gameOver = app.querySelector("#game-over-overlay");
  
  if (gameState === "menu") {
    menu.classList.remove("hidden");
    gameOver.classList.add("hidden");
    
    const menuCards = app.querySelector("#menu-level-cards");
    menuCards.innerHTML = LEVELS.map((level) => {
      const key = `runehold-highscore-level-${level.id}`;
      const high = localStorage.getItem(key) ?? 0;
      const activeClass = engine.level.id === level.id ? "active" : "";
      return `
        <div class="menu-level-card ${activeClass}" data-menu-level="${level.id}">
          <h4>${level.name}</h4>
          <p>${level.waves.length} waves · Starting Gold: ${formatMoney(level.startingMoney)}</p>
          ${high > 0 ? `<p style="color: #ffe7a0; margin-top: 4px;">Best Wave: ${high}</p>` : ""}
        </div>
      `;
    }).join("");
    
    menuCards.querySelectorAll(".menu-level-card").forEach((card) => {
      card.addEventListener("click", () => {
        const levelId = Number(card.dataset.menuLevel);
        engine.loadLevel(levelId);
        sounds.play("levelSelect");
        generateMapProps();
        updateOverlays();
      });
    });
  } else {
    menu.classList.add("hidden");
  }
  
  if (gameState === "victory" || gameState === "defeat") {
    gameOver.classList.remove("hidden");
    const title = app.querySelector("#game-over-title");
    const sub = app.querySelector("#game-over-subtitle");
    
    if (gameState === "victory") {
      title.textContent = "VICTORY";
      title.className = "won";
      sub.textContent = "Runehold stands victorious! The hold stands strong.";
      
      const nextBtn = app.querySelector("#game-over-action-btn");
      if (engine.level.id < LEVELS.length) {
        nextBtn.textContent = "NEXT LEVEL";
        nextBtn.disabled = false;
      } else {
        nextBtn.textContent = "CAMPAIGN COMPLETED";
        nextBtn.disabled = true;
      }
    } else {
      title.textContent = "DEFEAT";
      title.className = "lost";
      sub.textContent = "The hold has fallen. Rebuild your defenses.";
      
      const nextBtn = app.querySelector("#game-over-action-btn");
      nextBtn.textContent = "TRY AGAIN";
      nextBtn.disabled = false;
    }
    
    app.querySelector("#stat-level-name").textContent = engine.level.name.split(":")[1]?.trim() ?? engine.level.name;
    
    const maxWaves = engine.level.waves.length;
    const waveReached = gameState === "victory" ? maxWaves : Math.min(engine.waveIndex + 1, maxWaves);
    app.querySelector("#stat-wave-reached").textContent = `${waveReached}/${maxWaves}`;
    app.querySelector("#stat-gold-earned").textContent = formatMoney(engine.money);
  } else {
    gameOver.classList.add("hidden");
  }
}

function refresh() {
  renderHud();
  draw();
  renderSpells();
  updateOverlays();
  
  if (activeSpell) {
    canvas.classList.add("targeting-spell");
  } else {
    canvas.classList.remove("targeting-spell");
  }
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
  const targetModeBtn = event.target.closest("[data-target-mode]");
  
  if (level) {
    engine.loadLevel(Number(level.dataset.level));
    selectedTowerIndex = -1;
    inspectKey = "";
    sounds.play("levelSelect");
    renderControls();
    generateMapProps();
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
  } else if (targetModeBtn) {
    engine.setTowerTargeting(selectedTowerIndex, targetModeBtn.dataset.targetMode);
    sounds.play("click", 0.9);
  } else if (event.target.matches("[data-testid='reset-level']")) {
    const prevEndless = engine.endlessMode;
    engine.loadLevel(engine.level.id);
    engine.endlessMode = prevEndless;
    selectedTowerIndex = -1;
    inspectKey = "";
    sounds.play("resetLevel");
    generateMapProps();
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

  if (activeSpell) {
    const cost = activeSpell === "meteor" ? 25 : 30;
    if (engine.money >= cost) {
      engine.money -= cost;
      const origin = { x: x + 0.5, y: y + 0.5 };
      const radius = activeSpell === "meteor" ? 1.5 : 2.0;
      
      const targets = engine.enemies.filter((enemy) => {
        const pos = engine.enemyCenter(enemy);
        return Math.hypot(pos.x - origin.x, pos.y - origin.y) <= radius;
      });
      
      if (activeSpell === "meteor") {
        sounds.play("defeat", 0.8, "vault");
        addExplosion(origin.x, origin.y, "#f97316", 24);
        
        for (const target of targets) {
          target.hp -= 50;
          const targetPos = engine.enemyCenter(target);
          addFloatingText(targetPos.x, targetPos.y - 0.2, "-50", "#ef4444");
        }
        meteorCooldown = 20;
      } else if (activeSpell === "frost") {
        sounds.play("shoot", 0.6, "freezer");
        addExplosion(origin.x, origin.y, "#93c5fd", 18);
        
        for (const target of targets) {
          target.slowTimer = 4.0;
          target.slowFactor = 0.65;
          const targetPos = engine.enemyCenter(target);
          addFloatingText(targetPos.x, targetPos.y - 0.2, "FROZEN", "#38bdf8");
        }
        frostCooldown = 30;
      }
      activeSpell = null;
    }
    refresh();
    return;
  }

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
  
  // Decrement enemy hit flash timers
  for (const enemy of engine.enemies) {
    if (enemy.flashTimer > 0) {
      enemy.flashTimer = Math.max(0, enemy.flashTimer - simDt);
    }
  }

  // Spin range circles and tick banners
  rangeDashOffset = (rangeDashOffset - simDt * 10) % 12;
  bannerTimer = Math.max(0, bannerTimer - simDt);

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

generateMapProps();
renderControls();
refresh();
requestAnimationFrame(loop);

// Spell triggers click listeners
app.querySelector("#spell-meteor").addEventListener("click", (e) => {
  if (meteorCooldown > 0 || engine.money < 25) return;
  if (activeSpell === "meteor") {
    activeSpell = null;
  } else {
    activeSpell = "meteor";
    selectedTowerIndex = -1;
  }
  refresh();
});

app.querySelector("#spell-frost").addEventListener("click", (e) => {
  if (frostCooldown > 0 || engine.money < 30) return;
  if (activeSpell === "frost") {
    activeSpell = null;
  } else {
    activeSpell = "frost";
    selectedTowerIndex = -1;
  }
  refresh();
});

// Overlay button click listeners
app.querySelector("#menu-start-btn").addEventListener("click", () => {
  gameState = "play";
  if (sounds.enabled) {
    sounds.enable(true);
  }
  announceLevel(engine.level.id);
  showBanner(engine.level.name, "PREPARE YOUR DEFENSES", 2.5);
  refresh();
});

app.querySelector("#game-over-action-btn").addEventListener("click", () => {
  if (gameState === "victory") {
    if (engine.level.id < LEVELS.length) {
      engine.loadLevel(engine.level.id + 1);
      gameState = "play";
      generateMapProps();
      announceLevel(engine.level.id);
      showBanner(engine.level.name, "PREPARE YOUR DEFENSES", 2.5);
    }
  } else if (gameState === "defeat") {
    engine.loadLevel(engine.level.id);
    gameState = "play";
    generateMapProps();
    announceLevel(engine.level.id);
    showBanner(engine.level.name, "PREPARE YOUR DEFENSES", 2.5);
  }
  refresh();
});

app.querySelector("#game-over-retry-btn").addEventListener("click", () => {
  engine.loadLevel(engine.level.id);
  gameState = "play";
  generateMapProps();
  announceLevel(engine.level.id);
  showBanner(engine.level.name, "PREPARE YOUR DEFENSES", 2.5);
  refresh();
});

app.querySelector("#game-over-menu-btn").addEventListener("click", () => {
  gameState = "menu";
  refresh();
});

// Keyboard Hotkeys
window.addEventListener("keydown", (event) => {
  if (gameState !== "play") return;
  
  if (event.code === "Space") {
    event.preventDefault();
    if (activeSpell) {
      activeSpell = null;
    } else {
      const startWaveBtn = app.querySelector("[data-testid='start-wave']");
      if (!startWaveBtn.disabled) {
        engine.startWave();
      } else {
        engine.speedMultiplier = engine.speedMultiplier === 0 ? 1 : 0;
      }
    }
    refresh();
  } else if (event.code === "Escape") {
    activeSpell = null;
    selectedTowerIndex = -1;
    refresh();
  } else if (event.code === "Digit1") {
    selectedTowerType = "punch";
    sounds.play("select", 1.2, selectedTowerType);
    renderControls();
  } else if (event.code === "Digit2") {
    selectedTowerType = "radio";
    sounds.play("select", 1.2, selectedTowerType);
    renderControls();
  } else if (event.code === "Digit3") {
    selectedTowerType = "tax";
    sounds.play("select", 1.2, selectedTowerType);
    renderControls();
  } else if (event.code === "Digit4") {
    selectedTowerType = "freezer";
    sounds.play("select", 1.2, selectedTowerType);
    renderControls();
  } else if (event.code === "KeyU") {
    if (selectedTowerIndex >= 0) {
      engine.upgradeTower(selectedTowerIndex, 0);
      processEvents(engine.events);
      refresh();
    }
  } else if (event.code === "KeyI") {
    if (selectedTowerIndex >= 0) {
      engine.upgradeTower(selectedTowerIndex, 1);
      processEvents(engine.events);
      refresh();
    }
  } else if (event.code === "KeyS") {
    if (selectedTowerIndex >= 0) {
      engine.sellTower(selectedTowerIndex);
      selectedTowerIndex = -1;
      inspectKey = "";
      processEvents(engine.events);
      refresh();
    }
  }
});
