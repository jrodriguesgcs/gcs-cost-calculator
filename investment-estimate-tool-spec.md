# Investment Estimate Generator — Project Spec (Draft for Claude Code)

## 1. Overview
An internal web app for GCS staff to generate a one-page, branded A4 PDF investment
estimate to send to potential clients. The flow:

1. User selects a **Program of Interest** (e.g. Malta MPRP, Vanuatu CBI, etc.)
2. User enters the **Client Name**
3. User fills in **program-specific variables** (family composition, options, etc.)
4. App renders a **Family Structure** summary and a **fee breakdown table**
5. User downloads a generated **A4 PDF** styled with the `gcs-letterhead` skill

The tool must be **extensible**: new programs will be added over time, each with its
own variables, fee sections, and calculation logic — without rebuilding the core app.

---

## 2. PDF Output Spec

- **Size:** A4, one page (single-page constraint — content must auto-shrink
  text/spacing to fit if a program has many fee lines, rather than overflowing
  or blocking generation — see Decisions Made)
- **Speed:** PDF should be ready to download in **under 10 seconds** whenever
  possible. This affects the server-side rendering tool choice (e.g. a
  persistent/warm headless-browser instance for Puppeteer/Playwright rather
  than spinning one up per request, or a lighter HTML→PDF engine like
  WeasyPrint if warm-browser overhead is the bottleneck).
- **Quality:** output must be consistently high-quality — sharp text (not
  rasterized/blurry), correct embedded fonts, accurate colors, and no layout
  glitches — every time, not just on a "good" run.
- **Progress indicator:** if generation isn't instant, the UI must show a
  progress bar/spinner while the PDF is being built, rather than a frozen
  button or blank wait.
- **Branding:** Apply the `gcs-letterhead` skill (fonts Yrsa + Heebo, navy #000957,
  body #414856, accent #3F8CFF, header w/ logo + office locations, footer w/ URL + page number)
- **Layout, top to bottom:**
  1. Heading: `Investment Estimate - {Program of Interest}`
  2. Client Name
  3. Family Structure line, inferred from variables
     (e.g. "1 Main Applicant + Spouse + 2 Children + 2 Adult Dependants")
  4. Quote table — **flows vertically (top to bottom), not left to right**
     - One or more **sections** (e.g. for Malta MPRP: 4 sections)
     - Each section has: a title, a timing label, its own fee line items, and a
       **section subtotal**
     - A **grand total** at the bottom of the whole table
- **File naming:** `GCS_Estimate_{Program-Slug}_{ClientName}.pdf`
  (e.g. `GCS_Estimate_Malta-MPRP_ClientName.pdf` — program name hyphenated,
  spaces in the client name presumably kept as-is or also hyphenated — see
  Open Questions)

---

## 3. Program Data Model (per Program of Interest)

Each program needs to define, in a config format (JSON/YAML — format TBD by Claude Code, see Decisions Made):

| Field | Description |
|---|---|
| `name` | Program name (e.g. "Malta MPRP") |
| `currency` | Currency this program's fees are quoted in (e.g. EUR, USD) — not assumed, since programs vary |
| `variables` | List of inputs and their type (boolean, number, select) and how each affects the estimate and the family-structure sentence |
| `sections` | Ordered list of quote sections, each with a title + timeline label (e.g. "Signing & Engagement — Month 0") |
| `fees` | Per section, the fee line items and the formula/logic for how variables change them (fixed fee, per-dependant fee, conditional fee, etc.) |

### Example: Malta MPRP — full definition (extracted from `MPRP_Cost_Calculator.html`)

> Note: that HTML file is only the **source of the program's data/logic** (fields,
> fee amounts, formulas). Its own visual design (navy/gold, EB Garamond) is *not*
> what we replicate — the final PDF uses the `gcs-letterhead` skill's styling
> instead, per the original brief.

**Variables**
| Variable | Type | Range |
|---|---|---|
| Spouse / partner included | boolean | Yes / No (displayed as a Yes/No toggle in the UI, not a 0/1 stepper — internally still maps to 0 or 1 in the fee logic) |
| Dependants under 18 (minors) | number | 0–10 |
| Adult dependants (18+) | number | 0–10 |
| Real estate option | select | Purchase (min. €375,000) / Rental (min. €14,000/yr) — chosen upfront by the internal user, and its cost **is included** in the relevant section total (see below) |

`totalApplicants = 1 (main) + spouse + minors + adults`

