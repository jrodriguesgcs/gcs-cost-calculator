import { buildFamilyStructureSentence } from "../family-structure";
import { stLuciaCbiConfig } from "./st-lucia-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Copy_of_Pricing_Calculator__St_Lucia_CBI
// .xlsx's "Fee Reference" tab (constants) and "St Lucia Calculator" tab
// (formulas in F5–F14, C19–C26).

const INVESTMENT_BASE: Record<string, number> = {
  nef: 240_000,
  nab: 300_000,
  re: 300_000,
  ep3: 250_000,
  ep1: 3_500_000,
};

const NEF_EXTRA_18_PLUS = 20_000;
const NEF_EXTRA_UNDER_18 = 10_000;
const NEF_FREE_DEPENDANTS = 3; // free slots covered by the base NEF investment

const NAB_ADMIN_FEE = 50_000;
const EP1_ADMIN_FEE = 50_000;
const RE_ADMIN_BASE_SOLO = 30_000;
const RE_ADMIN_BASE_WITH_SPOUSE = 45_000;
const RE_ADMIN_PER_UNDER_18 = 5_000;
const RE_ADMIN_PER_18_PLUS = 10_000;
const EP3_ADMIN_TIERS = [15_000, 20_000, 25_000, 30_000]; // 0, 1, 2, 3+ dependants
const EP3_ADMIN_PER_EXTRA_BEYOND_3 = 10_000;

const APPLICATION_FEE_MAIN = 2_000;
const APPLICATION_FEE_PER_DEPENDANT = 1_000;
const DD_FEE_MAIN = 8_000;
const DD_FEE_PER_DEPENDANT_16_PLUS = 5_000;

const GCS_FEE = 15_000;

interface StLuciaCbiVariables {
  investmentPath: string;
  spouse: boolean;
  depUnder16: number;
  dep16to17: number;
  dep18Plus: number;
}

function readVariables(values: ProgramVariableValues): StLuciaCbiVariables {
  return {
    investmentPath: (values.investmentPath as string) ?? "nef",
    spouse: Boolean(values.spouse),
    depUnder16: Number(values.depUnder16 ?? 0),
    dep16to17: Number(values.dep16to17 ?? 0),
    dep18Plus: Number(values.dep18Plus ?? 0),
  };
}

