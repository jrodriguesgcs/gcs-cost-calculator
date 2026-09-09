import { buildFamilyStructureSentence } from "../family-structure";
import { sknCbiConfig } from "./skn-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Copy_of_Pricing_Calculator__SKN_CBI.xlsx's
// "Fee Reference" tab (constants) and "Calculator" tab (formulas in
// C16–C30, C34, C36).

const APPLICATION_FEE_PER_PERSON = 250;

const CBI_DD_MAIN = 10_000;
const CBI_DD_SPOUSE = 7_500;
const CBI_DD_ADULT = 7_500;
const CBI_DD_MINOR = 0; // minors exempt from the CBI due diligence fee

const BANK_DD_PRE_MAIN = 550;
const BANK_DD_POST_MAIN_SOLO = 500; // source quirk: solo differs from family — replicated as given
const BANK_DD_POST_MAIN_FAMILY = 550;
const BANK_DD_SPOUSE = 350;
const BANK_DD_ADULT = 300;
const BANK_DD_MINOR = 150;

const WIRE_TRANSFER_FEE = 35.1;
const COURIER_FEE = 200;
const SERVICE_PROVIDER_FEE_STANDARD = 5_000;
const SERVICE_PROVIDER_FEE_SOLO_WAIVED = 0;

const PASSPORT_FIRST_ADULT = 2_500;
const PASSPORT_ADDITIONAL_ADULT = 2_000;
const PASSPORT_MINOR = 1_300;
const PASSPORT_SOLO_FLAT = 305; // SISC/PBO solo applicant only — replaces the whole biometric schedule

const SISC_BASE_CONTRIBUTION = 250_000; // covers up to 4 persons
const SISC_FREE_THRESHOLD_PERSONS = 4;
const SISC_EXCESS_ADULT = 50_000;
const SISC_EXCESS_MINOR = 25_000;

const PBO_CONTRIBUTION_FLAT = 250_000;
const PBO_GOV_FEE_ADULT = 15_000;
const PBO_GOV_FEE_MINOR = 10_000;

const RE_CONTRIBUTION_CONDO = 325_000;
const RE_CONTRIBUTION_HOME = 600_000;
const RE_GOV_FEE_BASE = 25_000;
const RE_GOV_FEE_ADULT = 15_000;
const RE_GOV_FEE_MINOR = 10_000;
const RE_ESCROW_RATE = 0.01;

const GCS_FEE = 15_000;

type PathCode = "sisc" | "pbo" | "re";

interface SknCbiVariables {
  investmentPath: string;
  spouse: boolean;
  adults: number;
  minors: number;
}

function readVariables(values: ProgramVariableValues): SknCbiVariables {
  return {
    investmentPath: (values.investmentPath as string) ?? "sisc",
    spouse: Boolean(values.spouse),
    adults: Number(values.adults ?? 0),
    minors: Number(values.minors ?? 0),
  };
}

function resolvePathCode(investmentPath: string): PathCode {
  if (investmentPath === "sisc") return "sisc";
  if (investmentPath === "pbo") return "pbo";
  return "re";
}

