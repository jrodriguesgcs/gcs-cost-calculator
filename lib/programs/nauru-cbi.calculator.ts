import { buildFamilyStructureSentence } from "../family-structure";
import { nauruCbiConfig } from "./nauru-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Pricing_calculator_Naoero_Nauru_CBI.xlsx's
// "Pricing" tab (constants) and "Nauru Calculator" tab (formulas in D16–D21,
// D27–D29).

const APPLICATION_FEE_MAIN = 5_000;
const APPLICATION_FEE_PER_DEPENDANT = 2_000;
const DD_FEE_PRINCIPAL = 6_000;
const DD_FEE_PER_ADULT_DEPENDANT = 3_000;
const DD_FEE_BENEFACTOR = 3_000;
const BANK_FEE_SINGLE = 1_200;
const BANK_FEE_FAMILY_UP_TO_3 = 1_700;
const BANK_FEE_FAMILY_4_PLUS = 2_200;
const BANK_FEE_BENEFACTOR = 1_000;
// $115,000 base minus the current $25,000 limited-time discount (valid
// 3 Feb – 31 Dec 2026, confirmed active) — baked in as the current amount
// per requester decision, not exposed as a form toggle.
const CONTRIBUTION_MAIN = 90_000;
const CONTRIBUTION_PER_ADULT_DEPENDANT = 2_000;
const CONTRIBUTION_PER_SIBLING = 15_000;
const PASSPORT_FEE_PER_PASSPORT = 500;
const GCS_FEE = 15_000;

interface NauruCbiVariables {
  minorsNonSibling: number;
  adultsNonSibling: number;
  siblingMinors: number;
  siblingAdults: number;
  benefactor: boolean;
}

function readVariables(values: ProgramVariableValues): NauruCbiVariables {
  return {
    minorsNonSibling: Number(values.minorsNonSibling ?? 0),
    adultsNonSibling: Number(values.adultsNonSibling ?? 0),
    siblingMinors: Number(values.siblingMinors ?? 0),
    siblingAdults: Number(values.siblingAdults ?? 0),
    benefactor: Boolean(values.benefactor),
  };
}

export const nauruCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { minorsNonSibling, adultsNonSibling, siblingMinors, siblingAdults, benefactor } =
      readVariables(values);

    const totalDependants = minorsNonSibling + adultsNonSibling + siblingMinors + siblingAdults;
    // All 16+ dependants attract the contribution add-on regardless of
    // sibling status (per the source's own cell comment).
    const totalAdults16Plus = adultsNonSibling + siblingAdults;
    // Any-age siblings attract the separate, additional sibling fee.
    const totalSiblings = siblingMinors + siblingAdults;
    const totalPassports = 1 + totalDependants; // excludes the benefactor
    const sponsorCount = benefactor ? 1 : 0;

    // Bank-fee tier, auto-derived from the real dependant count (confirmed
    // with requester — no manual Scenario override).
    let bankFeeTierAmount: number;
    let bankFeeTierLabel: string;
    if (totalDependants === 0) {
      bankFeeTierAmount = BANK_FEE_SINGLE;
      bankFeeTierLabel = "single applicant";
    } else if (totalDependants <= 3) {
      bankFeeTierAmount = BANK_FEE_FAMILY_UP_TO_3;
      bankFeeTierLabel = "family, up to 3 dependants";
    } else {
      bankFeeTierAmount = BANK_FEE_FAMILY_4_PLUS;
      bankFeeTierLabel = "family, 4+ dependants";
    }

    const familyStructure = buildFamilyStructureSentence([
      { kind: "count", count: minorsNonSibling, singular: "Dependant Under 16", plural: "Dependants Under 16" },
      { kind: "count", count: adultsNonSibling, singular: "Dependant 16+", plural: "Dependants 16+" },
      {
        kind: "count",
        count: siblingMinors,
        singular: "Sibling Dependant Under 16",
        plural: "Sibling Dependants Under 16",
      },
      {
        kind: "count",
        count: siblingAdults,
        singular: "Sibling Dependant 16+",
        plural: "Sibling Dependants 16+",
      },
      { kind: "boolean", included: benefactor, label: "Non-Applicant Benefactor" },
    ]);

    // --- Section 1: Before Submission ---
    const applicationDependantsFee = APPLICATION_FEE_PER_DEPENDANT * totalDependants;
    const ddDependantsFee = DD_FEE_PER_ADULT_DEPENDANT * totalAdults16Plus;
    const ddBenefactorFee = DD_FEE_BENEFACTOR * sponsorCount;
    const bankBenefactorFee = BANK_FEE_BENEFACTOR * sponsorCount;
    const beforeSubmissionLineItems = [
      { label: "Application fee — main applicant", amount: APPLICATION_FEE_MAIN },
      { label: "Application fee — per dependant", amount: applicationDependantsFee },
      { label: "Due diligence fee — principal applicant", amount: DD_FEE_PRINCIPAL },
      { label: "Due diligence fee — dependants aged 16+", amount: ddDependantsFee },
      { label: "Due diligence fee — benefactor", amount: ddBenefactorFee },
      { label: `Bank DD & transaction charge — ${bankFeeTierLabel}`, amount: bankFeeTierAmount },
      { label: "Bank DD & transaction charge — benefactor", amount: bankBenefactorFee },
    ];
    const beforeSubmissionSubtotal =
      APPLICATION_FEE_MAIN +
      applicationDependantsFee +
      DD_FEE_PRINCIPAL +
      ddDependantsFee +
      ddBenefactorFee +
      bankFeeTierAmount +
      bankBenefactorFee;

    // --- Section 2: Approval Payment ---
    const contributionDependantsFee = CONTRIBUTION_PER_ADULT_DEPENDANT * totalAdults16Plus;
    const contributionSiblingFee = CONTRIBUTION_PER_SIBLING * totalSiblings;
    const passportFee = PASSPORT_FEE_PER_PASSPORT * totalPassports;
    const approvalPaymentLineItems = [
      { label: "Contribution — main applicant", amount: CONTRIBUTION_MAIN },
      { label: "Contribution — dependants aged 16+", amount: contributionDependantsFee },
      { label: "Contribution — sibling dependants", amount: contributionSiblingFee },
      { label: "Passport fee", amount: passportFee },
    ];
    const approvalPaymentSubtotal =
      CONTRIBUTION_MAIN + contributionDependantsFee + contributionSiblingFee + passportFee;

    // --- Section 3: GCS Professional Fee ---
    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...nauruCbiConfig.sections[0], lineItems: beforeSubmissionLineItems, subtotal: beforeSubmissionSubtotal },
      { ...nauruCbiConfig.sections[1], lineItems: approvalPaymentLineItems, subtotal: approvalPaymentSubtotal },
      { ...nauruCbiConfig.sections[2], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = beforeSubmissionSubtotal + approvalPaymentSubtotal + gcsFeeSubtotal;

    return {
      programName: nauruCbiConfig.name,
      programSlug: nauruCbiConfig.slug,
      currency: nauruCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: nauruCbiConfig.footnotes,
    };
  },
};
