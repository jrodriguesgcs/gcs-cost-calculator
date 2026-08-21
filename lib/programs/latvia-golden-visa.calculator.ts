import { buildFamilyStructureSentence } from "../family-structure";
import { latviaGoldenVisaConfig } from "./latvia-golden-visa.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteLineItem, QuoteSection } from "./types";

// Fee formulas transcribed from Latvia_Quotation_calculator.xlsx's four
// investment-track tabs. Each row is either "per person" (charged for
// main + spouse + each child, at possibly different rates per person
// type) or "flat" (a single main-only amount regardless of family size).
//
// Two rows in every track carry an explicit sheet comment marking them as
// NOT a fee — omitted here and covered by a static footnote instead: the
// D-visa row, and (Real estate only) the Escrow/account-setup row.
// Document preparation is the one row explicitly marked "include as a
// fee, but also make a note" — kept as an always-included line, with a
// footnote in the config explaining it's an approximate cost.
//
// Row-boundary rule (see the approved plan for the full reasoning): each
// track's own "Total (excl. GCS fee)" SUM() range is inconsistently
// copy/pasted across tracks, so the boundary used here is positional
// instead — "GCS legal and advisory fee" plus any "...Support" row
// immediately after it form the GCS Professional Fee section; everything
// before that is Programme Costs.

type PerPersonRate = { kind: "perPerson"; main: number; spouse: number; child: number };
type FlatRate = { kind: "flat"; amount: number };
type Rate = PerPersonRate | FlatRate;

interface TrackRow {
  label: string;
  rate: Rate;
}

interface TrackDefinition {
  investmentLabel: string;
  // Rows before the GCS-fee row -> Programme Costs.
  programmeCosts: TrackRow[];
  // GCS legal/advisory fee, plus a track-specific "...Support" row where
  // the source has one.
  gcsFee: TrackRow[];
  hasAddressDeclaration: boolean;
  hasEscrowNote: boolean;
}

function perPerson(main: number, spouse: number, child: number): Rate {
  return { kind: "perPerson", main, spouse, child };
}
function flat(amount: number): Rate {
  return { kind: "flat", amount };
}

// Rows common to every track (identical amounts across all 4 tabs).
const APPLICATION = perPerson(160, 160, 160);
const HEALTH_SCREENING = perPerson(80, 80, 80);
const MEDICAL_INSURANCE = perPerson(75, 75, 50);
const DOCUMENT_PREPARATION = flat(1000);
const ADDRESS_DECLARATION = flat(2000);

const TRACKS: Record<string, TrackDefinition> = {
  "business-50k": {
    investmentLabel: "Business Investment",
    programmeCosts: [
      { label: "Investment", rate: flat(50_000) },
      { label: "Government contribution", rate: flat(10_000) },
      { label: "Residence permit application (standard 30 days)", rate: APPLICATION },
      { label: "Health screening (chest X-ray)", rate: HEALTH_SCREENING },
      { label: "Medical insurance", rate: MEDICAL_INSURANCE },
      { label: "Residence permit registration (standard 30 days)", rate: perPerson(75, 75, 75) },
      { label: "Residence permit card issuance (standard 10 working days)", rate: perPerson(45, 45, 45) },
      { label: "Document preparation (approx.)", rate: DOCUMENT_PREPARATION },
    ],
    gcsFee: [
      { label: "GCS legal and advisory fee", rate: flat(10_000) },
      { label: "Corporate Legal Support", rate: flat(10_000) },
    ],
    hasAddressDeclaration: true,
    hasEscrowNote: false,
  },
  "business-100k": {
    investmentLabel: "Business Investment",
    programmeCosts: [
      { label: "Investment", rate: flat(100_000) },
      { label: "Government contribution", rate: flat(10_000) },
      { label: "Residence permit application (standard 30 days)", rate: APPLICATION },
      { label: "Health screening (chest X-ray)", rate: HEALTH_SCREENING },
      { label: "Medical insurance", rate: MEDICAL_INSURANCE },
      { label: "Residence permit registration (standard 30 days)", rate: perPerson(75, 75, 75) },
      { label: "Residence permit card issuance (10 working days)", rate: perPerson(45, 45, 45) },
      { label: "Document preparation (approx.)", rate: DOCUMENT_PREPARATION },
    ],
    gcsFee: [
      { label: "GCS legal and advisory fee", rate: flat(10_000) },
      { label: "Corporate Legal Support", rate: flat(10_000) },
    ],
    hasAddressDeclaration: true,
    hasEscrowNote: false,
  },
  "real-estate": {
    investmentLabel: "Real Estate Investment",
    programmeCosts: [
      { label: "Investment", rate: flat(250_000) },
      { label: "Government contribution (5%, min.)", rate: flat(12_500) },
      { label: "Assistance with finding the property (5%, min.)", rate: flat(2_500) },
      { label: "Residence permit application (standard 30 days)", rate: APPLICATION },
      { label: "Health screening (chest X-ray)", rate: HEALTH_SCREENING },
      { label: "Medical insurance", rate: MEDICAL_INSURANCE },
      { label: "Residence permit registration (standard 30 days)", rate: perPerson(75, 75, 75) },
      { label: "Residence permit card issuance (10 working days)", rate: perPerson(45, 45, 45) },
      { label: "Notary fees", rate: flat(1_500) },
      { label: "Land registry property registration (1.5%, min.)", rate: flat(3_750) },
      { label: "Document preparation (approx.)", rate: DOCUMENT_PREPARATION },
    ],
    gcsFee: [
      { label: "GCS legal and advisory fee", rate: flat(10_000) },
      { label: "Real Estate Support", rate: flat(2_500) },
    ],
    hasAddressDeclaration: false,
    hasEscrowNote: true,
  },
  "bank-deposit": {
    investmentLabel: "Bank Deposit",
    programmeCosts: [
      { label: "Investment", rate: flat(280_000) },
      { label: "Government contribution", rate: flat(25_000) },
      { label: "Residence permit application (standard 30 days)", rate: APPLICATION },
      { label: "Health screening (chest X-ray)", rate: HEALTH_SCREENING },
      { label: "Medical insurance", rate: MEDICAL_INSURANCE },
      { label: "Biometrics", rate: perPerson(155, 155, 80) },
      { label: "ID card production", rate: perPerson(45, 45, 45) },
      { label: "Account opening fee", rate: flat(4_000) },
      { label: "Document preparation (approx.)", rate: DOCUMENT_PREPARATION },
    ],
    gcsFee: [{ label: "GCS legal and advisory fee", rate: flat(10_000) }],
    hasAddressDeclaration: true,
    hasEscrowNote: false,
  },
};

