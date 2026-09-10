import fs from "fs";
import path from "path";
import { Quote } from "../programs/types";
import { formatAmount, formatCurrency } from "../currency";

// Brand tokens. Navy/accent are unchanged from the GCS Design System
// (gcsdesignsystemreference.md). Body text follows the gcs-docx skill's
// "General" correspondence variant (#343750, paragraph body text) rather
// than gcs-design-system's --foreground-secondary (#414856) — gcs-docx is
// the more recently updated brand source for document body-copy color;
// its "salutation/closing" color (#252839) has no PDF equivalent here
// (this is a fee estimate, not a letter) and isn't used.
const NAVY = "#000957";
const BODY = "#343750";
// The section "timing" label (e.g. "Months 1–3") is the one place small
// (9.5pt, non-bold) text was set in the raw brand accent #3F8CFF — that
// only reaches ~3.27:1 against white, well under WCAG AA's 4.5:1 for
// normal-size text (confirmed by computing relative luminance by hand; the
// impeccable skill's audit is web-only and doesn't check PDFs). --doc-badge
// from the design system's own §1.10 document palette is the closest
// same-family blue that actually clears AA (~5.93:1) — used here instead
// of the raw accent for any small blue text; a bigger/bolder accent use
// could still use the brand accent directly under the 3:1 large-text rule.
const ACCENT_TEXT = "#3D51E8";
const FOOTER_URL_COLOR = "#0F1A2D";

// Document-palette tokens (reference doc §1.10) — the finer-grained
// neutral/border scale meant for print/PDF contexts specifically.
const DOC_MUTED_ALT = "#6F7185"; // letterhead date/sender-style labels — used for the family-structure line, the footnotes, and (for real contrast; replaces the old #999999 that only hit ~2.85:1) the footer page count
const DOC_BORDER_LIGHT = "#ECEDF5"; // lightest divider (most common) — line-item and footer rules
const DOC_SURFACE = "#F7F8FD"; // "light card/box background" (§1.10) — used to give the Grand Total and alternating line-item rows real visual separation instead of relying on font-size alone

// Page-margin bands reserved for the repeating header/footer (see
// render-pdf.ts's `page.pdf({ margin })`) — exported so both sides of the
// header/footer-vs-content-height math stay in sync.
//
// HEADER_MARGIN_MM was sized (35mm) for the original 11mm-tall logo +
// three-line office-address block in the header (see git history on
// renderHeaderTemplate). Both were later removed/shrunk down to a single
// 6mm logo, but this constant was never revisited — leaving ~29mm of dead
// white space between the logo and the title on every generated PDF, and
// needlessly shrinking the auto-shrink content budget in render-pdf.ts.
// 18mm gives the 6mm logo a comfortable ~12mm gap before content starts
// (roughly the same visual breathing room the old 35mm gave the taller
// 11mm header) without the leftover slack.
export const HEADER_MARGIN_MM = 18;
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
  <img src="${logo.dataUri}" alt="Global Citizen Solutions" style="height:${heightMm}mm; width:${widthMm}mm;" />
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
  <span style="color:${DOC_MUTED_ALT};"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;
}

/**
 * Identifies one of the document's non-splitting top-level blocks (a fee
 * section, the Grand Total, or the footnotes list) — the unit render-pdf.ts's
 * pagination simulation reasons about. `index` is only meaningful for
 * `"section"` (position in `quote.sections`); Grand Total and footnotes are
 * each always exactly one block, so their `index` is always 0.
 */
export interface BlockKey {
  kind: "section" | "grand-total" | "footnotes";
  index: number;
}

export function blockKeyToString(key: BlockKey): string {
  return `${key.kind}:${key.index}`;
}

/** Extra shrink applied to a single oversized block only (see render-pdf.ts) — independent of, and layered on top of, the document-wide `scale`. */
export interface BlockScaleOverride {
  type: number;
  space: number;
}

/**
 * Pagination decisions computed by render-pdf.ts's simulation, fed back into
 * the render so the final `page.pdf()` call matches exactly what was
 * simulated. Every field defaults to empty/off, so the one-page case (the
 * common one) renders identically to before this existed.
 */
