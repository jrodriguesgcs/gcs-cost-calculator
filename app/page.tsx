"use client";

import { useMemo, useState } from "react";
import { listPrograms } from "@/lib/programs/registry";
import { ProgramVariableValues } from "@/lib/programs/types";
import { VariableField } from "@/components/VariableField";
import { EstimatePreview } from "@/components/EstimatePreview";

const programs = listPrograms();

function defaultVariableValues(programSlug: string): ProgramVariableValues {
  const program = programs.find((p) => p.config.slug === programSlug);
  if (!program) return {};
  const values: ProgramVariableValues = {};
  for (const variable of program.config.variables) {
    values[variable.key] = variable.default;
  }
  return values;
}

export default function Home() {
  const [programSlug, setProgramSlug] = useState(programs[0].config.slug);
  const [clientName, setClientName] = useState("");
  const [variables, setVariables] = useState<ProgramVariableValues>(() =>
    defaultVariableValues(programs[0].config.slug),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const program = programs.find((p) => p.config.slug === programSlug) ?? programs[0];

  const quote = useMemo(
    () => program.calculator.computeQuote(variables, clientName.trim() || "Client Name"),
    [program, variables, clientName],
  );

  function handleProgramChange(nextSlug: string) {
    setProgramSlug(nextSlug);
    setVariables(defaultVariableValues(nextSlug));
  }

  function updateVariable(key: string, value: boolean | number | string) {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGeneratePdf() {
    setError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programSlug, clientName: clientName.trim(), variables }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "PDF generation failed.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? "GCS_Estimate.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  const canGenerate = clientName.trim().length > 0 && !isGenerating;

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-3xl font-normal text-foreground">
          Investment Estimate Generator
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Internal tool — generate a branded, one-page investment estimate PDF for a
          prospective client.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-none border border-border bg-white p-6">
              <label className="block text-sm font-medium text-foreground-secondary">
                Program of Interest
              </label>
              <select
                value={programSlug}
                onChange={(event) => handleProgramChange(event.target.value)}
                className="mt-1 w-full rounded-none border border-border px-4 py-3 text-sm focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-accent/35"
              >
                {programs.map((p) => (
                  <option key={p.config.slug} value={p.config.slug}>
                    {p.config.name}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-sm font-medium text-foreground-secondary">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="e.g. John Smith"
                className="mt-1 w-full rounded-none border border-border px-4 py-3 text-sm focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-accent/35"
              />
            </div>

            <div className="rounded-none border border-border bg-white p-6">
              <h2 className="text-sm font-medium text-foreground-secondary">Variables</h2>
              <div className="mt-2 divide-y divide-border">
                {program.config.variables.map((variable) => (
                  <VariableField
                    key={variable.key}
                    variable={variable}
                    value={variables[variable.key]}
                    onChange={(value) => updateVariable(variable.key, value)}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={!canGenerate}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary px-4 text-sm font-medium uppercase tracking-[0.02em] text-white hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating…
                </>
              ) : (
                "Generate PDF"
              )}
            </button>
            {!clientName.trim() && (
              <p className="text-xs text-muted-foreground">
                Enter a client name to enable PDF generation.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-foreground-secondary">Live Preview</h2>
            <EstimatePreview quote={quote} />
          </div>
        </div>
      </div>
    </div>
  );
}
