import { ProgramConfig } from "./types";

// Display/config data for Latvia Golden Visa, transcribed from
// Latvia_Quotation_calculator.xlsx — four investment-track tabs
// ("Business Inv. 50K", "Business Inv. 100K", "Real estate", "Bank
// deposit") plus a fifth "Fees - Processing Options" tab that isn't a
// track at all — it's the source for the speed-tiered government-fee
// footnotes below. See latvia-golden-visa.calculator.ts for the formula
// logic and the row-boundary rule used to split each track's rows into
// "Programme Costs" vs. "GCS Professional Fee".
//
// Like St Lucia/Vanuatu, this source has no payment-milestone split — one
// flat cost table per track — so one "Programme Costs" section plus a
// separate GCS Professional Fee section.

export const latviaGoldenVisaConfig: ProgramConfig = {
  slug: "latvia-golden-visa",
  name: "Latvia Golden Visa",
  currency: "EUR",
  variables: [
    {
      key: "investmentTrack",
      label: "Investment Track",
      type: "select",
      options: [
        { value: "business-50k", label: "Business Investment — €50,000" },
        { value: "business-100k", label: "Business Investment — €100,000" },
        { value: "real-estate", label: "Real Estate Investment — €250,000" },
        { value: "bank-deposit", label: "Bank Deposit — €280,000" },
      ],
      default: "business-50k",
    },
    {
      key: "spouse",
      label: "Spouse Included?",
      type: "boolean",
      default: false,
    },
    {
      key: "children",
      label: "Dependent Children",
      type: "number",
      min: 0,
      max: 10,
      default: 0,
    },
    {
      key: "addressDeclaration",
      label: "Annual Address Declaration Service (Optional)",
      type: "boolean",
      default: false,
      helpText: "Not available for the Real Estate Investment track.",
      disabledWhen: (values) => values.investmentTrack === "real-estate",
    },
  ],
  sections: [
    { key: "programmeCosts", title: "Programme Costs", timing: "On application" },
    { key: "gcsFee", title: "GCS Professional Fee", timing: "Due on engagement" },
  ],
  footnotes: [
    "This quotation is provided for indicative purposes only, based on applicable fees and conditions on the date of issue. It does not constitute a binding offer or contract, nor does it guarantee the final costs of the application or investment.",
    "Government fees, transaction costs, applicable taxes, and other third-party charges are subject to change. Final amounts will be confirmed at the relevant stage of the process.",
    "The D-visa applies to nationals of countries requiring a visa to enter Latvia. Upon approval, if a visa is required for entry, a national long-stay (D) visa is issued to allow the applicant to obtain the residence permit card — the D-visa itself carries no separate government fee beyond the residence-permit costs already listed above.",
    "Document preparation (legalisation and translation, where applicable) is included above as a flat, approximate third-party cost estimation per application.",
    "The Residence permit application is paid when the RP application is submitted. The faster PMLP (authorities) must review the file, the higher the state fee. Standard €160 (30 days) · Expedited €280 (10 working days) · Urgent €560 (5 working days).",
    "The Residence permit registration is paid after approval, when the permit is registered in Latvia (biometrics submitted). Same speed choice applies again. Standard €75 (30 days) · Expedited €140 (10 working days) · Urgent €290 (5 working days).",
    "The Residence permit card issuance is paid for production of the physical Residence Permit card. Same speed choice applies again. Standard €45 (10 working days) · Urgent €80 (2 working days).",
    "Expedited and urgent processing options are available to applicants of low-risk nationalities only, listed by Latvian authorities.",
    "Bank wire and currency-conversion costs for transferring investment funds into Latvia are not included above and vary by originating bank and currency.",
    "Processing timelines are guidelines only, at the discretion of the Latvian authorities (PMLP).",
  ],
};
