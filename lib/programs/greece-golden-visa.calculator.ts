import { buildFamilyStructureSentence } from "../family-structure";
import { greeceGoldenVisaConfig } from "./greece-golden-visa.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Greece_Golden_Visa__Cost_Calculator.html's
// <script> (recalc()).

const GCS_DEPOSIT = 7_000;
const GOVT_FEE_MAIN = 2_016;
const GOVT_FEE_ADULT_DEPENDANT = 166;
const GOVT_FEE_MINOR_DEPENDANT = 16;
const INSURANCE_PER_APPLICANT = 200;

// Tangible track (real estate)
const PROPERTY_CONSULTANCY_RATE = 0.018 * 1.24; // 1.8% + 24% VAT
const ADMIN_RATE = 0.04;
const PROFESSIONAL_FEE_PER_ADULT = 3_500;
const PROFESSIONAL_FEE_PER_CHILD = 2_000;
const DISBURSEMENTS = 900;
const TRANSFER_TAX_RATE = 0.0309;
const NOTARY_STAMP_RATE = 0.015;
const REGISTRATION_RATE = 0.0077;

// Intangible track (capital / funds / bonds / shares)
const GCS_FEE_INTANGIBLE_MAIN = 15_000;
const GCS_FEE_INTANGIBLE_PER_DEPENDANT = 1_200;

type Track = "tangible" | "intangible";

interface GreeceGoldenVisaVariables {
  track: Track;
  spouse: boolean;
  minors: number;
  adults: number;
  parents: number;
  propertyTier: number;
  investmentTier: number;
}

function readVariables(values: ProgramVariableValues): GreeceGoldenVisaVariables {
  return {
    track: values.track === "intangible" ? "intangible" : "tangible",
    spouse: Boolean(values.spouse),
    minors: Number(values.minors ?? 0),
    adults: Number(values.adults ?? 0),
    parents: Number(values.parents ?? 0),
    propertyTier: Number(values.propertyTier ?? 250_000),
    investmentTier: Number(values.investmentTier ?? 350_000),
  };
}