const ESCROW_FOOTNOTE =
  "Escrow/account setup (if applicable) is an additional cost that may apply for the Real Estate Investment track and is not included in the total above.";

interface LatviaGoldenVisaVariables {
  investmentTrack: string;
  spouse: boolean;
  children: number;
  addressDeclaration: boolean;
}

function readVariables(values: ProgramVariableValues): LatviaGoldenVisaVariables {
  return {
    investmentTrack: (values.investmentTrack as string) ?? "business-50k",
    spouse: Boolean(values.spouse),
    children: Number(values.children ?? 0),
    addressDeclaration: Boolean(values.addressDeclaration),
  };
}

function rowAmount(rate: Rate, spouseCount: number, children: number): number {
  if (rate.kind === "flat") return rate.amount;
  return rate.main + rate.spouse * spouseCount + rate.child * children;
}

function buildLineItems(
  rows: TrackRow[],
  spouseCount: number,
  children: number,
): { lineItems: QuoteLineItem[]; subtotal: number } {
  const lineItems = rows.map((row) => ({
    label: row.label,
    amount: rowAmount(row.rate, spouseCount, children),
  }));
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  return { lineItems, subtotal };
}

export const latviaGoldenVisaCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentTrack, spouse, children, addressDeclaration } = readVariables(values);
    const track = TRACKS[investmentTrack] ?? TRACKS["business-50k"];
    const spouseCount = spouse ? 1 : 0;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: children, singular: "Dependent Child", plural: "Dependent Children" },
    ]);

    const rows = [...track.programmeCosts];
    if (track.hasAddressDeclaration && addressDeclaration) {
      rows.push({ label: "Address declaration (annual, optional)", rate: ADDRESS_DECLARATION });
    }

    const programmeCosts = buildLineItems(rows, spouseCount, children);
    const gcsFee = buildLineItems(track.gcsFee, spouseCount, children);

    const sections: QuoteSection[] = [
      { ...latviaGoldenVisaConfig.sections[0], lineItems: programmeCosts.lineItems, subtotal: programmeCosts.subtotal },
      { ...latviaGoldenVisaConfig.sections[1], lineItems: gcsFee.lineItems, subtotal: gcsFee.subtotal },
    ];

    const grandTotal = programmeCosts.subtotal + gcsFee.subtotal;

    const footnotes = track.hasEscrowNote
      ? [...latviaGoldenVisaConfig.footnotes, ESCROW_FOOTNOTE]
      : latviaGoldenVisaConfig.footnotes;

    return {
      programName: latviaGoldenVisaConfig.name,
      programSlug: latviaGoldenVisaConfig.slug,
      currency: latviaGoldenVisaConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes,
    };
  },
};
