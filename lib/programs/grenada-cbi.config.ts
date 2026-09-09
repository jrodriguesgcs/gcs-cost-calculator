import { ProgramConfig } from "./types";

// Display/config data for Grenada CBI, transcribed from
// "Pricing Calculator - Grenada CBI.xlsx" (the "Grenada Calculator" and
// "Fee Reference" tabs) — see grenada-cbi.calculator.ts for the formula
// logic.
//
// Like St Lucia/Vanuatu, this source has no payment-milestone split — one
// flat "Detailed Cost Breakdown" table — so this keeps a single "Programme
// Costs" section plus a separate "GCS Professional Fee" section, matching
// the source's own "Total excluding GCS professional fees" line.
//
// "Main applicant" is a free-typed input in the source (unusually — every
// other program in this tool treats it as fixed at 1), so it's not exposed
// as a form field here; hardcoded to 1 in the calculator for consistency
// with the rest of the tool.

export const grenadaCbiConfig: ProgramConfig = {
  slug: "grenada-cbi",
  name: "Grenada CBI",
  currency: "USD",
  variables: [
    {
      key: "investmentRoute",
      label: "Investment Route",
      type: "select",
      options: [
        { value: "ntf", label: "National Transformation Fund Contribution" },
        { value: "real-estate", label: "Real Estate Investment (Government-Approved Property)" },
      ],
      default: "ntf",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "childrenUnder16",
      label: "Dependent Children Aged 0–16",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "children17",
      label: "Dependent Children Aged 17",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
      helpText: "Priced separately from 0–16 and 18+ — the source's fee schedule has a distinct age-17 rate.",
    },
    {
      key: "children18Plus",
      label: "Dependent Children Aged 18 and Over",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "parents",
      label: "Dependent Parents / Grandparents",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "siblings",
      label: "Dependent Siblings",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "sponsors",
      label: "Sponsors (No Passport Issued)",
      type: "number",
      min: 0,
      max: 5,
      default: 0,
    },
    {
      key: "nonApplicantSpouses",
      label: "Non-Applicant Spouses (No Passport Issued)",
      type: "number",
      min: 0,
      max: 5,
      default: 0,
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "All fees are indicative and subject to change by the Grenada government; read alongside the full GCS proposal.",
    "Age thresholds: from age 17, a dependant's fees include full due diligence, interview, and processing charges; from age 18, they also carry the adult passport fee and the oath of allegiance fee. A dependant under 17 pays a reduced application + processing + child passport fee only.",
    "Bank charge (1% of total funds received) and VAT on that bank charge (15%) are calculated on the full amount transferred, including the GCS professional fee — not just the government/programme costs — per the fee schedule's own grossed-up calculation.",
    "Translation, courier beyond the schedule above, and travel costs are not included and are typically arranged separately.",
    "Processing timelines are guidelines only, at the discretion of the Grenada authorities (CBI Unit).",
    "The GCS professional fee is separate from the government/programme cost above.",
  ],
};
