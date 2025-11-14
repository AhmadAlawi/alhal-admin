# Design Guide - Al-Hal Admin Dashboard

## 🎨 Visual Design System

### Color Palette

#### Primary Colors
```
Primary:   #6366f1 (Indigo)  ████████
Secondary: #10b981 (Green)   ████████
Warning:   #f59e0b (Amber)   ████████
Danger:    #ef4444 (Red)     ████████
```

#### Background Colors
```
BG Primary:   #0f172a (Dark Blue)      ████████
BG Secondary: #1e293b (Slate)          ████████
BG Tertiary:  #334155 (Light Slate)    ████████
```

#### Text Colors
```
Text Primary:   #f1f5f9 (Almost White)  ████████
Text Secondary: #cbd5e1 (Light Gray)    ████████
Text Muted:     #94a3b8 (Gray)          ████████
```

#### Border Colors
```
Border: #334155 (Slate) ████████
```

---

## 📐 Layout Structure

### Desktop Layout (1920px)
```
┌─────────────────────────────────────────────────────┐
│                     Header (70px)                   │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │         Main Content Area                │
│ (260px)  │                                           │
│          │  ┌──────────────────────────────┐        │
│  [Icon]  │  │                              │        │
│  Menu 1  │  │      Page Content            │        │
│  Menu 2  │  │                              │        │
│  Menu 3  │  │                              │        │
│  Menu 4  │  └──────────────────────────────┘        │
│  Menu 5  │                                           │
│          │                                           │
│  [User]  │                                           │
└──────────┴──────────────────────────────────────────┘
```

### Mobile Layout (768px and below)
```
┌─────────────────────────────┐
│   Header with ☰ Menu        │
├─────────────────────────────┤
│                             │
│     Full Width Content      │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   Page Content      │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘

(Sidebar slides in from left)
```

---

## 🎯 Component Designs

### Stat Card
```
┌────────────────────────────────┐
│  TOTAL USERS            [Icon] │
│                                │
│  8,282                         │
│  ↑ 12.5%                       │
└────────────────────────────────┘
```

### Table
```
┌────────────────────────────────────────────┐
│ ID    │ NAME        │ EMAIL      │ STATUS  │
├────────────────────────────────────────────┤
│ #001  │ John Doe    │ john@...   │ ✓ Active│
│ #002  │ Jane Smith  │ jane@...   │ ✓ Active│
│ #003  │ Bob Jones   │ bob@...    │ ⚠ Pending│
└────────────────────────────────────────────┘
```

### Chart
```
┌────────────────────────────────┐
│  Revenue Overview              │
│                                │
│      ╱╲                        │
│     ╱  ╲      ╱╲               │
│    ╱    ╲    ╱  ╲              │
│  ╱       ╲╱╱     ╲             │
│ ────────────────────────       │
│ Jan Feb Mar Apr May Jun        │
└────────────────────────────────┘
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop First Approach */

Desktop:  > 1366px  (Full layout)
Laptop:   1024-1366px (Optimized layout)
Tablet:   768-1024px (Adjusted spacing)
Mobile:   < 768px   (Stacked layout, collapsible sidebar)
```

---

## 🎭 Animation & Transitions

### Page Transitions
```css
Duration: 0.3s
Easing: ease-in
Effect: Fade in + Slide up (10px)
```

### Hover Effects
```css
Duration: 0.2s
Easing: ease
Effects:
  - Cards: translateY(-2px) + shadow
  - Buttons: translateY(-1px) + shadow
  - Menu items: background color change
```

### Sidebar Toggle
```css
Duration: 0.3s
Easing: ease
Effect: Slide (translateX)
```

---

## 🔤 Typography Scale

```
Page Title:       32px / 2rem     (Bold)
Section Title:    24px / 1.5rem   (Semi-bold)
Card Title:       18px / 1.125rem (Semi-bold)
Body Text:        14px / 0.875rem (Regular)
Small Text:       12px / 0.75rem  (Regular)
Tiny Text:        11px / 0.6875rem(Regular)
```

### Line Heights
```
Headings: 1.2
Body:     1.6
Compact:  1.4
```

---

## 📦 Spacing System

Based on 8px grid:

```
xs:  0.25rem (4px)
sm:  0.5rem  (8px)
md:  0.75rem (12px)
base: 1rem   (16px)
lg:  1.5rem  (24px)
xl:  2rem    (32px)
2xl: 3rem    (48px)
```

