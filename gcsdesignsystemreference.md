# GCS Design System — Portable Reference

Extracted from `global-citizen-solutions/gcs-design-system` for applying to another app (Next.js form UI + Puppeteer-generated PDF). All values quoted are literal from the repo source, not paraphrased.

**⚠️ Read the "Conflicts with the old `gcs-letterhead` tokens" section at the end first** — your PDF currently uses an older, smaller token set (navy `#000957`, body `#414856`, accent `#3F8CFF`, Yrsa/Heebo). This design system supersedes it but is compatible on the core brand colors; the differences are in the *semantic* neutral scale (grays, borders, status colors) and the type scale, which the old tokens didn't define.

---

## 1. Color Tokens

Source of truth: `tokens/colors.css`. All tokens are declared as `hsl()` — hex equivalents below are computed exactly from those HSL values.

### 1.1 Brand palette — Night Blue (primary)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--night-blue-25` | `hsl(218 17% 92%)` | `#E8EBF0` | lightest tint |
| `--night-blue-50` | `hsl(233 22% 75%)` | `#B3B5CD` | borders, muted primary text/underlines (used for form field borders) |
| `--night-blue-100` | `hsl(232 18% 59%)` | `#8084AB` | |
| `--night-blue-200` | `hsl(233 41% 34%)` | `#333A79` | |
| `--night-blue-300` | `hsl(233 60% 26%)` | `#1A2268` | |
| `--night-blue-400` | `hsl(233 100% 17%)` | **`#000957`** | **Primary brand color.** Navigation, headings, primary CTAs, high-emphasis surfaces. Same value as the old `gcs-letterhead` navy — no conflict. |

### 1.2 Brand palette — Electric Blue (accent)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--electric-blue-25` | `hsl(215 100% 96%)` | `#ECF4FF` | |
| `--electric-blue-50` | `hsl(216 100% 93%)` | `#D9E8FF` | also aliased as `--border` / `--input` |
| `--electric-blue-400` | `hsl(216 100% 62%)` | **`#3D8BFF`** (renders ~`#3F8CFF`) | **Accent.** Links, highlights, focus rings, secondary buttons. Matches old accent `#3F8CFF` (rounding only — same color). |

### 1.3 Star / rating

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--star` | `hsl(47 100% 44%)` | `#DFB300` | Star ratings, achievement badges only |

### 1.4 Avatar tint palette (8 deterministic tints, hashed from a name)

```
--avatar-tint-1: #1a3a5c;
--avatar-tint-2: #1e4a6e;
--avatar-tint-3: #215a80;
--avatar-tint-4: #236a92;
--avatar-tint-5: #2580a8;
--avatar-tint-6: #1a4a6e;
--avatar-tint-7: #163358;
--avatar-tint-8: #0e2440;
```
Always paired with white text. Distinct from the Night Blue scale so avatars stay differentiable.

### 1.5 Primary scale (Night Blue aliases, 50–900)

| Token | HSL | Hex |
|---|---|---|
| `--primary-50` | `hsl(218 17% 92%)` | `#E8EBF0` |
| `--primary-100` | `hsl(233 22% 75%)` | `#B3B5CD` |
| `--primary-200` | `hsl(233 22% 75%)` | `#B3B5CD` (duplicate of 100) |
| `--primary-300` | `hsl(232 18% 59%)` | `#8084AB` |
| `--primary-400` | `hsl(233 41% 34%)` | `#333A79` |
| `--primary-500` | `hsl(233 60% 26%)` | `#1A2268` |
| `--primary-600` | `hsl(233 80% 22%)` | `#0B1665` |
| `--primary-700` | `hsl(233 60% 26%)` | `#1A2268` (duplicate of 500) |
| `--primary-800` | `hsl(233 100% 17%)` | `#000957` |
| `--primary-900` | `hsl(233 100% 12%)` | `#00073D` |

### 1.6 Secondary scale (Electric Blue aliases, 50–900)

| Token | HSL | Hex |
|---|---|---|
| `--secondary-50` | `hsl(215 100% 96%)` | `#ECF4FF` |
| `--secondary-100` | `hsl(216 100% 93%)` | `#D9E8FF` |
| `--secondary-200` | `hsl(216 100% 85%)` | `#B2D1FF` |
| `--secondary-300` | `hsl(216 100% 76%)` | `#85B6FF` |
| `--secondary-400` | `hsl(216 100% 68%)` | `#5CA3FF` |
| `--secondary-500` | `hsl(216 100% 62%)` | `#3D8BFF` |
| `--secondary-600` | `hsl(216 100% 55%)` | `#1A75FF` |
| `--secondary-700` | `hsl(216 100% 45%)` | `#005CE6` |
| `--secondary-800` | `hsl(216 100% 35%)` | `#0047B2` |
| `--secondary-900` | `hsl(216 100% 25%)` | `#003380` |

