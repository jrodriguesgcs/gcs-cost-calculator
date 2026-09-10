import { ProgramConfig } from "./types";

// Display/config data for St Kitts & Nevis CBI, transcribed from
// Copy_of_Pricing_Calculator__SKN_CBI.xlsx (the "Calculator" and "Fee
// Reference" tabs) — see skn-cbi.calculator.ts for the formula logic.

export const sknCbiConfig: ProgramConfig = {
  slug: "skn-cbi",
  name: "St Kitts & Nevis Citizenship by Investment",
  currency: "USD",
  variables: [
    {
      key: "investmentPath",
      label: "Investment Path",
      type: "select",
      options: [
        { value: "sisc", label: "Sustainable Island State Contribution" },
        { value: "pbo", label: "Public Benefit Option" },
        { value: "re-condo", label: "Private Real Estate Sales Option — Share or Condominium" },
        { value: "re-home", label: "Private Real Estate Sales Option — Private Home (Sole Ownership)" },
      ],
      default: "sisc",
    },
    {
      key: "spouse",
      label: "Spouse / Partner Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "adults",
      label: "Number of Adult Dependents (18+)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "minors",
      label: "Number of Minor Dependents (under 18)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
  ],
  sections: [
    { key: "beforeSubmission", title: "Before Submission", timing: "Before submission" },
    { key: "afterApproval", title: "After Approval", timing: "After approval" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, property acquisition and transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts are to be confirmed at the relevant stage of the process.",
    "Translation, courier beyond the schedule above, and travel costs are not included above — these are separate third-party fees that may apply and are not quoted here, as they vary case by case.",
  ],
};
