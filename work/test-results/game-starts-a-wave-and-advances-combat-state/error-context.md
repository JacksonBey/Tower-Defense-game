# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game.spec.js >> starts a wave and advances combat state
- Location: e2e\game.spec.js:66:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForFunction: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Runehold TD" [level=1] [ref=e6]
        - paragraph [ref=e7]: Fantasy RTS tower defense with awkward old-kingdom coinage.
      - generic [ref=e8]:
        - generic [ref=e9]: Gold 1C 5S 2B
        - generic [ref=e10]: Lives 12
        - generic [ref=e11]: Wave 1/3
        - generic [ref=e12]:
          - button "1x" [ref=e13] [cursor=pointer]
          - button "2x" [ref=e14] [cursor=pointer]
          - button "Pause" [ref=e15] [cursor=pointer]
        - button "Sound Off" [ref=e16] [cursor=pointer]
    - generic [ref=e17]:
      - complementary [ref=e18]:
        - heading "War Paths" [level=2] [ref=e19]
        - generic [ref=e20]:
          - 'button "Level 1: Briar Glen" [ref=e21] [cursor=pointer]':
            - strong [ref=e22]: "Level 1: Briar Glen"
          - 'button "Level 2: Mossgate Ford" [ref=e23] [cursor=pointer]':
            - strong [ref=e24]: "Level 2: Mossgate Ford"
          - 'button "Level 3: Elderfen Crossing" [ref=e25] [cursor=pointer]':
            - strong [ref=e26]: "Level 3: Elderfen Crossing"
        - generic [ref=e27]:
          - checkbox "Endless Mode" [ref=e28] [cursor=pointer]
          - generic [ref=e29] [cursor=pointer]: Endless Mode
        - heading "Audio Settings" [level=2] [ref=e30]
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e33]: Master
            - slider [ref=e34] [cursor=pointer]: "70"
          - generic [ref=e35]:
            - generic [ref=e36]: Combat
            - slider [ref=e37] [cursor=pointer]: "70"
          - generic [ref=e38]:
            - generic [ref=e39]: Build
            - slider [ref=e40] [cursor=pointer]: "70"
          - generic [ref=e41]:
            - generic [ref=e42]: System
            - slider [ref=e43] [cursor=pointer]: "70"
        - heading "Next Wave" [level=2] [ref=e44]
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: Wave 1
            - generic [ref=e48]: Moderate Threat
            - generic [ref=e49]: Reward 1C 4S 3B
          - generic [ref=e50]:
            - generic [ref=e51]:
              - img [ref=e52]
              - generic [ref=e55]: 4x Hollow Imp
              - generic [ref=e56]: 22 HP
            - generic [ref=e57]:
              - img [ref=e58]
              - generic [ref=e61]: 2x Wisp Strider
              - generic [ref=e62]: 30 HP
            - generic [ref=e63]:
              - img [ref=e64]
              - generic [ref=e67]: 1x Mire Brute
              - generic [ref=e68]: 52 HP
          - generic [ref=e69]:
            - generic [ref=e70]: Swarm
            - generic [ref=e71]: Armored
        - heading "Hero Spells" [level=2] [ref=e72]
        - generic [ref=e73]:
          - 'button "Meteor Strike 25 Gold · CD: 20s" [disabled] [ref=e74]':
            - strong [ref=e75]: Meteor Strike
            - generic [ref=e76]: "25 Gold · CD: 20s"
          - 'button "Frost Nova 30 Gold · CD: 30s" [disabled] [ref=e77]':
            - strong [ref=e78]: Frost Nova
            - generic [ref=e79]: "30 Gold · CD: 30s"
        - heading "Build Towers" [level=2] [ref=e80]
        - generic [ref=e81]:
          - button "Stoneguard Post Stoneguard Post 0C 4S 0B DMG 14 RNG 1.8 CD 0.58s SLOW 0%" [ref=e82] [cursor=pointer]:
            - img "Stoneguard Post" [ref=e83]
            - generic [ref=e84]:
              - strong [ref=e85]: Stoneguard Post
              - generic [ref=e86]: 0C 4S 0B
            - generic [ref=e87]:
              - generic [ref=e88]:
                - generic [ref=e89]: DMG
                - text: "14"
              - generic [ref=e90]:
                - generic [ref=e91]: RNG
                - text: "1.8"
              - generic [ref=e92]:
                - generic [ref=e93]: CD
                - text: 0.58s
              - generic [ref=e94]:
                - generic [ref=e95]: SLOW
                - text: 0%
          - button "Arcane Spire Arcane Spire 0C 6S 0B DMG 8 RNG 2.5 CD 0.34s SLOW 0%" [ref=e96] [cursor=pointer]:
            - img "Arcane Spire" [ref=e97]
            - generic [ref=e98]:
              - strong [ref=e99]: Arcane Spire
              - generic [ref=e100]: 0C 6S 0B
            - generic [ref=e101]:
              - generic [ref=e102]:
                - generic [ref=e103]: DMG
                - text: "8"
              - generic [ref=e104]:
                - generic [ref=e105]: RNG
                - text: "2.5"
              - generic [ref=e106]:
                - generic [ref=e107]: CD
                - text: 0.34s
              - generic [ref=e108]:
                - generic [ref=e109]: SLOW
                - text: 0%
          - button "Bounty Ballista Bounty Ballista 1C 0S 0B DMG 20 RNG 2.0 CD 1.05s SLOW 0%" [ref=e110] [cursor=pointer]:
            - img "Bounty Ballista" [ref=e111]
            - generic [ref=e112]:
              - strong [ref=e113]: Bounty Ballista
              - generic [ref=e114]: 1C 0S 0B
            - generic [ref=e115]:
              - generic [ref=e116]:
                - generic [ref=e117]: DMG
                - text: "20"
              - generic [ref=e118]:
                - generic [ref=e119]: RNG
                - text: "2.0"
              - generic [ref=e120]:
                - generic [ref=e121]: CD
                - text: 1.05s
              - generic [ref=e122]:
                - generic [ref=e123]: SLOW
                - text: 0%
          - button "Frost Obelisk Frost Obelisk 1C 2S 0B DMG 7 RNG 1.9 CD 0.48s SLOW 34%" [ref=e124] [cursor=pointer]:
            - img "Frost Obelisk" [ref=e125]
            - generic [ref=e126]:
              - strong [ref=e127]: Frost Obelisk
              - generic [ref=e128]: 1C 2S 0B
            - generic [ref=e129]:
              - generic [ref=e130]:
                - generic [ref=e131]: DMG
                - text: "7"
              - generic [ref=e132]:
                - generic [ref=e133]: RNG
                - text: "1.9"
              - generic [ref=e134]:
                - generic [ref=e135]: CD
                - text: 0.48s
              - generic [ref=e136]:
                - generic [ref=e137]: SLOW
                - text: 34%
        - button "Start Wave" [ref=e138] [cursor=pointer]
        - button "Reset Level" [ref=e139] [cursor=pointer]
        - generic [ref=e140]:
          - 'heading "Build: Stoneguard Post" [level=2] [ref=e141]'
          - paragraph [ref=e142]: "Cost: 0C 4S 0B"
          - generic [ref=e143]:
            - generic [ref=e144]:
              - generic [ref=e145]: DMG
              - text: "14"
            - generic [ref=e146]:
              - generic [ref=e147]: RNG
              - text: "1.8"
            - generic [ref=e148]:
              - generic [ref=e149]: CD
              - text: 0.58s
            - generic [ref=e150]:
              - generic [ref=e151]: SLOW
              - text: 0%
          - paragraph [ref=e152]: Select a build plot to place.
      - generic [ref=e153]:
        - generic "Runehold tower defense board" [ref=e154]
        - generic [ref=e155]: Raise towers. Hold the lane.
      - complementary [ref=e156]:
        - heading "Creep Ledger" [level=2] [ref=e157]
        - generic [ref=e158]:
          - generic [ref=e159]:
            - img [ref=e160]
            - generic [ref=e163]:
              - text: Hollow Imp
              - generic [ref=e165]: Swarm
            - generic [ref=e166]: 22 HP
          - generic [ref=e167]:
            - img [ref=e168]
            - generic [ref=e171]:
              - text: Mire Brute
              - generic [ref=e173]: Armored
            - generic [ref=e174]: 52 HP
          - generic [ref=e175]:
            - img [ref=e176]
            - generic [ref=e179]:
              - text: Wisp Strider
              - generic [ref=e181]: Swarm
            - generic [ref=e182]: 30 HP
          - generic [ref=e183]:
            - img [ref=e184]
            - generic [ref=e188]:
              - text: Stoneback
              - generic [ref=e189]:
                - generic [ref=e190]: Armored
                - generic [ref=e191]: Slow-Resistant
                - generic [ref=e192]: Elite
            - generic [ref=e193]: 94 HP
          - generic [ref=e194]:
            - img [ref=e195]
            - generic [ref=e198]:
              - text: Hex Acolyte
              - generic [ref=e200]: Shielded
            - generic [ref=e201]: 66 HP
  - generic [ref=e202]:
    - generic [ref=e203]: RUNEHOLD TD
    - paragraph [ref=e204]: Defend the ancient kingdom lanes against the creep onslaught.
    - generic [ref=e205]:
      - heading "Select a War Path" [level=3] [ref=e206]
      - generic [ref=e207]:
        - generic [ref=e208] [cursor=pointer]:
          - 'heading "Level 1: Briar Glen" [level=4] [ref=e209]'
          - paragraph [ref=e210]: "3 waves · Starting Gold: 1C 5S 2B"
        - generic [ref=e211] [cursor=pointer]:
          - 'heading "Level 2: Mossgate Ford" [level=4] [ref=e212]'
          - paragraph [ref=e213]: "3 waves · Starting Gold: 2C 2S 0B"
        - generic [ref=e214] [cursor=pointer]:
          - 'heading "Level 3: Elderfen Crossing" [level=4] [ref=e215]'
          - paragraph [ref=e216]: "3 waves · Starting Gold: 3C 0S 0B"
    - button "ENTER RUNEHOLD" [ref=e218] [cursor=pointer]
