# SHINE 2026 — Design System v3: "Navy ink on cool marble"

> **Version**: 3.0.0
> **Platform**: Next.js 16 (App Router) · Tailwind CSS v4 (`@theme`) · React 19
> **Source of truth**: `src/styles/tokens.css`, `src/app/globals.css`, `src/components/ui/*`
> **Live showcase**: `/design` (admin only; `/admin/design` redirects there)

---

## 1. Principles

The v3 system is calm, editorial and trustworthy. Think scheduling software, not a nightclub flyer.

1. **Navy ink, never black.** All text uses Ink Navy `#0B3558` and its slate ramp. Pure black does not appear anywhere.
2. **Cool marble canvas, white cards.** Pages sit on Cloud `#F8F9FB`; content lives on white cards with a 1px hairline border and a soft, blue-tinted shadow.
3. **One action color.** Signal Blue `#006BFF` is the only accent. It marks primary buttons, links, focus, selection and active wayfinding routes. No orange.
4. **Flat surfaces.** No gradients, glows, neon or colored halos. Depth comes from layered blue-tinted shadows only.
5. **One typeface.** Manrope for everything: headings, UI, body and numbers.
6. **Comfortable density.** Generous card padding (`p-6`), large bold navy headings, short muted descriptions.

---

## 2. Token architecture

Tokens are CSS custom properties in `src/styles/tokens.css`, mapped into Tailwind v4 through `@theme`, so every token becomes a utility (`bg-canvas`, `text-ink-muted`, `border-border`, `shadow-card`, …).

```
tokens.css
  ├── :root                          Light theme (default)
  ├── .dark, [data-theme="dark"]     Deep-navy workspace
  └── [data-stage-mode="true"]       16:9 projector / stage screens
        │
        ▼
@theme  →  Tailwind utilities  →  src/components/ui/*  +  globals.css helper classes
```

`globals.css` also keeps **legacy bridges** (`--fest-*`, `--dash-*`, `--font-outfit`, `--font-inter`) that now point at v3 tokens. Example: `--fest-ember` resolves to `--accent` (blue). Treat them as read-only aliases and use the v3 names in new code.

---

## 3. Color

Contrast ratios are measured against white `#FFFFFF` unless noted. WCAG 2.1 AA requires 4.5:1 for normal text and 3:1 for large text and UI graphics.

### 3.1 Surfaces

| Token / utility | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--canvas` · `bg-canvas` | `#F8F9FB` Cloud | `#071E33` | Page background |
| `--surface` · `bg-surface` | `#FFFFFF` Paper | `#0A2740` | Cards, panels, modals, popovers |
| `--surface-raised` · `bg-surface-raised` | `#F0F3F8` Pebble | `#0F3250` | Input fills, hover washes, neutral badges |
| `--surface-sunken` · `bg-surface-sunken` | `#E6EDF5` | `#061829` | Disabled fields, wells |
| `--surface-inverse` · `bg-surface-inverse` | `#0B3558` Ink Navy | `#F0F3F8` | Dark CTA buttons and inverse panels only |

### 3.2 Borders

| Token / utility | Light | Dark | Use |
| :--- | :--- | :--- | :--- |
| `--border` · `border-border` | `#D4E0ED` Hairline | `#1B4268` | Default 1px border on cards, inputs, tables |
| `--border-muted` · `border-border-muted` | `#E7EEF6` | `#123553` | Interior dividers |
| `--border-strong` · `border-border-strong` | `#B4C7DB` | `#2A5A85` | Hover / emphasis borders, scrollbar thumb |

### 3.3 Ink

| Token / utility | Light | Contrast | Use |
| :--- | :--- | :--- | :--- |
| `--ink` · `text-ink` | `#0B3558` Ink Navy | 12.6:1 (AAA) | Headings, body, primary text |
| `--ink-muted` · `text-ink-muted` | `#476788` Slate | 5.9:1 (AA) | Secondary text, descriptions |
| `--ink-subtle` · `text-ink-subtle` | `#56708D` | 5.1:1 (AA) | Helper text, captions, placeholders |
| `--ink-disabled` · `text-ink-disabled` | `#A6BBD1` Mist | 2.0:1 | **Disabled / inactive only**, never for readable copy |

### 3.4 Accent: Signal Blue

