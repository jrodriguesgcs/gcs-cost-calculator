import { useState } from "react";
import { Quote } from "@/lib/programs/types";
import { formatAmount, formatCurrency } from "@/lib/currency";

export function EstimatePreview({ quote }: { quote: Quote }) {
  // Collapsed by default (internal-tool preview only — the generated client
  // PDF always shows every disclaimer unconditionally, see print-template.ts).
  // Deliberately a plain local useState, not lifted to the parent: this
  // component instance is stable across program/route changes in
  // app/page.tsx (same position, no key), so the open/closed state persists
  // exactly as the user left it rather than resetting on every quote change.
  const [showDisclaimers, setShowDisclaimers] = useState(false);
  const disclaimersLabel = quote.investmentRoute
    ? "disclaimers for this program and investment route"
    : "disclaimers for this program";

  return (
    <div className="rounded-none border border-border bg-white p-6">
      <h2 className="font-serif text-xl font-normal text-primary">
        Investment Estimate – {quote.programName}
      </h2>
      <p className="mt-1 text-sm font-medium text-primary">{quote.clientName || "Client name"}</p>
      <p className="mt-1 text-sm text-foreground-secondary">{quote.familyStructure}</p>
      {quote.investmentRoute && (
        <p className="mt-1 text-sm text-foreground-secondary">Investment Route: {quote.investmentRoute}</p>
      )}

      <div className="mt-5 space-y-5">
        {quote.sections.map((section) => (
          <div key={section.key}>
            <div className="flex items-baseline justify-between border-b-2 border-primary pb-1">
              <h3 className="text-sm font-semibold text-primary">{section.title}</h3>
              <span className="text-xs text-accent">{section.timing}</span>
            </div>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {section.lineItems
                  .filter((item) => item.amount !== 0)
                  .map((item) => (
                  <tr key={item.label}>
                    <td className="py-0.5 text-foreground-secondary">{item.label}</td>
                    <td className="py-0.5 text-right text-foreground">
                      {formatAmount(item.amount, quote.currency, item.approximate)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold text-primary">
                  <td className="border-t border-border pt-1">Section total</td>
                  <td className="border-t border-border pt-1 text-right">
                    {section.subtotalApproximate ? "~" : ""}
                    {formatCurrency(section.subtotal, quote.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-y-2 border-primary py-2">
        <span className="text-base text-primary">Grand Total</span>
        <span className="text-lg font-semibold text-primary">{formatCurrency(quote.grandTotal, quote.currency)}</span>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowDisclaimers((current) => !current)}
          aria-expanded={showDisclaimers}
          aria-controls="disclaimers-panel"
          className="text-xs font-medium text-accent hover:underline"
        >
          {showDisclaimers ? `Hide ${disclaimersLabel}` : `Show ${disclaimersLabel}`}
        </button>
        {showDisclaimers && (
          <ul id="disclaimers-panel" className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {quote.footnotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
