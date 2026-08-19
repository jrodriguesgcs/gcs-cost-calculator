// Currency is always driven by the program config's `currency` field — never
// hardcoded to €/$, since programs are quoted in different currencies.

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number | null, currency: string, approximate?: boolean): string {
  if (amount === null) return "TBC";
  const formatted = formatCurrency(amount, currency);
  return approximate ? `~${formatted}` : formatted;
}
