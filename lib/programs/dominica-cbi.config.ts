import { ProgramConfig } from "./types";

// Display/config data for Dominica CBI, transcribed from "Pricing
// Calculator - Dominica CBI.xlsx" (the "Dominica Calculator" and "Fee
// Reference" tabs) — see dominica-cbi.calculator.ts for the formula logic.
//
// Like St Lucia/Vanuatu, this source has no payment-milestone split — one
// flat "Detailed Cost Breakdown" table — so this keeps a single "Programme
// Costs" section plus a separate "GCS Professional Fee" section.
//
// "Main applicant" is treated as fixed at 1, not a form field, matching
// every other program in this tool (the source's own cell technically
// allows 0/1, but quoting for zero applicants isn't a real scenario).

export const dominicaCbiConfig: ProgramConfig = {
  slug: "dominica-cbi",
  name: "Dominica Citizenship by Investment",
  currency: "USD",
  variables: [
    {
      key: "investmentOption",
      label: "Investment Option",
      type: "select",
      options: [
        { value: "edf", label: "EDF Donation (Economic Diversification Fund)" },
        { value: "real-estate", label: "Real Estate" },
      ],
      default: "edf",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "childrenUnder16",
      label: "Children Under 16",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "children16to17",
      label: "Children Aged 16–17",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "dependants18Plus",
      label: "Dependants Aged 18 and Over (Excluding Spouse)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "All fees are indicative and subject to change by the Dominica government; read alongside the full GCS proposal.",
    "Children under 16 pay no due diligence fee; children 16–17 and dependants 18+ are charged at the same $4,000 rate.",
    "Translation, notarization, and travel costs are not included and are typically arranged separately.",
    "Processing timelines are guidelines only, at the discretion of the Dominica CBIU (Citizenship by Investment Unit).",
    "The GCS professional fee is separate from the government/programme cost above.",
  ],
};
