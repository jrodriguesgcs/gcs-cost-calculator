"use client";

import { useMemo, useRef, useState } from "react";
import { listPrograms } from "@/lib/programs/registry";
import { ProgramVariable, ProgramVariableValues } from "@/lib/programs/types";
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
  const [clientNameError, setClientNameError] = useState<string | null>(null);
  const clientNameInputRef = useRef<HTMLInputElement>(null);

  const program = programs.find((p) => p.config.slug === programSlug) ?? programs[0];

  const quote = useMemo(
    () => program.calculator.computeQuote(variables, clientName.trim() || "Client Name"),
    [program, variables, clientName],
  );

  function handleProgramChange(nextSlug: string) {
    setProgramSlug(nextSlug);
    setVariables(defaultVariableValues(nextSlug));
  }

  function resetValueFor(variable: ProgramVariable): boolean | number | string {
    if (variable.type === "boolean") return false;
    if (variable.type === "number") return 0;
    return variable.default;
  }

  function updateVariable(key: string, value: boolean | number | string) {
    setVariables((prev) => {
      const next = { ...prev, [key]: value };
      // Cross-field rule: a variable disabled by the new values resets to
      // its inert value (e.g. Italy Golden Visa's minors, once spouse is
      // toggled off) rather than keeping a stale, now-inapplicable number.
      for (const variable of program.config.variables) {
        if (variable.disabledWhen?.(next)) {
          next[variable.key] = resetValueFor(variable);
        }
      }
      return next;
    });
  }

  async function handleGeneratePdf() {
    const trimmedName = clientName.trim();
    if (!trimmedName) {
      // Web Interface Guidelines: errors inline next to fields, focus the
      // first (only) invalid field on submit — rather than pre-emptively
      // disabling the button, which the guidelines also call out against
      // ("submit button stays enabled until request starts").
      setClientNameError("Enter a client name to generate the PDF.");
      clientNameInputRef.current?.focus();
      return;
    }
    setClientNameError(null);
    setError(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programSlug, clientName: trimmedName, variables }),
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

  const canGenerate = !isGenerating;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-none focus:border focus:border-border focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:outline-none focus:ring-[3px] focus:ring-accent/35"
      >
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start gap-2">
            {/* GCS Symbol lockup (gcs-design-system §3.10: icon-only mark, no wordmark —
                the right lockup for a compact app-header icon; real 70x71 aspect ratio,
                not guessed). Blue variant per the design system's light-background rule. */}
            <img src="/letterhead/GCS-Symbol-Blue.svg" alt="Global Citizen Solutions" width={36} height={36.5} />
            <h1 className="font-serif text-3xl font-normal text-foreground">Cost Calculator</h1>
          </div>
          <p className="mt-1 text-sm text-foreground-secondary">
            Internal Global Citizen Solutions tool
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-none border border-border bg-white p-6">
                <label htmlFor="program-select" className="block text-sm font-medium text-foreground-secondary">
                  Program of Interest
                </label>
                <select
                  id="program-select"
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

                <label htmlFor="client-name" className="mt-4 block text-sm font-medium text-foreground-secondary">
                  Client Name
                </label>
                <input
                  id="client-name"
                  ref={clientNameInputRef}
                  type="text"
                  value={clientName}
                  onChange={(event) => {
                    setClientName(event.target.value);
                    if (clientNameError && event.target.value.trim()) setClientNameError(null);
                  }}
                  placeholder="e.g. John Smith"
                  aria-invalid={clientNameError ? "true" : "false"}
                  aria-describedby={clientNameError ? "client-name-error" : undefined}
                  className={`mt-1 w-full rounded-none border px-4 py-3 text-sm focus:outline-none focus:ring-[3px] ${
                    clientNameError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/35"
                      : "border-border focus:border-ring focus:ring-accent/35"
                  }`}
                />
                {clientNameError && (
                  <p id="client-name-error" className="mt-1 text-xs text-destructive">
                    {clientNameError}
                  </p>
                )}
              </div>

              <div className="rounded-none border border-border bg-white p-6">
                <h2 className="text-sm font-medium text-foreground-secondary">Client & Family Details</h2>
                <div className="mt-2 divide-y divide-border">
                  {program.config.variables.map((variable) => (
                    <VariableField
                      key={variable.key}
                      variable={variable}
                      value={variables[variable.key]}
                      onChange={(value) => updateVariable(variable.key, value)}
                      disabled={variable.disabledWhen?.(variables) ?? false}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={!canGenerate}
                aria-busy={isGenerating}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary px-4 text-sm font-medium uppercase tracking-[0.02em] text-white hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    />
                    Generating…
                  </>
                ) : (
                  "Generate PDF"
                )}
              </button>
              {error && (
                <p className="text-sm text-destructive" aria-live="polite">
                  {error}
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium text-foreground-secondary">Live Preview</h2>
              <EstimatePreview quote={quote} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