```

# Test source

```ts
  1   | // Reference: SYSTEM.md#E2E-Testing
  2   | import { expect, test } from "@playwright/test";
  3   | import { GRID } from "../src/data.js";
  4   | 
  5   | async function clickCell(page, x, y) {
  6   |   const canvas = page.getByTestId("game-canvas");
  7   |   const box = await canvas.boundingBox();
  8   |   await page.mouse.click(box.x + (x + 0.5) * (box.width / GRID.cols), box.y + (y + 0.5) * (box.height / GRID.rows));
  9   | }
  10  | 
  11  | async function startGame(page) {
  12  |   await page.goto("/");
  13  |   await expect(page.getByRole("button", { name: "ENTER RUNEHOLD" })).toBeVisible();
  14  |   await page.getByRole("button", { name: "ENTER RUNEHOLD" }).click();
  15  |   await expect(page.locator("#menu-overlay")).toHaveClass(/hidden/);
  16  | }
  17  | 
  18  | test("loads with all requested content visible", async ({ page }) => {
  19  |   await page.goto("/");
  20  |   await expect(page.locator(".menu-title")).toContainText("RUNEHOLD TD");
  21  |   await expect(page.getByRole("button", { name: "ENTER RUNEHOLD" })).toBeVisible();
  22  |   await page.getByRole("button", { name: "ENTER RUNEHOLD" }).click();
  23  |   await expect(page.getByTestId("levels").getByRole("button")).toHaveCount(3);
  24  |   await expect(page.getByTestId("towers").getByRole("button")).toHaveCount(4);
  25  |   await expect(page.getByText("Hex Acolyte")).toBeVisible();
  26  |   await expect(page.getByTestId("money")).toContainText("Gold 1C 5S 2B");
  27  |   await expect(page.getByTestId("wave-preview")).toContainText("Wave 1");
  28  |   await expect(page.getByTestId("wave-preview")).toContainText("Reward 1C 4S 3B");
  29  |   await expect(page.getByTestId("wave-preview")).toContainText("4x Hollow Imp");
  30  |   await expect(page.getByTestId("wave-preview")).toContainText("Swarm");
  31  | });
  32  | 
  33  | test("places and upgrades a tower", async ({ page }) => {
  34  |   await startGame(page);
  35  |   await expect(page.getByTestId("inspect")).toContainText("Build: Stoneguard Post");
  36  |   await expect(page.getByTestId("inspect")).toContainText("DMG");
  37  |   await expect(page.getByTestId("inspect")).toContainText("0.58s");
  38  |   await clickCell(page, 1, 0);
  39  |   await expect(page.getByTestId("inspect")).toContainText("Stoneguard Post");
  40  |   await expect(page.getByTestId("inspect")).toContainText("Oath Stones");
  41  |   await expect(page.getByTestId("inspect")).toContainText("Watchfire");
  42  |   await expect(page.getByTestId("inspect")).toContainText("14->26");
  43  |   await expect(page.getByTestId("inspect")).toContainText("Armor +12");
  44  |   await expect(page.getByTestId("inspect")).toContainText("Swarm +6");
  45  |   await page.getByTestId("upgrade-tower").click();
  46  |   await expect(page.getByTestId("inspect")).toContainText("Rank 2");
  47  |   await expect(page.getByTestId("money")).toContainText("0C 3S 2B");
  48  | });
  49  | 
  50  | test("chooses an alternate upgrade branch", async ({ page }) => {
  51  |   await startGame(page);
  52  |   await clickCell(page, 1, 0);
  53  |   await page.getByTestId("upgrade-tower-1").click();
  54  |   await expect(page.getByTestId("inspect")).toContainText("Rank 2");
  55  |   const stats = await page.evaluate(() => {
  56  |     const tower = window.__game.engine.towers[0];
  57  |     return { damage: tower.stats.damage, range: tower.stats.range, cooldown: tower.stats.cooldown, upgrades: tower.upgradeHistory.map((u) => u.id) };
  58  |   });
  59  |   expect(stats.damage).toBe(14);
  60  |   expect(stats.range).toBeCloseTo(2.15);
  61  |   expect(stats.cooldown).toBeCloseTo(0.54);
  62  |   expect(await page.evaluate(() => window.__game.engine.towers[0].stats.bonusVsSwarm)).toBe(6);
  63  |   expect(stats.upgrades).toEqual(["watchfire"]);
  64  | });
  65  | 
  66  | test("starts a wave and advances combat state", async ({ page }) => {
  67  |   await startGame(page);
  68  |   await clickCell(page, 1, 0);
  69  |   await page.getByText("Arcane Spire").click();
  70  |   await clickCell(page, 4, 0);
  71  |   await page.getByTestId("start-wave").click();
  72  |   await expect(page.getByTestId("message")).toContainText("Wave 1");
  73  |   await page.getByTestId("speed-2").click(); // Speed up the simulation to avoid timeout on longer path
> 74  |   await page.waitForFunction(() => window.__game.engine.status !== "running" && window.__game.engine.waveIndex > 0, null, { timeout: 30000 });
      |              ^ Error: page.waitForFunction: Test timeout of 30000ms exceeded.
  75  |   expect(await page.evaluate(() => window.__game.engine.waveIndex)).toBeGreaterThan(0);
  76  |   await expect(page.getByTestId("wave")).toContainText("2/3");
  77  | });
  78  | 
  79  | test("switches levels and resets currency/lives", async ({ page }) => {
  80  |   await startGame(page);
  81  |   await page.getByRole("button", { name: "Level 3: Elderfen Crossing" }).click();
  82  |   await expect(page.getByTestId("money")).toContainText("Gold 3C 0S 0B");
  83  |   await expect(page.getByTestId("lives")).toContainText("Lives 9");
  84  | });
  85  | 
  86  | test("shows elite finale preview for authored levels", async ({ page }) => {
  87  |   await startGame(page);
  88  |   await page.evaluate(() => {
  89  |      const { engine, renderControls } = window.__game;
  90  |      engine.waveIndex = engine.level.waves.length - 1;
  91  |      renderControls();
  92  |    });
  93  |   await expect(page.getByTestId("wave-preview")).toContainText("Finale");
  94  |   await expect(page.getByTestId("wave-preview")).toContainText("Stoneback");
  95  |   await expect(page.getByTestId("wave-preview")).toContainText("Elite");
  96  | 
  97  |   const finaleTraits = await page.evaluate(() => {
  98  |     return window.__game.LEVELS.map((level) => {
  99  |       const finale = level.waves[level.waves.length - 1];
  100 |       return window.__game.engine.previewWave.call({ level: { waves: [finale] }, generateEndlessWave: () => {} }, 0).traits;
  101 |     });
  102 |   });
  103 |   expect(finaleTraits.every((traits) => traits.includes("elite"))).toBe(true);
  104 | });
  105 | 
  106 | test("blocks invalid placement with feedback", async ({ page }) => {
  107 |   await startGame(page);
  108 |   await clickCell(page, 0, 2);
  109 |   await expect(page.getByTestId("message")).toContainText("INVALID PAD");
  110 | });
  111 | 
  112 | test("demolishes/sells a tower and updates currency", async ({ page }) => {
  113 |   await startGame(page);
  114 |   await clickCell(page, 1, 0); // Places punch press: money goes from 86 to 58 (1C 1S 2B)
  115 |   await expect(page.getByTestId("inspect")).toContainText("Stoneguard Post");
  116 |   await page.getByTestId("upgrade-tower").click(); // Upgrades: money goes from 58 to 23 (0C 3S 2B)
  117 |   await expect(page.getByTestId("money")).toContainText("0C 3S 2B");
  118 | 
  119 |   // Refund is Math.floor(63 * 0.7) = 44. Money becomes 23 + 44 = 67 (1C 2S 4B)
  120 |   await page.getByTestId("sell-tower").click();
  121 |   await expect(page.getByTestId("money")).toContainText("1C 2S 4B");
  122 |   await expect(page.getByTestId("inspect")).toContainText("Select a build plot");
  123 | });
  124 | 
  125 | test("toggles speed and pause states", async ({ page }) => {
  126 |   await startGame(page);
  127 |   
  128 |   // Click 2x button
  129 |   await page.getByTestId("speed-2").click();
  130 |   let speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  131 |   expect(speed).toBe(2);
  132 | 
  133 |   // Click Pause button
  134 |   await page.getByTestId("speed-0").click();
  135 |   speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  136 |   expect(speed).toBe(0);
  137 | 
  138 |   // Click 1x button
  139 |   await page.getByTestId("speed-1").click();
  140 |   speed = await page.evaluate(() => window.__game.engine.speedMultiplier);
  141 |   expect(speed).toBe(1);
  142 | });
  143 | 
  144 | test("updates sound channel controls", async ({ page }) => {
  145 |   await startGame(page);
  146 |   await expect(page.getByTestId("volume-master")).toHaveValue("70");
  147 | 
  148 |   await page.getByTestId("volume-master").fill("35");
  149 |   await expect(page.getByTestId("volume-master")).toHaveValue("35");
  150 |   expect(await page.evaluate(() => localStorage.getItem("runehold-volume-master"))).toBe("0.35");
  151 | 
  152 |   await page.getByTestId("sound-toggle").click();
  153 |   await expect(page.getByTestId("sound-toggle")).toContainText("Sound On");
  154 |   expect(await page.evaluate(() => localStorage.getItem("runehold-sound-enabled"))).toBe("true");
  155 | });
  156 | 
```