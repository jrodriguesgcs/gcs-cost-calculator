import { buildFamilyStructureSentence } from "../family-structure";
import { abCbiConfig } from "./ab-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from "Pricing Calculator - A&B CBI.xlsx"'s "Fee
// Reference" tab (constants, rows 5–54) and "A&B CBI Calculator" tab
// (formulas, rows 5–17 control panel, 21–38 cost breakdown).

const NDF_UP_TO_4 = 230_000;
const NDF_5_PLUS = 245_000;
const UWI_FLAT = 260_000;
// Real estate minimum price is $300,000 for both sole and share ownership
// (Fee Reference rows 11–12; the source's own note flags an earlier
// $200,000 figure elsewhere as an example price, not a minimum).
const RE_MIN_PRICE = 300_000;

const STAMP_DUTY_RATE_SOLE = 0.04;
const STAMP_DUTY_RATE_SHARE = 0.03;
const LEGAL_FEE_RATE_SOLE = 0.02;
const LEGAL_FEE_FLAT_SHARE = 4_000;
const ESCROW_FEE_RATE_SOLE = 0.02;
const ESCROW_FEE_RATE_SHARE = 0.01;
const ESCROW_BALANCE_SHARE_OF_PRICE = 0.9;

// Government processing fee. Known source quirk, not guessed: the
// underlying workbook hardcodes "4" as the base-family-size threshold
// directly on the Calculator tab for every non-UWI path, rather than
// pulling it from Fee Reference like everything else — so if GCS ever
// changes NDF's real family-size threshold (Fee Reference row 7) this
// value won't follow it automatically. Replicated as the source actually
// computes it.
const BASE_FAMILY_SIZE_NON_UWI = 4;
const UWI_COVERED_FAMILY_SIZE = 6;
const GOV_FEE_BASE_SOLO = 10_000;
const GOV_FEE_BASE_FAMILY = 20_000;
const GOV_FEE_PER_EXTRA_NON_UWI = 10_000;
const GOV_FEE_BASE_SHARE = 30_000;
const GOV_FEE_PER_EXTRA_SHARE = 15_000;
const GOV_FEE_BASE_UWI = 0;
const GOV_FEE_PER_EXTRA_UWI = 10_000;

const DD_PRINCIPAL = 7_000; // same across all four paths in the current Fee Reference table
const DD_SPOUSE_STANDARD = 5_000;
const DD_SPOUSE_SHARE = 7_500;
const DD_UNDER_12 = 0;
const DD_AGE_12_TO_17 = 2_000;
const DD_AGE_18_PLUS = 4_000;
const DD_BENEFACTOR = 5_000;

const VIRTUAL_INTERVIEW = 1_500; // per application — source flags this basis as unconfirmed
const PASSPORT_FEE_PER_PERSON = 300;
const COURIER_STANDARD = 300;
const COURIER_SHARE = 500;
const BANK_FEE_PER_PERSON_12_PLUS = 350;
const BANK_FEE_BASE = 150;

const GCS_FEE = 15_000;

interface AbCbiVariables {
  investmentPath: string;
  spouse: boolean;
  under12: number;
  age12to17: number;
  age18Plus: number;
  siblings12to17: number;
  siblings18Plus: number;
  parents: number;
  benefactors: number;
  propertyPrice: number;
  localAgentFee: number;
}

function readVariables(values: ProgramVariableValues): AbCbiVariables {
  return {
    investmentPath: (values.investmentPath as string) ?? "ndf",
    spouse: Boolean(values.spouse),
    under12: Number(values.under12 ?? 0),
    age12to17: Number(values.age12to17 ?? 0),
    age18Plus: Number(values.age18Plus ?? 0),
    siblings12to17: Number(values.siblings12to17 ?? 0),
    siblings18Plus: Number(values.siblings18Plus ?? 0),
    parents: Number(values.parents ?? 0),
    benefactors: Number(values.benefactors ?? 0),
    propertyPrice: Number(values.propertyPrice ?? RE_MIN_PRICE),
    localAgentFee: Number(values.localAgentFee ?? 0),
  };
}

