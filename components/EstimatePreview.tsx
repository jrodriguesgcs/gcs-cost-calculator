import { Quote } from "@/lib/programs/types";
import { formatAmount, formatCurrency } from "@/lib/currency";

export function EstimatePreview({ quote }: { quote: Quote }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold" style={{ color: "#000957" }}>
        Investment Estimate - {quote.programName}
      </h2>
      <p className="mt-1 text-sm font-medium" style={{ color: "#000957" }}>
        {quote.clientName || "Client name"}
      </p>
      <p className="mt-1 text-sm text-slate-500">{quote.familyStructure}</p>

      <div className="mt-5 space-y-5">
        {quote.sections.map((section) => (
          <div key={section.key}>
            <div className="flex items-baseline justify-between border-b border-slate-300 pb-1">
              <h3 className="text-sm font-semibold" style={{ color: "#000957" }}>
                {section.title}
              </h3>
              <span className="text-xs" style={{ color: "#3F8CFF" }}>
                {section.timing}
              </span>
            </div>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {section.lineItems.map((item) => (
                  <tr key={item.label}>
                    <td className="py-0.5 text-slate-600">{item.label}</td>
                    <td className="py-0.5 text-right text-slate-800">
                      {formatAmount(item.amount, quote.currency, item.approximate)}
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold" style={{ color: "#000957" }}>
                  <td className="border-t border-slate-200 pt-1">Section total</td>
                  <td className="border-t border-slate-200 pt-1 text-right">
                    {section.subtotalApproximate ? "~" : ""}
                    {formatCurrency(section.subtotal, quote.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div
        className="mt-5 flex items-baseline justify-between border-y-2 py-2"
        style={{ borderColor: "#000957" }}
      >
        <span className="text-base" style={{ color: "#000957" }}>
          Grand Total
        </span>
        <span className="text-lg font-semibold" style={{ color: "#000957" }}>
          {formatCurrency(quote.grandTotal, quote.currency)}
        </span>
      </div>

      <ul className="mt-4 list-disc space-y-1 pl-4 text-xs text-slate-400">
        {quote.footnotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}