export const greeceGoldenVisaCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { track, spouse, minors, adults, parents, propertyTier, investmentTier } = readVariables(values);
    const spouseCount = spouse ? 1 : 0;

    const totalAdults = 1 + spouseCount + adults + parents; // includes main applicant
    const totalMinors = minors;
    const totalAll = totalAdults + totalMinors;
    const depAdults = spouseCount + adults + parents; // dependants only, excl. main applicant
    const depMinors = minors;
    const totalDependants = depAdults + depMinors;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: minors, singular: "Child", plural: "Children" },
      { kind: "count", count: adults, singular: "Adult Dependant", plural: "Adult Dependants" },
      { kind: "count", count: parents, singular: "Dependent Parent", plural: "Dependent Parents" },
    ]);

    // Shared across both tracks and repeated at renewal.
    const govtFee = GOVT_FEE_MAIN + depAdults * GOVT_FEE_ADULT_DEPENDANT + depMinors * GOVT_FEE_MINOR_DEPENDANT;
    const insurance = totalAll * INSURANCE_PER_APPLICANT;
    const appFees = govtFee + insurance;

    // GCS fee balance, itemized into its real components rather than one
    // bundled figure — every one of these is already a separately-named
    // constant/formula below, so showing them separately costs nothing and
    // directly serves "where exactly is my money allocated."
    let gcsBalanceLineItems: { label: string; amount: number }[];
    let gcsBalance: number;
    let investmentSectionTitle: string;
    let investmentLineItems: { label: string; amount: number }[];
    let investmentSubtotal: number;

    if (track === "tangible") {
      const propConsult = propertyTier * PROPERTY_CONSULTANCY_RATE;
      const adminPct = propertyTier * ADMIN_RATE;
      const profAdult = totalAdults * PROFESSIONAL_FEE_PER_ADULT;
      const profChild = totalMinors * PROFESSIONAL_FEE_PER_CHILD;
      const gcsTotal = propConsult + adminPct + profAdult + profChild + DISBURSEMENTS;
      gcsBalance = gcsTotal - GCS_DEPOSIT;
      gcsBalanceLineItems = [
        { label: "Property consultancy fee (1.8% + VAT of property value)", amount: propConsult },
        { label: "Consulting & admin fee (4% of property value)", amount: adminPct },
        { label: "Professional fee — adults", amount: profAdult },
        { label: "Professional fee — children", amount: profChild },
        { label: "Disbursements", amount: DISBURSEMENTS },
        { label: "Less: GCS fee deposit paid on engagement", amount: -GCS_DEPOSIT },
      ];

      const transferTax = propertyTier * TRANSFER_TAX_RATE;
      const notaryFee = propertyTier * NOTARY_STAMP_RATE;
      const registrationFee = propertyTier * REGISTRATION_RATE;
      const propertyTaxes = transferTax + notaryFee + registrationFee;

      investmentSectionTitle = "Property Purchase & Taxes";
      investmentLineItems = [
        { label: "Property purchase price", amount: propertyTier },
        { label: "Property transfer tax (3.09%)", amount: transferTax },
        { label: "Stamp duty & notary fees (1.5%)", amount: notaryFee },
        { label: "Property registration (0.77%)", amount: registrationFee },
      ];
      investmentSubtotal = propertyTier + propertyTaxes;
    } else {
      const gcsFeeMain = GCS_FEE_INTANGIBLE_MAIN;
      const gcsFeeDependants = totalDependants * GCS_FEE_INTANGIBLE_PER_DEPENDANT;
      const gcsTotal = gcsFeeMain + gcsFeeDependants;
      gcsBalance = gcsTotal - GCS_DEPOSIT;
      gcsBalanceLineItems = [
        { label: "GCS fee — main applicant", amount: gcsFeeMain },
        { label: "GCS fee — per dependant", amount: gcsFeeDependants },
        { label: "Less: GCS fee deposit paid on engagement", amount: -GCS_DEPOSIT },
      ];

      investmentSectionTitle = "Capital Investment";
      investmentLineItems = [{ label: "Investment amount", amount: investmentTier }];
      investmentSubtotal = investmentTier;
    }

    // --- Section 1: GCS Professional Fee (deposit only — the balance is
    // due, and shown, at Section 3; see the config footnote for the full
    // fee formula this deposit/balance split is derived from) ---
    const gcsFeeLineItems = [{ label: "GCS professional fee deposit (on engagement)", amount: GCS_DEPOSIT }];
    const gcsFeeSubtotal = GCS_DEPOSIT;

    // --- Section 3: Application Fees & GCS Balance ---
    const applicationBalanceLineItems = [
      ...gcsBalanceLineItems,
      { label: "Government fee — main applicant", amount: GOVT_FEE_MAIN },
      { label: "Government fee — adult dependants", amount: depAdults * GOVT_FEE_ADULT_DEPENDANT },
      { label: "Government fee — minor dependants", amount: depMinors * GOVT_FEE_MINOR_DEPENDANT },
      { label: "Health insurance (~€200 per applicant)", amount: insurance, approximate: true },
    ];
    const applicationBalanceSubtotal = gcsBalance + appFees;

    // --- Section 4: Permit Renewal (every 5 years) ---
    const renewalLineItems = [
      { label: "Government fee — main applicant", amount: GOVT_FEE_MAIN },
      { label: "Government fee — adult dependants", amount: depAdults * GOVT_FEE_ADULT_DEPENDANT },
      { label: "Government fee — minor dependants", amount: depMinors * GOVT_FEE_MINOR_DEPENDANT },
      { label: "Health insurance (~€200 per applicant)", amount: insurance, approximate: true },
    ];
    const renewalSubtotal = appFees;

    const sections: QuoteSection[] = [
      { ...greeceGoldenVisaConfig.sections[0], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
      {
        ...greeceGoldenVisaConfig.sections[1],
        title: investmentSectionTitle,
        lineItems: investmentLineItems,
        subtotal: investmentSubtotal,
      },
      {
        ...greeceGoldenVisaConfig.sections[2],
        lineItems: applicationBalanceLineItems,
        subtotal: applicationBalanceSubtotal,
      },
      { ...greeceGoldenVisaConfig.sections[3], lineItems: renewalLineItems, subtotal: renewalSubtotal },
    ];

    // Grand total = every section shown, no exceptions — per the tool-wide
    // rule that the Grand Total must always equal the sum of what's on the
    // page, not a subset requiring a footnote to explain the gap.
    const grandTotal = gcsFeeSubtotal + investmentSubtotal + applicationBalanceSubtotal + renewalSubtotal;

    return {
      programName: greeceGoldenVisaConfig.name,
      programSlug: greeceGoldenVisaConfig.slug,
      currency: greeceGoldenVisaConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      // The ~€200/applicant health insurance line is approximate and feeds
      // into this total — mark the total itself, not just the one line.
      grandTotalApproximate: true,
      footnotes: greeceGoldenVisaConfig.footnotes,
    };
  },
};
