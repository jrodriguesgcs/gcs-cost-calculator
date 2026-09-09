import { ProgramConfig } from "./types";

// Display/config data for Antigua & Barbuda CBI, transcribed from
// "Pricing Calculator - A&B CBI.xlsx" (the "A&B CBI Calculator" and "Fee
// Reference" tabs) — see ab-cbi.calculator.ts for the formula logic.
//
// Like St Lucia/Vanuatu, this source has no payment-milestone split — one
// flat "Detailed Cost Breakdown" table — so this keeps a single "Programme
// Costs" section plus a separate "GCS Professional Fee" section.
//
// "Principal applicant" is a fixed, non-editable cell in the source (always
// 1) — not exposed as a form field, matching the tool's usual pattern.
//
// Unlike every other program in this tool, the source workbook has NO
// client-facing notes/footnotes section at all (confirmed on the full
// multi-tab xlsx, not a partial-export gap) — its own "Source/Note" column
// is explicitly labeled "internal reference — not to include in the
// calculator". `footnotes` below is limited to structural facts this tool
// itself already states for every program, not anything invented about
// A&B's own rates/eligibility.

export const abCbiConfig: ProgramConfig = {
  slug: "ab-cbi",
  name: "Antigua & Barbuda CBI",
  currency: "USD",
  variables: [
    {
      key: "investmentPath",
      label: "Investment Path",
      type: "select",
      options: [
        { value: "ndf", label: "National Development Fund (NDF)" },
        { value: "uwi", label: "University of the West Indies (UWI) Fund" },
        { value: "re-sole", label: "Real Estate — Sole Ownership" },
        { value: "re-share", label: "Real Estate — Share Ownership" },
      ],
      default: "ndf",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "under12",
      label: "Dependants Under 12",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "age12to17",
      label: "Dependants Aged 12–17",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "age18Plus",
      label: "Dependants Aged 18 and Over",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "siblings12to17",
      label: "Dependent Siblings Aged 12–17",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "siblings18Plus",
      label: "Dependent Siblings Aged 18 and Over",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "parents",
      label: "Dependent Parents",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "benefactors",
      label: "Benefactors (Due Diligence Only — Not Counted in Family Size)",
      type: "number",
      min: 0,
      max: 5,
      default: 0,
    },
    {
      key: "propertyPrice",
      label: "Property Price (USD)",
      type: "number",
      min: 300_000,
      max: 10_000_000,
      default: 300_000,
      helpText: "Real estate paths only. Defaults to the $300,000 minimum — enter the actual purchase price for a live deal.",
      disabledWhen: (values) => values.investmentPath !== "re-sole" && values.investmentPath !== "re-share",
    },
    {
      key: "localAgentFee",
      label: "Local Agent Fee (USD)",
      type: "number",
      min: 0,
      max: 100_000,
      default: 0,
      helpText: "Negotiated per deal — GCS's fee schedule sets no default; historical deals have ranged $0–$30,000.",
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "All fees are indicative and subject to change by the Antigua & Barbuda government; read alongside the full GCS proposal.",
    "Local agent fee is negotiated per deal and entered manually for this quote — GCS's fee schedule sets no default rate for it; historical deals have ranged from $0 to $30,000.",
    "The virtual interview fee is shown as approximate — GCS's own fee schedule doesn't yet confirm whether it's charged once per application or once per person; the figure above assumes once per application.",
    "Translation, notarization beyond the schedule above, and travel costs are not included and are typically arranged separately.",
    "Processing timelines are guidelines only, at the discretion of the Antigua & Barbuda CIU (Citizenship by Investment Unit).",
    "The GCS professional fee is separate from the government/due-diligence payment schedule above.",
  ],
};