export interface PageLayout {
  /** Blocks that must start a new physical page (`break-before: page`). */
  pageBreaks?: BlockKey[];
  /** Blocks that get the "continues on next page" note as their last line — always the block immediately before a `pageBreaks` entry. */
  noteAfter?: BlockKey[];
  /** Per-block extra shrink for the rare block-taller-than-one-page case, keyed by `blockKeyToString()`. */
  blockOverrides?: Map<string, BlockScaleOverride>;
  /** Blocks that must be allowed to split mid-content because even the scoped shrink above couldn't make them fit one page, keyed by `blockKeyToString()`. */
  allowSplitBlocks?: Set<string>;
}

/**
 * The note shown when a block is the last one on a physical page and
 * content genuinely continues past it — a client-facing signal that the
 * document isn't finished, not a warning. Only ever placed at the end of a
 * `.quote-section` or `.grand-total` (see renderEstimateHtml below):
 * footnotes are always the last block in the document, so nothing ever
 * follows them onto a further page.
 */
function renderContinuationNote(): string {
  return `<div class="continuation-note">This estimate continues on the next page.</div>`;
}

/**
 * Renders the estimate's content (title, family structure, fee sections,
 * grand total, footnotes) as a standalone HTML document styled per the GCS
 * letterhead design tokens. The repeating header/footer are handled
 * separately by Puppeteer (see renderHeaderTemplate/renderFooterTemplate)
 * so they display correctly regardless of how many physical pages the
 * content ends up spanning.
 *
 * `scale` is the auto-shrink lever used by the PDF route to prefer fitting
 * everything on one A4 page. Type and spacing shrink independently (two CSS
 * custom properties, not one) so a dense quote compresses its padding/
 * margins first — the part that can give without hurting legibility —
 * before it ever touches font size: `render-pdf.ts`'s shrink loop holds
 * `scale.type` at 1 and walks `scale.space` down to its floor first, only
 * then starts reducing `scale.type`. Once both floors hit, genuinely dense
 * quotes flow onto a second page rather than being shrunk into illegibility.
 * Footnotes opt out of `scale.type` entirely (see the `.footnotes` rule
 * below) so disclaimers can never shrink below a readable size no matter
 * how dense the quote is.
 *
 * `layout` carries render-pdf.ts's pagination decisions (see `PageLayout`
 * above): which blocks must force a page break, which get a continuation
 * note, and the rare per-block overrides/allow-split escape hatch for a
 * block taller than one page. Every field defaults to empty, so a plain
 * `renderEstimateHtml(quote, scale)` call — as used during the shrink loop,
 * before pagination is known — renders exactly as it did before this
 * existed: no forced breaks, no notes, plain `break-inside: avoid` on every
 * block.
 */
