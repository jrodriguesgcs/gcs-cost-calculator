import type { Browser, Page } from "puppeteer-core";
import { Quote } from "../programs/types";
import { renderEstimateHtml } from "./print-template";

// A4 content box height in CSS px at 96dpi, minus the page's own vertical
// padding (20mm top + 16mm bottom, see print-template.ts), used to detect
// overflow for the auto-shrink step below.
const MM_TO_PX = 96 / 25.4;
const A4_HEIGHT_PX = 297 * MM_TO_PX;

const MIN_SCALE = 0.72;
const SCALE_STEP = 0.04;

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

async function measureContentHeightPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.getElementById("estimate-page");
    return el ? el.scrollHeight : 0;
  });
}

/**
 * Renders a Quote to a one-page A4 PDF, auto-shrinking font size/spacing
 * (via the print template's --scale variable) until the content fits,
 * rather than overflowing to a second page or blocking generation.
 */
export async function renderQuoteToPdf(quote: Quote): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

    let scale = 1;
    let html = renderEstimateHtml(quote, scale);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    let contentHeightPx = await measureContentHeightPx(page);

    while (contentHeightPx > A4_HEIGHT_PX && scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, scale - SCALE_STEP);
      html = renderEstimateHtml(quote, scale);
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      contentHeightPx = await measureContentHeightPx(page);
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