### Component Padding
```
Cards:    1.5rem (24px)
Buttons:  0.625rem 1.25rem (10px 20px)
Inputs:   0.75rem 1rem (12px 16px)
```

---

## 🎨 Shadow System

```css
/* Small Shadow */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large Shadow */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
```

---

## 🔲 Border Radius

```
Small:  0.375rem (6px)
Medium: 0.5rem   (8px)
Large:  0.75rem  (12px)
Full:   9999px   (Pills/Circles)
```

---

## 📍 Icon Sizes

```
Small:  1rem     (16px)
Medium: 1.25rem  (20px)
Large:  1.5rem   (24px)
XL:     1.75rem  (28px)
```

---

## 🎯 Badge Styles

### Success Badge
```
Background: rgba(16, 185, 129, 0.2)
Color:      #10b981
Border:     None
Padding:    0.25rem 0.75rem
Radius:     9999px (full)
```

### Warning Badge
```
Background: rgba(245, 158, 11, 0.2)
Color:      #f59e0b
Border:     None
Padding:    0.25rem 0.75rem
Radius:     9999px (full)
```

### Danger Badge
```
Background: rgba(239, 68, 68, 0.2)
Color:      #ef4444
Border:     None
Padding:    0.25rem 0.75rem
Radius:     9999px (full)
```

---

## 🌈 Gradient Styles

### Primary Gradient
```css
background: linear-gradient(135deg, #6366f1, #818cf8);
```

### Success Gradient
```css
background: linear-gradient(135deg, #10b981, #34d399);
```

### Background Gradient
```css
background: linear-gradient(180deg, #1e293b 0%, #1a2332 100%);
```

---

## 🎨 Button Styles

### Primary Button
```
Background: #6366f1
Color:      white
Hover:      #4f46e5 + translateY(-1px)
Padding:    0.625rem 1.25rem
Radius:     0.5rem
```

### Secondary Button
```
Background: #334155
Color:      #f1f5f9
Hover:      #475569
Padding:    0.625rem 1.25rem
Radius:     0.5rem
```

---

## 📊 Chart Colors

```
Line/Area: #6366f1 (Primary)
Bar:       #10b981 (Success)
Accent:    #f59e0b (Warning)
Grid:      #334155 (Border)
Tooltip:   #1e293b (BG Secondary)
```

---

## 🔍 Input Styles

```
Background: #334155 (BG Tertiary)
Border:     1px solid #334155
Radius:     0.5rem
Padding:    0.75rem 1rem
Color:      #f1f5f9

Focus:
  Border:     #6366f1
  Background: #1e293b
  Outline:    None
```

---

## 🎭 Component States

### Default
- Normal appearance

### Hover
- Slight lift (translateY)
- Enhanced shadow
- Color brightness increase

### Active
- Background color change
- Border accent (left border for menu)

### Focus
- Border color change
- Background adjustment
- No outline ring

### Disabled
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

---

## 📐 Grid Layouts

### Stats Grid
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1.5rem;
```

### Charts Grid
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
gap: 1.5rem;
```

---

## 🎨 Dark Theme Philosophy

### Principles
1. **Low Light Emission** - Easy on eyes in dark environments
2. **High Contrast** - Clear text readability
3. **Gradient Accents** - Modern, premium feel
4. **Subtle Shadows** - Depth perception
5. **Smooth Transitions** - Polished experience

### Color Temperature
- Cool tones (Blues, Grays)
- Warm accents (Amber warnings)
- Balanced saturation

---

## 📱 Mobile Optimizations

### Touch Targets
- Minimum: 44px × 44px
- Spacing: 8px between elements

### Text Sizes
- Slightly larger on mobile
- More generous line heights

### Navigation
- Hamburger menu
- Full-screen sidebar overlay
- Bottom action buttons (optional)

---

## ♿ Accessibility

### Color Contrast Ratios
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus Indicators
- Visible keyboard focus
- Clear tab order

### Semantic HTML
- Proper heading hierarchy
- ARIA labels (can be added)
- Alt text for images

---

## 🎯 Design Inspiration

This design follows modern SaaS dashboard trends:
- Vercel Dashboard
- Linear App
- Stripe Dashboard
- Tailwind UI
- shadcn/ui

---

## 🛠️ Customization Tips

### Change Theme Color
Edit `src/index.css`:
```css
:root {
  --primary-color: #your-color;
}
```

### Add Light Mode
Add CSS variables for light theme:
```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
  /* ... more variables */
}
```

### Adjust Spacing
Change the spacing scale in your CSS.

---

Your design system is complete and ready to use! 🎨