| Token / utility | Value | Use |
| :--- | :--- | :--- |
| `--accent` · `bg-accent` / `text-accent` | `#006BFF` | Primary buttons, links, focus ring, selected state. White on blue = 4.6:1 (AA) |
| `--accent-hover` · `bg-accent-hover` | `#0058D6` | Primary hover |
| `--accent-active` · `bg-accent-active` | `#004EBA` | Pressed |
| `--accent-muted` · `bg-accent-muted` | `#E6F0FF` (dark: 18% blue) | Tinted fills, pill badges, icon tiles |
| `--accent-strong` · `text-accent-strong` | `#004EBA` Deep Cobalt (dark: `#7FB2FF`) | Text on `accent-muted` (6.5:1) |
| `--accent-ink` · `text-accent-ink` | `#FFFFFF` | Text and icons on accent fills |

Pattern: solid action = `bg-accent text-accent-ink hover:bg-accent-hover`; tinted chip = `bg-accent-muted text-accent-strong`; inline link = `text-accent`.

### 3.5 Decorative blobs

| Token / utility | Value | Use |
| :--- | :--- | :--- |
| `--blob-magenta` · `bg-blob-magenta` | `#E55CFF` | Organic shapes behind hero visuals; also the "you are here" marker on the venue map |
| `--blob-cyan` · `bg-blob-cyan` | `#0099FF` | Organic shapes behind hero visuals |

Blobs are atmosphere only. Use the `.blob-stage` > `.blob .blob-magenta` / `.blob .blob-cyan` helpers, keep them behind a white card, and never use them as button, badge, chart or status fills.

### 3.6 Gold (awards only)

`--gold #D9A441`, `--gold-hover #C59132`, `--gold-muted` (14% gold), `--gold-ink #0B3558` (5.6:1 on gold). Reserved for trophies, podiums, winners and prize badges (`<Badge variant="gold">`). Any other gold or amber decoration should use accent or ink-muted.

### 3.7 Semantic and status roles

Always pair color with an icon or a label.

| Role | Base | Surface | Border | Ink (on surface) |
| :--- | :--- | :--- | :--- | :--- |
| Success | `#0E9F6E` | `#ECFDF5` | `#A7F3D0` | `#065F46` (7.3:1) |
| Warning | `#D97706` | `#FFFBEB` | `#FDE68A` | `#78350F` (8.8:1) |
| Danger | `#E02424` | `#FDF2F2` | `#FBD5D5` | `#9B1C1C` (7.4:1) |
| Info | `#006BFF` | `#E6F0FF` | `#B8D4FF` | `#004EBA` (6.5:1) |

Utilities follow `text-success`, `bg-success-surface`, `border-success-border`, `text-success-ink` (same for `warning-*`, `danger-*`, `info-*`). Registration states also have `status-confirmed-*`, `status-pending-*` and `status-rejected-*` (`-bg`, `-border`, `-text`), plus `.status-badge-*` and `.dash-row-*` helper classes in `globals.css`.

---

## 4. Typography

### 4.1 Family

**Manrope** (loaded in `src/app/layout.tsx` via `next/font` as `--font-brand`) is the only typeface. `--font-sans` and `--font-display` both resolve to it. `--font-mono` (system monospace) is for machine values only: badge codes, registration IDs, token names.

- Weights: 400 body · 500 labels · 600 buttons and UI emphasis · 700 headings. Do not use `font-extrabold` or `font-black`.
- Numbers: add `tabular-nums` to scores, counts, prices and times.
- Do not set inline `fontFamily` styles. The font is global.

### 4.2 Scale (`@theme`)

| Utility | Size | Typical use |
| :--- | :--- | :--- |
| `text-xs` | 12px | Captions, badges, eyebrows |
| `text-sm` | 14px | Labels, helper text, dense tables |
| `text-base` | 16px | Body copy, inputs |
| `text-lg` | 18px | Large buttons, lead text |
| `text-xl` | 24px | Card and modal titles |
| `text-2xl` | 32px | Dashboard page titles |
| `text-3xl` | 48px | Public section titles |
| `text-4xl` | 64px | Hero headline |
| `text-5xl` | 68px | Large display heading |
| `text-6xl` | 80px | Display |

### 4.3 Fluid editorial utilities (`globals.css`)

