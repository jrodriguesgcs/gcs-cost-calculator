import { ProgramConfig } from "./types";

// Display/config data for Saint Lucia CBI, transcribed from
// Copy_of_Pricing_Calculator__St_Lucia_CBI.xlsx (the "St Lucia
// Calculator" and "Fee Reference" tabs) — see st-lucia-cbi.calculator.ts
// for the formula logic.
//
// Unlike Nauru/SKN, this source has no explicit payment-milestone
// sections (no "before submission"/"after approval" split) — it's a
// single flat cost-breakdown table. Rather than inventing a payment
// schedule the source doesn't provide, this keeps one "Programme Costs"
// section for everything government/investment-related, plus the GCS
// professional fee kept separate (matching the source's own distinction:
// it explicitly computes a "Total cost excluding GCS fee" line).

export const stLuciaCbiConfig: ProgramConfig = {
  slug: "st-lucia-cbi",
  name: "St Lucia CBI",
  currency: "USD",
  variables: [
    {
      key: "investmentPath",
      label: "Investment Path",
      type: "select",
      options: [
        { value: "nef", label: "National Economic Fund" },
        { value: "nab", label: "National Action Bond" },
        { value: "re", label: "Real Estate Project" },
        { value: "ep3", label: "Enterprise Project (Option 3)" },
        { value: "ep1", label: "Enterprise Project (Option 1)" },
      ],
      default: "nef",
    },
    {
      key: "spouse",
      label: "Spouse / Partner Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "depUnder16",
      label: "Qualifying Dependants Under 16",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "dep16to17",
      label: "Qualifying Dependants Aged 16–17",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "dep18Plus",
      label: "Qualifying Dependants Aged 18 and Over",
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
    "All fees are indicative; sourced from the CIP Saint Lucia official programme site (fees as published, retrieved 17 Aug 2026).",
    "Due diligence is only conducted on applicants above the age of 16, so dependants under 16 carry no due diligence fee. Dependants aged 16–17 pay the due diligence fee but are priced in the \"under 18\" bucket for investment/administration purposes.",
    "Enterprise Project Option 2 (joint venture, $6,000,000 with a minimum $1,000,000 per applicant) is not modelled here — it's a multi-applicant structure requiring a bespoke quote.",
    "Excludes: the mandatory applicant interview and identity verification process (payable by the main applicant only), passport/oath/courier and translation costs, and Real Estate Project closing costs, taxes, and legal fees.",
    "Post-approval add-ons for an existing citizen (newborn $5,000, spouse $35,000, other dependant $25,000) are priced separately and not included in this estimate.",
    "The GCS professional fee is separate from the government/programme cost above.",
    "Processing timelines are guidelines only, at the discretion of the Saint Lucia CIU (Citizenship by Investment Unit).",
  ],
};
