import type { Browser, Page } from "puppeteer-core";
import { Quote } from "../programs/types";
import {
  renderEstimateHtml,
  renderHeaderTemplate,
  renderFooterTemplate,
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

// One page is preferred, not forced: shrink text/spacing down to this
// floor to try to fit a dense quote on one page, but stop there — beyond
// this point shrinking further would make the document hard to read.
// 0.75 comfortably covers a normal-sized quote across programs with either
// 4 sections (Malta MPRP, needs ~0.81) or 5 (Italy Golden Visa, needs
// ~0.77) — a genuinely dense quote (many dependants pushing several extra
// fee lines into every section) is still allowed to flow onto a second
// page instead of being shrunk further. Unlike the old 0.72 floor, this is
// paired with the footnote contrast/size fix, so it's never relied on for
// readability alone.
const MIN_SCALE = 0.75;
const SCALE_STEP = 0.03;

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

/**
 * Renders a Quote to an A4 PDF, auto-shrinking font size/spacing (via the
 * print template's --scale variable) to try to fit one page — but only
 * down to a readable floor. A genuinely dense quote flows onto a second
 * (or later) page rather than being shrunk into illegibility; the branded
 * header/footer repeat correctly on every page via Puppeteer's native
 * header/footer templates.
 */
export async function renderQuoteToPdf(quote: Quote): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | undefined;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

    let scale = 1;
    let html = renderEstimateHtml(quote, scale);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    let contentHeightPx = await measureContentHeightPx(page);

    while (contentHeightPx > CONTENT_HEIGHT_PX && scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, scale - SCALE_STEP);
      html = renderEstimateHtml(quote, scale);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      contentHeightPx = await measureContentHeightPx(page);
    }

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
