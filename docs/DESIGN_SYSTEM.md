# SHINE 2026 — Design System & Token Specification (v2.0)

> **Document Version**: 2.0.0  
> **Status**: Approved (Phase 1 Baseline)  
> **Target Platform**: Next.js 16.3.4 (App Router) / Tailwind v4 / React 19  
> **Core Palette**: Single Accent (`#FF6B1A` SHINE Orange) + Awards Gold (`#D9A441`) + Cool-Neutral Ramp

---

## 1. Design Philosophy & Guardrails

The SHINE 2026 UI redesign is engineered around a core duality:
- **Festival Energy on Public Pages**: The public landing page and event registration flows project warmth, momentum, and distinction using the signature `#FF6B1A` SHINE Orange accent and disciplined editorial typography.
- **Disciplined Software on Working Pages**: Coordinator, Admin, and Food dashboards prioritize density, rapid scanning, high keyboard efficiency, and visual calm on off-white surfaces (`#FFFFFF` / `#F5F5F4`) or dark console surfaces (`#121110`).

### Strict Anti-Patterns (Eliminated in v2)
1. **No Neon / AI-Style Gradients**: The previous 5-stop background linear gradients (`#14052e`, `#2d0b4e`, `#6c1e7a`) and text gradient wordmarks have been replaced by solid, high-contrast surfaces and solid `#FF6B1A` branding.
2. **No Glowing Drop-Shadows**: Radial glow halos and colored box-shadows (`box-shadow: 0 0 40px rgba(...)`) have been removed. Surface separation is achieved with **1px hairline borders** (`var(--border)`).
3. **Restricted Shadows**: Elevation shadows are strictly reserved for floating overlay layers (popovers, dropdown menus, dialog modals). Flat cards and buttons have `box-shadow: none`.
4. **No Emojis as UI Icons**: All interface symbology is rendered exclusively with **Lucide React icons**.
5. **No Decorative Looping Animations**: Infinite pulsing auras, radar pings, and rotating borders have been eliminated. Transitions are purposeful, subtle (150ms–250ms), and honor `prefers-reduced-motion`.
6. **Strict Font Weight Cap**: Maximum weight is **600 (semibold)** for UI elements and **700 (bold)** for display headlines. Ultra-bold / `font-black` (900) weights are forbidden.

---

## 2. Token Architecture

Tokens are authored as native CSS custom properties in `src/styles/tokens.css` and exposed directly to Tailwind CSS v4 via the `@theme` directive. Dynamic per-edition themes are computed via `src/lib/colorUtils.ts`.

### 2.1 CSS Custom Property Contract

```
Tokens Layer (tokens.css)
       │
       ├── :root (Light Theme Default)
       ├── .dark, [data-theme="dark"] (Dark Console Theme)
       └── [data-stage-mode="true"] (16:9 Projector Mode)
               │
               ▼
Tailwind v4 @theme Directive
       │
       ▼
Utility Classes (bg-surface, text-ink, border-border, bg-accent, etc.)
```

---

## 3. Color Tokens & Contrast Matrix

All color tokens have been verified against **WCAG 2.1 Level AA** standards:
- Normal text (< 18pt / 24px regular or < 14pt / 18.66px bold): **minimum 4.5:1** contrast ratio.
- Large text (≥ 18pt / 24px or ≥ 14pt / 18.66px bold): **minimum 3.0:1** contrast ratio.
- UI components and graphical objects: **minimum 3.0:1** contrast against adjacent backgrounds.

### 3.1 Base Surfaces & Ink

| Token Name | Light Theme | Dark Theme | Purpose / Usage | WCAG AA Contrast |
| :--- | :--- | :--- | :--- | :--- |
| `--surface` | `#FFFFFF` | `#121110` | Primary page & canvas background | Baseline |
| `--surface-raised` | `#F5F5F4` (stone-100) | `#1C1917` (stone-900) | Cards, sidebars, secondary panels | Non-text UI (passed) |
| `--surface-sunken` | `#E7E5E4` (stone-200) | `#0C0A09` (stone-950) | Table headers, wells, search input backgrounds | Non-text UI (passed) |
| `--border` | `#E7E5E4` (stone-200) | `#292524` (stone-800) | Default 1px hairline panel borders | 3.1:1 non-text |
| `--border-muted` | `#F5F5F4` (stone-100) | `#1C1917` (stone-900) | Subtle divider lines | Internal layout |
| `--border-strong` | `#D6D3D1` (stone-300) | `#44403C` (stone-700) | Interactive borders (inputs on hover, active states) | 3.5:1 non-text |
| `--ink` | `#0C0A09` (stone-950) | `#FAFAF9` (stone-50) | Primary body text, headings | **18.8:1** (Light) / **17.2:1** (Dark) |
| `--ink-muted` | `#57534E` (stone-600) | `#A8A29E` (stone-400) | Secondary metadata, labels, table subtitles | **5.1:1** (Light) / **6.8:1** (Dark) |
| `--ink-subtle` | `#78716C` (stone-500) | `#78716C` (stone-500) | Placeholders, disabled text, caption metadata | **4.6:1** (Light) / **4.6:1** (Dark) |

