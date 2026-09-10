# SHINE — Multi-Edition Event Management & Academic Dossier Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-blueviolet)](https://turbo.build/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **Flagship Intercollegiate Event Platform & Academic Reporting System**  
> Developed for the **Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur**.

---

## 🌟 Highlights & Key Features

- 🎨 **Dynamic Institution Branding & Theme Engine**: Native color picker and 8 curated one-click presets allowing any institution to white-label primary, secondary, and background colors with zero layout flash.
- 📑 **Consolidated Academic Dossier & NAAC / IQAC Suite (`/admin/reports`)**: Complete 8-section institutional report with KPI metrics, event catalogs, college tallies, master student rosters, prelims progression, podium winners, championship leaderboard, and 4 formal academic signature blocks.
- 🖨️ **Magazine-Grade PDF & Print Engine**: Paged-media print styling (`@page`), zero horizontal overflow, `table-layout: fixed`, `break-inside: avoid` preventing row slicing across pages, repeating table headers, and a **Portrait / Landscape print toggle**.
- 🚶 **Locomotive-Inspired 3D Perspective Error Suite**: Canvas-driven 3D perspective floor grid with interactive walking delegates, directional contact shadows, click-to-walk interaction, and pure midnight dark aesthetic across 404, 500, 403, 401, 503, and `/error-preview`.
- 🔐 **Enhanced Login & Authentication**: Premium glassmorphic interface, interactive password show/hide toggle, role-based protection, and 1-click demo fill buttons.
- ⚡ **High-Performance Architecture**: Parallelized Prisma database queries with `Promise.all`, deterministic date formatters eliminating hydration mismatches, and optimized payload delivery.
- 🏆 **Automated Championship Calculation**: Points tallying (10 pts for 1st, 7 pts for 2nd, 5 pts for 3rd) and tiebreaker logic for the Overall Fest Trophy.

---

## 📚 Documentation & Manual

For an in-depth, step-by-step operations manual for all user roles, consult:
👉 **[USER_MANUAL.md](./USER_MANUAL.md)** — *Complete operations guide, administrator walkthrough, academic dossier manual, and coordinator handbook.*

---

## 👥 Roles & Access Control

| Role | Access Scope | Target Dashboard | Key Capabilities |
|---|---|---|---|
| **Public Visitor** | Public routes | `/`, `/events`, `/register` | Discover competitions, browse rules, contingent registration. |
| **Student / Delegate** | Authenticated participant | `/dashboard` | View gate pass badge, check-in status, food tokens, registered events, published scores. |
| **Event Coordinator** | Scoped event staff | `/coordinator`, `/coordinator/[eventId]` | Check-in attendees, grade prelims, advance finalists, publish podium standings, export event CSV. |
| **Administrator** | Master control root | `/admin`, `/admin/*` | Complete event CRUD, user management, theme customizer, SMTP broadcasts, academic reports. |

---

## 🔑 Demo & Testing Credentials

| Role | Email | Password | Target Portal |
|---|---|---|---|
| **Admin** | `admin@shctpt.edu` | `admin123` | `/admin` |
| **Coordinator (Tech Lead)** | `coord.alex@shctpt.edu` | `coord123` | `/coordinator` |
| **Coordinator (Event Lead)** | `coord.priya@shctpt.edu` | `coord123` | `/coordinator` |
| **Student (Registered)** | `student@example.com` | `student123` | `/dashboard` |

> *Tip: The `/login` page includes 1-click **Quick-Fill Demo Credentials** buttons.*

---

## 🌐 Routes Directory

### Public Pages
- `/` — Landing page with countdown hero, fest categories, schedule, campus venue, and contacts.
- `/events` — Searchable and filterable directory of on-stage and off-stage competitions.
- `/register` — Multi-event and contingent team registration form with live fee calculator.
- `/login` — NextAuth credentials sign-in with interactive password visibility toggle.
- `/leaderboard` — Live public championship trophy standings.
- `/badge/[badgeCode]` — High-resolution digital gate pass and scannable QR badge.

### Protected Dashboards
- `/dashboard` — **Student Portal**: Real-time registration approval status, gate pass, food token, and competition results.
- `/coordinator` — **Coordinator Console**: Scoped list of assigned competitions with participant metrics.
- `/coordinator/[eventId]` — **Event Control Room**: On-site attendee check-in, prelims scoring, mains progression, and podium publishing.
- `/admin` — **Admin Master Console**: Financial analytics, institution settings, edition manager, theme customizer, SMTP broadcasts, and registrations audit.
- `/admin/reports` — **Consolidated Academic Dossier**: Printable NAAC/IQAC report with Portrait/Landscape toggles and individual CSV downloads.
- `/admin/events` — **Events CRUD**: Create and manage competitions, venues, and assign faculty/student coordinators.
- `/admin/users` — **User Management**: Provision administrator and coordinator accounts.
- `/admin/logs` — **Activity Audit**: Tamper-evident administrative action log.

### Interactive Diagnostics
- `/error-preview` — Interactive showcase dock displaying all 3D perspective error scenes.
- `/forbidden` — 403 Access Clearance boundary.
- `/unauthorized` — 401 Session expired redirect.
- `/maintenance` — 503 Stage maintenance blackout screen.

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

# Seed Admin, Coordinators, Sample Students, Competitions, and Sample Registrations
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

---

## 📡 API Reference

### Public & Registration
- `GET /api/edition/active` — Active edition metadata & branding theme colors
- `GET /api/events` — Public competitions directory
- `POST /api/register` — Contingent team and delegate registration
- `GET /api/leaderboard` — Live championship trophy rankings

### Student & Check-in
- `GET /api/student/registrations` — Authenticated student registration records
- `GET /api/badge/[badgeCode]` — QR validation endpoint for gate security
- `POST /api/checkin` — Mark delegate attendance

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
- `GET /api/admin/users` & `POST /api/admin/users` — User account management

---

## 📜 Academic Certification Standard

The platform complies with standard institutional documentation guidelines for:
- **NAAC Criterion V**: Student Support and Progression (Competitions, Cultural & Academic Activities).
- **IQAC Annual Fest Audits**: Official validated participant and winner records with staff signatures.
- **Department Annual Reviews**: Formal student participation tallies and revenue reconciliation.

---

*Engineered with precision for Sacred Heart College (Autonomous), Tirupattur.*