| Class | Range | Line height |
| :--- | :--- | :--- |
| `.text-fluid-hero` | 40 → 80px, 700 | 1.2 |
| `.text-fluid-h1` | 32 → 50px, 700 | 1.2 |
| `.text-fluid-h2` | 24 → 38px, 700 | 1.21 |
| `.text-fluid-body` | 15 → 18px | 1.6 |
| `.eyebrow` | 12px, 600, 0.08em, uppercase, `ink-muted` | — |

Headings: dashboard page titles are `text-2xl` or `text-3xl font-bold text-ink`. Public sections place an `.eyebrow` above a `.text-fluid-h1` or `.text-fluid-h2`. Uppercase tracked text is only for eyebrows.

---

## 5. Shape, spacing and elevation

### 5.1 Radii

| Token | Value | Utility | Use |
| :--- | :--- | :--- | :--- |
| `--radius-control` | 8px | `rounded-[8px]` | Buttons, inputs, selects, small controls |
| `--radius-panel` | 16px | `rounded-2xl` | Cards, tables, stat cards, toasts |
| `--radius-feature` | 24px | `rounded-3xl` | Feature panels, modals, large map / hero visuals |
| `--radius-full` | 9999px | `rounded-full` | Badges, pills, avatars, switches |

### 5.2 Spacing

A 4/8px rhythm. Cards use `p-6` by default (`p-4` or `p-5` in dense dashboards and tables). Sections on public pages are separated generously. Touch targets are at least 44px (`.tap-target`, `min-h-[44px]` on buttons).

### 5.3 Elevation

Shadows are three-layer and tinted with slate-blue `rgba(71,103,136,…)`, never neutral black.

| Utility | Use |
| :--- | :--- |
| `shadow-card` | Every card resting on the canvas |
| `shadow-elevated` | Hero and feature visuals, hovered interactive cards |
| `shadow-button` | Primary button hover lift |
| `shadow-popover` | Dropdowns, tooltips, toasts, floating controls |
| `shadow-modal` | Dialogs and sheets |

Default card recipe: `rounded-2xl bg-surface border border-border shadow-card`, or `<Card>`, or the `.fest-card` / `.dash-card` classes. Feature panel: `.feature-panel` (24px radius plus `shadow-elevated`).

Modal and sheet scrims are `bg-[#0b3558]/50 backdrop-blur-xs`, a translucent navy rather than black.

---

## 6. Components (`src/components/ui/*`, exported from `@/components/ui`)

| Component | v3 styling notes |
| :--- | :--- |
| `Button` | Variants: `primary` (blue), `dark` (navy), `outline` (white plus hairline, blue on hover), `secondary` (pebble), `ghost`, `danger`, `link`. Sizes `sm` / `md` / `lg`; 8px radius; 44px minimum touch height; `isLoading` spinner. |
| `Badge` | Pills: `confirmed`, `pending`, `rejected`, `live`, `closed`, `accent` (accent-muted with cobalt text), `gold` (awards), `info`, `neutral`. Default icons included. |
| `Card` + `CardHeader/Title/Description/Content/Footer` | 16px radius, hairline border, `shadow-card`; `interactive` adds `border-strong` and `shadow-elevated` on hover. |
| `StatCard` | Card with an accent-muted icon tile, 32px bold tabular value and a delta line. |
| `Input`, `Textarea`, `Select` | 44px height, 8px radius, hairline border, accent border plus a 15% accent focus ring; danger state with message. |
| `Checkbox`, `Radio`, `Switch` | Accent when checked; labels in ink, descriptions in ink-muted. |
| `Tabs` | Segmented control: pebble track; the active tab is a white chip with `shadow-card`. |
| `Table` family | Wrapped in a 16px card; canvas-tinted header row; hairline row dividers. |
| `Modal`, `Sheet` | Native `<dialog>`, 24px radius, `shadow-modal`, navy scrim, focus trap, Esc to close. |
| `DropdownMenu`, `Tooltip`, `Toast` | White surfaces with `shadow-popover`; destructive items use danger tokens. `useToast()` also provides `confirmAction()`. |
| `EmptyState`, `Pagination`, `Breadcrumbs`, `Avatar` | Token-only; accent marks the current page or crumb. |

Global helper classes (`globals.css`): `.btn-primary` / `.btn-ember`, `.btn-dark`, `.btn-outline` / `.btn-gold-outline`, `.fest-card`, `.dash-card`, `.feature-panel`, `.pill-badge`, `.eyebrow`, `.blob-*`, `.status-badge-*`, `.container-shine`, `.tap-target`, `.skeleton`, `.press-scale`.