**Family Structure sentence logic** — build from whichever parts are >0, e.g.:
`1 Main Applicant + Spouse + 2 Children + 2 Adult Dependants`
(omit a clause entirely if its count is 0; use singular "Child"/"Adult Dependant" if count = 1)

**GCS professional fee (drives Sections 1 & 2)**
- Base: €25,000 (covers main applicant + spouse, if any, + first 2 minors free)
- +€500 per dependant beyond that free allowance (extra minors past 2, and **every** adult dependant)
- `gcsTotal = 25000 + 500 × (max(0, minors − 2) + adults)`
- Paid 50% at Section 1, 50% (balance) at Section 2

**Section 1 — Signing & Engagement (Month 0)**
| Fee | Amount |
|---|---|
| GCS professional fee — 50% instalment | `gcsTotal / 2` |
| **Section total** | `gcsTotal / 2` |

**Section 2 — Application & Submission (Months 1–3)**
| Fee | Amount |
|---|---|
| GCS professional fee — 50% balance | `gcsTotal / 2` |
| Admin fee (non-refundable) | €15,000 (fixed) |
| Residence card — per applicant | `totalApplicants × €100` |
| **Section total** | sum of the above |

**Section 3 — Approval & Investment (Months 4–9)**
| Fee | Amount |
|---|---|
| Admin fee — balance | €45,000 (fixed) |
| Real estate — Purchase (min.) *or* Rental (min./yr), per the chosen variable | €375,000+ (purchase) or €14,000/yr (rental) — **included** in this section's total |
| Government contribution — main applicant | €37,000 (fixed) |
| Government contribution — adult dependants † | `adults × €7,500` (0 if no adult dependants) |
| Philanthropic donation | €2,000 (fixed) |
| Residence permit — per applicant/yr | `totalApplicants × €100` |
| **Section total** | 45000 + realEstateCost + 37000 + (adults×7500) + 2000 + (totalApplicants×100) |

> ⚠️ **Flag:** if the internal user picks **Rental**, the €14,000/yr also
> reappears in Section 4 (Annual Obligations) as "Minimum rental requirement."
> Counting it in both sections would double-count the same yearly rent. Likely
> intent: Section 3's rental line = the *first year's* rent (due at
> investment/approval stage), and Section 4's line = each *subsequent* year's
> rent. Confirm this reading before building, or adjust the logic accordingly.

**Section 4 — Annual Obligations (every 12 months from grant, ongoing years 1–5)**
| Fee | Amount |
|---|---|
| Minimum rental requirement | ~€14,000 (fixed, only relevant if renting) |
| Annual compliance filing | €1,000 (fixed) |
| Residence permit — per applicant | `totalApplicants × €100` |
| Medical insurance | TBC (no fixed figure — display as "TBC") |
| **Section total** | ~14000 + 1000 + (totalApplicants×100) *("~" prefix since rental figure is approximate)* |

**Grand total (one-time, excl. real estate and excl. annual)**
`Section 1 + Section 2 + Section 3`

**Footnotes to carry onto the PDF** (from the reference file):
- All fees indicative, subject to change by the Maltese government; read alongside the full proposal.
- GCS fee logic as above.
- † Government contribution of €7,500 per adult dependant (18+) only; not applicable to minors.
- Admin fee €60,000 total, in two instalments (€15,000 in Section 2, €45,000 in Section 3). Admin fee, real estate, government contribution, and donation are all required for eligibility. Real estate: purchase (min. €375,000) or rental (min. €14,000/yr).
- Asset requirement: min. €500,000 in assets (of which €150,000 financial) OR min. €650,000 in assets (of which €75,000 financial).
- Temporary residence cards in Section 2 are optional; permit renewal every 5 years costs €500 (govt fee).
- The 12-month timeline is a guideline only, at the discretion of the relevant authorities.

**Sections/timeline (4)**
1. Signing & Engagement — Month 0
2. Application & Submission — Months 1–3
3. Approval & Investment — Months 4–9
4. Annual Obligations — every 12 months from grant, ongoing years 1–5

---

## 4. Website Flow