### 1.7 Semantic tokens — Light mode (default)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--background` | `hsl(210 20% 98%)` | `#F9FAFB` | page background |
| `--foreground` | `hsl(220 43% 11%)` | `#101828` | primary body/heading text (near‑black navy — **not** the same as the old letterhead body gray `#414856`) |
| `--card` | `hsl(0 0% 100%)` | `#FFFFFF` | card surface |
| `--card-foreground` | `hsl(220 43% 11%)` | `#101828` | |
| `--popover` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--popover-foreground` | `hsl(220 43% 11%)` | `#101828` | |
| `--primary` | `hsl(233 100% 17%)` | `#000957` | Night Blue 400 |
| `--primary-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--secondary` | `hsl(216 100% 62%)` | `#3D8BFF` | Electric Blue 400 |
| `--secondary-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--muted` | `hsl(218 21% 93%)` | `#E9ECF1` | muted surface (light gray) |
| `--muted-foreground` | `hsl(221 13% 46%)` | `#667085` | muted/secondary text |
| `--foreground-secondary` | literal `#414856` | `#414856` | **The established GCS body-text gray — this is exactly the old letterhead's `#414856` body color.** Use for body copy needing more presence than `--muted-foreground` but not competing with headings. **This is the token your PDF's body text should map to, not `--foreground`.** |
| `--accent` | `hsl(216 100% 62%)` | `#3D8BFF` | |
| `--accent-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--destructive` | `hsl(0 84% 60%)` | `#EF4343` | error/destructive |
| `--destructive-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--border` | `hsl(216 100% 93%)` | `#D9E8FF` | default border (light electric blue tint) |
| `--input` | `hsl(216 100% 93%)` | `#D9E8FF` | input border |
| `--ring` | `hsl(233 100% 17%)` | `#000957` | focus ring color |

Sidebar tokens (light):
```
--sidebar-background: hsl(233 100% 17%);  /* #000957 */
--sidebar-foreground: hsl(0 0% 100%);     /* #FFFFFF */
--sidebar-primary:    hsl(216 100% 62%);  /* #3D8BFF */
--sidebar-accent:     hsl(218 21% 93%);   /* #E9ECF1 */
--sidebar-border:     hsl(216 100% 93%);  /* #D9E8FF */
--sidebar-ring:       hsl(233 100% 17%);  /* #000957 */
```

Chart colors: `--chart-1..5` alias `--primary`, `--accent`, `--muted-foreground`, `--border`, `--muted` respectively.

### 1.8 Functional / status colors

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--success` | `hsl(142 71% 45%)` | `#21C45D` | |
| `--success-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--warning` | `hsl(38 92% 50%)` | `#F59F0A` | |
| `--warning-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |
| `--info` | `hsl(216 100% 62%)` | `#3D8BFF` | same as accent |
| `--info-foreground` | `hsl(0 0% 100%)` | `#FFFFFF` | |

Table-component status pill colors differ slightly (see §4.6) — softer tinted backgrounds instead of solid fills:
```
--gcs-success-bg: #e7f5ed;  --gcs-success-fg: #1b7a5a;
--gcs-info-bg:    #ecf4ff;  --gcs-info-fg:    #1d50c7;
--gcs-warning-bg: #fff3dc;  --gcs-warning-fg: #95610a;
```

### 1.9 Dark mode semantic tokens (apply via `class="dark"` on `<html>`/`<body>`)

```css
.dark {
  --background:          hsl(233 100% 17%);  /* #000957 */
  --foreground:          hsl(0 0% 100%);     /* #FFFFFF */
  --card:                hsl(234 100% 22%);  /* #000B70 */
  --card-foreground:     hsl(0 0% 100%);
  --popover:             hsl(234 100% 22%);  /* #000B70 */
  --popover-foreground:  hsl(0 0% 100%);
  --primary:             hsl(0 0% 100%);     /* #FFFFFF */
  --primary-foreground:  hsl(233 100% 17%);  /* #000957 */
  --secondary:           hsl(220 43% 11%);   /* #101828 */
  --secondary-foreground: hsl(0 0% 100%);
  --muted:               hsl(220 43% 11%);   /* #101828 */
  --muted-foreground:    hsl(215 20% 65%);   /* #94A3B8 */
  --foreground-secondary: hsl(0 0% 100% / 0.7);
  --accent:              hsl(216 100% 62%);  /* #3D8BFF */
  --accent-foreground:   hsl(0 0% 100%);
  --destructive:         hsl(0 63% 31%);
  --destructive-foreground: hsl(0 0% 100%);
  --border:              hsl(220 43% 11%);   /* #101828 */
  --input:               hsl(220 43% 11%);
  --ring:                hsl(0 0% 100%);
  --sidebar-background:  hsl(234 100% 14%);
  --sidebar-foreground:  hsl(0 0% 100%);
  --sidebar-primary:     hsl(0 0% 100%);
  --sidebar-accent:      hsl(220 43% 11%);
  --sidebar-border:      hsl(220 43% 11%);
  --sidebar-ring:        hsl(0 0% 100%);
}
```

