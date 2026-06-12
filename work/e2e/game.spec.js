// Reference: SYSTEM.md#E2E-Testing
import { expect, test } from "@playwright/test";
import { GRID } from "../src/data.js";

async function clickCell(page, x, y) {
  const canvas = page.getByTestId("game-canvas");
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + (x + 0.5) * (box.width / GRID.cols), box.y + (y + 0.5) * (box.height / GRID.rows));
}

async function startGame(page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "ENTER RUNEHOLD" })).toBeVisible();
  await page.getByRole("button", { name: "ENTER RUNEHOLD" }).click();
  await expect(page.locator("#menu-overlay")).toHaveClass(/hidden/);
}

test("loads with all requested content visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".menu-title")).toContainText("RUNEHOLD TD");
  await expect(page.getByRole("button", { name: "ENTER RUNEHOLD" })).toBeVisible();
  await page.getByRole("button", { name: "ENTER RUNEHOLD" }).click();
  await expect(page.getByTestId("levels").getByRole("button")).toHaveCount(3);
  await expect(page.getByTestId("towers").getByRole("button")).toHaveCount(4);
  await expect(page.getByText("Hex Acolyte")).toBeVisible();
  await expect(page.getByTestId("money")).toContainText("Gold 1C 5S 2B");
  await expect(page.getByTestId("wave-preview")).toContainText("Wave 1");
  await expect(page.getByTestId("wave-preview")).toContainText("Reward 1C 4S 3B");
  await expect(page.getByTestId("wave-preview")).toContainText("4x Hollow Imp");
  await expect(page.getByTestId("wave-preview")).toContainText("Swarm");
});

test("places and upgrades a tower", async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId("inspect")).toContainText("Build: Stoneguard Post");
  await expect(page.getByTestId("inspect")).toContainText("DMG");
  await expect(page.getByTestId("inspect")).toContainText("0.58s");
  await clickCell(page, 1, 0);
  await expect(page.getByTestId("inspect")).toContainText("Stoneguard Post");
  await expect(page.getByTestId("inspect")).toContainText("Oath Stones");
  await expect(page.getByTestId("inspect")).toContainText("Watchfire");
  await expect(page.getByTestId("inspect")).toContainText("14->26");
  await expect(page.getByTestId("inspect")).toContainText("Armor +12");
  await expect(page.getByTestId("inspect")).toContainText("Swarm +6");
  await page.getByTestId("upgrade-tower").click();
  await expect(page.getByTestId("inspect")).toContainText("Rank 2");
  await expect(page.getByTestId("money")).toContainText("0C 3S 2B");
});

test("chooses an alternate upgrade branch", async ({ page }) => {
  await startGame(page);
  await clickCell(page, 1, 0);
  await page.getByTestId("upgrade-tower-1").click();
  await expect(page.getByTestId("inspect")).toContainText("Rank 2");
  const stats = await page.evaluate(() => {
    const tower = window.__game.engine.towers[0];
    return { damage: tower.stats.damage, range: tower.stats.range, cooldown: tower.stats.cooldown, upgrades: tower.upgradeHistory.map((u) => u.id) };
  });
  expect(stats.damage).toBe(14);
  expect(stats.range).toBeCloseTo(2.15);
  expect(stats.cooldown).toBeCloseTo(0.54);
  expect(await page.evaluate(() => window.__game.engine.towers[0].stats.bonusVsSwarm)).toBe(6);
  expect(stats.upgrades).toEqual(["watchfire"]);
});

test("changes tower targeting mode and shows lifetime damage", async ({ page }) => {
  await startGame(page);
  await clickCell(page, 1, 0);
  await expect(page.getByTestId("targeting-panel")).toContainText("First");
  await expect(page.getByTestId("tower-damage")).toContainText("Damage Done");
  await expect(page.getByTestId("tower-damage")).toContainText("0");

  await page.getByTestId("target-mode-strongest").click();
  await expect(page.getByTestId("target-mode-strongest")).toHaveClass(/active/);
  expect(await page.evaluate(() => window.__game.engine.towers[0].targetingMode)).toBe("strongest");

  await page.evaluate(() => {
    window.__game.engine.towers[0].totalDamage = 42;
    window.__game.refresh();
  });
  await expect(page.getByTestId("tower-damage")).toContainText("42");
});

