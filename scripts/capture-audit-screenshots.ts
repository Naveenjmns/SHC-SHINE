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
const OUTPUT_DIR = path.join(process.cwd(), "docs/ui-audit");
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(process.cwd(), ".playwright-browsers");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find a sample event for coordinator
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
      if (fs.existsSync(screenshotPath)) {
        console.log(`  Skipping existing ${filenamePrefix}_${vp.label}.png`);
        continue;
      }
      console.log(`Capturing ${filenamePrefix} at ${vp.label}...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 10000 });
        if (waitForSelector) {
          try {
            await page.waitForSelector(waitForSelector, { timeout: 3000 });
          } catch {}
        }
        await page.waitForTimeout(600);
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
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Fill login form
    await page.fill('input[type="text"], input[type="email"]', email);
    await page.fill('input[type="password"]', pass);
    await page.click('button[type="submit"]');

    // Wait for redirect away from /login
    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 10000 });
    console.log(`Logged in successfully, current URL: ${page.url()}`);

    for (const r of routes) {
      await captureRoute(page, r.url, r.prefix, r.selector);
    }

    await context.close();
  }

  // 1. PUBLIC ROUTES
  console.log("\n=== Capturing Public Routes ===");
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  const publicRoutes = [
    { url: "/", prefix: "public_home" },
    { url: "/events", prefix: "public_events" },
    { url: "/register", prefix: "public_register" },
    { url: "/login", prefix: "public_login" },
    { url: "/leaderboard", prefix: "public_leaderboard" },
    { url: "/badge/SHINE26-DEMO-RAHUL", prefix: "public_badge" },
    { url: "/loc/wp-entrance", prefix: "public_loc" },
    { url: "/maintenance", prefix: "public_maintenance" },
    { url: "/unauthorized", prefix: "public_unauthorized" },
    { url: "/forbidden", prefix: "public_forbidden" },
    { url: "/error-preview", prefix: "public_error_preview" },
    { url: "/non-existent-404", prefix: "public_404" },
  ];

  for (const r of publicRoutes) {
    await captureRoute(publicPage, r.url, r.prefix);
  }
  await publicContext.close();

  // 2. STUDENT ROUTES
  await loginAndCapture(
    "STUDENT",
    "student@example.com",
    "student123",
    [
      { url: "/dashboard", prefix: "student_dashboard" },
      { url: "/profile", prefix: "student_profile" },
    ]
  );

  // 3. COORDINATOR ROUTES
  await loginAndCapture(
    "COORDINATOR",
    "coord.alex@shctpt.edu",
    "coord123",
    [
      { url: "/coordinator", prefix: "coordinator_hub" },
      { url: `/coordinator/${eventId}`, prefix: "coordinator_event" },
    ]
  );

  // 4. FOOD COORDINATOR ROUTES
  await loginAndCapture(
    "FOOD_COORDINATOR",
    "food@shctpt.edu",
    "food123",
    [
      { url: "/food", prefix: "food_scanner" },
    ]
  );

  // 5. ADMIN ROUTES
  await loginAndCapture(
    "ADMIN",
    "admin@shctpt.edu",
    "admin123",
    [
      { url: "/admin", prefix: "admin_overview" },
      { url: "/admin/events", prefix: "admin_events" },
      { url: "/admin/users", prefix: "admin_users" },
      { url: "/admin/reports", prefix: "admin_reports" },
      { url: "/admin/logs", prefix: "admin_logs" },
    ]
  );

  await browser.close();
  console.log("\n All screenshots captured successfully in docs/ui-audit/");
}

main()
  .catch((err) => {
    console.error("Fatal error running screenshot script:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
