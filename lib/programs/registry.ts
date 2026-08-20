import { italyGoldenVisaCalculator } from "./italy-golden-visa.calculator";
import { italyGoldenVisaConfig } from "./italy-golden-visa.config";
import { maltaMprpCalculator } from "./malta-mprp.calculator";
import { maltaMprpConfig } from "./malta-mprp.config";
import { nauruCbiCalculator } from "./nauru-cbi.calculator";
import { nauruCbiConfig } from "./nauru-cbi.config";
import { ProgramDefinition } from "./types";

// Extension point: to add a new program, create `<slug>.config.ts` +
// `<slug>.calculator.ts` following the malta-mprp.* pair, then add one
// entry here. Nothing else in the app needs to change.
const programs: ProgramDefinition[] = [
  { config: maltaMprpConfig, calculator: maltaMprpCalculator },
  { config: italyGoldenVisaConfig, calculator: italyGoldenVisaCalculator },
  { config: nauruCbiConfig, calculator: nauruCbiCalculator },
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
