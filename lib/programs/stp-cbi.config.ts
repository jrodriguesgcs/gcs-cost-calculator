import { ProgramConfig } from "./types";

// Display/config data for São Tomé and Príncipe CBI, transcribed from
// Copy_of_Pricing_calculator__STP_CBI.xlsx (single "STP CBI calculator"
// tab) — see stp-cbi.calculator.ts for the formula logic.
//
// Unlike the other programs, this source has no investment-path choice
// (a single National Transformation Fund contribution) and its GCS-
// equivalent fee ("Legal and advisory Fee") is bundled directly into the
// "Upon Submission" section by the source itself — kept that way here,
// rather than forcing the separate-GCS-section convention used elsewhere.
//
// A small "Estimated Administrative fees" block (translation, apostille,
// notarization, courier — each a third-party cost quoted as a *range*,
// e.g. "$100-500") is explicitly excluded from the source's own total.
// Confirmed with requester: listed as a footnote (ranges, not priced
// line items), not a section with fabricated fixed amounts.

export const stpCbiConfig: ProgramConfig = {
  slug: "stp-cbi",
  name: "São Tomé and Príncipe CBI",
  currency: "USD",
  variables: [
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "children",
      label: "Dependent Child (up to and including 30)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "parentsGrandparents",
      label: "Dependent Parent or Grandparent (55 and above)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "sponsor",
      label: "Non-Applicant Sponsor Included?",
      type: "boolean",
      default: false,
      helpText: "A financial sponsor, not a family member — not counted toward the passport/ID fee.",
    },
  ],
  sections: [
    { key: "uponSubmission", title: "Upon Submission", timing: "Upon submission" },
    { key: "uponApproval", title: "Upon Approval-in-Principle", timing: "Upon approval-in-principle" },
  ],
  footnotes: [
    "All fees listed are in USD; bank charges are covered by the marketing agent (Global Citizen Solutions).",
    "Additional estimated third-party administrative costs, not included in the total above: translation of documents $100–500, apostille/legalisation of documents $100–500, and notarization of documents $100–500 (all payable before submission); courier fee $200–500 (as needed).",
  ],
};
