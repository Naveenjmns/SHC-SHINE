# SHINE — Multi-Edition Event Management & Academic Dossier Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-blueviolet)](https://turbo.build/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791?logo=postgresql)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **Flagship Intercollegiate Event Platform & Academic Reporting System**  
> A modern, multi-edition symposium and event management platform with real-time analytics, RBAC, and NAAC/IQAC accreditation reporting.

---

## 🌟 Highlights & Key Features

- 🎨 **Dynamic Institution Branding & Theme Engine**: Native color picker and 8 curated one-click presets allowing any institution to white-label primary, secondary, and background colors with zero layout flash.
- 🗺️ **Interactive Indoor Venue Floor Plan & Navigation (2D + 3D)**: High-performance blueprint modal with pan, pinch/wheel zoom, reset, pulsing assigned room spotlight in SHINE Orange (`#FF6B1A`), amenity markers (restrooms, water, food, helpdesk), and instant 2D/3D mode toggling.
- 🧊 **Volumetric 3D Venue Simulation (Three.js + R3F)**: Browser-rendered 3D extrusion of campus SVG layouts with OrbitControls, glowing `TubeGeometry` route line along `CatmullRomCurve3`, animated walker beacon, floating HTML room badges, and multi-floor level switcher.
- 🧭 **A* Shortest-Path Wayfinding Engine**: Graph routing algorithm (`lib/wayfinding.ts`) calculating Euclidean edge distances, vertical floor/stair transitions, and generating real-time turn-by-turn navigation steps.
- 📍 **Physical QR-Checkpoint Location System (`/loc/[waypointId]`)**: Campus-wide scannable checkpoint posters that orient visitors instantly with "You Are Here" beacon markers and one-click navigation to their events.
- 🔒 **Zero-Telemetry Privacy Architecture**: Checkpoint locations and opt-in outdoor proximity geolocation are kept strictly client-side (`localStorage`) with zero location telemetry written to the database.
- ⏰ **Automated 10-Minute Event Start Reminder Engine**: Autonomous 60-second in-process background worker (`instrumentation.ts` & `reminderScheduler.ts`) and cron API (`/api/cron/reminders`) that detects upcoming competitions and emails registered delegates their arena venue, designated zone badge, turn-by-turn map link, scheduled time, digital badge pass, and coordinator hotline numbers 10 minutes prior to start.
- 📬 **Student Portal Auto-Provisioning & Credential Dispatch**: When a contingent registers, student accounts (`role: STUDENT`) are automatically provisioned with password set to their mobile number, and an automated email is dispatched with direct portal link (`/login?email=...`), User ID, default password, venue zone label, map link, and digital pass.
- ⚡ **Preliminary Rounds Management & Rules Engine**: First-class prelims support (`hasPrelims`, `prelimsDateTime`, `prelimsVenue`, `prelimsRules`). Card previews on Home (`/`) and Events (`/events`) display dedicated prelims rules boxes, registration enforces mandatory prelims attendee nomination (max 1 per college), and coordinators manage prelims scoring with 1-click progression to Finals.
- 👤 **Unified User Profile & Security Center (`/profile`)**: Role-aware profile portal for `ADMIN`, `COORDINATOR`, `FOOD_COORDINATOR`, and `STUDENT` featuring live participation telemetry, contact editing with live validation, meal preference toggle (`VEG`/`NON_VEG`), and secure self-service password changes.
- 🍱 **Dedicated Food Coordinator Portal (`/food`)**: Fast-lane dining hall scanning hub with device camera QR scanner, flashlight toggle, lens switcher, and manual token lookup for instant meal voucher claiming and live Veg / Non-Veg metrics.
- 🛡️ **Universal Field Validation Suite**: Standardized validation (`validators.ts`) enforcing RFC-compliant email formats and 10–15 digit mobile numbers with E.164 support across registration, profile, and administrative forms.
- 📑 **Consolidated Academic Dossier & NAAC / IQAC Suite (`/admin/reports`)**: Complete institutional report with KPI metrics, event catalogs, print-friendly **Venue Floor Plan & Zones Directory** (Section 2B), college tallies, master student rosters, prelims progression, podium winners, championship leaderboard, and 4 formal academic signature blocks.
- 🖨️ **Magazine-Grade PDF & Print Engine**: Paged-media print styling (`@page`), zero horizontal overflow, `table-layout: fixed`, `break-inside: avoid` preventing row slicing across pages, repeating table headers, and a **Portrait / Landscape print toggle**.
- 🚶 **Locomotive-Inspired 3D Perspective Error Suite**: Canvas-driven 3D perspective floor grid with interactive walking delegates, directional contact shadows, click-to-walk interaction, and pure midnight dark aesthetic across 404, 500, 403, 401, 503, and `/error-preview`.
- 🔐 **Enhanced Login & Authentication**: Modern interface with password visibility toggle, pre-filled email from URL query params, role-based middleware protection, and 1-click demo fill buttons.
- 🏆 **Automated Championship Calculation**: Points tallying (10 pts for 1st, 7 pts for 2nd, 5 pts for 3rd) and tiebreaker logic for the Overall Fest Trophy.

