import { chromium } from "playwright";
import path from "path";
const B = "http://localhost:3000", S = process.argv[2];
const runs: [string, string, string?, string?][] = JSON.parse(process.argv[3]);
(async () => {
  const b = await chromium.launch({ executablePath: path.join(process.cwd(), ".playwright-browsers/chromium-1248/chrome-linux64/chrome"), headless: true, args: ["--no-sandbox","--disable-gpu"] });
  const ctxs: Record<string, any> = {};
  const login = async (email?: string, pass?: string) => {
    const key = email || "public"; if (ctxs[key]) return ctxs[key];
    const ctx = await b.newContext(); await ctx.addInitScript("window.__name = (f) => f");
    const p = await ctx.newPage();
    if (email) {
      await p.goto(B + "/login", { waitUntil: "networkidle" });
      await p.locator('input[type="email"], input[type="text"]').first().fill(email);
      await p.fill("#login-password", pass!); await p.click('button[type="submit"]');
      await p.waitForLoadState("networkidle"); await p.waitForTimeout(1500);
    }
    return (ctxs[key] = p);
  };
  const creds: Record<string, [string, string]> = { admin: ["admin@shctpt.edu","admin123"], student: ["student@example.com","student123"], coord: ["coord.alex@shctpt.edu","coord123"], food: ["food@shctpt.edu","food123"] };
  for (const [name, url, role, tab] of runs) {
    const p = await login(...(role ? creds[role] : []) as [string?, string?]);
    for (const [w, h, full] of [[390, 844, true], [1280, 800, false]] as const) {
      await p.setViewportSize({ width: w, height: h });
      await p.goto(B + url, { waitUntil: "networkidle" });
      if (tab) { await p.getByRole("button", { name: new RegExp("^\\s*" + tab) }).first().click().catch(() => {}); await p.waitForLoadState("networkidle"); }
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${S}/${name}-${w}.png`, fullPage: full });
    }
  }
  await b.close();
})();
