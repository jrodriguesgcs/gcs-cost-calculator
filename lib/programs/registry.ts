import { italyGoldenVisaCalculator } from "./italy-golden-visa.calculator";
import { italyGoldenVisaConfig } from "./italy-golden-visa.config";
import { maltaMprpCalculator } from "./malta-mprp.calculator";
import { maltaMprpConfig } from "./malta-mprp.config";
import { nauruCbiCalculator } from "./nauru-cbi.calculator";
import { nauruCbiConfig } from "./nauru-cbi.config";
import { sknCbiCalculator } from "./skn-cbi.calculator";
import { sknCbiConfig } from "./skn-cbi.config";
import { stLuciaCbiCalculator } from "./st-lucia-cbi.calculator";
import { stLuciaCbiConfig } from "./st-lucia-cbi.config";
import { stpCbiCalculator } from "./stp-cbi.calculator";
import { stpCbiConfig } from "./stp-cbi.config";
import { ProgramDefinition } from "./types";

// Extension point: to add a new program, create `<slug>.config.ts` +
// `<slug>.calculator.ts` following the malta-mprp.* pair, then add one
// entry here. Nothing else in the app needs to change.
const programs: ProgramDefinition[] = [
  { config: maltaMprpConfig, calculator: maltaMprpCalculator },
  { config: italyGoldenVisaConfig, calculator: italyGoldenVisaCalculator },
  { config: nauruCbiConfig, calculator: nauruCbiCalculator },
  { config: sknCbiConfig, calculator: sknCbiCalculator },
  { config: stLuciaCbiConfig, calculator: stLuciaCbiCalculator },
  { config: stpCbiConfig, calculator: stpCbiCalculator },
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
