import { ProgramConfig } from "./types";

// Display/config data for St Kitts & Nevis CBI, transcribed from
// Copy_of_Pricing_Calculator__SKN_CBI.xlsx (the "Calculator" and "Fee
// Reference" tabs) — see skn-cbi.calculator.ts for the formula logic.

export const sknCbiConfig: ProgramConfig = {
  slug: "skn-cbi",
  name: "St Kitts & Nevis CBI",
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
    "All fees are indicative and subject to change by the St Kitts & Nevis government; read alongside the full GCS proposal.",
    "Real estate government fees and escrow are per the April 2026 fee schedule and are identical for both Real Estate options; only the minimum qualifying investment differs ($325,000 share/condominium vs. $600,000 private home in sole ownership).",
    "The service provider fee is charged on the Real Estate path even for a solo applicant, unlike the Sustainable Island State Contribution or Public Benefit Option paths, where it's waived for a solo applicant.",
    "Minors are not charged a CBI due diligence fee, per the source schedule.",
    "The source schedule shows a $500 post-approval main-applicant bank due diligence fee for a solo applicant vs. $550 for family size 2+ (across all three paths) — replicated as given from the source.",
    "Bank due diligence fee for minor dependants ($150) is replicated exactly as it appears in the source, despite a source footnote referencing a different age band.",
    "Under the Sustainable Island State Contribution path, there's no separate government fee line — it's folded directly into the contribution amount shown above, not omitted.",
    "Translation, courier beyond the schedule above, and travel costs are not included and are typically arranged separately.",
    "Fee schedule source: Lawrence and Associates Ltd. Investment Options Fee Schedule, April 2026.",
    "The GCS professional fee is separate from the government/due-diligence payment schedule above.",
  ],
};
