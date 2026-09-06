---
name: shine26-ui-design
description: Visual, interaction, and responsive design direction for the SHINE 26 event management platform (Sacred Heart College fest — landing page, registration, student dashboard, coordinator dashboard, admin panel). Use this before writing any UI code, before proposing layouts, and before reviewing any screen for visual quality. Applies to every screen in the app — public landing/registration pages as much as internal dashboards. Trigger this whenever building, redesigning, or reviewing a page, component, or layout for SHINE 26, and whenever responsiveness across mobile/tablet/laptop/monitor/projector is being discussed.
---

# SHINE 26 UI/UX Design

SHINE 26 is a college fest platform built by a student, for a real audience: outside-college visitors deciding whether to register, event coordinators working fast during a live event, an admin needing a full picture at a glance, and — critically — a projector or large screen displaying results/leaderboards in front of a crowd. Every one of these audiences will judge the software in about three seconds. It has to look like it was built by a team, not like a weekend college project running an unstyled template. That is the standard this skill enforces.

This skill governs **how SHINE 26 looks, feels, and holds together across screens**. It does not change the underlying architecture (roles, routes, data model) defined elsewhere — it governs the visual and responsive layer on top of that.

## The trap to avoid

Student fest sites default to a specific look: a dark background with a stock "gaming/neon" gradient, Bootstrap default buttons, a hero image stretched and pixelated, a registration form that is one long unbroken column, and a dashboard that is just an HTML `<table>` with no states. That look reads as unfinished the moment a visitor scrolls. It is also what happens by default when styling is skipped until the end.

Equally, avoid overcorrecting into pure spectacle — heavy animation, oversized hero type, and effects that look great on a laptop at 1440px and completely break at 375px or on a projector. SHINE 26 has two very different jobs depending on the screen: the **public landing/registration flow** needs energy and excitement (it's a fest, not a bank); the **coordinator/admin dashboards** need to be calm, fast, and boring in the best way, because someone is using them standing up during a live event with a queue of students in front of them.

The brief: **festival energy on the public pages, disciplined software on the working pages** — and neither one is allowed to break, overflow, or look different-in-a-bad-way depending on what device opens it.

## Design tokens

Adapt these, don't lock them — but don't drift into unstyled framework defaults either.

**Color**
- Base the public-facing palette on the fest's own branding: a near-black background (`#0B0A0A`–`#141212`, never pure `#000`), warm ember/orange as the hero accent (matching the "SHINE" wordmark energy — a saturated orange-red, e.g. `#E8551F`–`#FF6B1A`), and gold (`#D9A441`-ish) for secondary highlights and borders. Use these with restraint: one hero gradient, one accent color for CTAs and links — not on every card.
- For coordinator/admin/student dashboards, shift to a calmer, working palette: an off-white or very light neutral surface (`#F8FAFC` / `#FFFFFF`), near-black ink text (`#0F172A`), and the same ember/gold used only for primary actions, active states, and status accents. Dashboards should not use the dark fest background — legibility and long-session comfort win over branding there.
- Status colors (registration pending/confirmed/rejected, event live/upcoming/closed) need distinct, slightly desaturated hues that still work as small dots, pills, or left-borders — never rely on color alone (pair with an icon or label).

**Type**
- One display face with real character for the fest name, hero headline, and section titles on public pages — Outfit / display sans with weight and presence.
- One clean, highly legible UI sans for everything else: forms, tables, dashboard body text, labels (Inter).
- A monospace or tabular-numeral face for registration IDs, timestamps, and scores/results — anywhere a number needs to be scanned quickly.
- Use fluid type via `clamp()` for headlines and hero text instead of fixed per-breakpoint font sizes.

**Layout**
- Public landing page: full-bleed hero, generous whitespace, clear visual hierarchy, sponsor/club strip.
- Dashboards: sidebar or calm top nav + content, visual priority treatment (colored left-border on rows, "needs action" grouping).
- Consistent radius, spacing scale, and elevation.

## Responsive strategy — this app must work everywhere

- **Base / small mobile**: 320–480px — single column, stacked nav, full-width CTAs, min 44×44px tap targets.
- **Large mobile**: 481–768px — forms and dashboards single column; landing page two-column feature blocks.
- **Tablet**: 769–1024px — two-column layouts; forms can use two-column field groups.
- **Laptop / small desktop**: 1025–1280px — multi-column dashboards, full hero.
- **Large desktop / monitor**: 1281–1536px+ — deliberate wide layout or centered canvas without dead space.
- **Projector / presentation displays**: dedicated high-contrast, large-type pass readable from the back of an auditorium.
