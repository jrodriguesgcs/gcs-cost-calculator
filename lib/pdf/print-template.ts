import fs from "fs";
import path from "path";
import { Quote } from "../programs/types";
import { formatAmount, formatCurrency } from "../currency";

// Brand tokens per the GCS Design System (gcsdesignsystemreference.md).
// Navy/accent/body-text are unchanged from the original gcs-letterhead
// tokens (confirmed no conflict, §7 of the reference doc) — body text stays
// #414856 (--foreground-secondary) rather than the newer --doc-body
// #4B4E65 print variant, per the doc's own explicit recommendation.
const NAVY = "#000957";
const BODY = "#414856";
const ACCENT = "#3F8CFF";
const FOOTER_URL_COLOR = "#0F1A2D";
const PAGE_NUM_COLOR = "#999999";

// Document-palette tokens (reference doc §1.10) — the finer-grained
// neutral/border scale meant for print/PDF contexts specifically.
const DOC_MUTED_ALT = "#6F7185"; // letterhead date/sender-style labels — used for the family-structure line, and (for real contrast) the footnotes
const DOC_BORDER_LIGHT = "#ECEDF5"; // lightest divider (most common) — line-item and footer rules

// Page-margin bands reserved for the repeating header/footer (see
// render-pdf.ts's `page.pdf({ margin })`) — exported so both sides of the
// header/footer-vs-content-height math stay in sync.
export const HEADER_MARGIN_MM = 35;
export const FOOTER_MARGIN_MM = 16;
export const PAGE_SIDE_MARGIN_MM = 20;

let cachedLogo: { dataUri: string; aspectRatio: number } | null = null;
let cachedFontFaceCss: string | null = null;

