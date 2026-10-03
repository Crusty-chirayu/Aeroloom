# Aeroloom — Brand Design System & Identity Manual

> **Version:** 2.0.0-editorial  
> **Design Philosophy:** Editorial Aviation  
> **Canonical Source:** `components/brand/AeroloomLogo.tsx`  
> **Theme Enforcement:** 100% Light Mode (`#F6F4EE` warm paper)

---

## 1. Brand Philosophy & Narrative

Aeroloom is a live airspace intelligence observatory. Its aesthetic sensibility bridges mid-century Swiss editorial cartography and real-time flight deck telemetry. 

The name fuses **Aero** (flight, aerodynamics, atmosphere) and **Loom** (the intricate weaving of invisible contrails, vectors, and airways that criss-cross the planetary troposphere).

### Core Brand Principles

1. **Paper & Ink, Not Phosphor & Glass:**  
   Unlike sci-fi HUDs or heavy, dark-themed radar trackers, Aeroloom renders the sky on warm archival paper (`#F6F4EE`) using deep carbon ink (`#0E1116`) and precise hairlines.

2. **Instrument Precision:**  
   Every curve, number, and rule has functional justification. Monospaced typography with tabular numerals (`tabular-nums`) ensures zero layout jitter when live airframes update.

3. **Singular Vermilion Signal:**  
   Color is reserved for intentional focus. The primary palette is 85% neutral, with a single confident vermilion beacon (`#FF4F1F`) guiding the observer’s eye to live transponder contacts and active flight vectors.

---

## 2. Brand Mark Anatomy & Geometric Construction

The Aeroloom mark is an original vector composition designed on a calibrated **32×32 unit vector grid**.

```
           [0,0] ────────────────────── [32,0]
             │                            │
             │       ╭────────╮           │   (Ascending flight vector)
             │      ╱   ╭──╮   ╲          │
             │     ╱   ╱    ╲   ╲  ●──────┼── Live Transponder Beacon
             │    ╱   ╱      ╰───╯        │   (cx: 26.5, cy: 17, r: 2.8)
             │   ╰───╯                    │
             │     ╲  Loom Weave          │
             │      ╲ (Contrail lattice)  │
           [0,32] ───────────────────── [32,32]
```

### Components:

1. **The Weft Thread (Ascending Flight Vector):**
   - **Path:** `M 5 24 C 9 24, 12 18, 15 12 C 17.5 7, 21.5 5.5, 24.5 7.5 C 27.5 9.5, 27 15, 23.5 18 C 19 22, 11 22.5, 7.5 17 C 4.5 12, 7 6.5, 13.5 6.5 C 19 6.5, 23.5 11, 26.5 17`
   - **Stroke Weight:** 2.4 units (7.5% of grid width) with rounded caps and joins.
   - **Meaning:** Represents continuous aerodynamic climb, banking turn, and trajectory through three-dimensional airspace.

2. **The Warp Thread (Loom Cross-Weave):**
   - **Path:** `M 10 9 C 14 13, 18 19, 22 25`
   - **Stroke Dasharray:** `0.1 6.5` with round caps.
   - **Meaning:** Represents the lateral contrail lattice and transponder interrogation pulses weaving the airspace into a cohesive fabric.

3. **The Transponder Beacon Dot:**
   - **Geometry:** Circle at `cx: 26.5, cy: 17, r: 2.8` units.
   - **Fill:** Vermilion (`#FF4F1F`).
   - **Meaning:** The live aircraft position blip in real-time space and time.

---

## 3. Clear Space & Size Scale

### Clear Space Rule
A minimum clear space equal to **50% of the mark's rendered width** must be maintained around the logo on all sides, free from other typography, borders, or iconography.

### Standard Size Scale

| Size Code | Rendered Size | Primary Context | Component Props |
| :--- | :--- | :--- | :--- |
| **Micro / Favicon** | 16px – 20px | Browser tab, compact table badges | `size="sm"` or `size={20}` |
| **Navigation** | 24px – 28px | Desktop nav rail, header lockups | `size="md"` or `size={28}` |
| **Card / Bento** | 36px – 38px | Dossier headers, modal titles | `size="lg"` or `size={38}` |
| **Hero Display** | 48px – 64px+ | Landing hero, splash cards | `size="xl"` or `size={52}` |

---

## 4. Logo Variants & Component Usage

The official component is exported from `@/components/brand/AeroloomLogo`:

```tsx
import { AeroloomLogo, AeroloomMark } from '@/components/brand/AeroloomLogo';

// 1. Horizontal Lockup (Default)
<AeroloomLogo variant="lockup" size="md" />

// 2. Mark Only (Rail / Favicon / Mobile)
<AeroloomLogo variant="mark" size={24} />

// 3. Editorial Wordmark Only
<AeroloomLogo variant="wordmark" size="lg" />

// 4. Monochrome (Print / Technical Documents)
<AeroloomLogo variant="monochrome" size="md" />
```

---

## 5. Color Tokens & Contrast Matrix

All colors are strictly calibrated for WCAG AA compliance against `#F6F4EE`:

| Token | Hex Value | Role | Min Contrast on `#F6F4EE` |
| :--- | :--- | :--- | :--- |
| `--paper` | `#F6F4EE` | Primary canvas & card surface | 1.00:1 (Base) |
| `--paper-2` | `#EFECE4` | Recessed panels, table rows | Subtle surface |
| `--ink` | `#0E1116` | Primary headlines, brand mark | **15.2:1 (AAA)** |
| `--ink-2` | `#3B4250` | Body prose, secondary labels | **8.1:1 (AAA)** |
| `--ink-3` | `#6E7686` | Metadata, tabular units, borders | **4.6:1 (AA)** |
| `--signal` | `#FF4F1F` | Transponder beacon, active flight | Focus accent |
| `--signal-ink` | `#C93A10` | Accent text on light surfaces | **4.9:1 (AA)** |
| `--signal-wash` | `#FFE9E1` | Active pill badges, selection tint | Tint background |
| `--sky` | `#2B62F0` | Altitude vector, radar weather | Secondary signal |

---

## 6. Typography System

1. **Display & Expressive Titles:**
   - **Typeface:** *Instrument Serif* (Google Fonts)
   - **Weights:** Regular 400, Italic 400
   - **Usage:** Editorial headlines, landing hero, section lead-ins. Mix roman and italic words in the same phrase for rhythm (e.g. `Airspace Sector <span className="italic">Void</span>`).

2. **Interface & Prose:**
   - **Typeface:** *Geist Sans* (Vercel)
   - **Weights:** Regular 400, Medium 500, SemiBold 600
   - **Usage:** Button labels, navigation items, descriptive copy.

3. **Data & Telemetry:**
   - **Typeface:** *Geist Mono* (Vercel)
   - **Weights:** Regular 400, Medium 500, Bold 700
   - **Features:** Strict tabular figures (`font-variant-numeric: tabular-nums`), uppercase micro-labels (`tracking-[0.06em]`).

---

## 7. Anti-Patterns (Strictly Prohibited)

- ❌ **Do NOT** place the logo on a dark or black background.
- ❌ **Do NOT** apply drop shadows, blurs, or glow filters to the mark.
- ❌ **Do NOT** rotate, stretch, shear, or flip the mark geometry.
- ❌ **Do NOT** replace the vermilion beacon (`#FF4F1F`) with blue, green, or generic yellow.
- ❌ **Do NOT** pair the mark with generic sans-serif fonts (Arial, Roboto, Helvetica) in marketing lockups.
- ❌ **Do NOT** add Three.js 3D rotating models of the logo. Aeroloom is an editorial 2D system.