export const abCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const {
      investmentPath,
      spouse,
      under12,
      age12to17,
      age18Plus,
      siblings12to17,
      siblings18Plus,
      parents,
      benefactors,
      propertyPrice,
      localAgentFee,
    } = readVariables(values);

    const spouseCount = spouse ? 1 : 0;
    const isRealEstate = investmentPath === "re-sole" || investmentPath === "re-share";
    const isShare = investmentPath === "re-share";
    const isUwi = investmentPath === "uwi";

    // Family size for processing-fee tiers explicitly excludes benefactors
    // (per the source's own labeling of that field).
    const totalPersons =
      1 + spouseCount + under12 + age12to17 + age18Plus + siblings12to17 + siblings18Plus + parents;
    const personsAged12Plus = totalPersons - under12;

    const coveredFamilySize = isUwi ? UWI_COVERED_FAMILY_SIZE : BASE_FAMILY_SIZE_NON_UWI;
    const personsAboveAllowance = Math.max(0, totalPersons - coveredFamilySize);

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: under12, singular: "Dependant Under 12", plural: "Dependants Under 12" },
      { kind: "count", count: age12to17, singular: "Dependant Aged 12–17", plural: "Dependants Aged 12–17" },
      { kind: "count", count: age18Plus, singular: "Dependant 18+", plural: "Dependants 18+" },
      { kind: "count", count: siblings12to17, singular: "Sibling Dependant Aged 12–17", plural: "Sibling Dependants Aged 12–17" },
      { kind: "count", count: siblings18Plus, singular: "Sibling Dependant 18+", plural: "Sibling Dependants 18+" },
      { kind: "count", count: parents, singular: "Dependent Parent", plural: "Dependent Parents" },
      { kind: "count", count: benefactors, singular: "Benefactor", plural: "Benefactors" },
    ]);

    // --- Investment / donation ---
    let investment: number;
    if (isRealEstate) {
      investment = propertyPrice;
    } else if (isUwi) {
      investment = UWI_FLAT;
    } else {
      investment = totalPersons < 5 ? NDF_UP_TO_4 : NDF_5_PLUS;
    }

    // --- Real estate transaction costs (real estate paths only) ---
    const stampDuty = isRealEstate ? propertyPrice * (isShare ? STAMP_DUTY_RATE_SHARE : STAMP_DUTY_RATE_SOLE) : 0;
    const legalFees = isRealEstate ? (isShare ? LEGAL_FEE_FLAT_SHARE : propertyPrice * LEGAL_FEE_RATE_SOLE) : 0;
    const escrowFee = isRealEstate
      ? propertyPrice * ESCROW_BALANCE_SHARE_OF_PRICE * (isShare ? ESCROW_FEE_RATE_SHARE : ESCROW_FEE_RATE_SOLE)
      : 0;

    // --- Government processing fee ---
    let govFeeBase: number;
    let govFeePerExtra: number;
    if (isUwi) {
      govFeeBase = GOV_FEE_BASE_UWI;
      govFeePerExtra = GOV_FEE_PER_EXTRA_UWI;
    } else if (isShare) {
      govFeeBase = GOV_FEE_BASE_SHARE;
      govFeePerExtra = GOV_FEE_PER_EXTRA_SHARE;
    } else {
      govFeeBase = totalPersons === 1 ? GOV_FEE_BASE_SOLO : GOV_FEE_BASE_FAMILY;
      govFeePerExtra = GOV_FEE_PER_EXTRA_NON_UWI;
    }
    const govFeeExtraPersons = personsAboveAllowance * govFeePerExtra;

    // --- Due diligence, itemized by rate tier rather than one bundled figure ---
    const ddPrincipal = DD_PRINCIPAL;
    const ddSpouse = spouseCount * (isShare ? DD_SPOUSE_SHARE : DD_SPOUSE_STANDARD);
    const ddUnder12 = under12 * DD_UNDER_12;
    const ddAge12to17 = (age12to17 + siblings12to17) * DD_AGE_12_TO_17;
    const ddAge18PlusAndParents = (age18Plus + siblings18Plus + parents) * DD_AGE_18_PLUS;
    const ddDependantsAndFamily = ddUnder12 + ddAge12to17 + ddAge18PlusAndParents;
    const ddBenefactors = benefactors * DD_BENEFACTOR;

    const passportFees = totalPersons * PASSPORT_FEE_PER_PERSON;
    const courierFee = isShare ? COURIER_SHARE : COURIER_STANDARD;
    const bankFeeBase = BANK_FEE_BASE;
    const bankFeePerPerson = personsAged12Plus * BANK_FEE_PER_PERSON_12_PLUS;
    const bankFees = bankFeeBase + bankFeePerPerson;

    const programmeCostsLineItems = [
      { label: `Investment / donation — ${investmentPathLabel(investmentPath)}`, amount: investment },
      { label: "Stamp duty (real estate transaction)", amount: stampDuty },
      { label: "Local attorney fees (real estate transaction)", amount: legalFees },
      { label: "Escrow fee (real estate transaction)", amount: escrowFee },
      { label: "Government application processing fee — base", amount: govFeeBase },
      { label: "Government application processing fee — additional persons", amount: govFeeExtraPersons },
      { label: "Due diligence — principal applicant", amount: ddPrincipal },
      { label: "Due diligence — spouse", amount: ddSpouse },
      { label: "Due diligence — dependants/siblings under 12 (exempt)", amount: ddUnder12 },
      { label: "Due diligence — dependants/siblings aged 12–17", amount: ddAge12to17 },
      { label: "Due diligence — dependants/siblings 18+ and parents", amount: ddAge18PlusAndParents },
      { label: "Due diligence — benefactor(s)", amount: ddBenefactors },
      { label: "Virtual interview (see footnote)", amount: VIRTUAL_INTERVIEW, approximate: true },
      { label: "Passport fees", amount: passportFees },
      { label: "Courier", amount: courierFee },
      { label: "Bank fee — base", amount: bankFeeBase },
      { label: "Bank fee — per person aged 12+", amount: bankFeePerPerson },
      { label: "Local agent fee (negotiated — see footnote)", amount: localAgentFee },
    ];
    const programmeCostsSubtotal =
      investment +
      stampDuty +
      legalFees +
      escrowFee +
      govFeeBase +
      govFeeExtraPersons +
      ddPrincipal +
      ddSpouse +
      ddDependantsAndFamily +
      ddBenefactors +
      VIRTUAL_INTERVIEW +
      passportFees +
      courierFee +
      bankFees +
      localAgentFee;

    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_FEE }];
    const gcsFeeSubtotal = GCS_FEE;

    const sections: QuoteSection[] = [
      { ...abCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...abCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    return {
      programName: abCbiConfig.name,
      programSlug: abCbiConfig.slug,
      currency: abCbiConfig.currency,
      clientName,
      familyStructure,
      investmentRoute: investmentPathLabel(investmentPath),
      sections,
      grandTotal,
      footnotes: abCbiConfig.footnotes,
    };
  },
};

function investmentPathLabel(path: string): string {
  switch (path) {
    case "uwi":
      return "UWI Fund";
    case "re-sole":
      return "Real Estate (Sole Ownership)";
    case "re-share":
      return "Real Estate (Share Ownership)";
    case "ndf":
    default:
      return "NDF";
  }
}
