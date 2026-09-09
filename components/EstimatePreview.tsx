import { Quote } from "@/lib/programs/types";
import { formatAmount, formatCurrency } from "@/lib/currency";

export function EstimatePreview({ quote }: { quote: Quote }) {
  return (
    <div className="rounded-none border border-border bg-white p-6">
      <h2 className="font-serif text-xl font-normal text-primary">
        Investment Estimate – {quote.programName}
      </h2>
      <p className="mt-1 text-sm font-medium text-primary">{quote.clientName || "Client name"}</p>
      <p className="mt-1 text-sm text-foreground-secondary">{quote.familyStructure}</p>

      <div className="mt-5 space-y-5">
        {quote.sections.map((section) => (
          <div key={section.key}>
            <div className="flex items-baseline justify-between border-b-2 border-primary pb-1">
              <h3 className="text-sm font-semibold text-primary">{section.title}</h3>
              <span className="text-xs text-accent">{section.timing}</span>
            </div>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {section.lineItems.map((item) => (
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
        <span className="text-lg font-semibold text-primary">
          {quote.grandTotalApproximate ? "~" : ""}
          {formatCurrency(quote.grandTotal, quote.currency)}
        </span>
      </div>

      <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {quote.footnotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
