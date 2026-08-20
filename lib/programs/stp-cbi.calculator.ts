import { buildFamilyStructureSentence } from "../family-structure";
import { stpCbiConfig } from "./stp-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Copy_of_Pricing_calculator__STP_CBI.xlsx's
// "STP CBI calculator" tab (cells H5–H11).

const LEGAL_ADVISORY_FEE = 15_000;
const APPLICATION_SUBMISSION_FEE = 5_000;
const SPONSOR_FEE = 5_000;

const CONTRIBUTION_SOLO = 90_000; // main applicant only, no spouse/children/parents
const CONTRIBUTION_WITH_FAMILY = 95_000; // flat once any dependant is present — doesn't scale further
const PASSPORT_FEE_PER_PERSON = 750; // main applicant + spouse + children + parents (excludes the sponsor)

interface StpCbiVariables {
  spouse: boolean;
  children: number;
  parentsGrandparents: number;
  sponsor: boolean;
}

function readVariables(values: ProgramVariableValues): StpCbiVariables {
  return {
    spouse: Boolean(values.spouse),
    children: Number(values.children ?? 0),
    parentsGrandparents: Number(values.parentsGrandparents ?? 0),
    sponsor: Boolean(values.sponsor),
  };
}

export const stpCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { spouse, children, parentsGrandparents, sponsor } = readVariables(values);
    const spouseCount = spouse ? 1 : 0;

    const totalApplicants = 1 + spouseCount + children + parentsGrandparents;
    const isSoloApplicant = spouseCount === 0 && children === 0 && parentsGrandparents === 0;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: children, singular: "Dependent Child", plural: "Dependent Children" },
      {
        kind: "count",
        count: parentsGrandparents,
        singular: "Dependent Parent or Grandparent",
        plural: "Dependent Parents or Grandparents",
      },
      { kind: "boolean", included: sponsor, label: "Non-Applicant Sponsor" },
    ]);

    // --- Section 1: Upon Submission ---
    const sponsorFee = sponsor ? SPONSOR_FEE : 0;
    const uponSubmissionLineItems = [
      { label: "Legal and advisory fee", amount: LEGAL_ADVISORY_FEE },
      { label: "Application submission fee", amount: APPLICATION_SUBMISSION_FEE },
      { label: "Non-applicant sponsor fee", amount: sponsorFee },
    ];
    const uponSubmissionSubtotal = LEGAL_ADVISORY_FEE + APPLICATION_SUBMISSION_FEE + sponsorFee;

    // --- Section 2: Upon Approval-in-Principle ---
    const contribution = isSoloApplicant ? CONTRIBUTION_SOLO : CONTRIBUTION_WITH_FAMILY;
    const passportFee = PASSPORT_FEE_PER_PERSON * totalApplicants;
    const uponApprovalLineItems = [
      { label: "Contribution to the National Transformation Fund", amount: contribution },
      { label: "Citizenship certificate, national ID & passport fee", amount: passportFee },
    ];
    const uponApprovalSubtotal = contribution + passportFee;

    const sections: QuoteSection[] = [
      { ...stpCbiConfig.sections[0], lineItems: uponSubmissionLineItems, subtotal: uponSubmissionSubtotal },
      { ...stpCbiConfig.sections[1], lineItems: uponApprovalLineItems, subtotal: uponApprovalSubtotal },
    ];

    const grandTotal = uponSubmissionSubtotal + uponApprovalSubtotal;

    return {
      programName: stpCbiConfig.name,
      programSlug: stpCbiConfig.slug,
      currency: stpCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: stpCbiConfig.footnotes,
    };
  },
};
