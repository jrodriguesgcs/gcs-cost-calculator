import { ProgramConfig } from "./types";

// Display/config data for Malta MPRP, transcribed from
// investment-estimate-tool-spec.md §3. Formula logic lives in
// malta-mprp.calculator.ts — this file only holds labels, ranges, options,
// section titles/timing, and footnotes.

export const maltaMprpConfig: ProgramConfig = {
  slug: "malta-mprp",
  name: "Malta MPRP",
  currency: "EUR",
  variables: [
    {
      key: "spouse",
      label: "Spouse / partner included",
      type: "boolean",
      default: false,
    },
    {
      key: "minors",
      label: "Dependants under 18 (minors)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "adults",
      label: "Adult dependants (18+)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "realEstateOption",
      label: "Real estate option",
      type: "select",
      options: [
        { value: "purchase", label: "Purchase (min. €375,000)" },
        { value: "rental", label: "Rental (min. €14,000/yr)" },
      ],
      default: "purchase",
    },
  ],
  sections: [
    { key: "signing", title: "Signing & Engagement", timing: "Month 0" },
    { key: "application", title: "Application & Submission", timing: "Months 1–3" },
    { key: "approval", title: "Approval & Investment", timing: "Months 4–9" },
    {
      key: "annual",
      title: "Annual Obligations",
      timing: "Every 12 months from grant, ongoing years 2–5",
    },
  ],
  footnotes: [
    "All fees indicative, subject to change by the Maltese government; read alongside the full proposal.",
    "Government contribution of €7,500 per adult dependant (18+) only; not applicable to minors.",
    "Admin fee €60,000 total, in two instalments (€15,000 in Section 2, €45,000 in Section 3). Admin fee, real estate, government contribution, and donation are all required for eligibility. Real estate: purchase (min. €375,000) or rental (min. €14,000/yr).",
    "Asset requirement: min. €500,000 in assets (of which €150,000 financial) OR min. €650,000 in assets (of which €75,000 financial).",
    "Temporary residence cards in Section 2 are optional; permit renewal every 5 years costs €500 (govt fee).",
    "The 12-month timeline is a guideline only, at the discretion of the relevant authorities.",
  ],
};
