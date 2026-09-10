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
  name: "St Lucia Citizenship by Investment",
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
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, property acquisition and transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts are to be confirmed at the relevant stage of the process.",
    "Fee schedule source: CIP Saint Lucia official programme site (fees as published, retrieved 17 Aug 2026).",
  ],
};
