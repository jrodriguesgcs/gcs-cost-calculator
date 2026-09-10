// Batch-renders every program to a real PDF, under a handful of variable
// combinations chosen to exercise both the "fits on one page" and "spills
// onto further pages" paths, for manual visual QA of the pagination-control
// feature (see lib/pdf/render-pdf.ts's simulatePagination) after a change to
// the PDF pipeline. Not a test suite (this repo has none) — a repeatable
// batch-render for eyeballing real output, kept as a regression check for
// future changes to lib/pdf/*.
//
// Usage: see scripts/README.md ("Rendering every program for a visual
// pagination check").
//
// Variants per program:
// - "default": every variable at its config default.
// - "route-<value>" (one per option, if the program has a route/track
//   select variable): default values with just that route selected. Route
//   detection mirrors export-review-data.ts's rule — a program's route is
//   its first select variable with no `disabledWhen` of its own.
// - "dense": every boolean variable on, every number variable at its `max`
//   — the densest legal combination for the program, which is what
//   actually pushes a quote's line-item count high enough to spill onto a
//   second page.
// - "dense-<lastRouteValue>" (if the program has a route variable): the
//   dense combination with the route pinned to its last option — in
//   practice the option most likely to add extra line items (e.g. a real
//   estate track), giving the single densest, most page-spilling case per
//   program.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { listPrograms } from "../lib/programs/registry";
import { ProgramConfig, ProgramVariable, ProgramVariableValues } from "../lib/programs/types";
import { renderQuoteToPdf } from "../lib/pdf/render-pdf";

const CLIENT_NAME = "Sample Client";
// __dirname at runtime is the compiled .scripts-build/scripts/ directory
// (see scripts/tsconfig.json's outDir/rootDir) — one level up is already
// .scripts-build/, so this lands at .scripts-build/pagination-check/, not a
// doubled .scripts-build/.scripts-build/.
const OUTPUT_DIR = join(__dirname, "..", "pagination-check");

function defaultValues(config: ProgramConfig): ProgramVariableValues {
  const values: ProgramVariableValues = {};
  for (const variable of config.variables) values[variable.key] = variable.default;
  return values;
}

function findRouteVariable(config: ProgramConfig): ProgramVariable | undefined {
  return config.variables.find((v) => v.type === "select" && !v.disabledWhen);
}

function denseValues(config: ProgramConfig): ProgramVariableValues {
  const values = defaultValues(config);
  for (const variable of config.variables) {
    if (variable.type === "boolean") values[variable.key] = true;
    else if (variable.type === "number" && variable.max !== undefined) values[variable.key] = variable.max;
  }
  return values;
}

interface Variant {
  label: string;
  values: ProgramVariableValues;
}

function buildVariants(config: ProgramConfig): Variant[] {
  const variants: Variant[] = [{ label: "default", values: defaultValues(config) }];
  const routeVariable = findRouteVariable(config);
  const dense = denseValues(config);

  if (routeVariable) {
    for (const option of routeVariable.options ?? []) {
      variants.push({
        label: `route-${option.value}`,
        values: { ...defaultValues(config), [routeVariable.key]: option.value },
      });
    }
    const lastOption = routeVariable.options?.[routeVariable.options.length - 1];
    variants.push({
      label: `dense-${lastOption?.value ?? "route"}`,
      values: { ...dense, [routeVariable.key]: lastOption?.value ?? routeVariable.default },
    });
  } else {
    variants.push({ label: "dense", values: dense });
  }

  return variants;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const programs = listPrograms();
  let rendered = 0;

  for (const { config, calculator } of programs) {
    for (const variant of buildVariants(config)) {
      const quote = calculator.computeQuote(variant.values, CLIENT_NAME);
      const pdf = await renderQuoteToPdf(quote);
      const fileName = `${config.slug}--${variant.label}.pdf`;
      writeFileSync(join(OUTPUT_DIR, fileName), pdf);
      rendered += 1;
      console.log(`Rendered ${fileName} (${pdf.length.toLocaleString()} bytes)`);
    }
  }

  console.log(`\nDone: ${rendered} PDFs written to ${OUTPUT_DIR}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