---

## 📚 Documentation & Manual

For an in-depth, step-by-step operations manual for all user roles, consult:
👉 **[USER_MANUAL.md](./USER_MANUAL.md)** — *Complete operations guide, administrator walkthrough, academic dossier manual, food coordinator guide, and coordinator handbook.*

---

## 👥 Roles & Access Control

| Role | Access Scope | Target Dashboard | Key Capabilities |
|---|---|---|---|
| **Public Visitor** | Public routes | `/`, `/events`, `/register` | Discover competitions, browse prelims rules, contingent registration. |
| **Student / Delegate** | Authenticated participant | `/dashboard`, `/profile` | Gate pass badge, check-in status, food tokens, registered events, prelims status, results, profile & password management. |
| **Event Coordinator** | Scoped event staff | `/coordinator`, `/coordinator/[eventId]`, `/profile` | Check-in attendees, grade prelims, advance finalists, publish podium standings, export event CSV, update coordinator profile. |
| **Food Coordinator** | Scoped hospitality staff | `/food`, `/profile` | Real-time QR badge & meal token scanning, Veg / Non-Veg distribution, offline/manual token verification. |
| **Administrator** | Master control root | `/admin`, `/admin/*`, `/profile` | Event CRUD, user provisioning & role/assignment editing, branding customizer, SMTP broadcasts, academic reports, reminder engine. |

---

## 🔑 Demo & Testing Credentials

| Role | Email | Password | Target Portal |
|---|---|---|---|
| **Admin** | `admin@shctpt.edu` | `admin123` | `/admin` |
| **Coordinator (Tech Lead)** | `coord.alex@shctpt.edu` | `coord123` | `/coordinator` |
| **Coordinator (Event Lead)** | `coord.priya@shctpt.edu` | `coord123` | `/coordinator` |
| **Food Coordinator** | `food@shctpt.edu` | `food123` | `/food` |
| **Student (Registered)** | `student@example.com` | `student123` | `/dashboard` |

> *Tip: The `/login` page includes 1-click **Quick-Fill Demo Credentials** buttons. You can also re-seed all demo accounts via `npx tsx scripts/create-demo-credentials.ts`.*

---

## 🌐 Routes Directory

### Public Pages
- `/` — Landing page with countdown hero, fest categories, prelims highlights, schedule, campus venue, and contacts.
- `/events` — Searchable and filterable directory of on-stage and off-stage competitions with prelims details.
- `/register` — Multi-event and contingent team registration form with mandatory prelims nominee validation and live fee calculator.
- `/login` — NextAuth credentials sign-in supporting `?email=` pre-fill and password toggle.
- `/leaderboard` — Live public championship trophy standings.
- `/badge/[badgeCode]` — High-resolution digital gate pass and scannable QR badge.
- `/loc/[waypointId]` — **QR Checkpoint Navigator**: Scannable physical checkpoint beacon activating live "You Are Here" position, destination hall guide, turn-by-turn routing, and zero-telemetry client storage.