### 1.10 Document palette (print/PDF-specific neutral+blue scale)

Used across brochures/letterheads/factsheets — **finer-grained grays than the app's `--foreground`/`--muted-foreground` pair**. This is the scale most relevant to a Puppeteer-PDF context:

```css
--doc-heading:       #16182A;  /* headings on white */
--doc-body:          #4B4E65;  /* body copy on white — close to but NOT identical to old #414856 */
--doc-muted:         #9B9CAD;  /* eyebrow labels, secondary text */
--doc-muted-alt:     #6F7185;  /* letterhead date/sender labels */
--doc-subtle:        #C6C8D5;  /* footnotes, copyright lines */
--doc-border:        #E0E2EA;  /* standard rule/divider */
--doc-border-alt:    #E0E2EE;  /* divider variant */
--doc-border-light:  #ECEDF5;  /* lightest divider (most common) */
--doc-border-soft:   #E8EAF5;  /* icon-box border */
--doc-surface:       #F7F8FD;  /* light card/box background */
--doc-surface-alt:   #F2F3FE;  /* badge/box background */
--doc-wrapper:       #DDE0E8;  /* page-wrapper background */
--doc-pattern-1:     #DDE0EA;  /* diagonal stripe pattern, colour A */
--doc-pattern-2:     #E8EAF2;  /* diagonal stripe pattern, colour B */
--doc-primary-dark:  #0F1A2D;  /* near-black navy, gradient end */
--doc-primary-deep:  #000B2E;  /* near-black navy, solid block */
--doc-accent-deep:   #0A1260;  /* dark blue, solid block */
--doc-label-on-dark: #A8B3CD;  /* label text on dark backgrounds */
--doc-accent-alt:    #4A6CF7;  /* bright-blue label accent */
--doc-badge:         #3D51E8;  /* indigo badge / underline accent */
```

**⚠️ Conflict flag:** `--doc-body: #4B4E65` is the design system's *current* documented "body copy on white" for print templates — it is a slightly lighter/cooler gray than the old letterhead's `#414856`. They are close enough to be visually indistinguishable at body-text size, but they are not byte-identical. Recommendation: keep `#414856` (`--foreground-secondary`) since it's explicitly called out in this repo as *"the value used consistently for body copy across social + print templates"* and is the more authoritative/older established value; treat `#4B4E65` as a document-template-only variant, not a supersede.

**⚠️ A third, later-adopted value exists too:** `gcs-cost-calculator`'s own PDF (`lib/pdf/print-template.ts`'s `BODY` constant) deliberately uses `#343750`, not `#414856` or `#4B4E65`. That's a documented, intentional cross-skill choice from a prior session: the `gcs-docx` skill's brand-color table specifies `#343750` for its "General" correspondence variant's paragraph body text, and was judged the more recently-updated source for document body copy specifically (as opposed to `--foreground-secondary`, which is scoped to "body copy across social + print templates" generally). Recorded here so this doc and that PDF template stay in agreement rather than silently diverging — `#343750` is the value to use for a fee-estimate/investment-document body-copy context going forward, alongside (not replacing) `#414856` for everything else this doc's own recommendation above covers.

---

## 2. Typography

Source: `tokens/fonts.css` + `tokens/typography.css`.

### 2.1 Font families & sourcing

```css
--font-sans:  'Heebo', system-ui, -apple-system, sans-serif;      /* UI, body, labels, captions */
--font-serif: 'Yrsa', Georgia, 'Times New Roman', serif;          /* Display headings, editorial copy */
--font-mono:  'JetBrains Mono', 'Fira Code', 'Courier New', monospace; /* code, data (NEW — not in old letterhead system) */
```

Loaded via Google Fonts `@import` (not self-hosted yet):
```css
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Yrsa:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap');
```
Repo note: *"Heebo / Yrsa / JetBrains Mono are still loaded from Google Fonts. For production use, self-host these too and replace this `@import` with local `@font-face` declarations."* — no self-hosted font files exist in this repo yet; if your Next.js app/PDF need offline/self-hosted fonts, you'll need to source and host Heebo, Yrsa, and JetBrains Mono yourself (all are open-source/Google Fonts, freely redistributable).

