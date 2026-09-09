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
  name: "Nauru CBI",
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
    "All fees are indicative and subject to change; based on the official Nauru Citizenship by Investment program fee schedule.",
    "Only dependants aged 16+ attract the $2,000 contribution fee; siblings under 16 are excluded from that fee but still incur the $15,000 sibling contribution (any age) — cumulative, not exclusive, for a 16+ sibling. Source: Nauru Program Office (ecrcp.gov.nr/contribution).",
    "Passport fee applies to the main applicant and all dependants; a non-applicant benefactor does not receive a passport.",
    "Payment schedule per Agent Manual §3.2.1: Payment 1 due before submission; Payment 2 due within 30 days of approval in principle.",
    "The GCS professional fee is separate from the government payment schedule above.",
    "Contribution amount reflects the current limited-time discount (valid 3 Feb – 31 Dec 2026); subject to change once the promotional period ends.",
    "Translation, courier, and travel costs are not included above and are typically arranged and paid separately by the applicant.",
    "The Grand Total covers all three sections shown (Before Submission, After Approval, and the GCS Professional Fee) — nothing is held back or excluded.",
  ],
};