function readAssetAsDataUri(relativePath: string, mimeType: string): string {
  const filePath = path.join(process.cwd(), "public", "letterhead", relativePath);
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// The GCS Design System (gcs-design-system skill, §3.10) calls for the
// "Secondary" lockup — inline symbol + wordmark, Blue variant — in "page
// headers, footers, letterheads": a better fit for a header band than the
// old letterhead skill's stacked "Primary" lockup, and shipped as a real
// SVG rather than a raster PNG. Its aspect ratio is read from the file
// itself (its root <svg> width/height attributes) rather than hardcoded,
// per that same section's own rule ("always compute placement dimensions
// from the real file's aspect ratio — never guess").
function getLogoAsset(): { dataUri: string; aspectRatio: number } {
  if (cachedLogo) return cachedLogo;

  const filePath = path.join(process.cwd(), "public", "letterhead", "GCS-Secondary-Blue.svg");
  const svg = fs.readFileSync(filePath, "utf8");
  const widthMatch = svg.match(/<svg[^>]*\swidth="([\d.]+)"/);
  const heightMatch = svg.match(/<svg[^>]*\sheight="([\d.]+)"/);
  const width = widthMatch ? parseFloat(widthMatch[1]) : 270;
  const height = heightMatch ? parseFloat(heightMatch[1]) : 17;

  cachedLogo = {
    dataUri: `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`,
    aspectRatio: width / height,
  };
  return cachedLogo;
}

// Fonts are embedded as data URIs (rather than a Google Fonts <link>) so PDF
// rendering never depends on an external network call — this keeps
// generation fast and consistent regardless of the deployment's outbound
// network conditions (spec §2: <10s, and "consistently high-quality... not
// just on a good run").
function getFontFaceCss(): string {
  if (cachedFontFaceCss) return cachedFontFaceCss;

  const heebo400 = readAssetAsDataUri("fonts/heebo-400.ttf", "font/ttf");
  const heebo500 = readAssetAsDataUri("fonts/heebo-500.ttf", "font/ttf");
  const heebo600 = readAssetAsDataUri("fonts/heebo-600.ttf", "font/ttf");
  const yrsa400 = readAssetAsDataUri("fonts/yrsa-400.ttf", "font/ttf");
  // §3.2 of the GCS Design System assigns JetBrains Mono to "application/
  // reference IDs, codes, data, anything tabular/numeric that benefits
  // from fixed width" — applied below to the line-item/subtotal amount
  // columns (see renderEstimateHtml), which are exactly that.
  const jetbrainsMono400 = readAssetAsDataUri("fonts/jetbrains-mono-400.ttf", "font/ttf");

  cachedFontFaceCss = `
    @font-face { font-family: "Heebo"; font-weight: 400; src: url(${heebo400}) format("truetype"); }
    @font-face { font-family: "Heebo"; font-weight: 500; src: url(${heebo500}) format("truetype"); }
    @font-face { font-family: "Heebo"; font-weight: 600; src: url(${heebo600}) format("truetype"); }
    @font-face { font-family: "Yrsa"; font-weight: 400; src: url(${yrsa400}) format("truetype"); }
    @font-face { font-family: "JetBrains Mono"; font-weight: 400; src: url(${jetbrainsMono400}) format("truetype"); }
  `;
  return cachedFontFaceCss;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Repeating page header (logo only — office locations were dropped per an
 * earlier explicit request this session), rendered via Puppeteer's native
 * `page.pdf({ headerTemplate })` so it appears correctly on every physical
 * page — necessary now that a quote can legitimately span more than one
 * page (see render-pdf.ts).
 */
export function renderHeaderTemplate(): string {
  const logo = getLogoAsset();
  const fontFaceCss = getFontFaceCss();
  const heightMm = 6;
  const widthMm = heightMm * logo.aspectRatio;

  return `<style>${fontFaceCss}</style>
<div style="width:100%; box-sizing:border-box; padding:0 ${PAGE_SIDE_MARGIN_MM}mm; font-family:'Heebo',sans-serif;">
  <img src="${logo.dataUri}" style="height:${heightMm}mm; width:${widthMm}mm;" />
</div>`;
}

/**
 * Repeating page footer (URL + real, dynamic page count via Puppeteer's
 * `pageNumber`/`totalPages` placeholder classes) — see renderHeaderTemplate.
 */
export function renderFooterTemplate(): string {
  const fontFaceCss = getFontFaceCss();

  return `<style>${fontFaceCss}</style>
<div style="width:100%; box-sizing:border-box; padding:0 ${PAGE_SIDE_MARGIN_MM}mm; display:flex; justify-content:space-between; font-family:'Heebo',sans-serif; font-size:10pt;">
  <span style="color:${FOOTER_URL_COLOR};">GLOBALCITIZENSOLUTIONS.COM</span>
  <span style="color:${PAGE_NUM_COLOR};"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;
}

/**
 * Renders the estimate's content (title, family structure, fee sections,
 * grand total, footnotes) as a standalone HTML document styled per the GCS
 * letterhead design tokens. The repeating header/footer are handled
 * separately by Puppeteer (see renderHeaderTemplate/renderFooterTemplate)
 * so they display correctly regardless of how many physical pages the
 * content ends up spanning.
 *
 * `scale` (0 < scale <= 1) is the auto-shrink lever used by the PDF route
 * to prefer fitting everything on one A4 page — it scales font sizes and
 * vertical spacing together via a CSS custom property. Once `scale` hits
 * its floor, genuinely dense quotes are allowed to flow onto a second page
 * rather than being shrunk further into illegibility.
 */
export function renderEstimateHtml(quote: Quote, scale: number = 1): string {
  const fontFaceCss = getFontFaceCss();

  const sectionsHtml = quote.sections
    .map(
      (section) => `
      <section class="quote-section">
        <div class="section-header">
          <h2>${escapeHtml(section.title)}</h2>
          <span class="timing">${escapeHtml(section.timing)}</span>
        </div>
        <table class="line-items">
          <tbody>
            ${section.lineItems
              .map(
                (item) => `
              <tr>
                <td class="label">${escapeHtml(item.label)}</td>
                <td class="amount">${formatAmount(item.amount, quote.currency, item.approximate)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="subtotal">
              <td class="label">Section total</td>
              <td class="amount">${
                section.subtotalApproximate ? "~" : ""
              }${formatCurrency(section.subtotal, quote.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </section>`,
    )
    .join("");

  const footnotesHtml = quote.footnotes
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${fontFaceCss}
  :root { --scale: ${scale}; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Heebo", sans-serif;
    color: ${BODY};
    font-size: calc(11pt * var(--scale));
    line-height: 1.4;
  }
  .page {
    /* Deliberately no min-height here: render-pdf.ts measures this
       element's natural scrollHeight to decide whether to shrink/paginate,
       and a min-height equal to the comparison threshold would make that
       measurement always read as "at least the threshold" regardless of
       actual content size. The physical A4 page size is controlled by
       Puppeteer's page.pdf({ format: "A4" }) call, independent of this. */
    width: 100%;
    padding: 0 ${PAGE_SIDE_MARGIN_MM}mm;
    display: flex;
    flex-direction: column;
  }
  h1 {
    font-family: "Yrsa", serif;
    font-weight: 400;
    font-size: calc(26pt * var(--scale));
    color: ${NAVY};
    margin: 0 0 calc(4mm * var(--scale)) 0;
  }
  .client-name {
    font-size: calc(13pt * var(--scale));
    color: ${NAVY};
    margin: 0 0 calc(2mm * var(--scale)) 0;
  }
  .family-structure {
    font-size: calc(11pt * var(--scale));
    color: ${DOC_MUTED_ALT};
    margin: 0 0 calc(8mm * var(--scale)) 0;
  }
  .quote-section { margin-bottom: calc(6mm * var(--scale)); break-inside: avoid; }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid ${NAVY};
    padding-bottom: calc(1.5mm * var(--scale));
    margin-bottom: calc(2mm * var(--scale));
  }
  .section-header h2 {
    font-family: "Heebo", sans-serif;
    font-weight: 500;
    font-size: calc(13pt * var(--scale));
    color: ${NAVY};
    margin: 0;
  }
  .section-header .timing {
    font-size: calc(9.5pt * var(--scale));
    color: ${ACCENT};
  }
  table.line-items { width: 100%; border-collapse: collapse; }
  table.line-items td {
    padding: calc(1mm * var(--scale)) 0;
    font-size: calc(10.5pt * var(--scale));
  }
  table.line-items td.amount {
    text-align: right;
    white-space: nowrap;
    /* §3.2 of the GCS Design System: JetBrains Mono for tabular/numeric
       data — these rows are exactly that, unlike the Grand Total below,
       which stays in Yrsa as a single hero figure, not a tabular one. */
    font-family: "JetBrains Mono", monospace;
  }
  table.line-items tfoot tr.subtotal td {
    border-top: 1px solid ${DOC_BORDER_LIGHT};
    padding-top: calc(1.5mm * var(--scale));
    font-weight: 600;
    color: ${NAVY};
  }
  .grand-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-top: 2px solid ${NAVY};
    border-bottom: 2px solid ${NAVY};
    padding: calc(3mm * var(--scale)) 0;
    margin: calc(2mm * var(--scale)) 0 calc(8mm * var(--scale)) 0;
    break-inside: avoid;
  }
  .grand-total .label {
    font-family: "Yrsa", serif;
    font-size: calc(14pt * var(--scale));
    color: ${NAVY};
  }
  .grand-total .amount {
    font-family: "Yrsa", serif;
    font-size: calc(16pt * var(--scale));
    color: ${NAVY};
  }
  .footnotes {
    margin-top: calc(6mm * var(--scale));
    font-size: calc(8pt * var(--scale));
    color: ${DOC_MUTED_ALT};
    padding-left: calc(4mm * var(--scale));
    break-inside: avoid;
  }
  .footnotes li { margin-bottom: calc(1mm * var(--scale)); }
</style>
</head>
<body>
  <div class="page" id="estimate-page">
    <h1>Investment Estimate - ${escapeHtml(quote.programName)}</h1>
    <div class="client-name">${escapeHtml(quote.clientName)}</div>
    <div class="family-structure">${escapeHtml(quote.familyStructure)}</div>

    ${sectionsHtml}

    <div class="grand-total">
      <span class="label">Grand Total</span>
      <span class="amount">${formatCurrency(quote.grandTotal, quote.currency)}</span>
    </div>

    <ul class="footnotes">
      ${footnotesHtml}
    </ul>
  </div>
</body>
</html>`;
}