### 2.2 Weight & tracking scale

```css
--weight-light:    300;
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;

--tracking-tighter: -0.05em;
--tracking-tight:   -0.025em;
--tracking-normal:  -0.01em;   /* applied to body by default */
--tracking-wide:     0.025em;
--tracking-wider:    0.05em;
--tracking-widest:   0.1em;
```

### 2.3 Base body reset

```css
body {
  font-family: var(--font-sans);   /* Heebo */
  font-size: 16px;
  line-height: 1.4;
  color: var(--foreground);         /* #101828 */
  background-color: var(--background); /* #F9FAFB */
  letter-spacing: var(--tracking-normal); /* -0.01em */
}
```

### 2.4 Full type scale (exact class → spec)

| Class | Font | Size | Line-height | Weight | Letter-spacing | Notes |
|---|---|---|---|---|---|---|
| `.text-display-xl` | Yrsa (serif) | 60px | 64px | 400 | `-0.025em` | hero/editorial |
| `.text-display-l` | Yrsa (serif) | 48px | 54px | 400 | `-0.025em` | |
| `.text-display-md` | Yrsa (serif) | 36px | 40px | 400 | `-0.025em` | |
| `.text-h1` | Yrsa (serif) | 48px | 54px | 400 | — | |
| `.text-h2` | Yrsa (serif) | 36px | 40px | 400 | — | |
| `.text-h3` | Heebo (sans) | 30px | `1.4` | 300 | — | sans, not serif |
| `.text-h4` | Heebo (sans) | 24px | `1.4` | 400 | — | |
| `.text-display-xs` | Heebo (sans) | 24px | `1.4` | 400 | — | |
| `.text-text-xl` | Heebo (sans) | 20px | `1.4` | 400 | — | |
| `.text-body-large` | Heebo (sans) | 18px | `1.4` | 400 | — | |
| `.text-body` | Heebo (sans) | 16px | `1.4` | 400 | — | default body |
| `.text-body-small` | Heebo (sans) | 14px | 20px | 400 | — | |
| `.text-caption` | Heebo (sans) | 12px | `1.4` | 400 | `0.025em` (wide) | |
| `.text-overline` | Heebo (sans) | 12px | `1.4` | 600 | `0.1em` (widest) | `text-transform: uppercase` |
| `.text-serif-lg` | Yrsa (serif) | 18px | 28px | 500 | — | pull quotes, bylines |
| `.text-mono` | JetBrains Mono | 14px | `1.5` | 400 | — | |
| `.text-mono-sm` | JetBrains Mono | 12px | `1.5` | 400 | — | |

**Rule of thumb:** Yrsa (serif) for H1/H2/display/editorial; Heebo (sans) for H3 and smaller, all UI/body/labels; JetBrains Mono only for code or tabular data contexts.

---

## 3. Spacing / Layout Scale

Source: `tokens/spacing.css`. **4px base grid.**

```css
--spacing-base: 0.25rem; /* 4px */

--space-0:    0px;
--space-0-5:  2px;
--space-1:    4px;
--space-1-5:  6px;
--space-2:    8px;
--space-2-5:  10px;
--space-3:    12px;
--space-4:    16px;
--space-5:    20px;
--space-6:    24px;
--space-7:    28px;
--space-8:    32px;
--space-10:   40px;
--space-12:   48px;
--space-14:   56px;
--space-16:   64px;
--space-20:   80px;
--space-24:   96px;
--space-32:   128px;
--space-40:   160px;
--space-48:   192px;
--space-64:   256px;
```

Semantic gap aliases:
```
--gap-xs:  4px   (var(--space-1))   tight inline gaps
--gap-sm:  8px   (var(--space-2))   icon + label
--gap-md:  16px  (var(--space-4))   component internal
--gap-lg:  24px  (var(--space-6))   section internal
--gap-xl:  32px  (var(--space-8))   section separation
--gap-2xl: 48px  (var(--space-12))  page sections
--gap-3xl: 64px  (var(--space-16))  major sections
```

Component-level padding:
```
--padding-btn-sm:  0 12px;
--padding-btn-md:  0 16px;
--padding-btn-lg:  0 24px;
--padding-card:    24px;
--padding-card-sm: 16px;
--padding-input:   12px 16px;
```

Layout:
```
--container-padding: 2rem;   /* 32px */
--container-max:     1400px;
```

