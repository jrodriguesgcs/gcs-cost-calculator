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
  name: "Turkey CBI",
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
    "All fees are indicative and subject to change; read alongside the full GCS proposal.",
    "$10,000 of the GCS main-applicant legal & processing fee is due upon acceptance; the remainder is due on engagement.",
    "Certified translation and notarization costs approximately $80 per page. The number of pages required depends on various factors and is defined for each particular application — not priced in this quotation, as it's a typical approximation that varies case by case.",
    "Government fees, real estate agent fees, and property taxes are subject to change; lines marked \"approx.\" are estimates, not fixed tariffs.",
    "The qualifying investment (property purchase or bank deposit) is a capital commitment, not a fee. The bank account opening deposit ($500) is charged once per account, applies only to the bank deposit route, and remains in the client's own account.",
    "Real estate route only: the property valuation report and the title deed processing tax are charged per property and scale with the number of properties selected. Title deed tax (4%) and the agent fee (2%) are currently calculated on a single illustrative property value, not on each property's own value — please confirm the intended figure with GCS directly before quoting a 2-property case.",
    "Real estate route: the qualifying investment figure shown is an illustrative example value, not the client's actual property price — GCS will confirm the real purchase price and recalculate before a final quotation is issued.",
  ],
};
