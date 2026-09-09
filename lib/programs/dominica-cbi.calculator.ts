import { buildFamilyStructureSentence } from "../family-structure";
import { dominicaCbiConfig } from "./dominica-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from "Pricing Calculator - Dominica CBI.xlsx"'s
// "Fee Reference" tab (constants, rows 6–46) and "Dominica Calculator" tab
// (formulas, rows 15–25).

const DD_MAIN = 7_500;
const DD_PER_PERSON_16_PLUS = 4_000; // spouse and dependants aged 16+; children under 16 are exempt

// The previously-bundled $4,200 flat fee, broken into its 6 real
// components (Fee Reference rows 12–18).
const GOV_PROCESSING_FEE = 1_000;
const INTERVIEW_FEE = 1_000;
const PASSPORT_PROCESSING_FEE = 1_200;
const COURIER_FEE = 350;
const BANK_FEE = 350;
const CERTIFICATION_FEE = 300;
const GOV_AND_PROCESSING_FLAT_TOTAL =
  GOV_PROCESSING_FEE + INTERVIEW_FEE + PASSPORT_PROCESSING_FEE + COURIER_FEE + BANK_FEE + CERTIFICATION_FEE; // 4,200

const PASSPORT_FEE_PER_PERSON = 300;
const CERTIFICATE_OF_NATURALIZATION_PER_PERSON = 500;
const AGENCY_FEE = 5_000;

const BASE_FAMILY_SIZE = 4;
const EDF_SINGLE = 200_000;
const EDF_FAMILY_UP_TO_4 = 250_000;
const EDF_EXTRA_UNDER_18 = 25_000;
const EDF_EXTRA_18_PLUS = 40_000;

const RE_MIN_INVESTMENT = 200_000; // flat, doesn't scale with family size
const RE_SHARE_TRANSFER_FEE = 8_800;
const RE_GOV_FEE_SOLO = 75_000;
const RE_GOV_FEE_UP_TO_4 = 100_000;
const RE_GOV_FEE_EXTRA_UNDER_18 = 25_000;
const RE_GOV_FEE_EXTRA_18_PLUS = 40_000;

const GCS_FEE = 15_000;

interface DominicaCbiVariables {
  investmentOption: string;
  spouse: boolean;
  childrenUnder16: number;
  children16to17: number;
  dependants18Plus: number;
}

function readVariables(values: ProgramVariableValues): DominicaCbiVariables {
  return {
    investmentOption: (values.investmentOption as string) ?? "edf",
    spouse: Boolean(values.spouse),
    childrenUnder16: Number(values.childrenUnder16 ?? 0),
    children16to17: Number(values.children16to17 ?? 0),
    dependants18Plus: Number(values.dependants18Plus ?? 0),
  };
}

export const dominicaCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentOption, spouse, childrenUnder16, children16to17, dependants18Plus } = readVariables(values);

    const spouseCount = spouse ? 1 : 0;
    const isRealEstate = investmentOption === "real-estate";

    const totalMembers = 1 + spouseCount + childrenUnder16 + children16to17 + dependants18Plus;
    const membersBeyond4 = Math.max(0, totalMembers - BASE_FAMILY_SIZE);
    // Extra (beyond-4) headcount is apportioned by consuming under-18
    // dependant slots first, then billing the remainder at the 18+ rate —
    // matches the source's own F8/F9 control-panel formulas exactly. A
    // spouse counted among the "beyond 4" extras is billed at the 18+ rate
    // by this same headcount logic (the source workbook doesn't separately
    // address that specific case — flagged, not guessed).
    const dependantsUnder18 = childrenUnder16 + children16to17;
    const extraUnder18 = Math.min(dependantsUnder18, membersBeyond4);
    const extra18Plus = membersBeyond4 - extraUnder18;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: childrenUnder16, singular: "Child Under 16", plural: "Children Under 16" },
      { kind: "count", count: children16to17, singular: "Child Aged 16–17", plural: "Children Aged 16–17" },
      { kind: "count", count: dependants18Plus, singular: "Dependant 18+", plural: "Dependants 18+" },
    ]);

    const dueDiligence = DD_MAIN + spouseCount * DD_PER_PERSON_16_PLUS + (children16to17 + dependants18Plus) * DD_PER_PERSON_16_PLUS;
    const passportFees = totalMembers * PASSPORT_FEE_PER_PERSON;
    const certificateFees = totalMembers * CERTIFICATE_OF_NATURALIZATION_PER_PERSON;

    let qualifyingInvestment: number;
    if (isRealEstate) {
      qualifyingInvestment = RE_MIN_INVESTMENT;
    } else if (totalMembers <= 1) {
      qualifyingInvestment = EDF_SINGLE;
    } else if (totalMembers <= BASE_FAMILY_SIZE) {
      qualifyingInvestment = EDF_FAMILY_UP_TO_4;
    } else {
      qualifyingInvestment = EDF_FAMILY_UP_TO_4 + extraUnder18 * EDF_EXTRA_UNDER_18 + extra18Plus * EDF_EXTRA_18_PLUS;
    }

    const shareTransferFee = isRealEstate ? RE_SHARE_TRANSFER_FEE : 0;

    let realEstateGovFee = 0;
    if (isRealEstate) {
      if (totalMembers <= 1) {
        realEstateGovFee = RE_GOV_FEE_SOLO;
      } else if (totalMembers <= BASE_FAMILY_SIZE) {
        realEstateGovFee = RE_GOV_FEE_UP_TO_4;
      } else {
        realEstateGovFee = RE_GOV_FEE_UP_TO_4 + extraUnder18 * RE_GOV_FEE_EXTRA_UNDER_18 + extra18Plus * RE_GOV_FEE_EXTRA_18_PLUS;
      }
    }

    const programmeCostsLineItems = [
      { label: "Due diligence fees", amount: dueDiligence },
      { label: "Passport fees", amount: passportFees },
      { label: "Certificate of Naturalization fee", amount: certificateFees },
      { label: "Government processing fee", amount: GOV_PROCESSING_FEE },
      { label: "Interview fee", amount: INTERVIEW_FEE },
      { label: "Passport processing fee", amount: PASSPORT_PROCESSING_FEE },
      { label: "Courier fee", amount: COURIER_FEE },
      { label: "Bank fee", amount: BANK_FEE },
      { label: "Certification fee", amount: CERTIFICATION_FEE },
      { label: `Qualifying investment — ${isRealEstate ? "Real Estate" : "EDF Donation"}`, amount: qualifyingInvestment },
      { label: "Share transfer fee (real estate only)", amount: shareTransferFee },
      { label: "Government property transfer duty (real estate only)", amount: realEstateGovFee },
      { label: "Local agency fee", amount: AGENCY_FEE },
    ];
    const programmeCostsSubtotal =
      dueDiligence +
      passportFees +
      certificateFees +
      GOV_AND_PROCESSING_FLAT_TOTAL +
      qualifyingInvestment +
      shareTransferFee +
      realEstateGovFee +
      AGENCY_FEE;

    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...dominicaCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...dominicaCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    return {
      programName: dominicaCbiConfig.name,
      programSlug: dominicaCbiConfig.slug,
      currency: dominicaCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: dominicaCbiConfig.footnotes,
    };
  },
};