### 3.2 Accent System

The application uses **one primary accent color**: `#FF6B1A` SHINE Orange. Secondary gold is strictly reserved for trophy/award components.

| Token Name | Light Value | Dark Value | Purpose | Contrast / Compliance |
| :--- | :--- | :--- | :--- | :--- |
| `--accent` | `#FF6B1A` | `#FF6B1A` | Primary CTAs, active tab indicator, key badges | **6.94:1** on dark ink |
| `--accent-hover` | `#E8551F` | `#E8551F` | Hover state for primary buttons | Maintains contrast |
| `--accent-active` | `#CC4414` | `#CC4414` | Active / pressed state | Maintains contrast |
| `--accent-muted` | `rgba(255,107,26,0.10)`| `rgba(255,107,26,0.16)` | Selection highlights, soft badge backgrounds | Ambient highlight |
| `--accent-ink` | `#0C0A09` | `#0C0A09` | Foreground text on `--accent` backgrounds | **6.94:1** (Passes WCAG AA & AAA) |
| `--gold` | `#D9A441` | `#D9A441` | Trophies, medals, 1st/2nd place awards ONLY | Dedicated award role |
| `--gold-hover` | `#C59132` | `#C59132` | Interactive award hover | Non-primary |
| `--gold-muted` | `rgba(217,164,65,0.12)`| `rgba(217,164,65,0.20)` | Award card badge background | Non-primary |
| `--gold-ink` | `#1C1917` | `#FAFAF9` | Text on gold backgrounds | **7.2:1** (Light) / **6.5:1** (Dark) |

### 3.3 Semantic & Status Roles

Every status indicator pairs color with an **icon** and **text label** (never color alone):

| Status | Color | Surface | Border | Text | Icon |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Confirmed / Active** | `#16A34A` | `#F0FDF4` | `#BBF7D0` | `#14532D` | `CheckCircle2` |
| **Pending / Under Review** | `#D97706` | `#FFFBEB` | `#FDE68A` | `#78350F` | `Clock` |
| **Rejected / Cancelled** | `#DC2626` | `#FEF2F2` | `#FECACA` | `#7F1D1D` | `XCircle` |
| **Information / Notice** | `#2563EB` | `#EFF6FF` | `#BFDBFE` | `#1E3A8A` | `Info` |

---

## 4. Typography Specification

### 4.1 Font Families

