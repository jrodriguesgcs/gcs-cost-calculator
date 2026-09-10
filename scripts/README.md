# Scripts

## Rendering every program for a visual pagination check

`render-all-programs.ts` batch-renders every program to a real PDF under a
few variable combinations (default, each route/track option, and a "dense"
worst case) and writes them to `.scripts-build/pagination-check/` for manual
visual QA. Use this after any change to `lib/pdf/render-pdf.ts` or
`lib/pdf/print-template.ts` to confirm: short quotes still render as a clean
single page with real breathing margin, dense quotes spill onto further
pages without ever splitting a section/disclaimers block mid-content, and
the "continues on the next page" note appears exactly once per real page
break, in the right place.

```sh
npx tsc -p scripts/tsconfig.json
node .scripts-build/scripts/render-all-programs.js
```

Compiling to CommonJS first (rather than running the `.ts` file directly)
is needed for the same reason as the review-workbook pipeline: `lib/programs/*`
uses extensionless relative imports (`from "./x.config"`), which only
Node's CJS resolver resolves automatically. No new dependency — reuses the
`typescript` package already in `devDependencies`.

Needs a local Chromium binary (see the main `README.md`'s "PDF rendering"
section) — set `LOCAL_CHROMIUM_PATH` if `/opt/pw-browsers/chromium` isn't
present, e.g.:

```sh
LOCAL_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  node .scripts-build/scripts/render-all-programs.js
```

Output PDFs and the `tsc` build output both land under `.scripts-build/`
(gitignored) — generated, not source.
