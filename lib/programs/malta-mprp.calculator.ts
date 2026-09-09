import { buildFamilyStructureSentence } from "../family-structure";
import { maltaMprpConfig } from "./malta-mprp.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from investment-estimate-tool-spec.md §3.
//
// Resolved rental double-count (confirmed with the requester): Section 3's
// real-estate line is the FIRST YEAR's rent (due at investment/approval
// stage); Section 4's rental line covers each SUBSEQUENT year (years 2–5),
// not year 1 again.
//
// Grand total = Section 1 + Section 2 + Section 3. This numerically
// includes the real estate cost, because Section 3's own subtotal includes
// it (per the spec's "Decisions Made": real estate is not excluded from
// totals) — the spec's grand-total heading says "(excl. real estate)" but
// that's describing intent loosely; the actual summed formula is Section 3
// as defined, real estate and all.

const REAL_ESTATE_PURCHASE_MIN = 375_000;
const REAL_ESTATE_RENTAL_YEARLY_MIN = 14_000;

interface MaltaMprpVariables {
  spouse: boolean;
  minors: number;
  adults: number;
  realEstateOption: "purchase" | "rental";
}

function readVariables(values: ProgramVariableValues): MaltaMprpVariables {
  return {
    spouse: Boolean(values.spouse),
    minors: Number(values.minors ?? 0),
    adults: Number(values.adults ?? 0),
    realEstateOption: (values.realEstateOption as "purchase" | "rental") ?? "purchase",
  };
}

export const maltaMprpCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { spouse, minors, adults, realEstateOption } = readVariables(values);
    const isRental = realEstateOption === "rental";

    const totalApplicants = 1 + (spouse ? 1 : 0) + minors + adults;

    // Base covers main applicant + spouse (if any) + first 2 minors free.
    // +€500 per dependant beyond that: extra minors past 2, and every adult.
    const gcsTotal = 25_000 + 500 * (Math.max(0, minors - 2) + adults);

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: minors, singular: "Child", plural: "Children" },
      { kind: "count", count: adults, singular: "Adult Dependant", plural: "Adult Dependants" },
    ]);

    // --- Section 1: Signing & Engagement (Month 0) ---
    const signingLineItems = [
      { label: "GCS professional fee — 50% instalment", amount: gcsTotal / 2 },
    ];
    const signingSubtotal = gcsTotal / 2;

    // --- Section 2: Application & Submission (Months 1–3) ---
    const residenceCardFee = totalApplicants * 100;
    const applicationLineItems = [
      { label: "GCS professional fee — 50% balance", amount: gcsTotal / 2 },
      { label: "Government administrative fee — instalment (non-refundable)", amount: 15_000 },
      { label: "Residence card — per applicant", amount: residenceCardFee },
    ];
    const applicationSubtotal = gcsTotal / 2 + 15_000 + residenceCardFee;

    // --- Section 3: Approval & Investment (Months 4–9) ---
    const realEstateCost = isRental ? REAL_ESTATE_RENTAL_YEARLY_MIN : REAL_ESTATE_PURCHASE_MIN;
    const realEstateLabel = isRental
      ? "Real estate — Rental, year 1 (min. €14,000/yr)"
      : "Real estate — Purchase (min. €375,000)";
    const govContributionAdults = adults * 7_500;
    const approvalResidencePermitFee = totalApplicants * 100;
    const approvalLineItems = [
      { label: "Government administrative fee — balance (non-refundable)", amount: 45_000 },
      { label: realEstateLabel, amount: realEstateCost },
      { label: "Government contribution — main applicant", amount: 37_000 },
      { label: "Government contribution — adult dependants", amount: govContributionAdults },
      { label: "Philanthropic donation", amount: 2_000 },
      { label: "Residence permit — per applicant (first issuance)", amount: approvalResidencePermitFee },
    ];
    const approvalSubtotal =
      45_000 + realEstateCost + 37_000 + govContributionAdults + 2_000 + approvalResidencePermitFee;

    // --- Section 4: Annual Obligations (every 12 months, ongoing years 2–5) ---
    const annualResidencePermitFee = totalApplicants * 100;
    const annualLineItems = [
      ...(isRental
        ? [
            {
              label: "Minimum rental requirement (years 2–5)",
              amount: REAL_ESTATE_RENTAL_YEARLY_MIN,
              approximate: true,
            },
          ]
        : []),
      { label: "Annual compliance filing", amount: 1_000 },
      { label: "Residence permit — per applicant (annual renewal)", amount: annualResidencePermitFee },
      { label: "Medical insurance (arranged separately — see footnote)", amount: null },
    ];
    const annualSubtotal =
      (isRental ? REAL_ESTATE_RENTAL_YEARLY_MIN : 0) + 1_000 + annualResidencePermitFee;

    const sections: QuoteSection[] = [
      { ...maltaMprpConfig.sections[0], lineItems: signingLineItems, subtotal: signingSubtotal },
      { ...maltaMprpConfig.sections[1], lineItems: applicationLineItems, subtotal: applicationSubtotal },
      { ...maltaMprpConfig.sections[2], lineItems: approvalLineItems, subtotal: approvalSubtotal },
      {
        ...maltaMprpConfig.sections[3],
        lineItems: annualLineItems,
        subtotal: annualSubtotal,
        subtotalApproximate: isRental,
      },
    ];

    const grandTotal = signingSubtotal + applicationSubtotal + approvalSubtotal;

    return {
      programName: maltaMprpConfig.name,
      programSlug: maltaMprpConfig.slug,
      currency: maltaMprpConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: maltaMprpConfig.footnotes,
    };
  },
};
