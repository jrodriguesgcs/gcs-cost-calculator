# GCS Investment Estimate Generator

Internal Next.js app for GCS staff: pick a Program of Interest, enter a client
name and a few program-specific variables, and download a branded, one-page
A4 PDF investment estimate. See `investment-estimate-tool-spec.md` for the
full product spec this implements.

No authentication — internal-only tool per spec.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

PDF generation uses `puppeteer-core` and needs a Chromium binary:
- **Locally**: defaults to `/opt/pw-browsers/chromium` (this environment's
  pre-installed Chromium). Override with the `LOCAL_CHROMIUM_PATH` env var if
  your Chromium lives elsewhere.
- **Deployed to Vercel**: automatically uses `@sparticuz/chromium`, the
  serverless-compatible Chromium build (detected via the `VERCEL` env var
  Vercel sets automatically).

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

## Architecture notes

- `lib/programs/` — per-program config + calculator modules (the data
  model from spec §3), plus the registry (extension point).
- `lib/family-structure.ts` — shared "Family Structure" sentence builder.
- `lib/currency.ts` — currency formatting, always driven by the program's
  own `currency` field, never hardcoded.
- `lib/pdf/print-template.ts` — the letterhead-styled HTML used for both the
  PDF and (conceptually) the live preview's visual language. Design tokens
  (colors/fonts/header/footer) come from the `gcs-letterhead` skill's design
  spec, reproduced in CSS since this is a generated PDF, not a .docx.
- `lib/pdf/render-pdf.ts` — Puppeteer rendering + the one-page auto-shrink
  loop (scales font-size/spacing down via a CSS custom property until the
  content fits A4, instead of overflowing or blocking generation).
- `app/api/generate-pdf/route.ts` — POST endpoint: `{ programSlug,
  clientName, variables }` → PDF binary, filename
  `GCS_Estimate_{Program-Slug}_{Client-Name}.pdf`.
- `app/page.tsx` — the wizard UI (program → client name → variables → live
  preview → Generate PDF).

### Known spec interpretation

Malta MPRP's rental line (real estate section): Section 3 holds the
**first year's** rent (due at approval), Section 4 holds each **subsequent**
year (years 2–5) — resolved this way with the requester to avoid
double-counting the same year's rent, per the spec's own flagged question.