test("shows and awards early-start rush gold", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    window.__game.engine.buildTimer = 10;
    window.__game.refresh();
  });
  await expect(page.getByTestId("start-wave")).toContainText("+0C 2S 6B");

  const before = await page.evaluate(() => window.__game.engine.money);
  await page.getByTestId("start-wave").click();
  expect(await page.evaluate(() => window.__game.engine.money)).toBe(before + 20);
  await expect(page.getByTestId("start-wave")).toContainText("Start Wave");
});

test("starts a wave and advances combat state", async ({ page }) => {
  await startGame(page);
  await clickCell(page, 1, 0);
  await page.getByText("Arcane Spire").click();
  await clickCell(page, 4, 0);
  await page.getByTestId("start-wave").click();
  await expect(page.getByTestId("message")).toContainText("Wave 1");
  await page.getByTestId("speed-2").click(); // Speed up the simulation to avoid timeout on longer path
  await page.waitForFunction(() => window.__game.engine.status === "running" && window.__game.engine.spawnIndex > 0, null, { timeout: 10000 });
  expect(await page.evaluate(() => window.__game.engine.enemies.length + window.__game.engine.projectiles.length)).toBeGreaterThan(0);
  await expect(page.getByTestId("wave")).toContainText("1/3");
});

test("switches levels and resets currency/lives", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Level 3: Elderfen Crossing" }).click();
  await expect(page.getByTestId("money")).toContainText("Gold 3C 0S 0B");
  await expect(page.getByTestId("lives")).toContainText("Lives 9");
});

test("shows elite finale preview for authored levels", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
     const { engine, renderControls } = window.__game;
     engine.waveIndex = engine.level.waves.length - 1;
     renderControls();
   });
  await expect(page.getByTestId("wave-preview")).toContainText("Finale");
  await expect(page.getByTestId("wave-preview")).toContainText("Stoneback");
  await expect(page.getByTestId("wave-preview")).toContainText("Elite");

  const finaleTraits = await page.evaluate(() => {
    return window.__game.LEVELS.map((level) => {
      const finale = level.waves[level.waves.length - 1];
      return window.__game.engine.previewWave.call({ level: { waves: [finale] }, generateEndlessWave: () => {} }, 0).traits;
    });
  });
  expect(finaleTraits.every((traits) => traits.includes("elite"))).toBe(true);
});

test("blocks invalid placement with feedback", async ({ page }) => {
  await startGame(page);
  await clickCell(page, 0, 2);
  await expect(page.getByTestId("message")).toContainText("INVALID PAD");
});

test("demolishes/sells a tower and updates currency", async ({ page }) => {
  await startGame(page);
  await clickCell(page, 1, 0); // Places punch press: money goes from 86 to 58 (1C 1S 2B)
  await expect(page.getByTestId("inspect")).toContainText("Stoneguard Post");
  await page.getByTestId("upgrade-tower").click(); // Upgrades: money goes from 58 to 23 (0C 3S 2B)
  await expect(page.getByTestId("money")).toContainText("0C 3S 2B");

  // Refund is Math.floor(63 * 0.7) = 44. Money becomes 23 + 44 = 67 (1C 2S 4B)
  await page.getByTestId("sell-tower").click();
  await expect(page.getByTestId("money")).toContainText("1C 2S 4B");
  await expect(page.getByTestId("inspect")).toContainText("Select a build plot");
});

test("toggles speed and pause states", async ({ page }) => {
  await startGame(page);
  
  // Click 2x button
  await page.getByTestId("speed-2").click();
  let speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  expect(speed).toBe(2);

  // Click Pause button
  await page.getByTestId("speed-0").click();
  speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  expect(speed).toBe(0);

  // Click 1x button
  await page.getByTestId("speed-1").click();
  speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  expect(speed).toBe(1);
});

test("updates sound channel controls", async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId("volume-master")).toHaveValue("70");

  await page.getByTestId("volume-master").fill("35");
  await expect(page.getByTestId("volume-master")).toHaveValue("35");
  expect(await page.evaluate(() => localStorage.getItem("runehold-volume-master"))).toBe("0.35");

  await page.getByTestId("sound-toggle").click();
  await expect(page.getByTestId("sound-toggle")).toContainText("Sound On");
  expect(await page.evaluate(() => localStorage.getItem("runehold-sound-enabled"))).toBe("true");
});
