# GCS Investment Estimate Generator

Internal Next.js app for GCS staff: pick a Program of Interest, enter a client
name and a few program-specific variables, and download a branded, one-page
A4 PDF investment estimate. See `investment-estimate-tool-spec.md` for the
full product spec this implements.

No authentication — internal-only tool per spec.

## Setup

```bash
npm install
```

No environment variables or external credentials are required — the app has
no database and no third-party API calls; all program data lives in
`lib/programs/`.

## Running it

### Locally

```bash
npm run dev
```

Open http://localhost:3000.

### PDF generation locally

PDF generation uses `puppeteer-core` and needs a Chromium binary:
- **Locally**: defaults to `/opt/pw-browsers/chromium` (this environment's
  pre-installed Chromium). Override with the `LOCAL_CHROMIUM_PATH` env var if
  your Chromium lives elsewhere (e.g. a local Google Chrome install).
- **Deployed to Vercel**: automatically uses `@sparticuz/chromium`, the
  serverless-compatible Chromium build (detected via the `VERCEL` env var
  Vercel sets automatically).

## Architecture

```
Wizard UI (app/page.tsx)
  -> lib/programs/registry.ts   (program lookup — the extension point)
  -> ProgramCalculator.computeQuote()   -> Quote
  -> components/EstimatePreview.tsx     (live, in-browser preview)
  -> POST /api/generate-pdf             ({ programSlug, clientName, variables })
  -> lib/pdf/render-pdf.ts              (warm Chromium singleton, auto-shrink loop)
  -> lib/pdf/print-template.ts          (branded HTML/CSS, embedded fonts + logo)
  -> PDF binary download
```

- `lib/programs/` — per-program config + calculator modules (the data model
  from spec §3), plus `registry.ts`, the extension point.
- `lib/family-structure.ts` — shared "Family Structure" sentence builder.
- `lib/currency.ts` — currency formatting, always driven by the program's
  own `currency` field, never hardcoded.
- `lib/pdf/print-template.ts` — the letterhead-styled HTML used for both the
  PDF and (conceptually) the live preview's visual language. Design tokens
  (colors/fonts/header/footer) come from the `gcs-letterhead` skill's design
  spec, reproduced in CSS since this is a generated PDF, not a .docx.
- `lib/pdf/render-pdf.ts` — Puppeteer rendering, the warm-browser cache (see
  "PDF generation" below), and the one-page auto-shrink loop (scales
  font-size/spacing down via a CSS custom property until the content fits
  A4, instead of overflowing or blocking generation).
- `app/api/generate-pdf/route.ts` — POST endpoint: `{ programSlug,
  clientName, variables }` → PDF binary, filename
  `GCS_Estimate_{Program-Slug}_{Client-Name}.pdf`.
- `app/page.tsx` — the wizard UI (program → client name → variables → live
  preview → Generate PDF).

## Adding a new program

Programs are the extension point described in the spec (§7, Program Intake
Checklist). To add one:

1. Create `lib/programs/<slug>.config.ts` — display data: name, currency,
   variables (with type/range/options), section titles + timing labels,
   footnotes. Follow `malta-mprp.config.ts`.
2. Create `lib/programs/<slug>.calculator.ts` — the fee formulas and the
   family-structure sentence for that program, returning a `Quote`. Follow
   `malta-mprp.calculator.ts`. Use the shared `buildFamilyStructureSentence`
   helper (`lib/family-structure.ts`) for the family-structure clause.
3. Register both in `lib/programs/registry.ts`.

Nothing else needs to change — the form, live preview, and PDF route all read
from the registry.

### Known spec interpretation

Malta MPRP's rental line (real estate section): Section 3 holds the
**first year's** rent (due at approval), Section 4 holds each **subsequent**
year (years 2–5) — resolved this way with the requester to avoid
double-counting the same year's rent, per the spec's own flagged question.

## PDF generation

`lib/pdf/render-pdf.ts` keeps a single Chromium `Browser` instance cached at
module scope (`getBrowser()`), reused across warm invocations of the same
serverless function instance instead of launching and closing a fresh
instance on every request. Each request still gets its own `Page` (opened
and closed per call), but the expensive part — launching Chromium itself —
only happens once per warm instance, then again if the cached instance is
ever found disconnected (checked via `browser.connected` before reuse).

This is what the spec (§2) originally asked for: *"a persistent/warm
headless-browser instance for Puppeteer/Playwright rather than spinning one
up per request"* — the app now does this on both the Vercel/`@sparticuz/chromium`
path and the local dev path. `maxDuration = 60` on the API route is
unchanged and still gives real headroom for the genuinely-cold case (a fresh
serverless instance, or the very first request in a `next dev` session).

On top of that, the render itself auto-shrinks: it measures the rendered
content's height and, if it overflows one A4 page, re-renders at a smaller
`--scale` CSS value (down to a floor of `0.75`) rather than overflowing or
blocking generation — a genuinely dense quote is still allowed to flow onto
a second page once the floor is hit.

## Deployment

Deployed to Vercel via its native Next.js zero-config detection (Git
integration — push to the production branch, Vercel builds and deploys
automatically). There is no `.github/` CI workflow and no test suite in
this repo, so `npm run build` and `npm run lint` are the only gates before
a PR merges — run both locally before opening one.

`maxDuration = 60` on `app/api/generate-pdf/route.ts` requires a Vercel
plan/region combination that supports it — confirm against the live Vercel
project settings if PDF generation ever times out in production rather than
assuming the code is at fault.

## Keeping this on-brand and accessible

Any future change to `app/`, `components/`, or `lib/pdf/print-template.ts`
should be checked against **`.claude/skills/web-design-guidelines`**
(interaction/accessibility rules — focus states, semantic HTML,
`prefers-reduced-motion`, ARIA, alt text) and the **`gcs-design-system`**
skill's tokens (colors, fonts, spacing) before being considered done — both
were applied deliberately in this pass and should stay that way as the app
evolves.