### Protected Dashboards & Profile
- `/dashboard` — **Student Portal**: Real-time registration approval status, gate pass, food token, prelims updates, competition results, and "View on Map" venue navigation.
- `/profile` — **User Profile & Security**: Unified account center for all roles with role-specific stats, contact update, and password reset.
- `/coordinator` — **Coordinator Console**: Scoped list of assigned competitions with participant metrics.
- `/coordinator/[eventId]` — **Event Control Room**: On-site attendee check-in, prelims scoring, mains progression, and podium publishing.
- `/food` — **Food Coordinator Portal**: Dining hall QR scanner, meal redemption, and live token analytics.
- `/admin` — **Admin Master Console**: Financial analytics, institution settings, edition manager, theme customizer, SMTP broadcasts, SVG floor plan upload, and waypoint graph editor.
- `/admin/reports` — **Consolidated Academic Dossier**: Printable NAAC/IQAC report with Section 2B Venue Floor Plan & Zones Directory, Portrait/Landscape toggles, and individual CSV downloads.
- `/admin/events` — **Events CRUD**: Create and manage competitions, venues, prelims rules, assign faculty/student coordinators, and select Floor Plan Map Zones.
- `/admin/users` — **User Management**: Provision and edit administrator, coordinator, and food coordinator accounts.
- `/admin/logs` — **Activity Audit**: Tamper-evident administrative action log.

### Interactive Diagnostics
- `/error-preview` — Interactive showcase dock displaying all 3D perspective error scenes.
- `/forbidden` — 403 Access Clearance boundary.
- `/unauthorized` — 401 Session expired redirect.
- `/maintenance` — 503 Stage maintenance blackout screen.

---

## 🧭 Indoor Wayfinding & Floor Plan Architecture

The platform features an autonomous, multi-modal Indoor Wayfinding & Venue Floor Plan system:

```
                  ┌────────────────────────────────────────┐
                  │        Uploaded SVG Floor Plan         │
                  │   (/public/uploads/campus-floorplan)   │
                  └──────────────────┬─────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
     ┌───────────────────────┐               ┌───────────────────────┐
     │   2D Blueprint Modal  │               │   3D R3F Simulation   │
     │ - Pinch / Wheel Zoom  │               │ - SVGLoader Extrusion │
     │ - Pulsing Active Room │               │ - Orbit Controls      │
     │ - Amenity Legend      │               │ - Glowing Route Tube  │
     │ - Animated Route Line │               │ - Walker Mesh Beacon  │
     └───────────┬───────────┘               └───────────┬───────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      A* Shortest-Path Engine        │
                  │      (src/lib/wayfinding.ts)        │
                  │ - Euclidean Distance Weights        │
                  │ - Staircase Floor Transitions       │
                  │ - Turn-by-Turn Guidance Drawer      │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
     ┌───────────────────────┐               ┌───────────────────────┐
     │ Physical QR Checkpoint│               │   Zero-Telemetry      │
     │      (/loc/[id])      │               │  Client-Side Privacy  │
     │ - "You Are Here" Pin  │               │ - LocalStorage only   │
     │ - Printable Posters   │               │ - No DB Geo-Tracking  │
     └───────────────────────┘               └───────────────────────┘
```

### Wayfinding API Reference

| Endpoint | Method | Auth Scope | Description |
|---|---|---|---|
| `/api/admin/upload` | `POST` | `ADMIN` | Uploads `.svg` floor plan (max 2MB), sanitizes scripts & external vectors, saves to `/public/uploads`, and returns detected zones. |
| `/api/admin/floorplan/zones` | `GET` | `ADMIN` | Extracts active SVG shapes with IDs (excluding `wp-*`), formatted labels, and categories (`hall`, `amenity`, `room`). |
| `/api/admin/floorplan/graph` | `GET` | `ADMIN` | Returns active waypoint graph (`nodes` + `edges`) from `EventEdition.waypointGraph`. |
| `/api/admin/floorplan/graph` | `POST` | `ADMIN` | Updates waypoint nodes and edges with auto-calculated Euclidean distances. |
| `/api/admin/floorplan/graph/validate` | `POST` | `ADMIN` | BFS graph traversal validating room door connections and reporting unreachable zones. |
| `/api/wayfinding/route` | `GET` | Public | Computes A* shortest path from a checkpoint waypoint (`fromId`) to an arena zone (`toZoneId`). |
| `/loc/[waypointId]` | `GET` | Public | Physical checkpoint location screen orienting delegates and opening live navigation. |