---

## 7. Themes and modes

- **Light (default)**: everything above.
- **Dark** (`.dark` or `[data-theme="dark"]`): deep-navy workspace. Canvas `#071E33`, surface `#0A2740`, ink `#F0F3F8`, ink-muted `#A6BBD1`, borders `#1B4268`. The accent stays blue. Status surfaces switch to deep tints with light ink. Shadows become dark navy.
- **Stage** (`[data-stage-mode="true"]`): projector, leaderboard and stage screens. Canvas `#041526`, surfaces `#071E33` / `#0B2A47`, white ink, `#C9D7E6` / `#A6BBD1` secondary text, and a brighter accent `#3D8BFF` for LED walls. Navbars are hidden. This is the only place, together with scanner camera viewports, where dark full-screen surfaces belong.
- **Reduced motion**: `prefers-reduced-motion` collapses all animation and transition durations.

The `/design` ThemePlayground toggles Light, Dark and Stage on `<html>` and previews edition accent presets.

### Edition accents

`src/lib/colorUtils.ts` derives hover, active, muted and ink variants from an admin-chosen primary (`deriveAccentPalette`, `generateThemeCss`), and `getContrastSafeInk()` picks white or navy text for AA contrast. The default is Signal Blue `#006BFF` (`DEFAULT_PRIMARY_ACCENT`). The legacy stored value `#FF6B1A` is migrated to it automatically by `resolveThemeColor`.

---

## 8. Do / Don't

| Do | Don't |
| :--- | :--- |
| Use `text-ink` / `text-ink-muted` for text | Use `text-black`, `stone-900`, `slate-900` or any pure black |
| Put white `rounded-2xl` cards with `shadow-card` on `bg-canvas` | Use dark-themed sections on normal pages |
| Use Signal Blue for the single primary action per view | Use orange, multiple accent colors, or gold outside awards |
| Pair `primary` with `outline` | Place a blue primary button directly beside a navy `dark` button |
| Use flat fills and blue-tinted shadows | Use gradients, glows, neon, `shadow-lg`/`xl`, or black shadows |
| Use 8 / 16 / 24px radii plus pills | Use one-off radii such as `rounded-[12px]` or `rounded-xl` on cards |
| Keep Manrope; use `tabular-nums` for numbers | Use inline `fontFamily`, `font-black`, or `font-mono` for prose |
| Use `.eyebrow` for small overline labels | Use ALL-CAPS `tracking-widest` for headings or body labels |
| Use `bg-[#0b3558]/50 backdrop-blur-xs` for scrims | Use `bg-black/80` scrims |
| Keep `text-white` / `text-accent-ink` on accent and navy fills | Put navy or muted text on solid blue |
| Use blobs only behind hero visuals | Use blob magenta or cyan as UI fills (the map "you are here" dot is the one sanctioned exception) |

### Canvas, SVG and WebGL

Libraries that need literal colors (the venue floor plan SVG, three.js, QR codes, canvas labels) use the same palette as hex values: navy `#0B3558`, blue `#006BFF`, slate `#476788`, hairline `#D4E0ED`, canvas `#F8F9FB`, pebble `#F0F3F8`, and magenta `#E55CFF` for the "you are here" marker only.

---

## 9. Files

```
src/
├── styles/tokens.css               # v3 tokens + Tailwind @theme + dark/stage modes
├── app/
│   ├── globals.css                 # base styles, helper classes, legacy bridges
│   ├── layout.tsx                  # Manrope via next/font (--font-brand)
│   └── design/                     # /design showcase (admin only)
│       ├── page.tsx
│       └── components/
│           ├── ThemePlayground.tsx         # light/dark/stage toggle, presets, contrast calculator
│           ├── ColorMatrix.tsx             # live token swatches
│           ├── TypographyMatrix.tsx        # Manrope scale + fluid utilities
│           ├── ShapeElevationMatrix.tsx    # radii, shadows, blobs
│           ├── ComponentPreviewMatrix.tsx  # buttons, forms, stat cards
│           └── DataDisplayPreviewMatrix.tsx# badges, tabs, table, cards, modal, sheet, toast
├── components/ui/                  # component library (see section 6)
└── lib/colorUtils.ts               # contrast math + edition accent derivation (tested in __tests__)
```
