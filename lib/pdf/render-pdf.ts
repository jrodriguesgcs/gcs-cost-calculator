import type { Browser, Page } from "puppeteer-core";
import { Quote } from "../programs/types";
import {
  renderEstimateHtml,
  renderHeaderTemplate,
  renderFooterTemplate,
  blockKeyToString,
  BlockKey,
  BlockScaleOverride,
  HEADER_MARGIN_MM,
  FOOTER_MARGIN_MM,
} from "./print-template";

// Content-area height for one A4 page, i.e. the page height minus the
// header/footer margin bands Puppeteer reserves (see print-template.ts,
// which uses the same constants) — used to detect overflow for the
// auto-shrink step below.
const MM_TO_PX = 96 / 25.4;
// Safety margin subtracted from the raw budget: our scrollHeight
// measurement comes from the live, on-screen DOM, not from Chromium's
// actual print/pagination pass, and the two can disagree by a handful of
// px (seen in practice: content measured as fitting with <1px to spare
// still spilled onto a second real page). Requiring real headroom here —
// not just clearing the raw number — makes the loop shrink one more notch
// in those close calls instead of gambling on an exact edge case.
const PAGE_SAFETY_MARGIN_PX = 20;
const CONTENT_HEIGHT_PX = (297 - HEADER_MARGIN_MM - FOOTER_MARGIN_MM) * MM_TO_PX - PAGE_SAFETY_MARGIN_PX;
// Invariant: HEADER_MARGIN_MM/FOOTER_MARGIN_MM (the page.pdf margin box,
// below) and print-template.ts's PAGE_SIDE_MARGIN_MM (the .page CSS padding)
// must never be threaded through `scale` — every shrink step below (and the
// pagination simulation that follows it) only ever touches
// --scale-type/--scale-space, so a quote always keeps real breathing margin
// on every page, never a margin squeezed down to make content fit.

// Extra safety margin applied specifically to the pagination simulation's
// per-page budget, on top of the PAGE_SAFETY_MARGIN_PX already baked into
// CONTENT_HEIGHT_PX. The simulation sums several separate
// getBoundingClientRect() block measurements rather than reading one
// scrollHeight, and in a real, observed dense case that sum landed <1px
// under budget while Chromium's actual print pass still needed the extra
// page — the same on-screen-vs-print-layout rounding gap
// PAGE_SAFETY_MARGIN_PX exists for above, just resurfacing at a finer
// grain once content is measured block-by-block. Predicting one extra page
// break too many is harmless (still clean, non-mid-section pagination);
// predicting one too few means a real page break with no continuation
// note, which is the failure this whole feature exists to prevent.
const PAGINATION_SAFETY_MARGIN_PX = 20;

// Oversized-single-block fallback (a section/grand-total/footnotes block
// taller than one full page's content budget — not triggered by any of the
// 14 programs today, in any route/variable combination: max observed
// section ~18 line items, max footnotes ~1940 characters, both comfortably
// under one A4 content page). Bounds how far that one block gets shrunk,
// independently of the document-wide scale, before it's allowed to split
// with a logged warning rather than silently mis-paginating. See
// simulatePagination's `oversized` flag and its use in renderQuoteToPdf.
const BLOCK_MIN_SCALE = 0.7;

// The actual per-page budget the pagination simulation reasons against —
// see PAGINATION_SAFETY_MARGIN_PX above.
const PAGINATION_BUDGET_PX = CONTENT_HEIGHT_PX - PAGINATION_SAFETY_MARGIN_PX;

// One page is preferred, not forced: shrink to try to fit a dense quote on
// one page, but stop there — beyond this point shrinking further would make
// the document hard to read. Type and spacing shrink independently (see
// print-template.ts's --scale-type/--scale-space) and are walked down in
// two phases below: spacing compresses first (it can give a lot before it
// hurts readability), and only once spacing bottoms out does type start
// shrinking, down to a much shallower floor. Footnotes don't scale with
// type at all (fixed 8pt in print-template.ts), so disclaimers are never
// affected by either floor.
const SPACE_MIN_SCALE = 0.5;
const SPACE_SCALE_STEP = 0.05;
// A normal-sized quote (4-5 sections) should rarely need to shrink type at
// all now that spacing absorbs most of the compression — this floor only
// matters for genuinely dense quotes (many dependants pushing several
// extra fee lines into every section), which flow to a second page instead
// of shrinking past it.
const TYPE_MIN_SCALE = 0.85;
const TYPE_SCALE_STEP = 0.03;

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");

  // On Vercel (and other serverless targets), use the serverless-compatible
  // Chromium build. Locally, fall back to the pre-installed Chromium binary
  // used for dev/verification (see project README).
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    executablePath: process.env.LOCAL_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
    headless: true,
    // Needed when running as root (e.g. in a container) — Chromium's
    // sandbox requires a non-root user otherwise.
    args: process.getuid?.() === 0 ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
}

