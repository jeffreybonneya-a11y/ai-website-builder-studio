---
name: Obsidian Crimson Studio
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1e'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#e6bdba'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#ac8886'
  outline-variant: '#5c3f3e'
  surface-tint: '#ffb3b0'
  primary: '#ffb3b0'
  on-primary: '#68000f'
  primary-container: '#ff5357'
  on-primary-container: '#5c000c'
  inverse-primary: '#bf0024'
  secondary: '#c4c6d0'
  on-secondary: '#2d3038'
  secondary-container: '#44474f'
  on-secondary-container: '#b3b5be'
  tertiary: '#b9c8de'
  on-tertiary: '#233143'
  tertiary-container: '#8392a6'
  on-tertiary-container: '#1c2b3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#930019'
  secondary-fixed: '#e0e2ec'
  secondary-fixed-dim: '#c4c6d0'
  on-secondary-fixed: '#191c22'
  on-secondary-fixed-variant: '#44474f'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a dark, cinematic creative atmosphere tuned specifically for power creators, software engineers, and founders constructing cutting-edge web experiences with AI. It merges the ultra-crisp, high-contrast monochrome elegance of luxury media with the electric underground pulse of an elite hacker aesthetic.

### Visual Mood & Persona
- **Atmospheric & Immersive:** Deep obsidian canvas tiers reminiscent of a high-end film grade suite, accentuated by subtle radial vignettes and soft specular reflections.
- **Electric Precision:** High-voltage hoodie red provides sharp visual puncturing, commanding immediate focus without fatiguing the viewer.
- **Underground Craftsmanship:** Confident, deliberate typography paired with razor-thin structural dividers, evoking high-performance terminals and executive-tier design tools.

## Colors

The palette establishes an obsidian-first color architecture where absolute darkness meets surgical precision. Accent hues are deployed with restraint, reserved for high-leverage triggers, AI status indicators, and key focus rings.

### Palette Architecture
- **Base Canvas (`#08080A`):** The foundational obsidian floor. Sets cinematic depth and prevents gray washouts across OLED screens.
- **Surface Elevation 1 (`#0D0E12`):** Primary panel layer, side drawers, and navigation shells.
- **Surface Elevation 2 (`#13151B`):** Input containers, cards, and modal dialog bodies.
- **Surface Elevation 3 (`#1A1D24`):** Interactive hover states, elevated controls, and active pill backgrounds.
- **Primary Accent (`#FF3B47`):** Direct visual translation of the red-hoodie tone. Utilized for primary actions, prompt submission buttons, processing glow pulses, and critical milestones.
- **Accent Muted (`rgba(255, 59, 71, 0.12)`): Backing wash for tags, hover rings, and active state badges.
- **Text & Borders:**
  - `Text-Primary`: `#FFFFFF` — clean contrast for all headlines, key metrics, and user input.
  - `Text-Secondary`: `#94A3B8` — body copy, metadata, and prompt suggestions.
  - `Text-Muted`: `#64748B` — disabled values, secondary shortcuts, and timestamps.
  - `Border-Subtle`: `rgba(255, 255, 255, 0.08)` — ghost structural dividers.
  - `Border-Active`: `rgba(255, 59, 71, 0.45)` — focused inputs and hero selections.

## Typography

The typographic hierarchy balances impactful, heavy display titles with utilitarian legibility for multi-line AI generation prompts and generated codebase previews.

- **Headlines (Plus Jakarta Sans):** Set with tight letter tracking (`-0.03em` on display styles) to deliver punchy, bold presence akin to modern luxury editorial layouts.
- **Body Text (Inter):** Highly legible neutral grotesque with micro-spacing optimized for dark mode contrast, preventing eye fatigue during prolonged prompt engineering sessions.
- **Code & Metadata (JetBrains Mono):** Reserved for prompt token counts, latency badges, model parameters, API snippets, and system logs.

## Layout & Spacing

Layouts follow a structured 12-column fluid grid system pinned to a max content envelope of 1440px. 

