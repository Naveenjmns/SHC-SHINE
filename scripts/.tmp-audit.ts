import { chromium, Page } from "playwright";
import path from "path";
import fs from "fs";
const B = "http://localhost:3000";
const OUT = process.argv[2];
const WIDTHS = [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920];
const EVENT = "cmv2gd2jh000i0ggzjwnn8xmc";
type Target = { name: string; url: string; tab?: string };
const SESSIONS: { role: string; email?: string; pass?: string; targets: Target[] }[] = [
  { role: "public", targets: [
    { name: "home", url: "/" }, { name: "events", url: "/events" }, { name: "leaderboard", url: "/leaderboard" },
    { name: "login", url: "/login" }, { name: "register", url: "/register" }, { name: "badge", url: "/badge/SHN26-DEL-WJ7UY8" },
    { name: "404", url: "/does-not-exist" }, { name: "maintenance", url: "/maintenance" },
  ]},
  { role: "admin", email: "admin@shctpt.edu", pass: "admin123", targets: [
    ...["Overview","Registrations","Editions","Institution","Branding","Floor Plan","Mail & Alerts","Reports"].map(t => ({ name: "admin-" + t.replace(/\W+/g, "").toLowerCase(), url: "/admin", tab: t })),
    { name: "admin-events", url: "/admin/events" }, { name: "admin-users", url: "/admin/users" },
    { name: "admin-logs", url: "/admin/logs" }, { name: "admin-reports", url: "/admin/reports" },
  ]},
  { role: "coord", email: "coord.alex@shctpt.edu", pass: "coord123", targets: [
    { name: "coordinator", url: "/coordinator" }, { name: "coordinator-event", url: `/coordinator/${EVENT}` },
  ]},
  { role: "food", email: "food@shctpt.edu", pass: "food123", targets: [{ name: "food", url: "/food" }] },
  { role: "student", email: "student@example.com", pass: "student123", targets: [
    { name: "dashboard", url: "/dashboard" }, { name: "profile", url: "/profile" },
  ]},
];

async function measure(p: Page, w: number) {
  return p.evaluate((w) => {
    const vw = window.innerWidth;
    const overflow = document.documentElement.scrollWidth - vw;
    const desc = (el: Element) => {
      const c = (el.getAttribute("class") || "").split(/\s+/).slice(0, 6).join(".");
      const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${c ? "." + c : ""} "${t}"`;
    };
    const inScroller = (el: Element) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true;
      }
      return false;
    };
    const visible = (el: Element) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      if (offenders.length >= 6) break;
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !inScroller(el) && getComputedStyle(el).position !== "fixed") {
        // report the outermost offender only
        const parent = el.parentElement;
        if (parent) { const pr = parent.getBoundingClientRect(); if (pr.right > vw + 1 && !inScroller(parent)) continue; }
        offenders.push(desc(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
    }
    const small: string[] = [];
    let smallCount = 0;
    if (w <= 768) {
      for (const el of Array.from(document.querySelectorAll("a, button, input:not([type=hidden]), select, [role=tab], [role=button]"))) {
        if (!visible(el)) continue;
        if (el.closest("p, li > span, td > a")) continue; // inline text links
        const r = el.getBoundingClientRect();
        if (r.height < 36 || r.width < 36) { smallCount++; if (small.length < 5) small.push(desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); }
      }
    }
    // clipped text: single-line elements whose content is cut without ellipsis
    return { overflow, offenders, smallCount, small };
  }, w);
}

(async () => {
  const exec = path.join(process.cwd(), ".playwright-browsers/chromium-1248/chrome-linux64/chrome");
  const b = await chromium.launch({ executablePath: exec, headless: true, args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"] });
  const results: any[] = [];
  for (const s of SESSIONS) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    if (s.email) {
      await p.goto(B + "/login", { waitUntil: "networkidle" });
      await p.locator('input[type="email"], input[type="text"]').first().fill(s.email);
      await p.fill("#login-password", s.pass!);
      await p.click('button[type="submit"]');
      await p.waitForLoadState("networkidle"); await p.waitForTimeout(1500);
    }
    for (const t of s.targets) {
      for (const w of WIDTHS) {
        try {
          await p.setViewportSize({ width: w, height: w <= 414 ? 800 : 900 });
          await p.goto(B + t.url, { waitUntil: "networkidle", timeout: 60000 });
          if (t.tab) {
            const tab = p.getByRole("button", { name: new RegExp("^\\s*" + t.tab.replace(/[&]/g, "\\&")) }).first();
            if (await tab.count()) { await tab.click().catch(() => {}); }
            else { await p.getByText(t.tab, { exact: true }).first().click().catch(() => {}); }
            await p.waitForLoadState("networkidle");
          }
          await p.waitForTimeout(600);
          const m = await measure(p, w);
          results.push({ page: t.name, w, ...m });
          if (w === 360) await p.screenshot({ path: `${OUT}/${t.name}-360.png`, fullPage: true });
          if (w === 1280) await p.screenshot({ path: `${OUT}/${t.name}-1280.png`, fullPage: false });
        } catch (e: any) { results.push({ page: t.name, w, error: e.message.slice(0, 100) }); }
      }
      process.stdout.write(t.name + " ");
    }
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
  await b.close();
  console.log("\nDONE");
})();