**Breakpoints:** there is no formal breakpoint token scale in `tokens/`. The only concrete responsive breakpoints in the system are in the Table component CSS (`components/core/primitives/tables.css`): **640px** (collapse table to stacked cards) and **420px** (stack the table footer vertically). Treat 1400px as the standard max content width for page layout.

---

## 4. Component Patterns

### 4.1 Border radius — **default is 0 (sharp corners)** — this is a defining brand trait

Source: `tokens/radius.css`.
```css
--radius:      0rem;      /* 0px  — DEFAULT for buttons, inputs, cards, tags */
--radius-sm:   0.125rem;  /* 2px  — very slight softening */
--radius-md:   0.25rem;   /* 4px  — subtle rounding */
--radius-lg:   0.5rem;    /* 8px  — moderate rounding, panels */
--radius-xl:   0.75rem;   /* 12px — rounded panels */
--radius-full: 9999px;    /* pill — badges, tags, avatars only */
```
Use the non-zero scale **sparingly and only where explicitly called for** (pills, badges, circular avatars). Everything else — buttons, inputs, cards, tables — is sharp-cornered (`border-radius: 0`).

### 4.2 Shadows

Source: `tokens/shadows.css`. Subtle in light mode (low-opacity warm-navy), deepen substantially in dark mode.

Light mode:
```css
--shadow-2xs: 0 4px 10px 0 hsl(0 0% 0% / 0.03);
--shadow-xs:  0 1px 2px 0 hsl(220 43% 11% / 0.05);
--shadow-sm:  0 4px 10px 0 hsl(220 43% 11% / 0.05), 0 1px 2px -1px hsl(220 43% 11% / 0.05);
--shadow:     0 4px 10px 0 hsl(220 43% 11% / 0.05), 0 1px 2px -1px hsl(220 43% 11% / 0.05);
--shadow-md:  0 4px 10px 0 hsl(220 43% 11% / 0.05), 0 2px 4px -1px hsl(220 43% 11% / 0.05);
--shadow-lg:  0 4px 10px 0 hsl(220 43% 11% / 0.05), 0 4px 6px -1px hsl(220 43% 11% / 0.05);
--shadow-xl:  0 4px 10px 0 hsl(220 43% 11% / 0.05), 0 8px 10px -1px hsl(220 43% 11% / 0.05);
--shadow-2xl: 0 4px 10px 0 hsl(0 0% 0% / 0.13);

--shadow-focus:             0 0 0 3px hsl(216 100% 62% / 0.35); /* accent-blue focus ring */
--shadow-focus-destructive: 0 0 0 3px hsl(0 84% 60% / 0.25);
```
Dark mode swaps all alpha values to a `hsl(0 0% 0% / …)` scale from 0.15 to 0.75 (see `tokens/shadows.css` for exact per-level values — same structure, deeper opacity).

### 4.3 Motion

Source: `tokens/animations.css`.
```css
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   300ms;
--duration-slower: 500ms;

--transition-base:      all var(--duration-normal) var(--ease-out);
--transition-colors:    background-color/color/border-color 200ms var(--ease-out);
--transition-shadow:    box-shadow 200ms var(--ease-out);
--transition-opacity:   opacity 200ms var(--ease-out);
--transition-transform: transform 200ms var(--ease-out);
```
Respects `prefers-reduced-motion: reduce` (clamps all animation/transition durations to 0.01ms).

### 4.4 Buttons

Source: `components/core/primitives/Button.jsx`. **All buttons: `border-radius: 0`, uppercase text, `font-weight: 500`, `letter-spacing: 0.02em`, `font-family: var(--font-sans)`.**