### Grid & Viewport Scaling
- **Desktop (1024px+):** 12 columns with `1.5rem` gutters and `3rem` side gutters. Hero workspaces prioritize centered prompt generators flanked by ambient canvas preview viewports.
- **Tablet (768px - 1023px):** 8 columns with `1rem` gutters and `2rem` side gutters. Secondary tools collapse into overlay sheets.
- **Mobile (<768px):** 4 columns with `1rem` gutters and `1.25rem` screen margins. Full-bleed interactive cards and stacked studio toolbars.

### Spatial Rhythm
Internal component spacing strictly adheres to the 4px baseline (`0.25rem` increments). Studio control bars and prompt composer wrappers rely on generous inner breathing room (`space-lg` to `space-xl`) to anchor focus on core workflows.

## Elevation & Depth

Visual hierarchy does not use high-drop shadows or gray drop cutouts. Depth is achieved entirely through chromatic layering, micro-borders, and targeted ambient luminosity:

- **Tonal Tiers:** Components sit on consecutive surface levels (`#08080A` canvas -> `#0D0E12` card background -> `#13151B` prompt capsule).
- **Subtle Ghost Borders:** Every container, dropdown, and floating card uses a crisp `1px` translucent edge (`rgba(255, 255, 255, 0.07)` to `rgba(255, 255, 255, 0.12)`) that catches peripheral light without breaking dark immersion.
- **Ambient Crimson Bloom:** High-value focal points (active prompt input, primary CTA, generation running state) emit an extra-diffused crimson halo:
  `box-shadow: 0 0 35px -5px rgba(255, 59, 71, 0.35)`.
- **Atmospheric Vignette:** Page backdrops feature a low-frequency radial gradient centered behind hero visual assets, falling off into pitch black toward the edges.

## Shapes

The system uses balanced, modern curvature that softens technical interfaces while maintaining structural discipline:

- **Interactive Chips & Status Badges:** Full-pill radiuses (`rounded-full` / `9999px`) provide sleek ergonomics for filtering and generation parameters.
- **Prompt Composer & Primary Surfaces:** Medium roundedness (`12px` to `16px`) to frame user thoughts like a premium hardware console.
- **Buttons & Small Controls:** Precise `8px` corner radii (`rounded-md`), communicating immediate tactility.

## Components

### Top Navigation Bar
- Ultra-slim `56px` height floating header with backdrop blur (`backdrop-blur-md`, `rgba(8, 8, 10, 0.8)`).
- Subdued hairline bottom border (`rgba(255, 255, 255, 0.06)`).
- Brand lockup pinned left, flat slate gray nav links (`#94A3B8`) transitioning to crisp white on hover with a red dot indicator, and a compact red outline or solid CTA button on the right.

### AI Prompt Composer
- Central command surface anchored inside `#13151B` with an ambient glow and subtle `1px` border (`rgba(255, 255, 255, 0.1)`).
- Expands dynamically with multi-line auto-resizing text fields.
- Integrated bottom toolbar housing parameter tags, file drop triggers, token counter, and an illuminated circular or pill-shaped crimson send button (`#FF3B47` background with a crisp white icon).

### Pill Badge Tags & Chips
- Slender pill format (`rounded-full`) with `#1A1D24` fill and `rgba(255, 255, 255, 0.08)` stroke.
- Includes a leading micro-dot (green for ready, crimson for live AI tasks, slate for idle).
- Interactive filter pills gain a soft red border and crimson text highlight upon activation.

### Buttons & CTAs
- **Primary:** Solid `#FF3B47` background, white bold text, subtle red ambient shadow. Hover: slight luminance lift (`#FF4F5A`) and scale transform (`1.01`).
- **Secondary / Ghost:** Transparent background with `#1A1D24` or `rgba(255, 255, 255, 0.1)` border. White text with red border glow on focus.
- **Icon Buttons:** `#13151B` square or rounded-full containers with `#94A3B8` glyphs switching to `#FFFFFF` on hover.

### Hero Artwork Integration
- Artwork panels featuring the red-hoodie aesthetic are treated as hero centerpieces within a dedicated ambient spotlight container.
- Surrounded by soft radial obsidian gradients that eliminate hard image rectangular edges and fuse the character directly into the dark canvas.