export const sknCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentPath, spouse, adults, minors } = readVariables(values);
    const pathCode = resolvePathCode(investmentPath);
    const isRealEstateHome = investmentPath === "re-home";

    const spouseCount = spouse ? 1 : 0;
    const totalPersons = 1 + spouseCount + adults + minors;
    const totalAdultsInclMain = 1 + spouseCount + adults;
    const solo = totalPersons === 1;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: adults, singular: "Adult Dependant", plural: "Adult Dependants" },
      { kind: "count", count: minors, singular: "Minor Dependant", plural: "Minor Dependants" },
    ]);

    // --- Section 1: Before Submission ---
    const applicationFee = APPLICATION_FEE_PER_PERSON * totalPersons;
    const cbiDdMainFee = CBI_DD_MAIN;
    const cbiDdSpouseFee = spouseCount * CBI_DD_SPOUSE;
    const cbiDdAdultFee = adults * CBI_DD_ADULT;
    const cbiDdMinorFee = minors * CBI_DD_MINOR;
    const cbiDdFee = cbiDdMainFee + cbiDdSpouseFee + cbiDdAdultFee + cbiDdMinorFee;
    const bankDdPreMainFee = BANK_DD_PRE_MAIN;
    const bankDdPreSpouseFee = spouseCount * BANK_DD_SPOUSE;
    const bankDdPreAdultFee = adults * BANK_DD_ADULT;
    const bankDdPreMinorFee = minors * BANK_DD_MINOR;
    const bankDdPreFee = bankDdPreMainFee + bankDdPreSpouseFee + bankDdPreAdultFee + bankDdPreMinorFee;
    const serviceProviderFee =
      pathCode === "re" ? SERVICE_PROVIDER_FEE_STANDARD : solo ? SERVICE_PROVIDER_FEE_SOLO_WAIVED : SERVICE_PROVIDER_FEE_STANDARD;

    const beforeSubmissionLineItems = [
      { label: "CBI application fee", amount: applicationFee },
      { label: "CBI due diligence fee — main applicant", amount: cbiDdMainFee },
      { label: "CBI due diligence fee — spouse", amount: cbiDdSpouseFee },
      { label: "CBI due diligence fee — adult dependants", amount: cbiDdAdultFee },
      { label: "CBI due diligence fee — minor dependants (exempt)", amount: cbiDdMinorFee },
      { label: "Bank due diligence fee — main applicant (pre-submission)", amount: bankDdPreMainFee },
      { label: "Bank due diligence fee — spouse (pre-submission)", amount: bankDdPreSpouseFee },
      { label: "Bank due diligence fee — adult dependants (pre-submission)", amount: bankDdPreAdultFee },
      { label: "Bank due diligence fee — minor dependants (pre-submission)", amount: bankDdPreMinorFee },
      { label: "Wire transfer fee — pre-submission", amount: WIRE_TRANSFER_FEE },
      { label: "Registered local service provider fee", amount: serviceProviderFee },
    ];
    const beforeSubmissionSubtotal = applicationFee + cbiDdFee + bankDdPreFee + WIRE_TRANSFER_FEE + serviceProviderFee;

    // --- Section 2: After Approval ---
    const bankDdPostMainLabel = solo
      ? "Bank due diligence fee — main applicant, solo rate (post-approval)"
      : "Bank due diligence fee — main applicant, family rate (post-approval)";
    const bankDdPostMainFee = solo ? BANK_DD_POST_MAIN_SOLO : BANK_DD_POST_MAIN_FAMILY;
    const bankDdPostSpouseFee = spouseCount * BANK_DD_SPOUSE;
    const bankDdPostAdultFee = adults * BANK_DD_ADULT;
    const bankDdPostMinorFee = minors * BANK_DD_MINOR;
    const bankDdPostFee = bankDdPostMainFee + bankDdPostSpouseFee + bankDdPostAdultFee + bankDdPostMinorFee;
    const passportFee =
      (pathCode === "sisc" || pathCode === "pbo") && solo
        ? PASSPORT_SOLO_FLAT
        : PASSPORT_FIRST_ADULT + (totalAdultsInclMain - 1) * PASSPORT_ADDITIONAL_ADULT + minors * PASSPORT_MINOR;

    // Government fees — itemized per path; SISC has none of its own (the
    // source folds it directly into the contribution amount below, see
    // config.ts's footnote), so no line item is shown for that path at all
    // rather than a confusing unexplained $0.
    let governmentFeeLineItems: { label: string; amount: number }[] = [];
    let governmentFee = 0;
    if (pathCode === "pbo") {
      const pboAdultFee = (spouseCount + adults) * PBO_GOV_FEE_ADULT;
      const pboMinorFee = minors * PBO_GOV_FEE_MINOR;
      governmentFee = pboAdultFee + pboMinorFee;
      governmentFeeLineItems = [
        { label: "Government fee — spouse & adult dependants", amount: pboAdultFee },
        { label: "Government fee — minor dependants", amount: pboMinorFee },
      ];
    } else if (pathCode === "re") {
      const reAdultFee = (spouseCount + adults) * RE_GOV_FEE_ADULT;
      const reMinorFee = minors * RE_GOV_FEE_MINOR;
      governmentFee = RE_GOV_FEE_BASE + reAdultFee + reMinorFee;
      governmentFeeLineItems = [
        { label: "Government fee — base", amount: RE_GOV_FEE_BASE },
        { label: "Government fee — spouse & adult dependants", amount: reAdultFee },
        { label: "Government fee — minor dependants", amount: reMinorFee },
      ];
    }

    const realEstateContribution = isRealEstateHome ? RE_CONTRIBUTION_HOME : RE_CONTRIBUTION_CONDO;
    const escrowFee = pathCode === "re" ? RE_ESCROW_RATE * realEstateContribution : 0;

    let contributionAmount: number;
    let contributionLabel: string;
    let investmentRoute: string;
    if (pathCode === "sisc") {
      const excessPersons = Math.max(0, totalPersons - SISC_FREE_THRESHOLD_PERSONS);
      const excessAdults = Math.min(adults, excessPersons);
      const excessMinors = Math.max(0, excessPersons - excessAdults);
      contributionAmount = SISC_BASE_CONTRIBUTION + excessAdults * SISC_EXCESS_ADULT + excessMinors * SISC_EXCESS_MINOR;
      contributionLabel = "Sustainable Island State Contribution";
      investmentRoute = "Sustainable Island State Contribution";
    } else if (pathCode === "pbo") {
      contributionAmount = PBO_CONTRIBUTION_FLAT;
      contributionLabel = "Public Benefit Contribution";
      investmentRoute = "Public Benefit Option";
    } else {
      contributionAmount = realEstateContribution;
      contributionLabel = isRealEstateHome
        ? "Real estate contribution — private home (sole ownership)"
        : "Real estate contribution — share or condominium";
      investmentRoute = isRealEstateHome ? "Real Estate — Private Home" : "Real Estate — Share or Condominium";
    }

    const afterApprovalLineItems = [
      { label: "Wire transfer fee — post-approval", amount: WIRE_TRANSFER_FEE },
      { label: "Courier fee", amount: COURIER_FEE },
      { label: bankDdPostMainLabel, amount: bankDdPostMainFee },
      { label: "Bank due diligence fee — spouse (post-approval)", amount: bankDdPostSpouseFee },
      { label: "Bank due diligence fee — adult dependants (post-approval)", amount: bankDdPostAdultFee },
      { label: "Bank due diligence fee — minor dependants (post-approval)", amount: bankDdPostMinorFee },
      { label: "Passport fees", amount: passportFee },
      ...governmentFeeLineItems,
      { label: "Escrow services", amount: escrowFee },
      { label: contributionLabel, amount: contributionAmount },
    ];
    const afterApprovalSubtotal =
      WIRE_TRANSFER_FEE + COURIER_FEE + bankDdPostFee + passportFee + governmentFee + escrowFee + contributionAmount;

    // --- Section 3: GCS Professional Fee ---
    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...sknCbiConfig.sections[0], lineItems: beforeSubmissionLineItems, subtotal: beforeSubmissionSubtotal },
      { ...sknCbiConfig.sections[1], lineItems: afterApprovalLineItems, subtotal: afterApprovalSubtotal },
      { ...sknCbiConfig.sections[2], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = beforeSubmissionSubtotal + afterApprovalSubtotal + gcsFeeSubtotal;

    return {
      programName: sknCbiConfig.name,
      programSlug: sknCbiConfig.slug,
      currency: sknCbiConfig.currency,
      clientName,
      familyStructure,
      investmentRoute,
      sections,
      grandTotal,
      footnotes: sknCbiConfig.footnotes,
    };
  },
};
