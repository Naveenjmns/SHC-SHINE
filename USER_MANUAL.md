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
   - [3.8 Events Catalog CRUD & Prelims Configuration](#38-events-catalog-crud--prelims-configuration)
   - [3.9 User Management, Password Reset & Coordinator Assignment](#39-user-management-password-reset--coordinator-assignment)
   - [3.10 Automated 10-Minute Event Reminders & Cron System](#310-automated-10-minute-event-reminders--cron-system)
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
6. [Food Coordinator Operations Manual (`/food`)](#6-food-coordinator-operations-manual-food)
   - [6.1 Dedicated Food Coordinator Role & Portal Access](#61-dedicated-food-coordinator-role--portal-access)
   - [6.2 Live Dining Telemetry & Diet Preference Tracking](#62-live-dining-telemetry--diet-preference-tracking)
   - [6.3 Camera QR Scanner Hub & Hardware Controls](#63-camera-qr-scanner-hub--hardware-controls)
   - [6.4 Manual Food Token Lookup & Redemption](#64-manual-food-token-lookup--redemption)
   - [6.5 Double Redemption Prevention & Audit Logs](#65-double-redemption-prevention--audit-logs)
7. [User Profile Center & Account Security (`/profile`)](#7-user-profile-center--account-security-profile)
   - [7.1 Unified Profile Access Across All Roles](#71-unified-profile-access-across-all-roles)
   - [7.2 Role-Scoped Telemetry Overview](#72-role-scoped-telemetry-overview)
   - [7.3 Updating Personal Information & Dietary Preferences](#73-updating-personal-information--dietary-preferences)
   - [7.4 Self-Service Password Change](#74-self-service-password-change)
8. [Student & Delegate Guide](#8-student--delegate-guide)
   - [8.1 Exploring the Competitions Directory & Prelims Rules Preview](#81-exploring-the-competitions-directory--prelims-rules-preview)
   - [8.2 Contingent Registration & Mandatory Prelims Nominee Validation](#82-contingent-registration--mandatory-prelims-nominee-validation)
   - [8.3 Automatic Account Provisioning & Direct Login Email Dispatch](#83-automatic-account-provisioning--direct-login-email-dispatch)
   - [8.4 Sign-in Experience & Password Visibility Toggle](#84-sign-in-experience--password-visibility-toggle)
   - [8.5 Accessing Gate Passes, Digital Badges & Food Tokens](#85-accessing-gate-passes-digital-badges--food-tokens)
   - [8.6 Automated 10-Minute Competition Start Reminders](#86-automated-10-minute-competition-start-reminders)
   - [8.7 Tracking Results & The Public Leaderboard](#87-tracking-results--the-public-leaderboard)
9. [Locomotive 3D Perspective Error Suite](#9-locomotive-3d-perspective-error-suite)
10. [Troubleshooting & Frequently Asked Questions (FAQ)](#10-troubleshooting--frequently-asked-questions-faq)
11. [Developers & Technical Support](#11-developers--technical-support)

---

## 1. Platform Overview & Architecture

**SHINE** is a comprehensive, multi-edition intercollegiate fest management platform engineered for higher education institutions. It streamlines the entire event lifecycle:
- Public discovery, rules dissemination, and preliminary round schedule previews
- Multi-contingent delegate registrations with strict email/mobile field validation and mandatory prelim nominee enforcement
- Automated student account provisioning and instant credential email dispatches
- Automated 10-minute competition start alert dispatches for preliminary and final rounds
- Dedicated dining hall management portal (`/food`) with live QR code scanner and dietary preference metrics (Veg vs. Non-Veg)
- Unified User Profile Center (`/profile`) for account updates, dietary preferences, and self-service password changes
- Dynamic institution white-labeling and real-time custom color theme engine
- Scoped coordinator grading for preliminary screening and final rounds
- Point-based college championship leaderboard calculation
- Official academic certification dossiers suitable for **NAAC**, **IQAC**, and college annual department reports

### Architectural Highlights
- **Framework**: Next.js 16 (Turbopack, App Router, React Server Components)
- **Database & ORM**: PostgreSQL with Prisma ORM v6
- **Authentication**: NextAuth.js credentials provider with role-based JWT sessions (`ADMIN`, `COORDINATOR`, `FOOD_COORDINATOR`, `STUDENT`)
- **Background Tasks**: Next.js `instrumentation.ts` background scheduler running continuous 60-second cron sweeps for 10-minute event reminders
- **Theme Engine**: Dynamic CSS variable injector supporting SSR and live client switching
- **Export Engines**: CSS Paged Media (`@media print`, `@page`) for vector PDF generation, client-side RFC 4180 CSV generation

---

## 2. User Roles & Access Permissions

The system implements strict Role-Based Access Control (RBAC) enforced via Next.js middleware, page layouts, and API boundaries:

| Role | Access Scope | Primary Dashboard | Key Capabilities |
|---|---|---|---|
| **Public Visitor** | Public routes only | `/`, `/events`, `/register` | View fest schedule, browse competition rules & prelims criteria, register college contingents. |
| **Student / Delegate** | Authenticated participant | `/dashboard`, `/profile` | View gate pass badge, check-in status, food tokens, registered events, published scores, update profile & food preference. |
| **Event Coordinator** | Scoped event staff | `/coordinator`, `/coordinator/[eventId]`, `/profile` | Check-in attendees, grade prelims, advance finalists, publish 1st/2nd/3rd places, export event CSV. |
| **Food Coordinator** | Dining hall staff | `/food`, `/profile` | Camera QR scanner, flashlight/torch toggle, camera flip, manual meal token redemption, Veg/Non-Veg tally. |
| **Administrator** | Full platform root | `/admin`, `/admin/*`, `/profile` | Complete event CRUD, user edit modal, password reset, coordinator assignment, branding customizer, SMTP broadcasts, academic reports, reminder audit. |

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
1. **Institution Name**: Enter the legal name of the college/university (e.g., *St. Xavier's Institute (Autonomous)*).
2. **Accreditation Text**: Enter accreditation details (e.g., *Affiliated to State University • Accredited by NAAC (4th Cycle) with 'A++' Grade*).
3. **Host Department**: Enter the hosting department (e.g., *Department of Computer Science & Engineering*).
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

### 3.8 Events Catalog CRUD & Prelims Configuration
Located at `/admin/events`:
- **Create Event**: Set Title, Category (`ON_STAGE` / `OFF_STAGE`), Venue, Date & Time, Rules, Registration Fee, and Seat Capacity.
- **Preliminary Rounds Toggle**: Toggle `Has Preliminary Round?` to reveal:
  - **Prelims Venue**: Physical location of screening room/lab.
  - **Prelims Date & Time**: Schedule for the screening round.
  - **Prelims Rules & Screening Criteria**: Specific instructions regarding preliminary qualifiers.
- **Assign Coordinators**: Link both a Faculty/Staff In-Charge and a Student Coordinator from provisioned user accounts.

### 3.9 User Management, Password Reset & Coordinator Assignment
Located at `/admin/users`:
- **Create Account**: Provision `ADMIN`, `COORDINATOR`, `FOOD_COORDINATOR`, or `STUDENT` accounts with full email/phone validation.
- **Edit User Modal**: Click **Edit** on any user row to:
  - Update Full Name, Email, Phone Number, College, and Role.
  - **Direct Password Reset**: Enter a new password to immediately update the user's credential without touching the database console.
  - **Assigned Competitions**: For `COORDINATOR` accounts, select which events this coordinator has authority to manage and score.
- **Delete / Revoke**: Safely deactivate users after fest completion.

### 3.10 Automated 10-Minute Event Reminders & Cron System
The platform features an autonomous event reminder engine:
- **Background Scheduler**: Powered by Next.js `instrumentation.ts` and `reminderScheduler.ts`, running an automated sweep every 60 seconds.
- **10-Minute Trigger Window**: Detects any active registration whose event starts within the next 10 minutes (between 0 and 10 minutes away):
  - Sends reminder for **Preliminary Rounds** (`prelimsDateTime`) if not yet sent (`prelimsReminderSentAt`).
  - Sends reminder for **Main Competition** (`dateTime`) if not yet sent (`reminderSentAt`).
- **Urgent Notification Payload**: Dispatches high-priority email featuring:
  - Event title, round designation (Prelims vs. Finals), venue, exact start time.
  - One-click Digital Gate Pass access link and badge code.
  - Competition rules preview and screening criteria.
  - Contact hotline numbers for Faculty and Student Event Coordinators.
- **Manual Trigger & Webhook Endpoint**: 
  - `GET /api/cron/reminders` (secured via `CRON_SECRET` header or admin session).
  - Supports `?dryRun=true` to preview eligible dispatches without sending emails.
  - Supports `?forceEventId=[id]` to trigger immediate test notifications for any specific competition.

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

## 6. Food Coordinator Operations Manual (`/food`)

Food coordinators manage lunch distribution and refreshment vouchers in the dining hall directly via `/food`.

### 6.1 Dedicated Food Coordinator Role & Portal Access
- Sign in with credentials carrying the `FOOD_COORDINATOR` role (e.g., demo account `food@shctpt.edu` / `food123`).
- Navigating to `/food` provides a clean, mobile-optimized control room for dining operations.

### 6.2 Live Dining Telemetry & Diet Preference Tracking
The top dashboard displays real-time catering counters:
- **Total Meals Claimed**: Overall count of redeemed food tokens.
- **Vegetarian Distribution**: Live count of Vegetarian meals issued.
- **Non-Vegetarian Distribution**: Live count of Non-Vegetarian meals issued.
- **Remaining Unclaimed Tokens**: Real-time counter of registered attendees who have not yet claimed their meal.

### 6.3 Camera QR Scanner Hub & Hardware Controls
Tap **Open QR Scanner** to launch the high-speed camera scanner:
- **Instant Decoding**: Point camera at the student's digital badge QR code or physical printout.
- **Camera Flip**: Tap **Flip Lens** to alternate between front and rear cameras (or between ultra-wide and main lenses).
- **Auditorium Torch / Flashlight**: Tap **Flashlight** to illuminate dimly lit catering areas (supported on compatible mobile rear cameras).
- **Auto Audio / Visual Feedback**: A green flash and chime confirm a valid claim, while a red warning modal flags an already-redeemed or invalid token.

### 6.4 Manual Food Token Lookup & Redemption
If a student's phone battery is drained or screen is damaged:
1. Tap the **Manual Token Entry** tab.
2. Input the student's 10-character Food Token (e.g., `FT-XXXX-MEAL`) or their Badge Code (e.g., `SHN27-DEL-001`).
3. View the student's name, college, and dietary preference badge (`VEG` vs. `NON-VEG`).
4. Click **Confirm Meal Claim** to record the transaction.

### 6.5 Double Redemption Prevention & Audit Logs
- The system checks `foodClaimedAt` instantaneously.
- If a token is scanned a second time, an alert modal immediately reveals:
  - Exact timestamp of the previous meal redemption.
  - Staff member / scanner terminal that approved the prior claim.
- Prevents duplicated lunch ticket usage across dining counters.

---

## 7. User Profile Center & Account Security (`/profile`)

The unified **User Profile Center** (`/profile`) is available to all authenticated users across all four roles (`ADMIN`, `COORDINATOR`, `FOOD_COORDINATOR`, `STUDENT`).

### 7.1 Unified Profile Access Across All Roles
- Click on the user avatar in the navigation bar and select **My Profile**, or navigate directly to `/profile`.
- The interface adapts dynamically based on the active role while maintaining consistent styling and instant responsiveness.

### 7.2 Role-Scoped Telemetry Overview
Each role receives personalized telemetry at the top of their profile:
- **Administrators**: Total platform accounts, total confirmed registrations, and currently active edition tag.
- **Event Coordinators**: List of assigned events with direct links to `/coordinator/[id]` control rooms.
- **Food Coordinators**: Today's meal claims tally, Veg/Non-Veg distribution summary, and scanner activity.
- **Students**: Gate Pass Badge Code, Food Token Code, Dietary Preference tag, and list of registered competitions.

### 7.3 Updating Personal Information & Dietary Preferences
Users can update their profile information at any time:
1. **Full Name**: Edit display name.
2. **Phone Number**: Enforces strict 10–15 digit mobile number validation.
3. **Institution / College**: Edit college affiliation.
4. **Food Preference**: Select either **Vegetarian (VEG)** or **Non-Vegetarian (NON_VEG)** to ensure accurate catering preparation.
5. **Avatar URL**: Enter custom profile image link.
6. Click **Save Changes** to commit updates.

### 7.4 Self-Service Password Change
Located in the **Account Security** section:
1. Enter your **Current Password** (verified securely against hashed password).
2. Enter your **New Password** (minimum 6 characters).
3. Re-enter your new password in **Confirm New Password**.
4. Click **Update Password**. The session password hash is updated instantly with zero disruption.

---

## 8. Student & Delegate Guide

### 8.1 Exploring the Competitions Directory & Prelims Rules Preview
- Visit `/events` or `/` to view the comprehensive event schedule.
- Filter competitions by category (**On-Stage** or **Off-Stage**).
- **Preliminary Round Indicators**: Competitions with preliminary rounds display a distinct badge and preliminary schedule notice right on their card.
- **Expandable Modal**: Clicking **View Details** reveals full competition rules alongside a dedicated **Preliminary Round Rules & Format** section outlining screening tests, time limits, and qualifier thresholds.

### 8.2 Contingent Registration & Mandatory Prelims Nominee Validation
1. Navigate to `/register`.
2. Enter your Institution / College name and Department.
3. Enter Contingent Team Lead contact details (strict email and 10–15 digit phone validation enforced).
4. Add all student delegates participating from your college.
5. Select the competitions your college contingent wishes to enter.
6. **Mandatory Prelims Nominee Selection**:
   - If any of your selected competitions has a preliminary round (`hasPrelims: true`), the form requires that you nominate one specific student from your delegate list to represent your institution in the preliminary screening.
   - **Form Enforcement**: The registration form prevents submission until every prelim-enabled competition has an assigned nominee.
7. Review the calculated total delegation fee.
8. Submit the form to generate your contingent registration ID.

### 8.3 Automatic Account Provisioning & Direct Login Email Dispatch
Upon successful registration:
1. **Automated Account Creation**: Student delegate accounts are automatically provisioned in the database.
2. **Initial Temporary Password**: The student's registered mobile number is set as their default password.
3. **Direct Login Welcome Email**:
   - An automated registration confirmation email is dispatched immediately to each student.
   - The email contains a prominent **Direct Portal Access** button (`/login?email=student@example.com`).
   - Clicking the link opens the login page with the student's email pre-filled.
   - The email clearly indicates their **User ID** and **Default Password (Mobile Number)**, with instructions to update their password upon sign-in.

### 8.4 Sign-in Experience & Password Visibility Toggle
1. Visit `/login` (or open the direct link from your welcome email).
2. The email field will automatically pre-fill if accessed via your direct email link.
3. Enter your password (your mobile number for first-time login).
4. Click the **Eye icon** on the right side of the password field to toggle between masked (`••••••••`) and visible text.
5. If testing on staging, use the **Quick-Fill Demo Credentials** buttons at the bottom of the card.

### 8.5 Accessing Gate Passes, Digital Badges & Food Tokens
In the **Student Portal** (`/dashboard`):
- **Digital Gate Pass**: Contains your unique alphanumeric Badge Code (e.g., `SHINE-DEL-042`). Present this at the registration desk upon campus arrival.
- **Physical QR Code**: Click **View Badge** (`/badge/[badgeCode]`) to display a high-resolution QR pass that coordinators can scan.
- **Food Token Status**: Displays your meal code (e.g., `FT-XXXX-MEAL`) and real-time status of lunch redemption.

### 8.6 Automated 10-Minute Competition Start Reminders
- Exactly 10 minutes prior to your competition (or preliminary round), the system dispatches an urgent reminder email directly to your inbox.
- The notification contains:
  - Exact competition title and round (Prelims vs. Finals).
  - Room/Lab venue location and scheduled start time.
  - One-click link to open your digital gate pass badge.
  - Quick reminder of judging criteria and rules.
  - Direct contact numbers for assigned Faculty and Student Coordinators.

### 8.7 Tracking Results & The Public Leaderboard
- Your personal results are posted on `/dashboard` as soon as coordinators publish them.
- Visit `/leaderboard` to view the live college championship standings and total points accumulated by participating colleges.

---

## 9. Locomotive 3D Perspective Error Suite

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

## 10. Troubleshooting & Frequently Asked Questions (FAQ)

#### Q: How do students receive their login credentials?
**A**: When a college contingent registers at `/register`, student accounts are automatically provisioned. Each student receives an automated welcome email containing their User ID (email), their temporary password (their registered mobile number), and a one-click login link with their email pre-filled.

#### Q: Why does the registration form block submission when selecting certain events?
**A**: If any selected competition has a Preliminary Round (`hasPrelims: true`), the system enforces that a student delegate must be assigned as the preliminary round nominee before completing registration. Ensure that a nominee is chosen in the Prelims Nominee dropdown for each applicable event.

#### Q: How do the automated 10-minute competition start reminders work?
**A**: The platform runs an autonomous background cron scheduler that sweeps event schedules every 60 seconds. When an event or preliminary round is between 0 and 10 minutes from starting, an urgent reminder email with venue, timing, rules, and coordinator hotlines is dispatched to all registered participants.

#### Q: How does the Food Coordinator scan badges or redeem meals?
**A**: Sign in as a `FOOD_COORDINATOR` (or Admin) and navigate to `/food`. Tap **Open QR Scanner** to activate the camera with torch/flashlight and lens flip capabilities. Alternatively, switch to **Manual Token Entry** to redeem meal tokens by alphanumeric code (`FT-XXXX-MEAL`). The system tracks Vegetarian and Non-Vegetarian counts in real time and flags any attempted double redemptions.

#### Q: How do users update their dietary preferences or change their passwords?
**A**: Navigate to `/profile` from the top navigation bar. Users can toggle their dietary preference between **VEG** and **NON_VEG**, update their contact phone number, and change their account password via the self-service security form.

#### Q: How do I change the festival logo and main brand color?
**A**: Sign in as Admin, go to `/admin` → **Branding & Stage** → **Section 5: Overall App Color Identity**. Select any of the 8 presets or pick a custom hex color. Click **Save Institution Theme**.

#### Q: How do I export data for IQAC / NAAC file submissions?
**A**: Navigate to `/admin/reports`, verify the data, and click **Print Official Report (PDF)**. The generated PDF includes the official certification statement and 4 formal signature blocks. You can also download the individual CSV datasets from the **Export CSVs** menu.

---

## 11. Developers & Technical Support

For platform support, deployment assistance, bug reports, or feature enhancements:

- **Sakthi K**: [sakthikaribeeran@gmail.com](mailto:sakthikaribeeran@gmail.com)
- **Naveen Kumar J**: [naveenkumarjmns@gmail.com](mailto:naveenkumarjmns@gmail.com)

---

*Document version: 3.0 • Last Revised: September 2026 • Enterprise Platform Edition*
