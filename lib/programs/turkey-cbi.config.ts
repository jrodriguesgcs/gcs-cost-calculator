import { ProgramConfig } from "./types";

// Display/config data for Turkey CBI, transcribed from
// "Pricing Calculator - Turkey CBI.xlsx" (the "Turkey Calculator" and
// "Fee Reference" tabs) — see turkey-cbi.calculator.ts for the formula
// logic.
//
// Like St Lucia/Vanuatu, this source has no payment-milestone split — one
// flat "Detailed Cost Breakdown" table — so this keeps a single "Programme
// Costs" section plus a separate "GCS Professional Fee" section.
//
// "Main Applicant" is a fixed, non-editable cell in the source (grey fill,
// always 1) — not exposed as a form field, matching the tool's usual
// pattern of always adding "1 +" rather than exposing it.

export const turkeyCbiConfig: ProgramConfig = {
  slug: "turkey-cbi",
  name: "Turkey Citizenship by Investment",
  currency: "USD",
  variables: [
    {
      key: "investmentPath",
      label: "Investment Path",
      type: "select",
      options: [
        { value: "bank-deposit", label: "Bank Deposit (3-Year Hold)" },
        { value: "real-estate", label: "Real Estate" },
      ],
      default: "bank-deposit",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "children",
      label: "Dependent Children (Under 18)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "otherDependants",
      label: "Other Dependants",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "properties",
      label: "Number of Properties",
      type: "select",
      options: [
        { value: "1", label: "1 Property" },
        { value: "2", label: "2 Properties" },
      ],
      default: "1",
      helpText: "Real estate route only — the source schedule doesn't support quoting 3+ properties.",
      disabledWhen: (values) => values.investmentPath !== "real-estate",
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, property acquisition and transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts are to be confirmed at the relevant stage of the process.",
    "Certified translation and notarization costs approximately $80 per page. The number of pages required depends on various factors and is defined for each particular application — the cost is a typical approximation that varies case by case.",
  ],
};
