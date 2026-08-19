// Shared types for the program config/calculator extension point.
//
// A "program" (e.g. Malta MPRP) is added by dropping in one config file
// (display data: variables, section titles/timing, footnotes) and one
// calculator module (the fee formulas + family-structure logic), then
// registering both in `registry.ts`. Nothing else in the app changes.

export type VariableType = "boolean" | "number" | "select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ProgramVariable {
  key: string;
  label: string;
  type: VariableType;
  /** number type only */
  min?: number;
  /** number type only */
  max?: number;
  /** select type only */
  options?: SelectOption[];
  default: boolean | number | string;
  /** Short note shown under the field in the form, if useful context. */
  helpText?: string;
  /**
   * Cross-field rule: when this returns true (evaluated against the form's
   * current values), the field is disabled in the UI and its value is
   * reset. e.g. Italy Golden Visa's `minors` depends on `spouse`.
   */
  disabledWhen?: (values: ProgramVariableValues) => boolean;
}

export interface ProgramSectionMeta {
  key: string;
  title: string;
  /** e.g. "Month 0", "Months 1–3", "Every 12 months, ongoing years 2–5" */
  timing: string;
}

export interface ProgramConfig {
  slug: string;
  name: string;
  /** ISO 4217 currency code, e.g. "EUR", "USD". Never hardcode a symbol. */
  currency: string;
  variables: ProgramVariable[];
  sections: ProgramSectionMeta[];
  footnotes: string[];
}

/** Values collected from the dynamic variable form, keyed by ProgramVariable.key */
export type ProgramVariableValues = Record<string, boolean | number | string>;

export interface QuoteLineItem {
  label: string;
  /** null = TBC, no fixed figure yet */
  amount: number | null;
  /** Prefix the rendered amount with "~" (figure is approximate/indicative) */
  approximate?: boolean;
}

export interface QuoteSection {
  key: string;
  title: string;
  timing: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  subtotalApproximate?: boolean;
}

export interface Quote {
  programName: string;
  programSlug: string;
  currency: string;
  clientName: string;
  familyStructure: string;
  sections: QuoteSection[];
  /** One-time grand total (per spec: Section 1 + Section 2 + Section 3, real estate included, annual obligations excluded) */
  grandTotal: number;
  footnotes: string[];
}

export interface ProgramCalculator {
  computeQuote(variables: ProgramVariableValues, clientName: string): Quote;
}

export interface ProgramDefinition {
  config: ProgramConfig;
  calculator: ProgramCalculator;
}
