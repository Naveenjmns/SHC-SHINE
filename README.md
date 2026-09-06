# SHINE 26 — Event Management Platform

> Flagship intercollegiate fest hosted by the **Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur**.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- **Database**: PostgreSQL
- **ORM**: [Prisma v6](https://www.prisma.io)
- **Auth**: [NextAuth.js](https://next-auth.js.org) with credentials provider & role-based sessions
- **Styling**: Tailwind CSS with custom glassmorphism design tokens
- **Fonts**: Outfit (display) & Inter (body)

---

## 👥 Roles & Access Control

1. **Public Visitor**: Browse fest details, search competitions, and register for events.
2. **Student**: Logged-in participant viewing their registered events, approval status, and published results.
3. **Event Coordinator**: Scoped portal to manage registrations, verify attendees, and submit competition results for assigned events.
4. **Admin**: Master console with fest statistics, revenue breakdown, full event CRUD, and coordinator/admin account management.

---

## 🔑 Demo & Test Credentials

| Role | Email | Password | Target Portal |
|---|---|---|---|
| **Admin** | `admin@shctpt.edu` | `admin123` | `/admin` |
| **Coordinator (Tech Lead)** | `coord.alex@shctpt.edu` | `coord123` | `/coordinator` |
| **Coordinator (Event Lead)** | `coord.priya@shctpt.edu` | `coord123` | `/coordinator` |
| **Student (Registered)** | `student@example.com` | `student123` | `/dashboard` |

> *Tip: The `/login` page includes 1-click **Quick-Fill Demo Credentials** buttons.*

---

## 🌐 Routes Overview

### Public Routes
- `/` — Landing page with Hero, About, Categories, Venue, Schedule, and Contacts.
- `/events` — Searchable and filterable directory of all on-stage and off-stage events.
- `/register` — Registration form for students (supports outside-college participants, multi-event selection, and fee calculations).
- `/login` — NextAuth credentials sign-in for students, coordinators, and administrators.

### Protected Dashboards (Middleware Enforced)
- `/dashboard` — **Student Portal**: Live registration status (`PENDING`, `CONFIRMED`, `REJECTED`) and published competition rankings.
- `/coordinator` — **Coordinator Console**: Overview of assigned events with participant counts.
- `/coordinator/[eventId]` — **Event Participant Manager**: Scoped attendee table with status toggles (`Confirm`/`Reject`), result input, and CSV export.
- `/admin` — **Admin Master Control**: Real-time stats (registrations, confirmed revenue, per-event breakdown) and instant status overrides.
- `/admin/events` — **Event CRUD**: Create, edit, delete competitions and assign faculty coordinators.
- `/admin/users` — **User Management**: Create and manage coordinator and administrator accounts.

---

## ⚙️ Local Development Setup

### 1. Environment Variables (`.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/shine26?schema=public"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
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

# Seed Admin, Coordinators, Sample Student, 10 Events, and Sample Registrations
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📡 API Reference

- `GET /api/events` — Fetch list of all public events
- `POST /api/events` — Create new event (*Admin only*)
- `GET/PUT/DELETE /api/events/[id]` — Event CRUD (*Admin only*)
- `POST /api/register` — Public registration endpoint (creates student user + pending registrations)
- `GET /api/student/registrations` — Current user's registrations (*Authenticated*)
- `GET /api/coordinator/events` — Assigned events for coordinator (*Coordinator/Admin*)
- `GET /api/coordinator/events/[id]/registrations` — Scoped participant list (*Coordinator/Admin*)
- `PATCH /api/coordinator/registrations/[id]` — Update status and award result (*Coordinator/Admin*)
- `GET /api/admin/stats` — Summary metrics and event breakdown (*Admin only*)
- `GET /api/admin/registrations` — All fest registrations (*Admin only*)
- `PATCH /api/admin/registrations` — Override any registration status (*Admin only*)
- `GET/POST /api/admin/users` — List and create coordinators/admins (*Admin only*)
- `DELETE /api/admin/users/[id]` — Delete user account (*Admin only*)
