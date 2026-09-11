# SHINE Event Management Platform — User Manual & Operations Guide

> **Comprehensive Operations & Administrator Manual for SHINE**  
> *Intercollegiate Event Platform • NAAC & IQAC Academic Reporting • Multi-Edition System*

---

## 📖 Table of Contents

1. [Platform Overview & Architecture](#1-platform-overview--architecture)
2. [User Roles & Access Permissions](#2-user-roles--access-permissions)
3. [Administrator Operations Manual](#3-administrator-operations-manual)
   - [3.1 Executive Analytics & KPI Overview](#31-executive-analytics--kpi-overview)
   - [3.2 Institution & Department Configuration](#32-institution--department-configuration)
   - [3.3 Multi-Edition Management](#33-multi-edition-management)
   - [3.4 Institution Branding & Custom Theme Color Picker](#34-institution-branding--custom-theme-color-picker)
   - [3.5 SMTP Gateway & Broadcast Email Dispatcher](#35-smtp-gateway--broadcast-email-dispatcher)
   - [3.6 Registrations Verification & Fee Audits](#36-registrations-verification--fee-audits)
   - [3.7 Activity & Security Audit Logs](#37-activity--security-audit-logs)
   - [3.8 Events Catalog CRUD](#38-events-catalog-crud)
   - [3.9 User & Coordinator Account Provisioning](#39-user--coordinator-account-provisioning)
4. [Academic Reports & NAAC / IQAC Dossier Guide](#4-academic-reports--naac--iqac-dossier-guide)
   - [4.1 Navigating the Consolidated Report](#41-navigating-the-consolidated-report)
   - [4.2 The 8 Formal Report Sections](#42-the-8-formal-report-sections)
   - [4.3 Exporting Official PDF (Portrait vs. Landscape)](#43-exporting-official-pdf-portrait-vs-landscape)
   - [4.4 Exporting Tabular CSV Datasets](#44-exporting-tabular-csv-datasets)
   - [4.5 Academic Signatures & Institutional Endorsement](#45-academic-signatures--institutional-endorsement)
5. [Event Coordinator Operations Manual](#5-event-coordinator-operations-manual)
   - [5.1 Accessing Assigned Competitions](#51-accessing-assigned-competitions)
   - [5.2 On-Site Attendance & Delegate Check-in](#52-on-site-attendance--delegate-check-in)
   - [5.3 Preliminary Rounds Evaluation & Mains Progression](#53-preliminary-rounds-evaluation--mains-progression)
   - [5.4 Final Round Scoring & Podium Publishing](#54-final-round-scoring--podium-publishing)
6. [Student & Delegate Guide](#6-student--delegate-guide)
   - [6.1 Exploring the Competitions Directory](#61-exploring-the-competitions-directory)
   - [6.2 Contingent Team & Individual Registration](#62-contingent-team--individual-registration)
   - [6.3 Sign-in Experience & Password Visibility Toggle](#63-sign-in-experience--password-visibility-toggle)
   - [6.4 Accessing Gate Passes, Digital Badges & Food Tokens](#64-accessing-gate-passes-digital-badges--food-tokens)
   - [6.5 Tracking Results & The Public Leaderboard](#65-tracking-results--the-public-leaderboard)
7. [Locomotive 3D Perspective Error Suite](#7-locomotive-3d-perspective-error-suite)
8. [Troubleshooting & Frequently Asked Questions (FAQ)](#8-troubleshooting--frequently-asked-questions-faq)

---

## 1. Platform Overview & Architecture

**SHINE** is a comprehensive, multi-edition intercollegiate fest management platform engineered for higher education institutions. It streamlines the entire event lifecycle:
- Public discovery & schedule dissemination
- Multi-contingent delegate registrations and fee verification
- Dynamic institution white-labeling and real-time color theme engine
- Scoped coordinator grading for preliminary and final rounds
- Point-based college championship leaderboard calculation
- Official academic certification dossiers suitable for **NAAC**, **IQAC**, and college annual reports

### Architectural Highlights
- **Framework**: Next.js 16 (Turbopack, App Router, React Server Components)
- **Database & ORM**: PostgreSQL with Prisma ORM v6
- **Authentication**: NextAuth.js credentials provider with role-based JWT sessions
- **Theme Engine**: Dynamic CSS variable injector supporting SSR and live client switching
- **Export Engines**: CSS Paged Media (`@media print`, `@page`) for vector PDF generation, client-side RFC 4180 CSV generation

---

## 2. User Roles & Access Permissions

The system implements strict Role-Based Access Control (RBAC) enforced via Next.js middleware and API boundaries:

| Role | Access Scope | Target Dashboard | Key Capabilities |
|---|---|---|---|
| **Public Visitor** | Public routes only | `/`, `/events`, `/register` | View fest schedule, browse rules, register contingents. |
| **Student / Delegate** | Authenticated participant | `/dashboard` | View gate pass badge, check-in status, food tokens, registered events, published scores. |
| **Event Coordinator** | Scoped event staff | `/coordinator`, `/coordinator/[eventId]` | Check-in attendees, grade prelims, advance finalists, publish 1st/2nd/3rd places, export event CSV. |
| **Administrator** | Full platform root | `/admin`, `/admin/*` | Complete event CRUD, user provisioning, branding customizer, SMTP broadcasts, academic reports. |

---

## 3. Administrator Operations Manual

Access the Master Control Console at `http://your-domain/admin`. Sign in with your administrative credentials.

### 3.1 Executive Analytics & KPI Overview
Upon opening the **Analytics Overview** tab, administrators are presented with real-time fest telemetry:
- **Total Revenue**: Cumulative calculated fee from confirmed delegations.
- **Total Delegates**: Count of unique verified student participants.
- **Participating Institutions**: Number of colleges/universities registered.
- **Overall Attendance Rate**: Percentage of registered delegates who completed physical gate check-in.
- **Event Breakdown Matrix**: Quick view of On-Stage vs. Off-Stage enrollment tallies.

### 3.2 Institution & Department Configuration
Navigate to the **Institution & Dept** tab:
1. **Institution Name**: Enter the legal name of the college/university (e.g., *Sacred Heart College (Autonomous)*).
2. **Accreditation Text**: Enter accreditation details (e.g., *Affiliated to Thiruvalluvar University • Accredited by NAAC (4th Cycle) with 'A++' Grade*).
3. **Host Department**: Enter the hosting department (e.g., *Department of Computer Applications (PG)*).
4. **Campus Venue & Contacts**: Update physical address, official inquiry email, and emergency contact phones.
5. Click **Save Institution Profile** to propagate changes across letterheads and report templates.

### 3.3 Multi-Edition Management
The **Event Editions** tab enables multi-year fest archiving and seamless edition switching:
- **Create New Edition**: Enter Edition Name (e.g., *SHINE*), Year/Tag (e.g., *2027*), and Fest Tagline.
- **Activate Edition**: Toggle which edition is currently "Live". All landing page stats, registration queues, and reports automatically bind to the active edition.
- **Archive Past Editions**: Previous editions remain immutable for auditing and historical report downloads.

### 3.4 Institution Branding & Custom Theme Color Picker
Located in **Branding & Stage** (Section 5):
Institutions with different brand colors can customize the entire app in seconds:
1. **Primary Accent Color**: Click the color picker or enter a hex code (e.g., `#EA580C` for SHINE Orange, `#2563EB` for Tech Blue).
2. **Secondary Color**: Pick complementary tone for badges, subtle borders, and gradients.
3. **Background Mode**: Choose between Crisp Light (`#FAF8F5`), Pure Clean Slate (`#F8FAFC`), Soft Cream (`#FDFBF7`), or Tech Dark (`#0A0908`).
4. **One-Click Presets**:
   - 🍊 *SHINE Orange* (`#EA580C`)
   - 🔷 *Royal Tech Blue* (`#2563EB`)
   - 🟣 *Imperial Violet* (`#7C3AED`)
   - 🌿 *Emerald Campus* (`#059669`)
   - 🍷 *Crimson Ruby* (`#DC2626`)
   - 👑 *Heritage Gold* (`#D97706`)
   - 🌊 *Cyber Teal* (`#0D9488`)
   - 🖤 *Obsidian Slate* (`#475569`)
5. **Live Simulator**: Test buttons, badges, and cards directly in the preview card before saving.
6. Click **Save Institution Theme**. The change reflects instantly across public and protected screens with zero layout flash.

### 3.5 SMTP Gateway & Broadcast Email Dispatcher
Located in the **SMTP & Email Updates** tab:
1. **Configure SMTP**: Enter your mail server details (`host`, `port`, `username`, `password`, `fromAddress`).
2. **Test Dispatch**: Send a verification ping to any email address to validate TLS handshake.
3. **Broadcast Announcements**:
   - Filter audience: *All Students*, *Team Leads Only*, *Confirmed Delegations*, or *Coordinators*.
   - Compose rich Markdown/HTML body.
   - Click **Dispatch Announcement** to queue messages.

### 3.6 Registrations Verification & Fee Audits
Located in the **Registrations** tab:
- Search by student name, college name, team name, or gate pass code.
- Filter by payment status: `ALL`, `PENDING`, `PAID`, `EXEMPTED`.
- Use the quick action dropdown on each row to approve payment, mark check-in, or override enrollment.

### 3.7 Activity & Security Audit Logs
Located at `/admin/logs`:
- Displays tamper-evident logs of administrative actions (event modifications, result publications, role changes, broadcast dispatches).
- Includes actor identity, timestamp, IP address, and target payload.

### 3.8 Events Catalog CRUD
Located at `/admin/events`:
- **Create Event**: Set Title, Category (`ON_STAGE` / `OFF_STAGE`), Venue, Date & Time, Rules, Registration Fee, and Seat Capacity.
- **Prelims Config**: Toggle `Has Preliminary Round?` to enable preliminary screening venues and timings.
- **Assign Coordinators**: Link both a Faculty/Staff In-Charge and a Student Coordinator from provisioned user accounts.

### 3.9 User & Coordinator Account Provisioning
Located at `/admin/users`:
- Create new `COORDINATOR` or `ADMIN` accounts with assigned email and temporary password.
- Reset passwords or deactivate staff access after fest completion.

---

## 4. Academic Reports & NAAC / IQAC Dossier Guide

The **Consolidated Event Report** (`/admin/reports`) serves as the official institutional audit document required for accreditation committees and annual department reviews.

### 4.1 Navigating the Consolidated Report
In the Admin Console, open the **Reports** tab and click **Open Printable Report (PDF) ↗**, or navigate directly to `/admin/reports`.
- Use the **Section Navigation Tabs** at the top to filter specific sections on-screen (`Full Report`, `Executive Summary`, `Events`, `Delegations`, `Master Student Roster`, `Prelims Progression`, `Final Results`, `Championship Standings`).
- Tabs automatically wrap on smaller screens, preventing truncation.

### 4.2 The 8 Formal Report Sections
1. **Official Institutional Letterhead**: Displays university crest, NAAC accreditation level, host department, venue, and date.
2. **Executive Summary & Fest Participation Metrics**:
   - Total colleges, unique delegates, attendance percentage, competition counts.
   - Secondary KPIs: Total registrations, prelims nominees, mains finalists, podium winners awarded.
   - Overall Symposium Champion Institution spotlight.
3. **Competitions Catalogue & Coordinators Directory**:
   - Full schedule, category, venue, faculty in-charge, student lead, prelims requirement, and enrollment count.
4. **College Delegations Representation Tally**:
   - Roster of all attending colleges, departments, contingent team leads, accompanying faculty members, delegate counts, and fee status.
5. **Master Student Registration Roster**:
   - Participant name, delegation lead badge, institution, contact phone/email, badge gate pass code, enrolled competitions, and attendance status.
6. **Prelims Screening, Evaluation Scores & Mains Progression**:
   - Nominee lists, prelim scores, coordinator qualification remarks, qualification status (`CLEARED`, `WAITLIST`, `ELIMINATED`), mains scores, and final rankings.
7. **Official Competition Results & Winners Podium**:
   - 1st Place (Gold), 2nd Place (Silver), and 3rd Place (Bronze) winners with student name, institution, and official scores.
8. **Overall Intercollegiate Championship Leaderboard**:
   - Points tallied based on official weightage: **1st Place = 10 pts**, **2nd Place = 7 pts**, **3rd Place = 5 pts**.
   - Identifies the *Overall Fest Champion* and *Overall Runner-Up*.
9. **Certification & Endorsement Declaration**:
   - Formal validation declaration for submission to the **Internal Quality Assurance Cell (IQAC)** and annual portfolios.
   - 4 formal academic signature blocks: *Staff Coordinator*, *Student Coordinator*, *Head of Department*, and *Principal / Secretary*.

### 4.3 Exporting Official PDF (Portrait vs. Landscape)
1. **Choose Print Orientation**:
   - **Portrait** (Default): Perfectly scaled for standard A4 binders, NAAC documentation folders, and office printing.
   - **Landscape**: Ideal when viewing wide tables with extensive columns.
2. **Click "Print Official Report (PDF)"**:
   - The browser print preview opens.
   - Ensure destination is set to **"Save as PDF"**.
   - Ensure **"Background graphics"** is checked.
   - Margins are automatically optimized to **8mm**.
   - Page breaks are strictly regulated: no table row or text string is ever sliced across page breaks.
   - Column headers automatically repeat on every subsequent page.

### 4.4 Exporting Tabular CSV Datasets
Click the **Export CSVs ▾** dropdown in the top bar to download clean RFC 4180 CSV files:
- `Master_Student_Roster.csv`
- `Prelims_and_Mains_Scores.csv`
- `Final_Results_and_Winners.csv`
- `Events_and_Coordinators.csv`
- `College_Championship_Standings.csv`

---

## 5. Event Coordinator Operations Manual

Event coordinators manage individual competitions directly from `/coordinator`.

### 5.1 Accessing Assigned Competitions
1. Log in at `/login` using your coordinator credentials.
2. The dashboard displays all competitions assigned to you by the administrator.
3. Click **Manage Competition** on any event card to access the scoped control room.

### 5.2 On-Site Attendance & Delegate Check-in
1. Open the participant roster for your event.
2. When a participant reports to your venue, locate them via search or badge code.
3. Click **Mark Attended** / toggle check-in. The attendance percentage updates automatically in real-time.

### 5.3 Preliminary Rounds Evaluation & Mains Progression
For events with `Has Prelims`:
1. In the **Prelims Evaluation** section, enter the score achieved by each participant.
2. Add qualitative feedback in the **Coordinator Remarks** field.
3. Set their preliminary status:
   - `CLEARED`: Nominated to advance to the final round.
   - `WAITLIST`: Standby candidate.
   - `ELIMINATED`: Did not qualify.
4. Click **Update Progression**. Cleared candidates appear immediately on the Mains scoring sheet.

### 5.4 Final Round Scoring & Podium Publishing
1. Enter the final score for each finalist in the **Mains Stage** table.
2. Select the podium standing:
   - **1st Place** (Awards 10 Championship Points to their college)
   - **2nd Place** (Awards 7 Championship Points to their college)
   - **3rd Place** (Awards 5 Championship Points to their college)
3. Click **Publish Results**. Scores and podium titles are instantly synchronized to the student dashboard, public leaderboard, and consolidated report.

---

## 6. Student & Delegate Guide

### 6.1 Exploring the Competitions Directory
- Visit `/events` to view the comprehensive event schedule.
- Filter competitions by category (**On-Stage** or **Off-Stage**).
- Expand any card to review team size restrictions, time limits, judging criteria, and venue instructions.

### 6.2 Contingent Team & Individual Registration
1. Navigate to `/register`.
2. Enter your Institution / College name and Department.
3. Enter Contingent Team Lead contact details.
4. Select all competitions your college contingent wishes to enter.
5. Review the calculated total delegation fee.
6. Submit the form to generate your contingent registration ID.

### 6.3 Sign-in Experience & Password Visibility Toggle
1. Visit `/login`.
2. Enter your registered email or phone number.
3. Enter your password. Click the **Eye icon** on the right side of the password field to toggle between masked (`••••••••`) and visible text.
4. If testing on staging, use the **Quick-Fill Demo Credentials** buttons at the bottom of the card.

### 6.4 Accessing Gate Passes, Digital Badges & Food Tokens
In the **Student Portal** (`/dashboard`):
- **Digital Gate Pass**: Contains your unique alphanumeric Badge Code (e.g., `SHINE-DEL-042`). Present this at the registration desk upon campus arrival.
- **Physical QR Code**: Click **View Badge** (`/badge/[badgeCode]`) to display a high-resolution QR pass that coordinators can scan.
- **Food Token Status**: Displays whether lunch/refreshment coupons have been redeemed at the dining hall.

### 6.5 Tracking Results & The Public Leaderboard
- Your personal results are posted on `/dashboard` as soon as coordinators publish them.
- Visit `/leaderboard` to view the live college championship standings and total points accumulated by participating colleges.

---

## 7. Locomotive 3D Perspective Error Suite

The platform includes an interactive, dark-mode 3D error suite inspired by Locomotive's perspective stage:
- **Canvas-based 3D Floor Grid**: Realistic vanishing perspective with walking delegates, authentic humanoid walking gaits, and directional contact shadows.
- **Interactive Stage**: Click or tap anywhere on the stage floor to direct the delegates to walk toward your pointer.
- **Error Codes Covered**:
  - `404 Not Found` (`/not-found.tsx`): Lost delegate scene with quick return links.
  - `500 Server Error` (`/error.tsx`): Incident reference badge with one-click error copy and retry action.
  - `403 Forbidden` (`/forbidden.tsx`): Clearance boundary wall for unauthorized roles.
  - `401 Session Expired` (`/unauthorized.tsx`): Seamless redirect back to login.
  - `503 Stage Maintenance` (`/maintenance`): Temporary blackout stage during live platform migrations.
- **Live Showcase Dock**: Explore all error scenes interactively at `/error-preview`.

---

## 8. Troubleshooting & Frequently Asked Questions (FAQ)

#### Q: How do I change the festival logo and main brand color?
**A**: Sign in as Admin, go to `/admin` → **Branding & Stage** → **Section 5: Overall App Color Identity**. Select any of the 8 presets or pick a custom hex color. Click **Save Institution Theme**.

#### Q: Why did the PDF print table cut off previously, and how is it resolved?
**A**: Tables previously lacked explicit print layout rules. The platform now includes `print:table-fixed`, proportional percentage column widths, `print:break-inside-avoid` to prevent horizontal word splitting, and an orientation toggle for **Portrait** and **Landscape** modes in `/admin/reports`.

#### Q: How do I export data for IQAC / NAAC file submissions?
**A**: Navigate to `/admin/reports`, verify the data, and click **Print Official Report (PDF)**. The generated PDF includes the official certification statement and 4 formal signature blocks. You can also download the individual CSV datasets from the **Export CSVs** menu.

#### Q: How does the QR Check-in scanner work on mobile and how do I troubleshoot camera access?
**A**: The **QR Check-In & Food Claim Hub** modal supports live badge and meal voucher scanning using your device camera:
- **Lens Flipping**: If your phone has multiple rear/front cameras, tap **Flip Lens** to cycle through available sensors.
- **Auditorium Flashlight**: Tap **Flashlight** to illuminate dark auditioriums or night stages (supported on rear cameras with torch capability).
- **Troubleshooting "Camera Unavailable"**:
  1. Verify camera permissions in browser site settings (padlock icon in address bar → Permissions → Camera: **Allowed**).
  2. If the camera was held by another app or background tab, tap **Retry Camera** or **Try Next Lens**.
  3. If hardware access remains blocked, use **Manual Code Lookup** to instantly verify attendees via their alphanumeric badge code (e.g. `SHN27-DEL-XXXX`) or food token code (e.g. `FT-XXXX-MEAL`).

#### Q: How is the Intercollegiate Championship Trophy calculated?
**A**: Points are tallied automatically across all events:
- 🥇 1st Place = 10 Points
- 🥈 2nd Place = 7 Points
- 🥉 3rd Place = 5 Points  
The college with the highest aggregate points is crowned *Overall Fest Champion*. In case of a tie, Gold counts serve as the primary tiebreaker.

---

*Document version: 2.0 • Last Revised: September 2026 • Sacred Heart College (Autonomous), Tirupattur*
