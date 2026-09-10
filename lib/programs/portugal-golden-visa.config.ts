import { ProgramConfig } from "./types";

// Display/config data for the Portugal Golden Visa, transcribed from
// "Cost Calculator - Portugal GV.xlsx" (the "Portugal GV Calculator" and
// "Fee Reference" tabs) — see portugal-golden-visa.calculator.ts for the
// formula logic.
//
// Unlike the other new programs, this source DOES have a real
// payment-milestone structure — an Application Stage, then two
// government-fee-only renewal stages (Year 2, Year 4) — so it gets 3
// sections rather than the "Programme Costs + GCS Fee" fallback. The GCS
// consultancy/legal fee stays bundled inside the Application Stage section
// (matching the source's own subtotal breakdown), not split into its own
// section.

export const portugalGoldenVisaConfig: ProgramConfig = {
  slug: "portugal-golden-visa",
  name: "Portugal Golden Visa",
  currency: "EUR",
  variables: [
    {
      key: "investmentRoute",
      label: "Investment Route",
      type: "select",
      options: [
        { value: "fund", label: "Investment Fund (min. €500,000)" },
        { value: "cultural-donation", label: "Cultural Donation (min. €250,000)" },
        { value: "cultural-donation-low-density", label: "Cultural Donation — Low-Density Area (min. €200,000)" },
      ],
      default: "cultural-donation",
    },
    {
      key: "spouse",
      label: "Spouse / Partner Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "otherAdultDependents",
      label: "Other Adult Dependents (18+)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "childDependents",
      label: "Child Dependents (Under 18)",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
  ],
  sections: [
    { key: "applicationStage", title: "Application Stage", timing: "On application" },
    { key: "renewal1", title: "1st Renewal", timing: "Year 2 — government fees only" },
    { key: "renewal2", title: "2nd Renewal", timing: "Year 4 — government fees only" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts will be confirmed at the relevant stage of the process.",
    "Fund subscription, management, and performance fees are excluded — not supplied in the source fee schedule; they're fund-specific and must be added per manager if the Investment Fund route is chosen.",
    "Additional expenses for translations, apostilles, travel, and Portuguese tax on investment returns are unique per application and are not priced in this quotation.",
    "AIMA revises government application fees annually, typically in March/April — figures above reflect the fee schedule applied in 2026.",
    "Fiscal representation is an ongoing annual service, not a one-time cost — the €350 line above covers Year 1 only; each subsequent year may be quoted separately.",
  ],
};