1. **Select Program of Interest** (dropdown/select, extensible list)
2. **Enter Client Name** (text input)
3. **Enter Variables** (dynamic form based on selected program's variable schema)
4. **Live preview** (optional — see Q7) of family structure + fee table
5. **Generate PDF** button → download

---

## 5. Decisions Made

- **Program data storage:** left to Claude Code's judgment — likely a JSON/YAML
  config file per program (easy to hand Claude Code new material later) unless
  it finds a stronger reason to do otherwise during the build.
- **PDF generation:** server-side HTML → PDF (e.g. Puppeteer/Playwright or
  WeasyPrint) for pixel-perfect A4 letterhead rendering.
- **Auth:** none — unauthenticated internal-only page.
- **Overflow handling (long fee tables):** auto-shrink text/spacing to fit the
  one-page constraint, rather than treating one page as a hard limit that
  blocks generation.
- **Real estate (Malta MPRP):** not excluded from totals. It's a variable the
  internal user sets upfront (Purchase vs. Rental), and its cost is included in
  the relevant section total — see the flagged double-counting question below.
- **Client Name:** one field, same as the main applicant's name (no separate
  "client" vs. "main applicant" distinction).
- **Currency:** not fixed to EUR — different programs use different currencies
  (e.g. some in USD). Currency must be a per-program config field, not
  hardcoded, and the PDF should render the correct symbol/formatting for that
  program's currency.
- **Progress indicator:** a simple indeterminate spinner ("Generating…") is
  sufficient — no need for multi-step progress detail.

## 6. Open Questions Still to Resolve Before/During Building

1. **Tech stack** — plain HTML/CSS/JS + a small Node/Python server, or a
   framework (React/Next.js)? Any existing GCS internal-tools stack this should
   match?
2. **Rental double-counting (Malta MPRP)** — see the ⚠️ flag above: if Rental is
   chosen, does Section 3 hold the *first year's* rent and Section 4 hold each
   *subsequent* year, or should the logic be different?
3. **Editable fees at generation time** — does the user ever need to override a
   fee amount manually before generating, or is it strictly calculated from variables?
4. **Client-name formatting in the filename** — spaces kept as-is, or also
   hyphenated/underscored (e.g. `John Smith` → `John-Smith` or `John_Smith`)?
5. **Hosting** — where will this run (internal server, Vercel, etc.)?
6. **"Good quality" benchmark** — is there an existing GCS-branded PDF (proposal,
   report) we should match visually/technically as the quality bar, beyond what
   the `gcs-letterhead` skill already defines?

---

## 7. Program Intake Checklist — What Claude Code Should Extract From New Material

Whenever new reference material (spreadsheet, PDF, HTML, etc.) is provided for
another program, Claude Code should read it and pull out exactly these pieces,
following the same structure used for Malta MPRP above:

1. **Program name** — the official name and how it should be slugged for the
   filename (e.g. "Malta MPRP" → `Malta-MPRP`).
2. **Variables** — every input the internal user needs to set, with:
   - type (boolean / number / select-with-options)
   - valid range or option list
   - how it changes the **family structure sentence** (does it add a clause like
     "+ Spouse" or "+ N Children"?)
   - how it changes **fee amounts** (does it multiply a per-person fee, unlock/
     remove a free allowance, switch between two mutually-exclusive costs like
     purchase-vs-rental, etc.)
   - **UI convention:** boolean variables (included/not included) are shown as
     a **Yes/No toggle**, not a 0/1 numeric stepper — even though they may map
     to 0/1 internally for the fee formulas.
3. **Sections** — the ordered list of quote stages, each with:
   - a title (e.g. "Signing & Engagement")
   - a timing label (e.g. "Month 0", "Months 1–3", "Every 12 months, ongoing years 1–5")
4. **Fees per section** — every line item, each tagged as one of:
   - **fixed** (flat amount regardless of variables)
   - **per-person formula** (amount × some count of applicants/dependants)
   - **conditional / either-or** (only one of two options applies, e.g.
     purchase vs. rental — and whether it's included in the section total or
     shown for information only)
   - **unknown/TBC** (no fixed figure yet — display literally as "TBC")
5. **Section subtotal formula** — the exact sum of which line items (and any
   that are deliberately excluded, with the reason — as flagged for Malta
   MPRP's real estate line).
6. **Grand total formula** — which sections/lines roll up into the one-time
   total shown at the bottom of the page (and which, like annual obligations,
   are called out separately rather than summed in).
7. **Footnotes/disclaimers** — any legal caveats, asset requirements, or notes
   that should be reproduced on the PDF (kept short, matching the style already
   used for Malta MPRP).
8. **Currency** — identify which currency the program's fees are quoted in
   (EUR, USD, etc. — programs vary, so this must always be set explicitly per
   program, never assumed as EUR).

If any of these 8 items aren't clearly present in the material provided,
Claude Code should flag the gap and ask rather than guess — the same way this
spec flagged the Malta MPRP rental double-counting question above.
