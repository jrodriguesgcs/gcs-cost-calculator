import { buildFamilyStructureSentence } from "../family-structure";
import { grenadaCbiConfig } from "./grenada-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from "Pricing Calculator - Grenada CBI.xlsx"'s
// "Fee Reference" tab (constants, rows 6–37) and "Grenada Calculator" tab
// (formulas, rows 19–40).

const NTF_CONTRIBUTION_UP_TO_4 = 235_000;
const RE_MIN_INVESTMENT = 270_000;
const RE_SHARE_REGISTRATION_FEE = 8_800;
const RE_CONTRIBUTION_UP_TO_4 = 50_000;
// Both routes' "additional contribution per member over 4" happen to be
// the same amount in the current Fee Reference table (rows 7 and 11) — kept
// as one constant rather than two identical route-branched ones.
const CONTRIBUTION_PER_MEMBER_OVER_4 = 25_000;

// Known source ambiguity, not guessed: Fee Reference labels these two rows
// "Real Estate (see Note 3)", but "Note 3" doesn't exist anywhere in the
// workbook, and the Calculator tab's own formulas (C23/C24) apply them
// unconditionally regardless of the selected route. Transcribed as the
// formula actually computes, not as the (unresolvable) label implies —
// flag for GCS to confirm which is correct.
const GOV_CONTRIBUTION_PER_PARENT = 50_000;
const GOV_CONTRIBUTION_PER_SIBLING = 75_000;

const COURIER_FEE = 250;
const GCS_FEE = 15_000;

// Government application fees per applicant category — the "Total" column
// (Application + Processing + Due Diligence + Interview + Passport + Oath)
// from Fee Reference rows 22–30, per the source's own explicit build
// instruction to itemize by category rather than show one lump sum.
const APPLICATION_FEE = {
  main: 9_370,
  spouse: 9_370,
  childUnder16: 2_250,
  child17: 9_250,
  child18Plus: 9_370,
  parent: 9_370,
  sibling: 9_370,
  sponsor: 9_000,
  nonApplicantSpouse: 9_000,
};

// Combined bank charge (1%) + VAT-on-bank-charge (15%) rate, applied via
// grossed-up division per the source's own self-referential formula:
// bankCharge = (subtotal / (1 - combinedRate)) * bankChargeRate.
const BANK_CHARGE_RATE = 0.01;
const VAT_ON_BANK_CHARGE_RATE = 0.15;
const COMBINED_BANK_VAT_RATE = BANK_CHARGE_RATE * (1 + VAT_ON_BANK_CHARGE_RATE);

interface GrenadaCbiVariables {
  investmentRoute: string;
  spouse: boolean;
  childrenUnder16: number;
  children17: number;
  children18Plus: number;
  parents: number;
  siblings: number;
  sponsors: number;
  nonApplicantSpouses: number;
}

function readVariables(values: ProgramVariableValues): GrenadaCbiVariables {
  return {
    investmentRoute: (values.investmentRoute as string) ?? "ntf",
    spouse: Boolean(values.spouse),
    childrenUnder16: Number(values.childrenUnder16 ?? 0),
    children17: Number(values.children17 ?? 0),
    children18Plus: Number(values.children18Plus ?? 0),
    parents: Number(values.parents ?? 0),
    siblings: Number(values.siblings ?? 0),
    sponsors: Number(values.sponsors ?? 0),
    nonApplicantSpouses: Number(values.nonApplicantSpouses ?? 0),
  };
}

