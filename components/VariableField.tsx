import { ProgramVariable } from "@/lib/programs/types";

interface Props {
  variable: ProgramVariable;
  value: boolean | number | string;
  onChange: (value: boolean | number | string) => void;
}

export function VariableField({ variable, value, onChange }: Props) {
  if (variable.type === "boolean") {
    const included = Boolean(value);
    return (
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-slate-700">{variable.label}</label>
        <div className="inline-flex rounded-md border border-slate-300 text-sm">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1 rounded-l-md ${
              included ? "bg-[#000957] text-white" : "bg-white text-slate-600"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1 rounded-r-md ${
              !included ? "bg-[#000957] text-white" : "bg-white text-slate-600"
            }`}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  if (variable.type === "number") {
    const numericValue = Number(value ?? 0);
    return (
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-slate-700">{variable.label}</label>
        <input
          type="number"
          min={variable.min}
          max={variable.max}
          value={numericValue}
          onChange={(event) => {
            const next = Number(event.target.value);
            const clamped = Math.min(
              variable.max ?? Infinity,
              Math.max(variable.min ?? 0, Number.isNaN(next) ? 0 : next),
            );
            onChange(clamped);
          }}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
        />
      </div>
    );
  }

  // select
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-slate-700">{variable.label}</label>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        {variable.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