For SVG authoring rules, layer hierarchy, and ID naming conventions, consult **[docs/FLOORPLAN_GUIDE.md](./docs/FLOORPLAN_GUIDE.md)**.

---

## ⚙️ Local Development Setup

### 1. Environment Variables (`.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shine26?schema=public"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration & Seed
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed Admin, Coordinators, Food Coordinator, Sample Students, and Competitions
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Validation
```bash
npm run build
npm run start
```

### 6. Run Unit & Wayfinding Test Suite
```bash
# Run all unit tests (A* wayfinding, SVG sanitizer, zone validation)
npx tsx --test src/lib/__tests__/*.test.ts
```

---

## 📡 API Reference

### Public & Registration
- `GET /api/edition/active` — Active edition metadata & branding theme colors
- `GET /api/events` — Public competitions directory with prelims details
- `POST /api/register` — Contingent team registration with automatic student account & credential dispatch
- `GET /api/leaderboard` — Live championship trophy rankings

### User & Profile
- `GET /api/profile` — Authenticated user profile and role-tailored metrics
- `PATCH /api/profile` — Update user profile details, meal preferences, and password

### Student & Check-in
- `GET /api/student/registrations` — Authenticated student registration records
- `GET /api/badge/[badgeCode]` — QR validation endpoint for gate security
- `POST /api/checkin` — Mark delegate attendance
- `POST /api/food/claim` — Redeem student food token

### Automated Reminders & Cron
- `GET /api/cron/reminders` — Trigger 10-minute competition start scan (supports `?dryRun=true` and `?forceEventId=...`)
- `POST /api/cron/reminders` — Webhook/scheduler trigger for upcoming event reminder dispatch

### Coordinator Endpoints
- `GET /api/coordinator/events` — Assigned competitions for authenticated coordinator
- `GET /api/coordinator/events/[id]/registrations` — Scoped participant roster
- `PATCH /api/coordinator/registrations/[id]` — Update attendance, prelims status, and final score

### Administrator Endpoints
- `GET /api/admin/stats` — Financial summary, delegate metrics, and event breakdown
- `GET /api/admin/reports` — Consolidated academic dossier data compiler
- `GET /api/admin/registrations` — All fest registrations with status override
- `GET /api/admin/edition` & `PUT /api/admin/edition` — Edition settings & institution theme configuration
- `POST /api/admin/smtp/test` — Verify mail server connection
- `POST /api/admin/email/broadcast` — Dispatch announcements to delegates
- `GET /api/admin/logs` — Security and activity audit log
- `GET /api/admin/users` & `POST /api/admin/users` — Provision user accounts
- `PATCH /api/admin/users/[id]` — Edit user details, reset password, or change coordinator event assignments

---

## 📜 Academic Certification Standard

The platform complies with standard institutional documentation guidelines for:
- **NAAC Criterion V**: Student Support and Progression (Competitions, Cultural & Academic Activities).
- **IQAC Annual Fest Audits**: Official validated participant and winner records with staff signatures.
- **Department Annual Reviews**: Formal student participation tallies and revenue reconciliation.

---

## 👨‍💻 Developers Contact

- **Sakthi K**: [sakthikaribeeran@gmail.com](mailto:sakthikaribeeran@gmail.com)
- **Naveen Kumar J**: [naveenkumarjmns@gmail.com](mailto:naveenkumarjmns@gmail.com)

