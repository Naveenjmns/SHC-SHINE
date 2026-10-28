import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "docs/ui-audit");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const exec = path.join(process.cwd(), ".playwright-browsers/chromium-1248/chrome-linux64/chrome");
  const browser = await chromium.launch({
    executablePath: exec,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  const page = await context.newPage();

  console.log("Logging in as Admin...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.fill('input[type="text"], input[type="email"]', "admin@shctpt.edu");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');

  await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 15000 });
  console.log("Logged in. Navigating to /design...");

  await page.goto(`${BASE_URL}/design`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Capture Light Mode (Default)
  const lightPath = path.join(OUTPUT_DIR, "design_system_light_1280px.png");
  await page.screenshot({ path: lightPath, fullPage: true });
  console.log(`Saved Light Mode screenshot: ${lightPath}`);

  // 2. Switch to Dark Mode & Capture
  const darkBtn = page.getByRole("button", { name: "Dark Workspace" });
  if (await darkBtn.count() > 0) {
    await darkBtn.click();
    await page.waitForTimeout(500);
    const darkPath = path.join(OUTPUT_DIR, "design_system_dark_1280px.png");
    await page.screenshot({ path: darkPath, fullPage: true });
    console.log(`Saved Dark Mode screenshot: ${darkPath}`);
  }

  // 3. Switch to Stage Mode & Capture
  const stageBtn = page.getByRole("button", { name: "Stage (16:9)" });
  if (await stageBtn.count() > 0) {
    await stageBtn.click();
    await page.waitForTimeout(500);
    const stagePath = path.join(OUTPUT_DIR, "design_system_stage_1280px.png");
    await page.screenshot({ path: stagePath, fullPage: true });
    console.log(`Saved Stage Mode screenshot: ${stagePath}`);
  }

  // 4. Capture Mobile Viewport 360px in Light Mode
  const lightBtn = page.getByRole("button", { name: "Light (Default)" });
  if (await lightBtn.count() > 0) {
    await lightBtn.click();
    await page.waitForTimeout(300);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(500);
  const mobilePath = path.join(OUTPUT_DIR, "design_system_mobile_360px.png");
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved Mobile 360px screenshot: ${mobilePath}`);

  await browser.close();
  console.log("Phase 1 Design System verification captures complete!");
}

main().catch((err) => {
  console.error("Error in capture-design-system:", err);
  process.exit(1);
});
