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
  name: "Vanuatu CBI",
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
    "All fees are indicative and subject to change by the Vanuatu government; read alongside the full GCS proposal.",
    "\"Incidental fees\" (a source-schedule term, not an age category) cover the application fee, citizenship certificate, oath taking, and DHL courier — separate from the per-applicant Birth Registration/ID Card fee shown above it, and from biometrics, which is priced separately below.",
    "Biometrics: $1,000 per person in-country at the Vanuatu Immigration Service in Port Vila, or $3,000 per person overseas at the Vanuatu consulate in Dubai or Hong Kong. A mobile consul visit is priced by custom quotation and shown as TBC — it is not included in the total above.",
    "Translation and travel costs are not included and are typically arranged separately.",
    "Processing timelines are guidelines only, at the discretion of the Vanuatu authorities.",
  ],
};
