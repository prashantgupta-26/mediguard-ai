---
name: MediKiosk Aesthetic
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#006948'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855d'
  on-tertiary-container: '#f5fff7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-kiosk: 1.5rem
  margin-kiosk: 2rem
  touch-target-min: 3.5rem
---

## Brand & Style

This design system serves as an AI-powered clinical intake infrastructure operating within high-density outpatient departments, diagnostic centers, and hospital reception kiosks across India. The aesthetic bridges clinical precision with welcoming public-health empathy, catering simultaneously to tech-literate doctors, anxious patients, and elderly or low-literacy users navigating digital kiosks in regional healthcare environments.

The visual direction combines **Minimalist Clinical SaaS** with **Soft Glassmorphism** and high-affordance tactile interaction:
- **Atmosphere:** Calm, antiseptic yet warm, authoritative, transparent, and non-intimidating. It avoids the coldness of bureaucratic software while refraining from frivolous consumer tropes.
- **Key Tenets:** Extreme legibility, large touch targets (minimum 48px to 56px for physical kiosk tap ergonomics), high visual contrast, multi-layered visual scaffolding (dual icon-and-text cues), and soothing optical white-space to de-escalate waiting-room cognitive stress.
- **Glassmorphic Touch:** Soft translucent frosted headers and floating action trays layered over pure clinical white surfaces provide an elevated, modern digital-health presence without sacrificing accessibility or frame rates on varied hardware.

## Colors

The palette establishes an immediate sensation of hygiene, biological health, and clinical authority. Light mode is the default and mandatory operational baseline for public intake kiosks, optimizing readability under direct overhead fluorescent lighting.

### Functional Palette Mapping:
- **Primary (`#0D9488` Deep Teal):** The primary operational color used for primary CTA buttons, active state rings, selected triage chips, and vital brand anchors. Supported by `#0F766E` for active/pressed interactions and `#14B8A6` for soft focus halos.
- **Secondary (`#0284C7` Clinical Sky Blue):** Used for informational accents, system guidance steps, AI processing indicators, and interactive instructional cues. Paired with `#38BDF8` for ambient tinting.
- **Tertiary (`#059669` Emerald Green):** Denotes verified identity, validated vitals, successful OTP submissions, and non-critical triage status.
- **Neutral System (`#0F172A` Deep Slate Navy):** The structural core. Replaces harsh true black with deep slate navy, rendering clinical text legible without glare. `#1E293B` provides softer sub-copy hierarchy, while `#64748B` handles non-essential metadata.
- **Backgrounds & Canvases:** Primary canvas relies on `#F8FAFC` (Cool Off-White) transitioning into `#F0FDF4` (Pale Mint Mist) for reassuring intake confirmation zones. Elevated surfaces utilize clean `#FFFFFF` and `#F1F5F9`.
- **Triage & Warning Accents:** `#D97706` (Amber) for priority triage or incomplete forms; `#DC2626` (Crimson) exclusively reserved for severe symptoms, emergency escalation triggers, and error validations.

## Typography

**Plus Jakarta Sans** is the single typographic voice across headlines, body copy, and UI controls. Its open apertures, tall x-height, clear differentiation between glyphs (e.g., capital 'I', numeral '1', lowercase 'l'), and friendly geometric construction ensure maximum optical recognition.

### Typographic Principles:
- **Elderly & Multi-Lingual Legibility:** Never drop below `14px` for system instructions on kiosks. Standard body intake text defaults to `body-lg` (`18px`) on touch kiosks to accommodate standing reading distances of 45–60 cm.
- **Triage Visual Priority:** Key questions ("Are you experiencing chest pain?") require `headline-lg` or `headline-md` paired with prominent auxiliary icons.
- **Multilingual Accommodation:** The line heights maintain extra padding (`1.4x` to `1.55x` ratio) to avoid glyph clipping when rendering Indic scripts (Hindi, Tamil, Telugu, Marathi, Bengali) in localized kiosk iterations.

## Layout & Spacing

The layout is built around an **8pt clinical rhythm** calibrated specifically for dual deployment: large vertical touchscreen kiosks (e.g., 21"–32" portrait displays) and assistive mobile web interfaces.

### Grid & Breakpoints:
- **Kiosk Portrait (1080x1920 / Large Tablets):** 8-column fluid grid, `24px` gutters, `32px` outer boundary margins. All primary actions and intake questions sit within an ergonomic "Comfort Tap Zone" positioned between 800px and 1400px from the bottom edge to facilitate seated wheelchair users and standing patients alike.
- **Desktop Clinical Admin Dashboard (1280px+):** 12-column layout, `24px` gutters, max container width of `1440px`.
- **Patient Mobile Companion (< 768px):** 4-column layout, `16px` gutters, `16px` outer margin.

