import { buildFamilyStructureSentence } from "../family-structure";
import { turkeyCbiConfig } from "./turkey-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from "Pricing Calculator - Turkey CBI.xlsx"'s
// "Fee Reference" tab (constants) and "Turkey Calculator" tab (formulas,
// rows 16–32).

const RE_MIN_INVESTMENT = 400_000; // "Default property value used in the fee illustration" (Fee Reference B11)
const BANK_DEPOSIT_MIN = 500_000;

const PROPERTY_VALUATION_REPORT_PER_PROPERTY = 400;
const TITLE_DEED_TAX_RATE = 0.04;
const TITLE_DEED_PROCESSING_TAX_PER_PROPERTY = 150;
const AGENT_FEE_RATE = 0.02;

const GOVERNMENT_PROCESSING_FEE = 500;
const VISA_RESIDENCE_NOTARY_PER_PERSON = 1_159;
const ID_PASSPORT_PER_PERSON = 400;
const HEALTH_INSURANCE_PER_PERSON = 300;
const POWER_OF_ATTORNEY = 450;
const INTERPRETER_NOTARIZATION_PER_PERSON = 200;
const BANK_ACCOUNT_DEPOSIT_REFUNDABLE = 500; // bank deposit route only

const GCS_LEGAL_FEE_MAIN = 20_000;
const GCS_LEGAL_FEE_PER_DEPENDENT = 5_000;

interface TurkeyCbiVariables {
  investmentPath: string;
  spouse: boolean;
  children: number;
  otherDependants: number;
  properties: number;
}

function readVariables(values: ProgramVariableValues): TurkeyCbiVariables {
  return {
    investmentPath: (values.investmentPath as string) ?? "bank-deposit",
    spouse: Boolean(values.spouse),
    children: Number(values.children ?? 0),
    otherDependants: Number(values.otherDependants ?? 0),
    properties: Number(values.properties ?? 1),
  };
}

export const turkeyCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { investmentPath, spouse, children, otherDependants, properties } = readVariables(values);

    const spouseCount = spouse ? 1 : 0;
    const isRealEstate = investmentPath === "real-estate";
    const totalPersons = 1 + spouseCount + children + otherDependants;
    const dependantsExclMain = totalPersons - 1;
    const propertiesCharged = isRealEstate ? properties : 0;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: children, singular: "Dependent Child", plural: "Dependent Children" },
      { kind: "count", count: otherDependants, singular: "Other Dependant", plural: "Other Dependants" },
    ]);

    const qualifyingInvestment = isRealEstate ? RE_MIN_INVESTMENT : BANK_DEPOSIT_MIN;
    const propertyValuationReport = propertiesCharged * PROPERTY_VALUATION_REPORT_PER_PROPERTY;
    // Known source ambiguity, not guessed: footnote 4 states these two are
    // "calculated on the total property(properties) value," implying they
    // scale with the number of properties — but the actual formula (and
    // this transcription of it) computes both on the single fixed
    // qualifying-investment value above, never multiplied by `properties`.
    // Transcribed as the workbook actually computes it; flagged for GCS to
    // confirm before a 2-property Real Estate quote is trusted.
    const titleDeedTax = isRealEstate ? qualifyingInvestment * TITLE_DEED_TAX_RATE : 0;
    const titleDeedProcessingTax = propertiesCharged * TITLE_DEED_PROCESSING_TAX_PER_PROPERTY;
    const agentFee = isRealEstate ? qualifyingInvestment * AGENT_FEE_RATE : 0;

    const visaResidenceNotary = totalPersons * VISA_RESIDENCE_NOTARY_PER_PERSON;
    const idPassport = totalPersons * ID_PASSPORT_PER_PERSON;
    const healthInsurance = totalPersons * HEALTH_INSURANCE_PER_PERSON;
    const interpreterNotarization = totalPersons * INTERPRETER_NOTARIZATION_PER_PERSON;
    const bankAccountDeposit = isRealEstate ? 0 : BANK_ACCOUNT_DEPOSIT_REFUNDABLE;

    const gcsLegalFeeMain = GCS_LEGAL_FEE_MAIN;
    const gcsLegalFeeDependants = dependantsExclMain * GCS_LEGAL_FEE_PER_DEPENDENT;

    const programmeCostsLineItems = [
      { label: `Qualifying investment — ${isRealEstate ? "Real Estate" : "Bank Deposit"}`, amount: qualifyingInvestment },
      { label: "Property valuation report", amount: propertyValuationReport },
      { label: "Title deed tax (4% of property value)", amount: titleDeedTax },
      { label: "Title deed processing tax", amount: titleDeedProcessingTax },
      { label: "Real estate agent fee (2% of property value)", amount: agentFee },
      { label: "Government application & certificate of conformity fee", amount: GOVERNMENT_PROCESSING_FEE, approximate: true },
      { label: "Visa tax, residence permit tax, notary & translation fee", amount: visaResidenceNotary },
      { label: "ID card and passport fees", amount: idPassport, approximate: true },
      { label: "Health insurance", amount: healthInsurance, approximate: true },
      { label: "Power of attorney", amount: POWER_OF_ATTORNEY },
      { label: "Interpreter and notarization", amount: interpreterNotarization },
      { label: "Bank account opening deposit (refundable)", amount: bankAccountDeposit },
    ];
    const programmeCostsSubtotal =
      qualifyingInvestment +
      propertyValuationReport +
      titleDeedTax +
      titleDeedProcessingTax +
      agentFee +
      GOVERNMENT_PROCESSING_FEE +
      visaResidenceNotary +
      idPassport +
      healthInsurance +
      POWER_OF_ATTORNEY +
      interpreterNotarization +
      bankAccountDeposit;

    const gcsFeeLineItems = [
      { label: "GCS legal & processing fee — main applicant", amount: gcsLegalFeeMain },
      { label: "GCS legal & processing fee — per dependant", amount: gcsLegalFeeDependants },
    ];
    const gcsFeeSubtotal = gcsLegalFeeMain + gcsLegalFeeDependants;

    const sections: QuoteSection[] = [
      { ...turkeyCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...turkeyCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    return {
      programName: turkeyCbiConfig.name,
      programSlug: turkeyCbiConfig.slug,
      currency: turkeyCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes: turkeyCbiConfig.footnotes,
    };
  },
};