// Module-level cache: survives across warm invocations of the same
// serverless function instance (or across requests within one `next dev`
// process). Launching Chromium is the expensive part of a render — a cold
// instance still pays that cost once, but every subsequent request against
// a warm instance reuses this browser instead of relaunching it, which is
// what the spec (§2) asked for ("a persistent/warm headless-browser
// instance... rather than spinning one up per request").
let cachedBrowserPromise: Promise<Browser> | null = null;

// Returns a warm, connected Browser — reusing the cached instance if one
// exists and is still alive, relaunching (and replacing the cache) if it
// doesn't exist yet or has crashed/disconnected since the last call. Note
// this instance must never be closed by a request — only the per-request
// Page (see renderQuoteToPdf) — closing it here would silently undo the
// whole point of the cache.
async function getBrowser(): Promise<Browser> {
  if (cachedBrowserPromise) {
    const browser = await cachedBrowserPromise;
    if (browser.connected) return browser;
    // Cached instance died between invocations (crashed, OOM-killed, etc.)
    // — drop it and fall through to relaunch.
    cachedBrowserPromise = null;
  }
  cachedBrowserPromise = launchBrowser();
  return cachedBrowserPromise;
}

async function measureContentHeightPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById("estimate-page");
    return el ? el.scrollHeight : 0;
  });
}

interface BlockMeasurement {
  key: BlockKey;
  /**
   * This block's full vertical footprint — not just its own border-box
   * height. Computed as the gap between the *previous* block's bottom edge
   * and this block's own bottom edge, so it inherently includes this
   * block's margin-top (and folds the previous block's margin-bottom into
   * whichever block follows it). This matters because `#estimate-page` is a
   * `display: flex; flex-direction: column` container — flex items never
   * collapse margins with each other, unlike normal block flow — so a
   * plain `getBoundingClientRect().height` (border-box only, no margins)
   * would silently under-count real space consumed and make the simulation
   * think more fits per page than actually does.
   */
  height: number;
}

interface BlockMeasurements {
  /**
   * Fixed space consumed before the first paginatable block (title, client
   * name, family structure, optional investment-route line) — only ever
   * paid once, on the first physical page, since none of that repeats on
   * later pages the way the Puppeteer header/footer templates do.
   */
  headerHeight: number;
  blocks: BlockMeasurement[];
}

// Reads the real rendered layout of every top-level block (each fee
// section, the grand total, the footnotes list) currently in the DOM — i.e.
// after whatever `scale`/route-driven line-item filtering already applied.
// This is the input to simulatePagination below.
async function measureBlocks(page: Page): Promise<BlockMeasurements> {
  return page.evaluate(() => {
    const root = document.getElementById("estimate-page");
    if (!root) return { headerHeight: 0, blocks: [] };

    const candidates = Array.from(root.children).filter((el) =>
      el.matches(".quote-section, .grand-total, .footnotes"),
    ) as HTMLElement[];
    if (candidates.length === 0) return { headerHeight: 0, blocks: [] };

    const rootTop = root.getBoundingClientRect().top;
    const firstTop = candidates[0].getBoundingClientRect().top;
    const headerHeight = firstTop - rootTop;

    const blocks: BlockMeasurement[] = [];
    let prevBottom = firstTop;
    let sectionIndex = 0;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      let key: BlockKey;
      if (el.classList.contains("quote-section")) {
        key = { kind: "section", index: sectionIndex };
        sectionIndex += 1;
      } else if (el.classList.contains("grand-total")) {
        key = { kind: "grand-total", index: 0 };
      } else {
        key = { kind: "footnotes", index: 0 };
      }
      blocks.push({ key, height: rect.bottom - prevBottom });
      prevBottom = rect.bottom;
    }

    return { headerHeight, blocks };
  });
}

interface PageAssignment {
  measurement: BlockMeasurement;
  page: number;
  /** This block alone is taller than one page's content budget — see BLOCK_MIN_SCALE. */
  oversized: boolean;
}

// Deterministically mirrors what Chromium's real print pagination produces
// for a sequence of non-splitting blocks (every block here already carries
// break-inside: avoid): a block starts a new simulated page iff it doesn't
// fit in what's left of the current one. Since the header/footer repeat
// identically on every physical page, `budgetPx` is a valid content budget
// for every simulated page — except the very first, which additionally
// pays `headerHeight` (the title/client-name/family-structure block above
// the first section, which is never repeated) — so this single greedy pass
// tells us exactly which block will start each real page, before we ever
// call page.pdf().
function simulatePagination(measurements: BlockMeasurements, budgetPx: number): PageAssignment[] {
  const { headerHeight, blocks } = measurements;
  const result: PageAssignment[] = [];
  let page = 0;
  let remaining = budgetPx - headerHeight;

  for (const block of blocks) {
    const oversized = block.height > budgetPx;
    if (!oversized && block.height > remaining) {
      page += 1;
      remaining = budgetPx;
    }
    result.push({ measurement: block, page, oversized });
    remaining -= block.height;
  }

  return result;
}

