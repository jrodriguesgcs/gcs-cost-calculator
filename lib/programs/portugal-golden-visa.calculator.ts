import { buildFamilyStructureSentence } from "../family-structure";
import { portugalGoldenVisaConfig } from "./portugal-golden-visa.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from "Cost Calculator - Portugal GV.xlsx"'s
// "Fee Reference" tab (constants, rows 7–23) and "Portugal GV Calculator"
// tab (formulas, rows 14–30).

const INVESTMENT_THRESHOLD: Record<string, number> = {
  fund: 500_000,
  "cultural-donation": 250_000,
  "cultural-donation-low-density": 200_000,
};

const CONSULTANCY_FEE_MAIN = 9_750;
const CONSULTANCY_FEE_ADULT_DEPENDENT = 750;
// Genuinely not priced in the source ("NOT PRICED IN SOURCE" per Fee
// Reference row 14) — not a transcription gap, GCS's own fee schedule has
// no child-dependent consultancy rate yet.
const CONSULTANCY_FEE_CHILD_DEPENDENT = 0;
const NIF_FISCAL_REP_YEAR_1 = 350;

// AIMA per-person rates — each stage is genuinely two separate government
// charges (Fee Reference rows 21–23), shown as two line items rather than
// one pre-summed total.
const AIMA_APPLICATION_FEE_PER_PERSON = 632.1;
const AIMA_PERMIT_FEE_PER_PERSON = 6_314.2; // 632.10 + 6,314.20 = 6,946.30 total per person
// 632.10 + 3,157.80 = 3,789.90 per person — same rate both renewal years;
// the source models no fee escalation between Year 2 and Year 4.
const AIMA_RENEWAL_PERMIT_FEE_PER_PERSON = 3_157.8;

interface PortugalGoldenVisaVariables {
  investmentRoute: string;
  spouse: boolean;
  otherAdultDependents: number;
  childDependents: number;
}

function readVariables(values: ProgramVariableValues): PortugalGoldenVisaVariables {
  return {
    investmentRoute: (values.investmentRoute as string) ?? "cultural-donation",
    spouse: Boolean(values.spouse),
    otherAdultDependents: Number(values.otherAdultDependents ?? 0),
    childDependents: Number(values.childDependents ?? 0),
  };
}

export const portugalGoldenVisaCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentRoute, spouse, otherAdultDependents, childDependents } = readVariables(values);

    const spouseCount = spouse ? 1 : 0;
    const adultDependents = spouseCount + otherAdultDependents;
    const totalPersons = 1 + adultDependents + childDependents;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: otherAdultDependents, singular: "Adult Dependent", plural: "Adult Dependents" },
      { kind: "count", count: childDependents, singular: "Child Dependent", plural: "Child Dependents" },
    ]);

    const qualifyingInvestment = INVESTMENT_THRESHOLD[investmentRoute] ?? INVESTMENT_THRESHOLD["cultural-donation"];
    const consultancyFeeMain = CONSULTANCY_FEE_MAIN;
    const consultancyFeeAdults = adultDependents * CONSULTANCY_FEE_ADULT_DEPENDENT;
    const consultancyFeeChildren = childDependents * CONSULTANCY_FEE_CHILD_DEPENDENT;
    const nifFiscalRep = NIF_FISCAL_REP_YEAR_1;
    const aimaApplicationFee = totalPersons * AIMA_APPLICATION_FEE_PER_PERSON;
    const aimaPermitFee = totalPersons * AIMA_PERMIT_FEE_PER_PERSON;
    const aimaApplicationFees = aimaApplicationFee + aimaPermitFee;

    const applicationStageLineItems = [
      { label: `Qualifying investment — ${investmentRouteLabel(investmentRoute)}`, amount: qualifyingInvestment },
      { label: "GCS consultancy & legal fees — main applicant", amount: consultancyFeeMain },
      { label: "GCS consultancy & legal fees — adult dependent", amount: consultancyFeeAdults },
      {
        label:
          CONSULTANCY_FEE_CHILD_DEPENDENT === 0
            ? "GCS consultancy & legal fees — child dependent (not priced in source)"
            : "GCS consultancy & legal fees — child dependent",
        amount: consultancyFeeChildren,
      },
      { label: "NIF issuance and fiscal representation (Year 1)", amount: nifFiscalRep },
      { label: "AIMA government application fee", amount: aimaApplicationFee },
      { label: "AIMA residence permit fee", amount: aimaPermitFee },
    ];
    const applicationStageSubtotal =
      qualifyingInvestment + consultancyFeeMain + consultancyFeeAdults + consultancyFeeChildren + nifFiscalRep + aimaApplicationFees;

    const renewalApplicationFee = totalPersons * AIMA_APPLICATION_FEE_PER_PERSON;
    const renewalPermitFee = totalPersons * AIMA_RENEWAL_PERMIT_FEE_PER_PERSON;
    const renewalFee = renewalApplicationFee + renewalPermitFee;
    const renewalLineItems = [
      { label: "AIMA government application fee", amount: renewalApplicationFee },
      { label: "AIMA residence permit renewal fee", amount: renewalPermitFee },
    ];
    const renewal1LineItems = renewalLineItems;
    const renewal2LineItems = renewalLineItems;

    const sections: QuoteSection[] = [
      { ...portugalGoldenVisaConfig.sections[0], lineItems: applicationStageLineItems, subtotal: applicationStageSubtotal },
      { ...portugalGoldenVisaConfig.sections[1], lineItems: renewal1LineItems, subtotal: renewalFee },
      { ...portugalGoldenVisaConfig.sections[2], lineItems: renewal2LineItems, subtotal: renewalFee },
    ];

    // Deliberate divergence from the source sheet's own bottom line (which
    // sums Application Stage + both renewals): matches this tool's
    // established convention of excluding recurring/later-due obligations
    // from the headline grand total (see Malta MPRP's "Annual Obligations"
    // section) — renewals are still shown in full above, just not folded
    // into the one-time total.
    const grandTotal = applicationStageSubtotal;

    return {
      programName: portugalGoldenVisaConfig.name,
      programSlug: portugalGoldenVisaConfig.slug,
      currency: portugalGoldenVisaConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: portugalGoldenVisaConfig.footnotes,
    };
  },
};

function investmentRouteLabel(route: string): string {
  switch (route) {
    case "fund":
      return "Investment Fund";
    case "cultural-donation-low-density":
      return "Cultural Donation (Low-Density Area)";
    case "cultural-donation":
    default:
      return "Cultural Donation";
  }
}