export const stLuciaCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentPath, spouse, depUnder16, dep16to17, dep18Plus } = readVariables(values);
    const spouseCount = spouse ? 1 : 0;

    // Total qualifying dependants (includes spouse) and derived buckets —
    // mirrors the Calculator tab's F5–F14 helper cells exactly.
    const totalQualifyingDependants = spouseCount + depUnder16 + dep16to17 + dep18Plus;
    const under18Bucket = depUnder16 + dep16to17;
    const eighteenPlusInclSpouse = spouseCount + dep18Plus;
    const subjectToDueDiligence = spouseCount + dep16to17 + dep18Plus; // 16+ only; under-16 exempt

    const nefFreeSlotsUsedBy18Plus = Math.min(eighteenPlusInclSpouse, NEF_FREE_DEPENDANTS);
    const nefChargeable18Plus = eighteenPlusInclSpouse - nefFreeSlotsUsedBy18Plus;
    const nefChargeableUnder18 = Math.max(0, under18Bucket - (NEF_FREE_DEPENDANTS - nefFreeSlotsUsedBy18Plus));
    const ep3DependantsBeyond3 = Math.max(0, totalQualifyingDependants - 3);

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: depUnder16, singular: "Dependant Under 16", plural: "Dependants Under 16" },
      { kind: "count", count: dep16to17, singular: "Dependant Aged 16–17", plural: "Dependants Aged 16–17" },
      { kind: "count", count: dep18Plus, singular: "Dependant 18+", plural: "Dependants 18+" },
    ]);

    // --- Qualifying investment (base) ---
    const investmentBase = INVESTMENT_BASE[investmentPath] ?? INVESTMENT_BASE.nef;

    // --- Additional dependant investment (NEF only) ---
    const additionalDependantInvestment =
      investmentPath === "nef" ? nefChargeable18Plus * NEF_EXTRA_18_PLUS + nefChargeableUnder18 * NEF_EXTRA_UNDER_18 : 0;

    // --- Government administration fee (non-refundable, on grant of
    // citizenship) — itemized into its real components where the path has
    // sub-structure (RE, EP3); NAB/EP1 are already a single flat fee with
    // nothing further to break out.
    let adminFeeLineItems: { label: string; amount: number }[];
    let adminFee: number;
    if (investmentPath === "nab") {
      adminFee = NAB_ADMIN_FEE;
      adminFeeLineItems = [{ label: "Government administration fee (non-refundable, National Action Bond)", amount: adminFee }];
    } else if (investmentPath === "ep1") {
      adminFee = EP1_ADMIN_FEE;
      adminFeeLineItems = [{ label: "Government administration fee (non-refundable, Enterprise Project Option 1)", amount: adminFee }];
    } else if (investmentPath === "re") {
      const reBase = spouseCount === 1 ? RE_ADMIN_BASE_WITH_SPOUSE : RE_ADMIN_BASE_SOLO;
      const reUnder18 = under18Bucket * RE_ADMIN_PER_UNDER_18;
      const re18Plus = dep18Plus * RE_ADMIN_PER_18_PLUS;
      adminFee = reBase + reUnder18 + re18Plus;
      adminFeeLineItems = [
        { label: `Government administration fee — base (${spouseCount === 1 ? "with spouse" : "solo applicant"})`, amount: reBase },
        { label: "Government administration fee — dependants under 18", amount: reUnder18 },
        { label: "Government administration fee — dependants 18+", amount: re18Plus },
      ];
    } else if (investmentPath === "ep3") {
      const tierIndex = Math.min(totalQualifyingDependants, 3);
      const tierBase = EP3_ADMIN_TIERS[tierIndex];
      const beyond3 = ep3DependantsBeyond3 * EP3_ADMIN_PER_EXTRA_BEYOND_3;
      adminFee = tierBase + beyond3;
      adminFeeLineItems = [
        { label: `Government administration fee — base (${totalQualifyingDependants} qualifying dependant${totalQualifyingDependants === 1 ? "" : "s"})`, amount: tierBase },
        { label: "Government administration fee — dependants beyond 3", amount: beyond3 },
      ];
    } else {
      adminFee = 0; // NEF: no administration fee under this path
      adminFeeLineItems = [];
    }

    // --- Application processing & due diligence fees, itemized main vs. dependants ---
    const applicationFeeMain = APPLICATION_FEE_MAIN;
    const applicationFeeDependants = totalQualifyingDependants * APPLICATION_FEE_PER_DEPENDANT;
    const applicationFee = applicationFeeMain + applicationFeeDependants;
    const dueDiligenceFeeMain = DD_FEE_MAIN;
    const dueDiligenceFeeDependants = subjectToDueDiligence * DD_FEE_PER_DEPENDANT_16_PLUS;
    const dueDiligenceFee = dueDiligenceFeeMain + dueDiligenceFeeDependants;

    const programmeCostsLineItems = [
      { label: "Qualifying investment (base)", amount: investmentBase },
      { label: "Additional dependant investment (NEF only)", amount: additionalDependantInvestment },
      ...adminFeeLineItems,
      { label: "Application processing fee — main applicant", amount: applicationFeeMain },
      { label: "Application processing fee — dependants", amount: applicationFeeDependants },
      { label: "Due diligence fee — main applicant", amount: dueDiligenceFeeMain },
      { label: "Due diligence fee — dependants aged 16+", amount: dueDiligenceFeeDependants },
    ];
    const programmeCostsSubtotal = investmentBase + additionalDependantInvestment + adminFee + applicationFee + dueDiligenceFee;

    // --- GCS Professional Fee ---
    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...stLuciaCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...stLuciaCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    return {
      programName: stLuciaCbiConfig.name,
      programSlug: stLuciaCbiConfig.slug,
      currency: stLuciaCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: stLuciaCbiConfig.footnotes,
    };
  },
};
