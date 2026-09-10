import { ProgramConfig } from "./types";

// Display/config data for Nauru CBI, transcribed from
// Pricing_calculator_Naoero_Nauru_CBI.xlsx (the "Nauru Calculator" and
// "Pricing" tabs) — see nauru-cbi.calculator.ts for the formula logic.
//
// No "Scenario" select here: the source has a manual Single/Family
// dropdown that picks the bank-fee tier independently of the actual
// dependant counts entered (so it can disagree with them). Confirmed with
// requester: removed — the calculator auto-derives the tier from the real
// dependant counts instead.

export const nauruCbiConfig: ProgramConfig = {
  slug: "nauru-cbi",
  name: "Nauru Citizenship by Investment",
  currency: "USD",
  variables: [
    {
      key: "minorsNonSibling",
      label: "Dependants under 16 (excluding siblings)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "adultsNonSibling",
      label: "Dependants aged 16+ (excluding siblings)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "siblingMinors",
      label: "Sibling dependants under 16",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "siblingAdults",
      label: "Sibling dependants aged 16+",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "benefactor",
      label: "Non-applicant benefactor included",
      type: "boolean",
      default: false,
      helpText: "A financial sponsor, not a family member — no passport or contribution fee.",
    },
  ],
  sections: [
    { key: "beforeSubmission", title: "Before Submission", timing: "Before submission" },
    { key: "approvalPayment", title: "After Approval", timing: "After approval — within 30 days of approval in principle" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts will be confirmed at the relevant stage of the process.",
    "Contribution amount reflects the current limited-time Nauru's Iruwa Initiative promotion, that reduces the minimum economic contribution for the Economic and Climate Resilience Citizenship Program (NECRCP) to $90,000 for a principal applicant through December 31, 2026.",
    "Translation, courier, and travel costs are not included above — these are separate third-party fees that may apply and are not quoted here, as they vary case by case.",
  ],
};