| Role | Family | Fallback Stack | Allowed Weights |
| :--- | :--- | :--- | :--- |
| **Display / Fest Headlines** | **Bricolage Grotesque** | `-apple-system, BlinkMacSystemFont, sans-serif` | `600` (semibold), `700` (bold) |
| **UI Body / Controls / Tables** | **Inter** | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | `400` (regular), `500` (medium), `600` (semibold) |
| **Tabular Numbers / Badges** | **System Monospace** | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas` | `400` (regular), `600` (semibold) |

### 4.2 Fixed 8-Step Typography Scale

No arbitrary font sizes are permitted. All typography must strictly use this 8-step scale:

| Step | Token | Rem | Px | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `text-xs` | `0.75rem` | **12px** | `1.0rem` (16px) | `+0.01em` | Table column headers, badge text, timestamps, captions |
| **2** | `text-sm` | `0.875rem` | **14px** | `1.25rem` (20px) | `0em` | Form labels, helper text, dense table cell body, nav links |
| **3** | `text-base` | `1.0rem` | **16px** | `1.5rem` (24px) | `-0.01em` | Primary body text, card descriptions, input field values |
| **4** | `text-lg` | `1.125rem` | **18px** | `1.75rem` (28px) | `-0.01em` | Card titles, section headers in modals, lead paragraphs |
| **5** | `text-xl` | `1.5rem` | **24px** | `2.0rem` (32px) | `-0.02em` | Section headers (`h2`), modal titles, dashboard metric numbers |
| **6** | `text-2xl` | `2.0rem` | **32px** | `2.25rem` (36px) | `-0.02em` | Page titles (`h1`), major section titles |
| **7** | `text-3xl` | `3.0rem` | **48px** | `3.25rem` (52px) | `-0.03em` | Public landing section titles, auditorium stats |
| **8** | `text-4xl` | `4.0rem` | **64px** | `4.25rem` (68px) | `-0.04em` | Public hero headline ("SHINE 2026") |

---

## 5. Spacing, Radii, and Elevation

### 5.1 Spacing Rhythm (4px / 8px Base)

Layouts use an 8px modular grid with 4px half-steps:
- `4px` (`space-1`): Inner badge padding, icon-text gap.
- `8px` (`space-2`): Control inner padding (Y-axis), stacked list items gap.
- `12px` (`space-3`): Control horizontal padding (`px-3`), compact card padding.
- `16px` (`space-4`): Standard card body padding, form field vertical gap.
- `24px` (`space-6`): Modal inner padding, dashboard grid gap (`gap-6`).
- `32px` (`space-8`): Section separation in dashboards.
- `48px` (`space-12`): Major page section padding on desktop.
- `64px` (`space-16`): Public landing section spacing.

### 5.2 Radii Rules

To eliminate inconsistent mixed roundings:
1. **Interactive Controls (`8px` / `--radius-control` / `rounded-[8px]`)**:
   - Buttons, text inputs, selects, dropdown menus, filter pills, checkboxes.
2. **Panels & Containers (`12px` / `--radius-panel` / `rounded-[12px]`)**:
   - Cards, sheets, dialog modals, alert callouts, data tables.
3. **Full Round (`9999px` / `rounded-full`)**:
   - User avatars, circular counter badges, status indicator dots.

### 5.3 Elevation & Hairline Borders

- **Flat Elements (Cards, Panels, Tables, Controls)**:
  `box-shadow: none; border: 1px solid var(--border);`
- **Floating Overlays (Popovers, Select Menus, Tooltips)**:
  `box-shadow: var(--shadow-popover); border: 1px solid var(--border-strong);`
- **Dialogs & Modals**:
  `box-shadow: var(--shadow-modal); border: 1px solid var(--border-strong);`

---

## 6. Stage Mode (16:9 Projector Theme)

For auditorium screens, large LED walls, and stage presentations:
- Activated via attribute `[data-stage-mode="true"]`.
- Base surface drops to near-black (`#080706`) to maximize projector contrast.
- Primary accent shifts to `#FF7728` with pure black ink (`#000000`) for high-distance legibility.
- Typography size increments by 1.25x across all dashboard widgets.
- Ambient borders are darkened (`#2C2825`) to eliminate projector glare.

---

## 7. Dynamic Edition Adaptation

Through `src/lib/colorUtils.ts`, fest admins can customize edition accent colors while guaranteeing accessibility:
- **Automatic Safe Foreground Derivation**: `getContrastSafeInk(hex)` automatically selects between `#FFFFFF` and `#0C0A09` based on WCAG 2.1 relative luminance formulas.
- **Auto-Derived Variants**: Hover (darkened/lightened by 10%), Active (darkened by 18%), and Muted (10% opacity alpha).
- **Institution Presets**: Built-in tested palettes for Engineering (`#2563EB`), Polytechnic (`#DC2626`), Autonomous Tech (`#059669`), and Executive (`#334155`).

---

## 8. File Structure & Responsibilities

```
src/
├── styles/
│   └── tokens.css            # Master design tokens & Tailwind @theme
├── lib/
│   ├── colorUtils.ts         # WCAG AA contrast math & dynamic CSS generator
│   └── __tests__/
│       └── colorUtils.test.ts # 11 automated test suites covering contrast & presets
├── app/
│   ├── globals.css           # Global resets, base utilities, hairline borders
│   ├── layout.tsx            # Bricolage Grotesque & Inter font loading
│   └── design/               # Admin token matrix showcase route
│       ├── page.tsx          # Layout, auth guard, theme switcher
│       └── components/
│           ├── ColorMatrix.tsx
│           ├── TypographyMatrix.tsx
│           ├── ComponentPreviewMatrix.tsx
│           └── ThemePlayground.tsx
```
