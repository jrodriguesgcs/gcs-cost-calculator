import { ProgramConfig } from "./types";

// Display/config data for Italy Golden Visa, transcribed from
// Italy_Golden_Visa_Calculator_2.html's HTML (fee-breakdown columns,
// lines 331–421) and <script> (lines 447–548) — see italy-golden-visa
// .calculator.ts for the formula logic.

export const italyGoldenVisaConfig: ProgramConfig = {
  slug: "italy-golden-visa",
  name: "Italy Golden Visa",
  currency: "EUR",
  variables: [
    {
      key: "investmentTrack",
      label: "Investment track",
      type: "select",
      options: [
        { value: "startup", label: "Track A — Innovative Startup (min. €250,000)" },
        { value: "equity", label: "Track B — Company Equity (min. €500,000)" },
        { value: "bonds", label: "Track C — Government Bonds (min. €2,000,000)" },
        { value: "donation", label: "Track D — Philanthropic Donation (min. €1,000,000)" },
      ],
      default: "startup",
    },
    {
      key: "spouse",
      label: "Spouse / partner included",
      type: "boolean",
      default: false,
    },
    {
      key: "minors",
      label: "Minor children under 14 on application",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
      helpText: "Requires a spouse/partner on the application.",
      // Confirmed with requester: minors are only eligible alongside a
      // spouse on the application — the source calculator's own comment
      // ("minors not eligible without spouse") is enforced here, not just
      // silently absorbed into the fee math.
      disabledWhen: (values) => !values.spouse,
    },
    {
      key: "adults",
      label: "Adult dependants 14+ (parents 65+, older children)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
  ],
  sections: [
    { key: "engagement", title: "Engagement & Nulla Osta Application", timing: "Months 0–1 — on engagement" },
    { key: "submission", title: "Nulla Osta Submission & Investor Visa", timing: "Months 1–2 — on submission" },
    { key: "permit", title: "Residence Permit", timing: "Within 8 working days of entering Italy" },
    { key: "investment", title: "Execute Investment", timing: "Within 90 days of entering Italy" },
    { key: "renewal", title: "Permit Renewal", timing: "After 2 years — renewable for 3 years" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, property acquisition and transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts are to be confirmed at the relevant stage of the process.",
    "Processing timelines are guidelines only, at the discretion of the Italian authorities.",
    "No additional investment required for family members. Family apply for a reunification visa after the main applicant's Investor Visa is issued.",
    "Investment must be executed within 90 days of entry and maintained for the permit duration. Nulla Osta is valid for 6 months from issue.",
    "Residence permit fee (~€96 per applicant) applies to each family member; biometric attendance at the Questura is mandatory.",
    "Programme currently suspended for Russian and Belarusian nationals and dual passport holders.",
    "Legalisation, translations, and courier costs (~€700) vary by how many documents need certifying and where they originate — the figure above is a typical estimate, not a fixed fee, which is why the Grand Total itself is shown as approximate.",
  ],
};
