import { chromium } from "playwright";
import prisma from "../src/lib/prisma";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { width: 360, height: 800, label: "360px" },
  { width: 768, height: 1024, label: "768px" },
  { width: 1280, height: 800, label: "1280px" },
  { width: 1920, height: 1080, label: "1920px" },
];

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "docs/redesign-v2");
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(process.cwd(), ".playwright-browsers");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sampleEvent = await prisma.event.findFirst({
    orderBy: { dateTime: "asc" },
  });
  const eventId = sampleEvent?.id || "sample-event-id";
  console.log(`Using sample event ID: ${eventId} (${sampleEvent?.name})`);

  const exec = path.join(process.cwd(), ".playwright-browsers/chromium-1248/chrome-linux64/chrome");
  const browser = await chromium.launch({
    executablePath: exec,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  async function captureRoute(
    page: any,
    url: string,
    filenamePrefix: string,
    waitForSelector?: string
  ) {
    for (const vp of VIEWPORTS) {
      const screenshotPath = path.join(OUTPUT_DIR, `${filenamePrefix}_${vp.label}.png`);
      console.log(`Capturing ${filenamePrefix} at ${vp.label}...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        if (waitForSelector) {
          try {
            await page.waitForSelector(waitForSelector, { timeout: 3000 });
          } catch {}
        }
        await page.waitForTimeout(800);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  -> Saved ${screenshotPath}`);
      } catch (err: any) {
        console.error(`  x Failed capturing ${filenamePrefix} at ${vp.label}:`, err.message);
      }
    }
  }

  async function loginAndCapture(
    roleName: string,
    email: string,
    pass: string,
    routes: { url: string; prefix: string; selector?: string }[]
  ) {
    console.log(`\n=== Logging in as ${roleName} (${email}) ===`);
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });

    await page.fill('input[type="text"], input[type="email"]', email);
    await page.fill('input[type="password"]', pass);
    await page.click('button[type="submit"]');

    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 15000 });
    console.log(`Logged in successfully as ${roleName}, current URL: ${page.url()}`);

    for (const r of routes) {
      await captureRoute(page, r.url, r.prefix, r.selector);
    }

    await context.close();
  }

  // 1. PUBLIC ROUTES
  console.log("\n=== Capturing Redesigned Public Routes ===");
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  const publicRoutes = [
    { url: "/", prefix: "v2_home" },
    { url: "/events", prefix: "v2_events" },
    { url: "/register", prefix: "v2_register" },
    { url: "/design", prefix: "v2_design" },
  ];

  for (const r of publicRoutes) {
    await captureRoute(publicPage, r.url, r.prefix);
  }
  await publicContext.close();

  // 2. STUDENT ROUTE
  await loginAndCapture(
    "STUDENT",
    "student@example.com",
    "student123",
    [{ url: "/dashboard", prefix: "v2_student_dashboard" }]
  );

  // 3. COORDINATOR ROUTE
  await loginAndCapture(
    "COORDINATOR",
    "coord.alex@shctpt.edu",
    "coord123",
    [{ url: `/coordinator/${eventId}`, prefix: "v2_coordinator_desk" }]
  );

  // 4. FOOD COORDINATOR ROUTE
  await loginAndCapture(
    "FOOD_COORDINATOR",
    "food@shctpt.edu",
    "food123",
    [{ url: "/food", prefix: "v2_food_hub" }]
  );

  // 5. ADMIN ROUTE
  await loginAndCapture(
    "ADMIN",
    "admin@shctpt.edu",
    "admin123",
    [{ url: "/admin", prefix: "v2_admin_console" }]
  );

  await browser.close();
  console.log("\nAll redesigned screen captures completed! Output directory: docs/redesign-v2/");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

