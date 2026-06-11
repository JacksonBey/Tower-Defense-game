// Reference: SYSTEM.md#E2E-Testing
import { expect, test } from "@playwright/test";
import { GRID } from "../src/data.js";

async function clickCell(page, x, y) {
  const canvas = page.getByTestId("game-canvas");
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + (x + 0.5) * (box.width / GRID.cols), box.y + (y + 0.5) * (box.height / GRID.rows));
}

test("loads with all requested content visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Runehold TD" })).toBeVisible();
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
  await page.goto("/");
  await clickCell(page, 1, 0);
  await expect(page.getByTestId("inspect")).toContainText("Stoneguard Post");
  await page.getByTestId("upgrade-tower").click();
  await expect(page.getByTestId("inspect")).toContainText("Rank 2");
  await expect(page.getByTestId("money")).toContainText("0C 3S 2B");
});

test("starts a wave and advances combat state", async ({ page }) => {
  await page.goto("/");
  await clickCell(page, 1, 0);
  await page.getByText("Arcane Spire").click();
  await clickCell(page, 4, 0);
  await page.getByTestId("start-wave").click();
  await expect(page.getByTestId("message")).toContainText("Wave 1");
  await page.getByTestId("speed-2").click(); // Speed up the simulation to avoid timeout on longer path
  await page.waitForFunction(() => window.__game.engine.status !== "running", null, { timeout: 30000 });
  await expect(page.getByTestId("message")).toContainText(/Wave broken|cleared/);
});

test("switches levels and resets currency/lives", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Level 3: Elderfen Crossing" }).click();
  await expect(page.getByTestId("money")).toContainText("Gold 3C 0S 0B");
  await expect(page.getByTestId("lives")).toContainText("Lives 9");
});

test("blocks invalid placement with feedback", async ({ page }) => {
  await page.goto("/");
  await clickCell(page, 0, 2);
  await expect(page.getByTestId("message")).toContainText("INVALID PAD");
});

test("demolishes/sells a tower and updates currency", async ({ page }) => {
  await page.goto("/");
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
  await page.goto("/");
  
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
