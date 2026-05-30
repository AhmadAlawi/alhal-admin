---
name: Sovereign State Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f493f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7a6e'
  outline-variant: '#becabc'
  surface-tint: '#006d30'
  primary: '#00652c'
  on-primary: '#ffffff'
  primary-container: '#15803d'
  on-primary-container: '#d3ffd5'
  inverse-primary: '#79db8d'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#54585a'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d7072'
  on-tertiary-container: '#f3f5f7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f8a7'
  primary-fixed-dim: '#79db8d'
  on-primary-fixed: '#00210a'
  on-primary-fixed-variant: '#005323'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Alexandria
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Alexandria
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl:
    fontFamily: Alexandria
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: Alexandria
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Alexandria
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Alexandria
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Alexandria
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Alexandria
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-end administrative governance, balancing absolute authority with modern accessibility. The brand personality is **Stately, Precise, and Progressive**. It moves away from heavy, dated bureaucratic interfaces toward a "Glass-Corporate" aesthetic—combining the reliability of institutional design with the lightness of modern SaaS.

The visual language utilizes **Modern Minimalism** with **Glassmorphism** accents. High-density information is organized through generous whitespace and a sophisticated layering system, ensuring that the user feels a sense of calm and clarity while managing complex state-level data. The emotional response is one of trust, efficiency, and architectural permanence.

## Colors

The palette is anchored by a refined **Emerald State Green (#15803D)**, representing growth and national identity. This is paired with a deep **Midnight Slate (#0F172A)** for primary typography and navigation, grounding the interface in professional authority.

- **Primary:** Used for active states, primary actions, and brand reinforcement.
- **Secondary:** Used for sidebar navigation backgrounds and high-level headers to provide contrast.
- **Surface Tiers:** Employs a range of extremely soft greys (Slate 50 through 200) to create "paper-on-stone" depth.
- **Functional Colors:** Error (Rose), Warning (Amber), and Success (Emerald) are desaturated to maintain the sophisticated, high-end tone.

## Typography

This design system utilizes **Alexandria** across all roles. Alexandria is a premium, high-readability typeface that excels in both Arabic and Latin scripts, maintaining a mathematical precision that feels inherently modern and professional.

**Scale Philosophy:**
- **Display & Headlines:** Use heavier weights (600-700) with tighter tracking for a commanding presence.
- **Body Text:** Standardized at 16px for optimal legibility in data-heavy administrative environments.
- **Labels:** Set in Medium or Semi-Bold to ensure they stand out against form fields and metadata clusters.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. The main administrative dashboard is constrained to a 1440px max-width container to prevent line-length issues on ultra-wide monitors, while the inner content areas utilize a 12-column fluid system.

- **Desktop:** 12 columns, 24px gutters, 40px outer margins.
- **Tablet:** 8 columns, 16px gutters, 24px outer margins.
- **Mobile:** 4 columns, 16px gutters, 16px outer margins.

Spacing is strictly 4px-based. Use `md` (24px) for standard component grouping and `xl` (48px) for major sectional breaks.

## Elevation & Depth

Depth is conveyed through a "Glass-Stack" model. Rather than heavy, muddy shadows, this design system uses **Ambient Tonal Layers** and **Translucent Background Blurs**.

- **Level 0 (Base):** The foundational canvas, colored in Slate 50.
- **Level 1 (Cards/Containers):** Pure white background with a 1px border (#E2E8F0) and a very soft, high-diffusion shadow: `0 4px 20px -2px rgba(0,0,0,0.05)`.
- **Level 2 (Modals/Overlays):** Utilizes glassmorphism. A white surface with 80% opacity and a 12px backdrop blur.
- **Level 3 (Popovers):** High-contrast surfaces with a refined 1px "inner glow" border to separate the element from the blurred background.

## Shapes

The shape language is **Professional and Softened**. A "Soft" roundedness (4px - 12px) is used to humanize the authoritative structure. Sharp corners are avoided to reduce visual fatigue, but overly rounded "pill" shapes are restricted to specific interactive elements like tags or toggle switches to maintain a serious tone.

- **Buttons & Inputs:** 6px radius.
- **Cards & Panes:** 12px radius.
- **Selection Indicators:** 4px radius.

## Components

### Buttons & Inputs
- **Primary Action:** Solid Emerald Green (#15803D) with white text. On hover, the color deepens slightly, and a subtle 2px glow appears.
- **Secondary Action:** Ghost-style buttons with a Slate 200 border.
- **Inputs:** White backgrounds with Slate 300 borders. Focus states transition the border to Emerald Green with a 3px soft outer ring (Primary Color at 10% opacity).

### Glass Cards
Dashboard widgets must use the Glassmorphism style: `background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3);`.

### Data Tables
Tables are the heart of the admin portal. They feature zero-border rows, using alternating subtle grey fills on hover. Headers are uppercase `label-sm` in Midnight Slate with a 1px bottom divider.

### Iconography
Use thin-stroke (Light or Regular weight) linear icons. Icons should be monochrome (Slate 500) unless indicating an active state, where they adopt the Primary Emerald Green.

### Micro-interactions
- **Hover Transitions:** All interactive elements use a 200ms ease-out transition on scale and background color.
- **Loading:** Use a refined "shimmer" effect on cards rather than spinning loaders for a premium feel.