import { buildFamilyStructureSentence } from "../family-structure";
import { italyGoldenVisaConfig } from "./italy-golden-visa.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Italy_Golden_Visa_Calculator_2.html's
// <script> (lines 447–548).
//
// Confirmed with requester: minors require a spouse on the application
// (the source's own comment: "minors not eligible without spouse — treat
// as 0"). The form enforces this by disabling/resetting minors whenever
// spouse is off (see italy-golden-visa.config.ts's `disabledWhen`); this
// calculator also defensively clamps effective minors to 0 if spouse is
// false, so the math is correct even if called with a stale value.

const INVESTMENT_TRACKS: Record<string, { label: string; amount: number }> = {
  startup: { label: "Track A: Innovative Startup", amount: 250_000 },
  equity: { label: "Track B: Company Equity", amount: 500_000 },
  bonds: { label: "Track C: Government Bonds", amount: 2_000_000 },
  donation: { label: "Track D: Philanthropic Donation", amount: 1_000_000 },
};

const RESIDENCE_PERMIT_PRINTING = 30.46;
const RESIDENCE_PERMIT_ISSUANCE = 50;
const REVENUE_STAMP = 16;

interface ItalyGoldenVisaVariables {
  investmentTrack: string;
  spouse: boolean;
  minors: number;
  adults: number;
}

function readVariables(values: ProgramVariableValues): ItalyGoldenVisaVariables {
  return {
    investmentTrack: (values.investmentTrack as string) ?? "startup",
    spouse: Boolean(values.spouse),
    minors: Number(values.minors ?? 0),
    adults: Number(values.adults ?? 0),
  };
}

export const italyGoldenVisaCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentTrack, spouse, adults, minors: rawMinors } = readVariables(values);
    const minors = spouse ? rawMinors : 0; // minors require a spouse — see note above

    const track = INVESTMENT_TRACKS[investmentTrack] ?? INVESTMENT_TRACKS.startup;

    const totalApplicants = 1 + (spouse ? 1 : 0) + minors + adults;

    // Family fee: spouse + minors -> flat €5,000; spouse alone -> €3,000;
    // neither -> €0. Adults are always chargeable at €3,000 each.
    let familyFee = 0;
    if (spouse && minors > 0) familyFee = 5_000;
    else if (spouse) familyFee = 3_000;
    const gcsFee = 18_000 + familyFee + adults * 3_000;
    const gcsHalf = Math.round(gcsFee / 2);

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: minors, singular: "Child", plural: "Children" },
      { kind: "count", count: adults, singular: "Adult Dependant", plural: "Adult Dependants" },
    ]);

    // --- Section 1: Engagement & Nulla Osta Application (Months 0–1) ---
    const engagementLineItems = [
      { label: "GCS fee — 50% instalment", amount: gcsHalf },
      { label: "Legalisation, translations, courier (est.)", amount: 700, approximate: true },
    ];
    const engagementSubtotal = gcsHalf + 700;

    // --- Section 2: Nulla Osta Submission & Investor Visa (Months 1–2) ---
    const submissionLineItems = [
      { label: "GCS fee — 50% balance", amount: gcsHalf },
      { label: "Visa application fee", amount: 116 },
      { label: "Revenue stamp", amount: 16 },
    ];
    const submissionSubtotal = gcsHalf + 116 + 16;

    // --- Section 3: Residence Permit (within 8 working days of entry) ---
    // Section 5 (Renewal) uses this exact same per-applicant formula.
    function residencePermitLineItems() {
      const printing = Math.round(RESIDENCE_PERMIT_PRINTING * totalApplicants);
      const issuance = Math.round(RESIDENCE_PERMIT_ISSUANCE * totalApplicants);
      const stamp = Math.round(REVENUE_STAMP * totalApplicants);
      return {
        lineItems: [
          { label: "Postal bulletin — permit printing (per applicant)", amount: printing },
          { label: "Postal bulletin — permit issuance (per applicant)", amount: issuance },
          { label: "Revenue stamp (per applicant)", amount: stamp },
        ],
        subtotal: printing + issuance + stamp,
      };
    }
    const permit = residencePermitLineItems();

    // --- Section 4: Execute Investment (within 90 days of entry) ---
    const investmentLineItems = [{ label: `Investment — ${track.label}`, amount: track.amount }];
    const investmentSubtotal = track.amount;

    // --- Section 5: Permit Renewal (after 2 years, renewable for 3) ---
    const renewal = residencePermitLineItems();

    const sections: QuoteSection[] = [
      { ...italyGoldenVisaConfig.sections[0], lineItems: engagementLineItems, subtotal: engagementSubtotal },
      { ...italyGoldenVisaConfig.sections[1], lineItems: submissionLineItems, subtotal: submissionSubtotal },
      { ...italyGoldenVisaConfig.sections[2], lineItems: permit.lineItems, subtotal: permit.subtotal },
      { ...italyGoldenVisaConfig.sections[3], lineItems: investmentLineItems, subtotal: investmentSubtotal },
      { ...italyGoldenVisaConfig.sections[4], lineItems: renewal.lineItems, subtotal: renewal.subtotal },
    ];

    // Grand total = every section shown (1–5), no exceptions — per the
    // tool-wide rule that the Grand Total must always equal the sum of
    // what's on the page, not a subset requiring a footnote to explain the
    // gap.
    const grandTotal =
      engagementSubtotal + submissionSubtotal + permit.subtotal + investmentSubtotal + renewal.subtotal;

    return {
      programName: italyGoldenVisaConfig.name,
      programSlug: italyGoldenVisaConfig.slug,
      currency: italyGoldenVisaConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      // Section 1's legalisation/translation/courier line is approximate,
      // and it feeds directly into this total — the client must see the
      // Grand Total itself marked "~", not just the one line item, so it's
      // never mistaken for a fully precise figure.
      grandTotalApproximate: true,
      footnotes: italyGoldenVisaConfig.footnotes,
    };
  },
};
