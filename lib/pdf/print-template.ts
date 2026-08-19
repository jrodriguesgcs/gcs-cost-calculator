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
const DOC_MUTED_ALT = "#6F7185"; // letterhead date/sender-style labels — used for the family-structure line
const DOC_SUBTLE = "#C6C8D5"; // footnotes, copyright lines
const DOC_BORDER_LIGHT = "#ECEDF5"; // lightest divider (most common) — line-item and footer rules

let cachedLogoDataUri: string | null = null;
let cachedPinDataUri: string | null = null;
let cachedFontFaceCss: string | null = null;

function readAssetAsDataUri(relativePath: string, mimeType: string): string {
  const filePath = path.join(process.cwd(), "public", "letterhead", relativePath);
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function getLogoDataUri(): string {
  if (!cachedLogoDataUri) cachedLogoDataUri = readAssetAsDataUri("gcs-logo-full.png", "image/png");
  return cachedLogoDataUri;
}

function getPinDataUri(): string {
  if (!cachedPinDataUri) cachedPinDataUri = readAssetAsDataUri("location-pin-icon.png", "image/png");
  return cachedPinDataUri;
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

  cachedFontFaceCss = `
    @font-face { font-family: "Heebo"; font-weight: 400; src: url(${heebo400}) format("truetype"); }
    @font-face { font-family: "Heebo"; font-weight: 500; src: url(${heebo500}) format("truetype"); }
    @font-face { font-family: "Heebo"; font-weight: 600; src: url(${heebo600}) format("truetype"); }
    @font-face { font-family: "Yrsa"; font-weight: 400; src: url(${yrsa400}) format("truetype"); }
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
 * Renders the estimate as a standalone HTML document styled per the GCS
 * letterhead design tokens. `scale` (0 < scale <= 1) is the auto-shrink
 * lever used by the PDF route to fit everything on one A4 page — it scales
 * font sizes and vertical spacing together via a CSS custom property.
 */
export function renderEstimateHtml(quote: Quote, scale: number = 1): string {
  const logo = getLogoDataUri();
  const pin = getPinDataUri();
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
  @page { size: A4; margin: 0; }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: calc(20mm * var(--scale)) 20mm calc(16mm * var(--scale)) 20mm;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: calc(10mm * var(--scale));
  }
  .header img.logo { height: calc(11mm * var(--scale)); }
  .header .locations {
    text-align: right;
    font-size: calc(9pt * var(--scale));
    color: ${NAVY};
  }
  .header .locations .pin-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-bottom: 2px;
  }
  .header .locations img.pin { width: calc(4mm * var(--scale)); height: calc(4mm * var(--scale)); }
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
  .quote-section { margin-bottom: calc(6mm * var(--scale)); }
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
  table.line-items td.amount { text-align: right; white-space: nowrap; }
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
    margin-top: auto;
    font-size: calc(7.5pt * var(--scale));
    color: ${DOC_SUBTLE};
    padding-left: calc(4mm * var(--scale));
  }
  .footnotes li { margin-bottom: calc(1mm * var(--scale)); }
  .footer {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    padding-top: 4mm;
    border-top: 1px solid ${DOC_BORDER_LIGHT};
    margin-top: 6mm;
  }
  .footer .url { color: ${FOOTER_URL_COLOR}; text-decoration: none; }
  .footer .page-num { color: ${PAGE_NUM_COLOR}; }
</style>
</head>
<body>
  <div class="page" id="estimate-page">
    <div class="header">
      <img class="logo" src="${logo}" alt="Global Citizen Solutions" />
      <div class="locations">
        <div class="pin-row"><img class="pin" src="${pin}" alt="" /></div>
        <div>United Kingdom</div>
        <div>Portugal</div>
        <div>Brazil</div>
      </div>
    </div>

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

    <div class="footer">
      <a class="url" href="https://globalcitizensolutions.com">GLOBALCITIZENSOLUTIONS.COM</a>
      <span class="page-num">1</span>
    </div>
  </div>
</body>
</html>`;
}
