import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const VIEWPORTS = [
  { width: 360, height: 800, label: "360px" },
  { width: 768, height: 1024, label: "768px" },
  { width: 1280, height: 800, label: "1280px" },
  { width: 1920, height: 1080, label: "1920px" },
];

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "docs/redesign-v2");

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

  async function captureRoute(page: any, url: string, prefix: string) {
    for (const vp of VIEWPORTS) {
      const screenshotPath = path.join(OUTPUT_DIR, `${prefix}_${vp.label}.png`);
      console.log(`Capturing ${prefix} at ${vp.label}...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  -> Saved ${screenshotPath}`);
      } catch (err: any) {
        console.error(`  x Failed capturing ${prefix} at ${vp.label}:`, err.message);
      }
    }
  }

  // 1. PUBLIC ROUTES: Leaderboard and Badge Pass
  console.log("\n=== Capturing Phase 4 Public Routes ===");
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  await captureRoute(publicPage, "/leaderboard", "v2_leaderboard");
  await captureRoute(publicPage, "/badge/SHINE26-DEMO-RAHUL", "v2_badge");
  await publicContext.close();

  // 2. ADMIN ROUTES: Admin Events & Admin Users
  console.log("\n=== Capturing Phase 4 Admin Routes ===");
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.setViewportSize({ width: 1280, height: 800 });
  await adminPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await adminPage.fill('input[type="text"], input[type="email"]', "admin@shctpt.edu");
  await adminPage.fill('input[type="password"]', "admin123");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL((u) => !u.pathname.includes("/login"));

  await captureRoute(adminPage, "/admin/events", "v2_admin_events");
  await captureRoute(adminPage, "/admin/users", "v2_admin_users");
  await adminContext.close();

  // 3. STUDENT PROFILE ROUTE
  console.log("\n=== Capturing Phase 4 Profile Route ===");
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.setViewportSize({ width: 1280, height: 800 });
  await studentPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await studentPage.fill('input[type="text"], input[type="email"]', "student@example.com");
  await studentPage.fill('input[type="password"]', "student123");
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((u) => !u.pathname.includes("/login"));

  await captureRoute(studentPage, "/profile", "v2_profile");
  await studentContext.close();

  await browser.close();
  console.log("\nAll Phase 4 screenshots successfully captured in docs/redesign-v2/!");
}

main().catch(console.error);