### Spacing Philosophy:
Whitespace serves as a cognitive anchor. Every clinical step must present a single atomic concept per card view to eliminate the sensory overload typical of Indian hospital check-in areas.

## Elevation & Depth

Visual hierarchy leverages a hybrid model of **Tonal Layering**, **Frosted Glassmorphism**, and **Teal-Tinted Ambient Shadows**.

### Elevation Tiers:
- **Base Level 0 (Canvas):** `#F8FAFC`. Completely non-reflective flat canvas.
- **Level 1 (Card & Module Layer):** Pure `#FFFFFF` surface accompanied by an ultra-subtle border (`1px solid rgba(226, 232, 240, 0.8)`) and an ambient tinted drop-shadow: `0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(13, 148, 136, 0.03)`.
- **Level 2 (Active Cards, Selection States, Modals):** `#FFFFFF` paired with an elevated float: `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(13, 148, 136, 0.06)`.
- **Level 3 (Glassmorphic Overlay Headers & Sticky Footer Trays):** Background set to `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(16px)` and a crisp bottom/top hairline border of `1px solid rgba(255, 255, 255, 0.6)`. This keeps persistent back buttons, language pickers, and voice assistants accessible over scrolling lists.

## Shapes

The design uses **Roundedness Level 2** (`rounded-md: 0.5rem`, `rounded-lg: 1rem`, `rounded-xl: 1.5rem`).

- **Interactive Cards & Containers:** Standardized at `rounded-xl` (`1.5rem` / `24px`). The soft curves dismantle clinical severity, projecting safety and high approachable value.
- **Buttons, Form Controls & Chips:** Employ `rounded-lg` (`1rem` / `16px`) for standard controls, scaling up to full pill shapes (`rounded-full`) exclusively for status badges, conversational voice widgets, and language selectors.
- **Tactile Inner Affordances:** Internal slots, icon badges, and input text fields utilize `rounded-md` (`0.5rem` / `8px`) to preserve structural clarity within outer containers.

## Components

### 1. Buttons
- **Primary Action (Next Step / Confirm / OTP Verify):** Solid `#0D9488` background, `#FFFFFF` text, `56px` minimum height for touch reliability, `rounded-lg`. Hover/Tap: `#0F766E` with a subtle scale down (`transform: scale(0.98)`).
- **Secondary Action (Back / Edit / Skip):** Pure `#FFFFFF` card background with `1.5px solid #E2E8F0`, `#0F172A` text.
- **Emergency Escalation Button:** Highlighted in subtle light red `#FEF2F2` with `#DC2626` text, prominent SOS medical cross icon, and instant-priority routing.

### 2. Large Symptom & Language Selection Chips
- Designed as oversized touch cards (`min-height: 72px`).
- Inactive: `#FFFFFF` fill, `1.5px solid #E2E8F0`, dark slate text, auxiliary dual-tone icon on the left.
- Active: Soft cyan wash `#F0FDFA`, crisp `2px solid #0D9488` border, bold teal label, and an animated emerald checkmark icon on the right.

### 3. Input Fields & Numeric Keypads
- For entering phone numbers, Aadhaar/ABHA IDs, and OTPs.
- Input height is `64px` with large, centered `headline-md` typography.
- Border shifts from `1.5px solid #CBD5E1` to `2px solid #0D9488` with a glowing teal outer ring (`box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.15)`).
- Accompanied by an on-screen high-contrast numeric keypad featuring large, tactile `72px` square key targets.

### 4. Interactive Intake Cards
- Structured question wrappers showcasing:
  1. Category pill (e.g., "Vital Signs", "Past History").
  2. Question title in `headline-sm`.
  3. Contextual illustration or audio-readout trigger icon.
  4. Response slots (Yes / No / Unsure) arranged horizontally with unambiguous visual icons (Thumb up, Thumb down, Question mark).

### 5. AI Triage & Voice Dictation Assist Bar
- Persistent bottom pill-shaped drawer (`rgba(255, 255, 255, 0.9)`, glassmorphic blur).
- Displays real-time bilingual voice transcription ("Listening in Hindi / हिन्दी में सुन रहे हैं..."), an animated teal/sky-blue soundwave visualizer, and a quick switch button for high-contrast accessibility mode.