| Variant | Background | Text | Border | Hover background | Hover text |
|---|---|---|---|---|---|
| `primary` | `#000957` (Night Blue 400) | `--primary-foreground` (#FFF) | transparent | `#3D8BFF` (Electric Blue 400) | `--secondary-foreground` (#FFF) |
| `secondary` | `#3D8BFF` | `--secondary-foreground` (#FFF) | transparent | `--card` (#FFF) | `#000957` |
| `outline` | transparent | `#B3B5CD` (Night Blue 50) | `#B3B5CD` | `--card` (#FFF) | `#000957` |
| `ghost` | transparent | `#000957` | transparent | `#3D8BFF` | `--secondary-foreground` (#FFF) |
| `link` | transparent | `#000957` | transparent | transparent (underline on hover) | `#000957` |
| `destructive` | `hsl(0 84% 60%)` (#EF4343) | `--destructive-foreground` (#FFF) | transparent | same bg, `opacity: 0.9` | same |

Disabled state (non-link): bg `#000957`, text `#FFF`, `opacity: 0.5`. Disabled link: `opacity: 0.4`.

Sizes:
| Size | Height | Padding | Font size |
|---|---|---|---|
| `sm` | 36px | 0 12px | 13px |
| `md` (default) | 40px | 0 16px | 14px |
| `lg` | 44px | 0 32px | 14px |
| `xl` | 48px | 0 40px | 16px |
| `icon` (icon-only) | 40px × 40px | 0 | 14px |

Focus-visible: `outline: none; box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring, 233 100% 17%))`. Transition: `background-color .2s ease, color .2s ease, border-color .2s ease, opacity .2s ease`. `gap: 8px` between icon and label.

### 4.5 Form inputs (text/email/tel/select/textarea)

Source: `components/core/sections/LeadForm.jsx` — the system's canonical form-field styling is an **underline field**, not a boxed input:

```css
.gcs-leadform-field {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 16px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--night-blue-50); /* #B3B5CD */
  padding: 8px 0;
  color: var(--primary); /* #000957 */
  border-radius: 0;
  outline: none;
  box-sizing: border-box;
}
.gcs-leadform-field:focus { border-bottom-color: var(--primary); /* #000957 */ }
.gcs-leadform-field::placeholder { color: var(--night-blue-50); /* #B3B5CD */ }
.gcs-leadform-field.gcs-leadform-error { border-bottom-color: var(--destructive); /* #EF4343 */ }

select.gcs-leadform-field {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23000957' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 24px;
  cursor: pointer;
}
```
States: default border `#B3B5CD`, focus border `#000957`, error border `#EF4343` (destructive), placeholder text `#B3B5CD`.

**Note for your Next.js form UI:** this repo has no "boxed" input/select/checkbox/toggle/switch primitive component — the underline field above (from `LeadForm`) is the only first-party form-field spec that exists. If your app needs boxed inputs with visible borders on all sides, extrapolate using the same tokens: `border: 1px solid var(--border)` (`#D9E8FF`) at rest, `border-color: var(--ring)` (`#000957`) + `box-shadow: var(--shadow-focus)` (`0 0 0 3px hsl(216 100% 62% / 0.35)`) on focus, `border-color: var(--destructive)` on error, `border-radius: 0` (system default), padding `var(--padding-input)` = `12px 16px`.

Associated submit button style (also from LeadForm):
```css
.gcs-leadform-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 24px; height: 44px;
  font-family: var(--font-sans); font-size: 14px; font-weight: 500;
  text-transform: uppercase; letter-spacing: .02em;
  background: var(--primary); color: var(--primary-foreground);
  border: 1px solid var(--primary);
  cursor: pointer; transition: .2s; border-radius: 0;
}
.gcs-leadform-btn:hover:not(:disabled) { background: var(--accent); border-color: var(--accent); }
```

### 4.6 Badges / Tags / Pills

**Badge** (`components/core/primitives/Badge.jsx`) — `border-radius: 999px` (full pill), `font-weight: 500`, `letter-spacing: 0.03em`, `font-family: var(--font-sans)`:

| Variant | Background | Text | Border |
|---|---|---|---|
| `default` | `var(--muted)` #E9ECF1 | `var(--foreground)` #101828 | none |
| `primary` | `var(--primary)` #000957 | `var(--primary-foreground)` #FFF | none |
| `secondary` | `hsl(216 100% 40%)` = `#0052CC` | `var(--secondary-foreground)` #FFF | none |
| `success` | `hsl(142 60% 18%)` (dark green) | `hsl(142 72% 72%)` (light green) | none |
| `warning` | `hsl(38 80% 18%)` (dark amber) | `hsl(38 95% 68%)` (light amber) | none |
| `destructive` | `hsl(0 72% 18%)` (dark red) | `hsl(0 84% 72%)` (light red) | none |
| `outline` | transparent | `var(--muted-foreground)` #667085 | `1px solid var(--border)` #D9E8FF |

Sizes: `sm` → 18px height, 10px font, 1px/7px padding. `md` → 22px height, 11px font, 2px/9px padding. Optional 5×5px dot indicator (`currentColor`, `border-radius: 50%`).

**Tag** (`components/core/primitives/Tag.jsx`) — same family but **`border-radius: 0`** (sharp, unlike Badge's pill), `font-weight: 500`, `letter-spacing: 0.04em`:

| Variant | Background | Text | Border |
|---|---|---|---|
| `default` | `var(--muted)` | `var(--foreground)` | none |
| `primary` | `var(--primary)` | `var(--primary-foreground)` | none |
| `outline` | transparent | `var(--muted-foreground)` | `1px solid var(--border)` |
| `filled` | `var(--foreground)` | `var(--background)` | none |
| `success` | `hsl(142 60% 18%)` | `hsl(142 72% 72%)` | none |
| `warning` | `hsl(38 80% 18%)` | `hsl(38 95% 68%)` | none |

Sizes: `sm` → 20px height, 10px font. `md` → 24px height, 11px font. Optional dismiss button, optional leading icon.

**Table status pills** (`components/core/primitives/tables.css`, `.gcs-table .badge`) — a third, softer variant used specifically in tables/print, `border-radius: 9999px`, `padding: 3px 10px`, `font-size: 12px`, `font-weight: 600`:
```css
.badge--success { background: #e7f5ed; color: #1b7a5a; }
.badge--info    { background: #ecf4ff; color: #1d50c7; }
.badge--warning { background: #fff3dc; color: #95610a; }
```

### 4.7 Tables

Source: `components/core/primitives/tables.css` (self-contained, all values literal with `!important` — designed to be pasted standalone into e.g. WordPress). Key spec:

- Container: `border: 1px solid #DBEAFF`, `background: #FFFFFF`, font `Heebo`.
- Local CSS variables:
  ```css
  --gcs-primary: #000957;
  --gcs-primary-fg: #ffffff;
  --gcs-secondary: #3f8cff;
  --gcs-foreground: #101828;
  --gcs-card: #ffffff;
  --gcs-muted: #e9ecf1;
  --gcs-muted-fg: #667084;
  --gcs-border: #dbeaff;
  --gcs-row-line: #e8ebf0;
  ```
- Title block: eyebrow `11px/600/0.18em uppercase` in `--gcs-secondary`; title in **Yrsa** `clamp(22px, 3.2vw, 32px)/1.2/-0.01em`, weight 400; subtitle `15px/1.6`, weight 300, `--gcs-muted-fg`.
- Header variants: `solid` (filled Night Blue row, 55%-opacity white uppercase 11px/600 labels), `minimal` (Night Blue labels on white, `2px solid var(--gcs-primary)` bottom rule), `plain` (bold 15px sentence-case, `2px solid var(--gcs-foreground)` bottom rule).
- Body cells: `padding: 15px 16px`, `font-size: 15px`, `border-top: 1px solid #E8EBF0`; first column bold (`font-weight: 600`).
- Zebra striping (default on): even rows `background: #E9ECF1`.
- Country/flag cells: 24×24px flag image, `border-radius: var(--radius-full)`, inset border, always paired with country name.
- Responsive: **at `max-width: 640px`** the table collapses to stacked labeled cards (`data-label` attribute powers a `::before` label); **at `max-width: 420px`** the footer stacks vertically.
- Icons in headers: inline Material Symbols SVG only, `fill="currentColor"`, 15×15px — never Font Awesome/Heroicons/Feather/Lucide.

### 4.8 Cards

No standalone `Card.jsx` primitive exists; card surfaces are built directly from tokens wherever used (e.g. `CountryCard`, `ProgramCard`, `TestimonialCard`, `SpeakerCard` in `components/core/sections/`, covered together in `cards-overview.reference.html`). The consistent pattern across the system:
- Background: `var(--card)` = `#FFFFFF` (light) / `hsl(234 100% 22%)` = `#000B70` (dark)
- Padding: `var(--padding-card)` = 24px (or `--padding-card-sm` = 16px for compact cards)
- Border-radius: `0` (system default — sharp corners)
- Shadow: `var(--shadow-sm)` or `var(--shadow-md)` for elevated cards
- Border (where used): `1px solid var(--border)` = `#D9E8FF`

### 4.9 Accordion / Tabs / Toggles

`components/core/primitives/Accordion.jsx` and `Tabs.jsx` exist as primitives (see their `.card.html` demos for exact visuals) but no dedicated boolean toggle/switch component exists in the system — none was found searching the repo for `switch`/`.toggle` patterns. If you need a toggle, build it from the same tokens as Button/Badge (Night Blue `#000957` on-state, `#B3B5CD` or `var(--muted)` off-state, `border-radius: var(--radius-full)` for pill-shaped track, sharp `0` if you want it to match the rest of the system's edges instead).

---

## 5. Brand Assets

| Asset type | Location | Notes |
|---|---|---|
| GCS logos | `assets/logos/` | `GCS-Primary-{Black,Blue,White}.{png,svg}`, `GCS-Secondary-{Black,Blue,White}.{png,svg}`, `GCS-Symbol-{Black,Blue,White}.{png,svg}` |
| GIU (sub-brand) logos | `assets/logos/` | `GIU-Wordmark-{Black,Blue,White}.svg` |
| Icons | `assets/icons/{outlined,rounded,sharp}/` | Self-hosted **Material Symbols** SVGs (thousands of icons, e.g. `10k.svg`, `10k-fill.svg`). Never use inline ad-hoc SVGs or other icon sets (Font Awesome, Heroicons, Feather, Lucide) — Material Symbols only, `fill="currentColor"` to inherit text color. |
| Flags | `assets/flags/` | Self-hosted PNG from `msikma/country-flags`; 37 uncovered territories/UK-sub-nations/Kosovo stay legacy SVG |
| Passports | `assets/passports/` | Passport image assets |
| Icon component | `components/core/primitives/Icon.jsx` | React wrapper around the self-hosted icon set |

---

## 6. Design Tokens — Single Source of Truth

The single source of truth is **`styles.css`** at the repo root, which imports all token files in this order:

```css
@import "./tokens/fonts.css";
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./tokens/spacing.css";
@import "./tokens/radius.css";
@import "./tokens/shadows.css";
@import "./tokens/animations.css";
```

There is no Tailwind config, JSON token export, or Figma export in this repo — **plain CSS custom properties are the canonical format.** The exact, complete contents of each `tokens/*.css` file are quoted verbatim in sections 1–4 above (colors.css → §1, typography.css/fonts.css → §2, spacing.css → §3, radius.css/shadows.css/animations.css → §4.1–4.3). To port this system into a Next.js app: copy `styles.css` + all six files under `tokens/` into the project and import `styles.css` globally (e.g. in `app/layout.tsx` / `_app.tsx`), or transcribe the custom properties into a Tailwind `theme.extend` config, matching hex-for-hex.

---

## 7. Conflicts / Supersessions vs. the old `gcs-letterhead` skill tokens

The task states your Next.js form UI and Puppeteer PDF currently use the older, minimal `gcs-letterhead` token set: **navy `#000957`, body `#414856`, accent `#3F8CFF`, fonts Yrsa/Heebo.**

| Old token | Old value | This design system | Verdict |
|---|---|---|---|
| Navy | `#000957` | `--night-blue-400` / `--primary` / `--primary-800` = `hsl(233 100% 17%)` = **`#000957`** | **Identical — no conflict.** Keep using it. |
| Accent | `#3F8CFF` | `--electric-blue-400` / `--accent` / `--secondary` = `hsl(216 100% 62%)` = **`#3D8BFF`** (rounds to `#3F8CFF` on many color pickers) | **Effectively identical** (sub-1% RGB rounding difference from HSL→hex conversion). No visible conflict — safe to keep `#3F8CFF` literally, or switch to the token. |
| Body text | `#414856` | `--foreground-secondary` = **`#414856`** (literal hex, explicitly documented as *"the established GCS body-text grey"*) | **Identical — no conflict.** But note this is a *different* token from `--foreground` (`#101828`, near-black, used for headings/high-emphasis text) — don't conflate the two. Also note the newer *document-template* variant `--doc-body: #4B4E65` is close but not identical; prefer `#414856`/`--foreground-secondary` as authoritative for body copy. |
| Fonts | Yrsa (display), Heebo (body) | Same, **plus** JetBrains Mono added for code/data (§2.1) | **Superset, no conflict.** Yrsa/Heebo usage rules also now formalized into an exact type scale (§2.4) the old skill didn't define — adopt it for heading/body sizing consistency. |
| Border radius | not specified in old tokens | `0` by default, sharp corners is a *named brand trait* here, with an opt-in small non-zero scale for pills/badges/avatars (§4.1) | **New information, not a conflict** — if your current PDF has any rounded corners on cards/buttons, this design system says to flatten them to `0` unless it's a pill/badge/avatar. |
| Neutrals/grays, semantic status colors, spacing scale, shadows, motion tokens | **not defined at all** in the old letterhead system | Fully specified here (§1.7–1.8, §3, §4.2–4.3) | **New information — adopt wholesale.** This is the main value-add of migrating: a complete gray/neutral scale, success/warning/error/info colors, a 4px spacing grid, and shadow/motion tokens where previously only 3 colors + 2 fonts existed. |

**Bottom line:** nothing in this design system contradicts the three colors and two fonts your PDF already uses — it's a strict superset. The one place to be precise is **which gray you use for body text**: use `#414856` (`--foreground-secondary`), not `#101828` (`--foreground`, reserved for headings) and not `#4B4E65` (`--doc-body`, a separate print-template variant).

**Update, later session:** the PDF's body text has since moved again, to `#343750` (the `gcs-docx` skill's "General" correspondence body-copy value — see the §1.10 conflict flag above for the full reasoning). Treat that as the current authoritative value for this PDF specifically; the guidance above still holds for anything that should instead use `#414856`/`--foreground-secondary`.