export const grenadaCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const {
      investmentRoute,
      spouse,
      childrenUnder16,
      children17,
      children18Plus,
      parents,
      siblings,
      sponsors,
      nonApplicantSpouses,
    } = readVariables(values);

    const spouseCount = spouse ? 1 : 0;
    const isRealEstate = investmentRoute === "real-estate";

    // "Persons in the contribution family band" (Fee Reference F8): main
    // applicant + spouse + all dependent children — excludes parents,
    // siblings, sponsors, and non-applicant spouses, matching the source's
    // own control-panel formula exactly.
    const familyBand = 1 + spouseCount + childrenUnder16 + children17 + children18Plus;
    const membersOver4 = Math.max(0, familyBand - 4);

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: childrenUnder16, singular: "Dependent Child Aged 0–16", plural: "Dependent Children Aged 0–16" },
      { kind: "count", count: children17, singular: "Dependent Child Aged 17", plural: "Dependent Children Aged 17" },
      { kind: "count", count: children18Plus, singular: "Dependent Child 18+", plural: "Dependent Children 18+" },
      { kind: "count", count: parents, singular: "Dependent Parent/Grandparent", plural: "Dependent Parents/Grandparents" },
      { kind: "count", count: siblings, singular: "Dependent Sibling", plural: "Dependent Siblings" },
      { kind: "count", count: sponsors, singular: "Sponsor", plural: "Sponsors" },
      { kind: "count", count: nonApplicantSpouses, singular: "Non-Applicant Spouse", plural: "Non-Applicant Spouses" },
    ]);

    const govContribution = isRealEstate ? RE_CONTRIBUTION_UP_TO_4 : NTF_CONTRIBUTION_UP_TO_4;
    const realEstateInvestment = isRealEstate ? RE_MIN_INVESTMENT : 0;
    const shareRegistrationFee = isRealEstate ? RE_SHARE_REGISTRATION_FEE : 0;
    const additionalContributionOver4 = membersOver4 * CONTRIBUTION_PER_MEMBER_OVER_4;
    const govContributionParents = parents * GOV_CONTRIBUTION_PER_PARENT;
    const govContributionSiblings = siblings * GOV_CONTRIBUTION_PER_SIBLING;

    const applicationFeeMain = APPLICATION_FEE.main;
    const applicationFeeSpouse = spouseCount * APPLICATION_FEE.spouse;
    const applicationFeeChildUnder16 = childrenUnder16 * APPLICATION_FEE.childUnder16;
    const applicationFeeChild17 = children17 * APPLICATION_FEE.child17;
    const applicationFeeChild18Plus = children18Plus * APPLICATION_FEE.child18Plus;
    const applicationFeeParents = parents * APPLICATION_FEE.parent;
    const applicationFeeSiblings = siblings * APPLICATION_FEE.sibling;
    const applicationFeeSponsors = sponsors * APPLICATION_FEE.sponsor;
    const applicationFeeNonApplicantSpouses = nonApplicantSpouses * APPLICATION_FEE.nonApplicantSpouse;

    const programmeCostsBeforeBankCharge =
      govContribution +
      realEstateInvestment +
      shareRegistrationFee +
      additionalContributionOver4 +
      govContributionParents +
      govContributionSiblings +
      applicationFeeMain +
      applicationFeeSpouse +
      applicationFeeChildUnder16 +
      applicationFeeChild17 +
      applicationFeeChild18Plus +
      applicationFeeParents +
      applicationFeeSiblings +
      applicationFeeSponsors +
      applicationFeeNonApplicantSpouses +
      COURIER_FEE;

    // Bank charge + VAT are computed on the total transferred, which the
    // source includes the GCS professional fee in — even though the fee
    // itself is shown in its own section below (see grenada-cbi.config.ts).
    const subtotalInclGcsFee = programmeCostsBeforeBankCharge + GCS_FEE;
    const bankCharge = (subtotalInclGcsFee / (1 - COMBINED_BANK_VAT_RATE)) * BANK_CHARGE_RATE;
    const vatOnBankCharge = bankCharge * VAT_ON_BANK_CHARGE_RATE;

    const programmeCostsLineItems = [
      { label: "Government contribution (family of up to 4 persons)", amount: govContribution },
      { label: "Real estate investment", amount: realEstateInvestment },
      { label: "Share registration fee", amount: shareRegistrationFee },
      { label: "Additional government contribution — members over 4", amount: additionalContributionOver4 },
      { label: "Government contribution — dependent parents/grandparents", amount: govContributionParents },
      { label: "Government contribution — dependent siblings", amount: govContributionSiblings },
      { label: "Government application fees — main applicant", amount: applicationFeeMain },
      { label: "Government application fees — spouse", amount: applicationFeeSpouse },
      { label: "Government application fees — dependent children 0–16", amount: applicationFeeChildUnder16 },
      { label: "Government application fees — dependent children 17", amount: applicationFeeChild17 },
      { label: "Government application fees — dependent children 18+", amount: applicationFeeChild18Plus },
      { label: "Government application fees — dependent parents/grandparents", amount: applicationFeeParents },
      { label: "Government application fees — dependent siblings", amount: applicationFeeSiblings },
      { label: "Government application fees — sponsors", amount: applicationFeeSponsors },
      { label: "Government application fees — non-applicant spouses", amount: applicationFeeNonApplicantSpouses },
      { label: "Courier fees", amount: COURIER_FEE },
      { label: "Bank charge on incoming funds", amount: bankCharge },
      { label: "VAT on bank charge", amount: vatOnBankCharge },
    ];
    const programmeCostsSubtotal = programmeCostsBeforeBankCharge + bankCharge + vatOnBankCharge;

    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...grenadaCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...grenadaCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    return {
      programName: grenadaCbiConfig.name,
      programSlug: grenadaCbiConfig.slug,
      currency: grenadaCbiConfig.currency,
      clientName,
      familyStructure,
      investmentRoute: isRealEstate ? "Real Estate Investment" : "National Transformation Fund Contribution",
      sections,
      grandTotal,
      footnotes: grenadaCbiConfig.footnotes,
    };
  },
};
