import { maltaMprpCalculator } from "./malta-mprp.calculator";
import { maltaMprpConfig } from "./malta-mprp.config";
import { ProgramDefinition } from "./types";

// Extension point: to add a new program, create `<slug>.config.ts` +
// `<slug>.calculator.ts` following the malta-mprp.* pair, then add one
// entry here. Nothing else in the app needs to change.
const programs: ProgramDefinition[] = [
  { config: maltaMprpConfig, calculator: maltaMprpCalculator },
];

export const programRegistry = new Map<string, ProgramDefinition>(
  programs.map((program) => [program.config.slug, program]),
);

export function listPrograms(): ProgramDefinition[] {
  return programs;
}

export function getProgram(slug: string): ProgramDefinition | undefined {
  return programRegistry.get(slug);
}

/** Program name, hyphenated for use in the output filename (spec §2). */
export function slugifyProgramName(name: string): string {
  return name.trim().replace(/\s+/g, "-");
}
