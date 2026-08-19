// Shared "Family Structure" sentence builder (spec §3).
//
// The main applicant is always present. Every other part is included only
// if its count/flag is truthy, using singular wording for a count of 1 and
// omitting the clause entirely for a count of 0.
//
// e.g. buildFamilyStructureSentence([
//   { kind: "boolean", included: true, label: "Spouse" },
//   { kind: "count", count: 2, singular: "Child", plural: "Children" },
//   { kind: "count", count: 2, singular: "Adult Dependant", plural: "Adult Dependants" },
// ]) === "1 Main Applicant + Spouse + 2 Children + 2 Adult Dependants"

export type FamilyStructurePart =
  | { kind: "boolean"; included: boolean; label: string }
  | { kind: "count"; count: number; singular: string; plural: string };

export function buildFamilyStructureSentence(parts: FamilyStructurePart[]): string {
  const clauses = ["1 Main Applicant"];

  for (const part of parts) {
    if (part.kind === "boolean") {
      if (part.included) clauses.push(part.label);
      continue;
    }
    if (part.count > 0) {
      clauses.push(part.count === 1 ? `1 ${part.singular}` : `${part.count} ${part.plural}`);
    }
  }

  return clauses.join(" + ");
}
