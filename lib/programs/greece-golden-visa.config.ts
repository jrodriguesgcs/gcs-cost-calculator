import { ProgramConfig } from "./types";

// Display/config data for Greece Golden Visa, transcribed from
// Greece_Golden_Visa__Cost_Calculator.html's markup (fee-breakdown
// columns) and <script> (recalc()) — see greece-golden-visa.calculator.ts
// for the formula logic.
//
// Two investment tracks, like Italy: Track A (Tangible, a real-estate
// purchase) and Track B (Intangible, capital/funds/bonds/shares). The
// source script itself excludes the property price/investment principal
// from its own "total outlay" figure — this tool deliberately does not
// follow that: the Grand Total always sums every section shown on the
// page, including the investment principal and the Permit Renewal
// section, so a client never has to wonder what's missing from the total.

export const greeceGoldenVisaConfig: ProgramConfig = {
  slug: "greece-golden-visa",
  name: "Greece Golden Visa",
  currency: "EUR",
  variables: [
    {
      key: "track",
      label: "Investment track",
      type: "select",
      options: [
        { value: "tangible", label: "Track A — Tangible Investment (Real Estate)" },
        { value: "intangible", label: "Track B — Intangible Investment (Capital, Funds, Bonds, Shares)" },
      ],
      default: "tangible",
    },
    {
      key: "spouse",
      label: "Spouse / partner included",
      type: "boolean",
      default: false,
    },
    {
      key: "minors",
      label: "Minor dependants (under 18)",
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
      key: "parents",
      label: "Dependent parents included",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
      helpText: "No age limit.",
    },
    {
      key: "propertyTier",
      label: "Property investment tier",
      type: "select",
      options: [
        { value: "250000", label: "€250,000 — Conversion / Heritage properties" },
        { value: "400000", label: "€400,000 — Other regions of Greece" },
        { value: "800000", label: "€800,000 — Athens, Thessaloniki, Mykonos, Santorini & islands >3,100" },
      ],
      default: "250000",
      disabledWhen: (values) => values.track === "intangible",
    },
    {
      key: "investmentTier",
      label: "Investment type & amount",
      type: "select",
      options: [
        { value: "350000", label: "€350,000 — Mutual funds / AIF units (Greek assets)" },
        { value: "500000", label: "€500,000 — Capital contribution / Bank deposit / Govt bonds / Closed-end funds" },
        { value: "800000", label: "€800,000 — Listed shares or corporate bonds (Greek regulated markets)" },
      ],
      default: "350000",
      disabledWhen: (values) => values.track === "tangible",
    },
  ],
  sections: [
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Month 0 — on engagement" },
    // Section 2's title is overridden per-track in the calculator
    // ("Property Purchase & Taxes" vs. "Capital Investment").
    { key: "investment", title: "Investment", timing: "Months 1–3 — application submission" },
    { key: "applicationBalance", title: "Application Fees & GCS Balance", timing: "Months 2–5 — processing & biometrics" },
    { key: "renewal", title: "Permit Renewal", timing: "Every 5 years" },
  ],
  footnotes: [
    "All fees are indicative and subject to change by the Greek government. The 4–6+ month timeline is a guideline only, at the discretion of the Greek authorities; read alongside the full GCS proposal.",
    "The GCS professional fee is split into a €7,000 deposit (due on engagement, Section 1) and the balance (Section 3) — each balance component above is itemized individually; the deposit already paid is subtracted from the balance so the two sections never double-count it.",
    "Government application fee: €2,016 main applicant, €166 per adult dependant, €16 per minor dependant, plus ~€200 health insurance per applicant — repeated at each 5-year renewal. Property taxes (transfer tax 3.09%, notary/stamp duty 1.5%, registration 0.77%) apply to the tangible track only, estimated on the tier selected.",
    "The property purchase price / investment principal shown above buys an asset the applicant retains (or remains invested) — unlike every other line, it isn't spent on a programme cost, even though it's included in the Grand Total.",
    "Short-term rentals (e.g. Airbnb) are prohibited for Golden Visa holders — violations may cancel residency and incur a €50,000 fine. Dependent parents may be included with no age limit; unmarried partners are ineligible (civil unions recognised); same-sex married spouses eligible since February 2024.",
    "Greek citizenship may be available after 7 years of physical residence (min. 183 days/year), subject to B1 Greek language proficiency and integration requirements; citizenship should be consulted separately.",
  ],
};