export function renderEstimateHtml(
  quote: Quote,
  scale: { type: number; space: number } = { type: 1, space: 1 },
  layout: PageLayout = {},
): string {
  const fontFaceCss = getFontFaceCss();
  const {
    pageBreaks = [],
    noteAfter = [],
    blockOverrides = new Map<string, BlockScaleOverride>(),
    allowSplitBlocks = new Set<string>(),
  } = layout;
  const pageBreakKeys = new Set(pageBreaks.map(blockKeyToString));
  const noteAfterKeys = new Set(noteAfter.map(blockKeyToString));

  // Builds the `class="..."` (plus an inline style for a block-scoped
  // override, if any) attribute string for one top-level block — the single
  // place that turns the simulation's decisions (forced break, allow-split,
  // scoped shrink) into markup, reused identically for sections, the grand
  // total, and footnotes below.
  function blockAttrs(key: BlockKey, baseClass: string): string {
    const keyStr = blockKeyToString(key);
    const classes = [baseClass];
    if (pageBreakKeys.has(keyStr)) classes.push("force-page-break");
    if (allowSplitBlocks.has(keyStr)) classes.push("allow-split");
    const override = blockOverrides.get(keyStr);
    const styleAttr = override
      ? ` style="--scale-type:${override.type};--scale-space:${override.space};"`
      : "";
    return `class="${classes.join(" ")}"${styleAttr}`;
  }

  const sectionsHtml = quote.sections
    .map((section, index) => {
      const key: BlockKey = { kind: "section", index };
      const note = noteAfterKeys.has(blockKeyToString(key)) ? renderContinuationNote() : "";
      return `
      <section ${blockAttrs(key, "quote-section")}>
        <div class="section-header">
          <h2>${escapeHtml(section.title)}</h2>
          <span class="timing">${escapeHtml(section.timing)}</span>
        </div>
        <table class="line-items">
          <tbody>
            ${section.lineItems
              .filter((item) => item.amount !== 0)
              .map(
                (item) => `
              <tr${item.amount === null ? ' class="tbc"' : ""}>
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
        ${note}
      </section>`;
    })
    .join("");

  const footnotesHtml = quote.footnotes
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  const grandTotalKey: BlockKey = { kind: "grand-total", index: 0 };
  const grandTotalAttrs = blockAttrs(grandTotalKey, "grand-total");
  const grandTotalNote = noteAfterKeys.has(blockKeyToString(grandTotalKey)) ? renderContinuationNote() : "";

  const footnotesKey: BlockKey = { kind: "footnotes", index: 0 };
  const footnotesAttrs = blockAttrs(footnotesKey, "footnotes");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${fontFaceCss}
  :root { --scale-type: ${scale.type}; --scale-space: ${scale.space}; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Heebo", sans-serif;
    color: ${BODY};
    font-size: calc(11pt * var(--scale-type));
    line-height: 1.4;
    /* §2.2/§2.4 tracking-tight default for body copy. */
    letter-spacing: -0.01em;
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
    font-size: calc(26pt * var(--scale-type));
    color: ${NAVY};
    margin: 0 0 calc(4mm * var(--scale-space)) 0;
    /* §2.2/§2.4 tracking-tight for serif/display headings. */
    letter-spacing: -0.025em;
  }
  .client-name {
    font-size: calc(13pt * var(--scale-type));
    color: ${NAVY};
    margin: 0 0 calc(2mm * var(--scale-space)) 0;
  }
  .family-structure {
    font-size: calc(11pt * var(--scale-type));
    color: ${DOC_MUTED_ALT};
    margin: 0 0 calc(8mm * var(--scale-space)) 0;
  }
  .quote-section {
    /* --gap-xl ("section separation", §3) — was --gap-lg ("section
       internal"), a semantic-tier too tight for space between whole
       sections. */
    margin-bottom: calc(8mm * var(--scale-space));
    break-inside: avoid;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid ${NAVY};
    padding-bottom: calc(1.5mm * var(--scale-space));
    margin-bottom: calc(2mm * var(--scale-space));
  }
  .section-header h2 {
    font-family: "Heebo", sans-serif;
    font-weight: 500;
    font-size: calc(13pt * var(--scale-type));
    color: ${NAVY};
    margin: 0;
    letter-spacing: -0.025em;
  }
  .section-header .timing {
    /* This is the "when"/"where the money is applied" axis of the whole
       document — an overline treatment (§2.4's .text-overline, adapted for
       print) makes it read as a structural label next to the section
       title, not a footnote-weight aside. */
    font-size: calc(9pt * var(--scale-type));
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${ACCENT_TEXT};
  }
  table.line-items { width: 100%; border-collapse: collapse; }
  table.line-items td {
    /* ~2.5mm vertical padding, close to the design system's own print-table
       spec (§4.7: 15px/16px) — was 1mm, roughly 4x too tight to "breathe". */
    padding: calc(2.5mm * var(--scale-space)) 0;
    font-size: calc(10.5pt * var(--scale-type));
  }
  /* Subtle zebra striping on line items (own read of the pdf-design skill's
     budget-table pattern, adapted to gcs-design-system's own doc-surface
     token rather than its journalism-branded palette) — helps the eye track
     a row across to its amount on a dense, many-line section. */
  table.line-items tbody tr:nth-child(even) td { background: ${DOC_SURFACE}; }
  table.line-items td.amount {
    text-align: right;
    white-space: nowrap;
    /* §3.2 of the GCS Design System: JetBrains Mono for tabular/numeric
       data — these rows are exactly that, unlike the Grand Total below,
       which stays in Yrsa as a single hero figure, not a tabular one. */
    font-family: "JetBrains Mono", monospace;
  }
  /* A TBC/null amount must never read like a real figure at a glance — the
     client should always know exactly how much, or exactly which lines
     aren't fixed yet. */
  table.line-items tr.tbc td {
    font-style: italic;
    color: ${DOC_MUTED_ALT};
  }
  table.line-items tfoot tr.subtotal td {
    border-top: 1px solid ${DOC_BORDER_LIGHT};
    padding-top: calc(1.5mm * var(--scale-space));
    font-weight: 600;
    color: ${NAVY};
  }
  .grand-total {
    /* A surface block (§1.10 --doc-surface), not just larger type, so the
       single most important number in the document announces itself over a
       section subtotal rather than reading as one more table row. */
    background: ${DOC_SURFACE};
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    /* Wraps only when a continuation-note child is present (it forces its
       own row via flex-basis: 100% below) — a no-op otherwise, since the
       label/amount pair never needs to wrap on its own. */
    flex-wrap: wrap;
    border-top: 2px solid ${NAVY};
    border-bottom: 2px solid ${NAVY};
    padding: calc(4mm * var(--scale-space));
    margin: calc(2mm * var(--scale-space)) 0 calc(8mm * var(--scale-space)) 0;
    break-inside: avoid;
  }
  .grand-total .continuation-note { flex-basis: 100%; }
  .grand-total .label {
    font-family: "Yrsa", serif;
    font-size: calc(14pt * var(--scale-type));
    color: ${NAVY};
  }
  .grand-total .amount {
    font-family: "Yrsa", serif;
    font-size: calc(16pt * var(--scale-type));
    color: ${NAVY};
  }
  .footnotes {
    margin-top: calc(6mm * var(--scale-space));
    /* Fixed, not scaled by --scale-type: disclaimers/caveats must never
       shrink below a readable size just because a dense quote needed to
       compress elsewhere to fit one page. */
    font-size: 8pt;
    color: ${DOC_MUTED_ALT};
    padding-left: calc(4mm * var(--scale-space));
    break-inside: avoid;
  }
  .footnotes li { margin-bottom: calc(2mm * var(--scale-space)); }

  /* Pagination-control (see render-pdf.ts's simulatePagination): authoritative
     forced break, computed and applied only at the exact block the
     simulation decided starts a new page — stronger than the soft
     break-inside: avoid above, which Chromium may still violate if a block
     is genuinely too tall (see .allow-split below). */
  .force-page-break { break-before: page; }
  /* Escape hatch for the rare block-taller-than-one-page case (see
     render-pdf.ts's BLOCK_MIN_SCALE fallback): lets that one block's own
     content flow across a page boundary after every other option (scoped
     shrink) has been tried, instead of silently leaving it as an
     unenforceable break-inside: avoid that Chromium ignores anyway. Doubled
     selector for specificity over the plain .quote-section/.grand-total/
     .footnotes rules regardless of source order. */
  .quote-section.allow-split,
  .grand-total.allow-split,
  .footnotes.allow-split {
    break-inside: auto;
  }
  .continuation-note {
    margin-top: calc(3mm * var(--scale-space));
    padding-top: calc(2mm * var(--scale-space));
    border-top: 1px solid ${DOC_BORDER_LIGHT};
    font-size: calc(9pt * var(--scale-type));
    font-style: italic;
    color: ${DOC_MUTED_ALT};
    text-align: right;
  }
</style>
</head>
<body>
  <div class="page" id="estimate-page">
    <h1>Investment Estimate – ${escapeHtml(quote.programName)}</h1>
    <div class="client-name">${escapeHtml(quote.clientName)}</div>
    <div class="family-structure">${escapeHtml(quote.familyStructure)}</div>
    ${quote.investmentRoute ? `<div class="family-structure">Investment Route: ${escapeHtml(quote.investmentRoute)}</div>` : ""}

    ${sectionsHtml}

    <div ${grandTotalAttrs}>
      <span class="label">Grand Total</span>
      <span class="amount">${quote.grandTotalApproximate ? "~" : ""}${formatCurrency(quote.grandTotal, quote.currency)}</span>
      ${grandTotalNote}
    </div>

    <ul ${footnotesAttrs}>
      ${footnotesHtml}
    </ul>
  </div>
</body>
</html>`;
}
