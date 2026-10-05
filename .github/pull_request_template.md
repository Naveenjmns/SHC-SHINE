## 📝 Description

Provide a clear and concise summary of the changes made in this Pull Request. Explain *what* was changed and *why*.

Fixes / Related Issues: (e.g. `Fixes #12`, `Closes #34`)

---

## 🏷️ Type of Change

Please delete options that are not relevant.

- [ ] 🐛 **Bug fix** (non-breaking change which fixes an issue)
- [ ] ✨ **New feature** (non-breaking change which adds functionality)
- [ ] 💥 **Breaking change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🎨 **UI / UX Improvement** (styling, responsive layout, animations)
- [ ] 🗄️ **Database / Prisma Schema** (schema update, migration, seed script)
- [ ] ⚡ **Performance optimization** (caching, query optimization, asset loading)
- [ ] 📚 **Documentation** (README, USER_MANUAL, guides, inline docs)
- [ ] 🔧 **Chore / Tooling** (dependencies, linting, build scripts)

---

## 🎯 Affected Portals & Areas

- [ ] Public Portal (`/`, `/events`, `/register`, `/leaderboard`)
- [ ] Student Dashboard (`/dashboard`, `/profile`, `/badge/[badgeCode]`)
- [ ] Event Coordinator Console (`/coordinator`, `/coordinator/[eventId]`)
- [ ] Food & Dining Portal (`/food`)
- [ ] Admin Control Room (`/admin`, `/admin/events`, `/admin/users`, `/admin/reports`)
- [ ] Authentication & RBAC (`/login`, NextAuth, session management)
- [ ] Background Workers & Cron (`reminderScheduler`, `/api/cron/*`, SMTP)

---

## 🧪 Testing & Verification

Please describe how these changes were tested:

- [ ] **TypeScript Check**: `npx tsc --noEmit` passed with 0 errors
- [ ] **Linter**: `npm run lint` passed without new errors/warnings
- [ ] **Database**: Tested against local PostgreSQL (`npx prisma db push` / queries verified)
- [ ] **Responsive Testing**: Verified across viewport breakpoints:
  - [ ] Mobile (360px – 430px)
  - [ ] Tablet (768px – 1024px)
  - [ ] Desktop / Laptop (1280px – 1920px)
  - [ ] Stage 16:9 Presentation View (if applicable)
- [ ] **Role Permissions**: Tested with appropriate test account (`ADMIN`, `COORDINATOR`, `FOOD_COORDINATOR`, `STUDENT`)

---

## 📷 Screenshots / Screen Recordings (if applicable)

| Before | After |
| :---: | :---: |
| *(Image / GIF)* | *(Image / GIF)* |

---

## 📋 Checklist

- [ ] My code adheres to the project's coding standards and naming conventions.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented complex or non-obvious code blocks (especially business logic, tiebreakers, or validation).
- [ ] If Prisma schema was updated, I have documented the changes and verified `SCHEMA_REVISION` in `src/lib/prisma.ts`.
- [ ] No sensitive credentials, secrets, or API keys are committed.
