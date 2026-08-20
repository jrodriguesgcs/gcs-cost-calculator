import { buildFamilyStructureSentence } from "../family-structure";
import { vanuatuCbiConfig } from "./vanuatu-cbi.config";
import { ProgramCalculator, ProgramVariableValues, Quote, QuoteSection } from "./types";

// Fee formulas transcribed from Vanuatu_Pricing_Calculator.xlsx's "Vanuatu
// Calculator" tab, cross-referenced against the "Fee Reference" tab.

const DSP_PRINCIPAL_CONTRIBUTION = 130_000;
const DSP_SPOUSE_CONTRIBUTION = 20_000;
const DSP_DEPENDANT_CONTRIBUTION = 15_000;

const CIIP_FLAT_CONTRIBUTION = 165_000; // covers up to 4 persons
const CIIP_EXTRA_PERSON_CONTRIBUTION = 25_000; // per person above 4

const BIRTH_REGISTRATION_FEE_PER_PERSON = 1_000;
const DSP_MINOR_FEES_PRINCIPAL = 2_000;
const CIIP_MINOR_FEES_PRINCIPAL = 1_000;
const MINOR_FEES_PER_ADDITIONAL_PERSON = 2_000;

const BIOMETRICS_RATE_IN_COUNTRY = 1_000;
const BIOMETRICS_RATE_OVERSEAS = 3_000;
const BIOMETRICS_RATE_MOBILE = 0; // custom quotation, not included in the total

const FIU_DUE_DILIGENCE_FEE = 5_500;
const GCS_PROFESSIONAL_FEE = 15_000;

const CIIP_FOOTNOTE =
  "The CIIP contribution includes a $50,000 investment redeemable after 5 years, so the net cost is $50,000 less than the total above. Processing time is approximately 1–2 months.";
const DSP_FOOTNOTE =
  "The DSP contribution is a one-time government donation with no investment component. Processing time is approximately 1–2 months.";

type Programme = "dsp" | "ciip";
type BiometricsLocation = "in-country" | "overseas" | "mobile";

interface VanuatuCbiVariables {
  programme: Programme;
  spouse: boolean;
  otherDependants: number;
  biometricsLocation: BiometricsLocation;
}

function readVariables(values: ProgramVariableValues): VanuatuCbiVariables {
  return {
    programme: values.programme === "ciip" ? "ciip" : "dsp",
    spouse: Boolean(values.spouse),
    otherDependants: Number(values.otherDependants ?? 0),
    biometricsLocation:
      values.biometricsLocation === "overseas" || values.biometricsLocation === "mobile"
        ? (values.biometricsLocation as BiometricsLocation)
        : "in-country",
  };
}

function biometricsRate(location: BiometricsLocation): number {
  if (location === "overseas") return BIOMETRICS_RATE_OVERSEAS;
  if (location === "mobile") return BIOMETRICS_RATE_MOBILE;
  return BIOMETRICS_RATE_IN_COUNTRY;
}

export const vanuatuCbiCalculator: ProgramCalculator = {
  computeQuote(values: ProgramVariableValues, clientName: string): Quote {
    const { programme, spouse, otherDependants, biometricsLocation } = readVariables(values);
    const spouseCount = spouse ? 1 : 0;
    const totalApplicants = 1 + spouseCount + otherDependants;

    const familyStructure = buildFamilyStructureSentence([
      { kind: "boolean", included: spouse, label: "Spouse" },
      { kind: "count", count: otherDependants, singular: "Dependant", plural: "Dependants" },
    ]);

    // --- Government contribution ---
    const governmentContribution =
      programme === "dsp"
        ? DSP_PRINCIPAL_CONTRIBUTION +
          DSP_SPOUSE_CONTRIBUTION * spouseCount +
          DSP_DEPENDANT_CONTRIBUTION * otherDependants
        : CIIP_FLAT_CONTRIBUTION + CIIP_EXTRA_PERSON_CONTRIBUTION * Math.max(0, totalApplicants - 4);

    // --- Minor fees: Birth Registration/ID Card + balance ---
    const birthRegistrationFee = BIRTH_REGISTRATION_FEE_PER_PERSON * totalApplicants;
    const pooledMinorFees =
      (programme === "dsp" ? DSP_MINOR_FEES_PRINCIPAL : CIIP_MINOR_FEES_PRINCIPAL) +
      MINOR_FEES_PER_ADDITIONAL_PERSON * (totalApplicants - 1);
    const minorFeesBalance = pooledMinorFees - birthRegistrationFee;

    // --- Biometrics ---
    const biometricsSubmissionFee = biometricsRate(biometricsLocation) * totalApplicants;

    const programmeCostsLineItems = [
      { label: "Government contribution", amount: governmentContribution },
      { label: "Minor fees – Birth Registration/ID Card", amount: birthRegistrationFee },
      { label: "Minor fees – balance", amount: minorFeesBalance },
      { label: "Biometrics submission fee", amount: biometricsSubmissionFee },
      { label: "FIU due diligence fee", amount: FIU_DUE_DILIGENCE_FEE },
    ];
    const programmeCostsSubtotal =
      governmentContribution +
      birthRegistrationFee +
      minorFeesBalance +
      biometricsSubmissionFee +
      FIU_DUE_DILIGENCE_FEE;

    const gcsFeeLineItems = [{ label: "GCS professional fee", amount: GCS_PROFESSIONAL_FEE }];
    const gcsFeeSubtotal = GCS_PROFESSIONAL_FEE;

    const sections: QuoteSection[] = [
      { ...vanuatuCbiConfig.sections[0], lineItems: programmeCostsLineItems, subtotal: programmeCostsSubtotal },
      { ...vanuatuCbiConfig.sections[1], lineItems: gcsFeeLineItems, subtotal: gcsFeeSubtotal },
    ];

    const grandTotal = programmeCostsSubtotal + gcsFeeSubtotal;

    const footnotes = [
      ...vanuatuCbiConfig.footnotes,
      programme === "ciip" ? CIIP_FOOTNOTE : DSP_FOOTNOTE,
    ];

    return {
      programName: vanuatuCbiConfig.name,
      programSlug: vanuatuCbiConfig.slug,
      currency: vanuatuCbiConfig.currency,
      clientName,
      familyStructure,
      sections,
      grandTotal,
      footnotes,
    };
  },
};
