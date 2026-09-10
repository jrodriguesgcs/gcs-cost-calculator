import { ProgramConfig } from "./types";

// Display/config data for Vanuatu CBI, transcribed from
// Vanuatu_Pricing_Calculator.xlsx (the "Vanuatu Calculator" and "Fee
// Reference" tabs) — see vanuatu-cbi.calculator.ts for the formula logic.
//
// Like St Lucia, this source has no payment-milestone split — a single
// flat cost table — so one "Programme Costs" section covers everything
// government-related, plus a separate GCS Professional Fee section
// (the source itself computes a distinct "Total cost without GCS fee").

export const vanuatuCbiConfig: ProgramConfig = {
  slug: "vanuatu-cbi",
  name: "Vanuatu Citizenship by Investment",
  currency: "USD",
  variables: [
    {
      key: "programme",
      label: "Programme",
      type: "select",
      options: [
        { value: "dsp", label: "DSP (Development Support Program)" },
        { value: "ciip", label: "CIIP (Capital Investment Immigration Plan)" },
      ],
      default: "dsp",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "otherDependants",
      label: "Other Dependants (Children / Family Members)",
      type: "number",
      min: 0,
      max: 20,
      default: 0,
    },
    {
      key: "biometricsLocation",
      label: "Biometrics Submission Location",
      type: "select",
      options: [
        { value: "in-country", label: "In-Country (Port Vila)" },
        { value: "overseas", label: "Overseas Consulate (Dubai / Hong Kong)" },
        { value: "mobile", label: "Mobile Consul (Custom Quotation)" },
      ],
      default: "in-country",
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts will be confirmed at the relevant stage of the process.",
    "Biometrics: $1,000 per person in-country at the Vanuatu Immigration Service in Port Vila, or $3,000 per person overseas at the Vanuatu consulate in Dubai or Hong Kong. A mobile consul visit is available and priced by custom quotation on request.",
    "Translation and travel costs are not included above — these are separate third-party fees that may apply and are not quoted here, as they vary case by case.",
    "Processing timelines are guidelines only, at the discretion of the Vanuatu authorities.",
  ],
};