/**
 * Renders a Quote to an A4 PDF, auto-shrinking font size/spacing (via the
 * print template's --scale variable) to try to fit one page — but only
 * down to a readable floor. A genuinely dense quote flows onto a second
 * (or later) page rather than being shrunk into illegibility; the branded
 * header/footer repeat correctly on every page via Puppeteer's native
 * header/footer templates.
 *
 * When it does spill onto further pages, pagination is not left to chance:
 * a deterministic simulation (see simulatePagination) decides exactly which
 * block starts each page before the final print call, so no fee section or
 * the disclaimers list is ever split mid-content, and a "continues on the
 * next page" note appears at exactly the right spot. See the "Deterministic
 * pagination control" section below.
 */
export async function renderQuoteToPdf(quote: Quote): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | undefined;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

    const scale = { type: 1, space: 1 };
    let html = renderEstimateHtml(quote, scale);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    let contentHeightPx = await measureContentHeightPx(page);

    // Phase 1: compress spacing first, type stays at 1.
    while (contentHeightPx > CONTENT_HEIGHT_PX && scale.space > SPACE_MIN_SCALE) {
      scale.space = Math.max(SPACE_MIN_SCALE, scale.space - SPACE_SCALE_STEP);
      html = renderEstimateHtml(quote, scale);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      contentHeightPx = await measureContentHeightPx(page);
    }

    // Phase 2: spacing is at its floor and it's still overflowing — only
    // now start shrinking type, down to its own (much shallower) floor.
    while (contentHeightPx > CONTENT_HEIGHT_PX && scale.type > TYPE_MIN_SCALE) {
      scale.type = Math.max(TYPE_MIN_SCALE, scale.type - TYPE_SCALE_STEP);
      html = renderEstimateHtml(quote, scale);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      contentHeightPx = await measureContentHeightPx(page);
    }

    // --- Deterministic pagination control -----------------------------
    // The shrink loop above only ever tries to fit everything on one page.
    // If a genuinely dense quote still spills over, decide — before the
    // final print call, not after — exactly which block starts each real
    // page, so a forced break can be made authoritative (rather than
    // relying on the soft break-inside: avoid the print template already
    // sets) and a professional "continues on next page" note can be placed
    // at exactly the right spot. Chromium's page.pdf() pagination can't be
    // inspected after the fact, so this simulates it first (see
    // simulatePagination's own comment for why the simulation is exact).
    let measurements = await measureBlocks(page);
    let assignment = simulatePagination(measurements, PAGINATION_BUDGET_PX);

    const blockOverrides = new Map<string, BlockScaleOverride>();
    const allowSplitBlocks = new Set<string>();

    const oversizedBlocks = assignment.filter((a) => a.oversized);
    if (oversizedBlocks.length > 0) {
      // A block taller than one full page can't be kept off a break by CSS
      // alone. Apply one extra shrink scoped to just that block (never the
      // document-wide scale, which is already settled) before accepting it
      // has to split. Footnotes never scale type (fixed 8pt, see
      // print-template.ts) — overriding it here would be a no-op there by
      // design, so only spacing actually shrinks further for that block.
      for (const a of oversizedBlocks) {
        const ratio = Math.max(BLOCK_MIN_SCALE, PAGINATION_BUDGET_PX / a.measurement.height);
        blockOverrides.set(blockKeyToString(a.measurement.key), {
          type: Math.min(scale.type, ratio),
          space: Math.min(scale.space, ratio),
        });
      }

      html = renderEstimateHtml(quote, scale, { blockOverrides });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      measurements = await measureBlocks(page);
      assignment = simulatePagination(measurements, PAGINATION_BUDGET_PX);

      for (const a of assignment) {
        if (a.oversized) {
          console.warn(
            `[render-pdf] "${quote.programSlug}" ${a.measurement.key.kind} #${a.measurement.key.index} is still taller than one page (${Math.round(a.measurement.height)}px) after its scoped shrink floor (${BLOCK_MIN_SCALE}) — allowing it to split rather than silently mis-paginating.`,
          );
          allowSplitBlocks.add(blockKeyToString(a.measurement.key));
        }
      }
    }

    const needsForcedBreaks = assignment.some((a, i) => i > 0 && a.page !== assignment[i - 1].page);
    if (needsForcedBreaks || blockOverrides.size > 0) {
      const pageBreaks: BlockKey[] = [];
      const noteAfter: BlockKey[] = [];
      assignment.forEach((a, i) => {
        if (i > 0 && a.page !== assignment[i - 1].page) {
          pageBreaks.push(a.measurement.key);
          noteAfter.push(assignment[i - 1].measurement.key);
        }
      });
      html = renderEstimateHtml(quote, scale, { pageBreaks, noteAfter, blockOverrides, allowSplitBlocks });
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
    }
    // -------------------------------------------------------------------

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: renderHeaderTemplate(),
      footerTemplate: renderFooterTemplate(),
      // Left/right stay 0 here: the 20mm side inset is applied as CSS
      // padding in both the main content (print-template.ts's `.page`) and
      // the header/footer templates themselves, so it isn't double-applied.
      margin: {
        top: `${HEADER_MARGIN_MM}mm`,
        bottom: `${FOOTER_MARGIN_MM}mm`,
        left: "0mm",
        right: "0mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    // Only the per-request Page is closed — the Browser is cached and
    // reused across requests (see getBrowser above).
    await page?.close();
  }
}
