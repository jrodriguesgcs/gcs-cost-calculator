import { ProgramVariable } from "@/lib/programs/types";

interface Props {
  variable: ProgramVariable;
  value: boolean | number | string;
  onChange: (value: boolean | number | string) => void;
}

const FOCUS_RING = "focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-accent/35";

export function VariableField({ variable, value, onChange }: Props) {
  if (variable.type === "boolean") {
    const included = Boolean(value);
    return (
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-foreground-secondary">{variable.label}</label>
        <div className="inline-flex rounded-none border border-border text-sm">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1 ${
              included ? "bg-primary text-white" : "bg-white text-foreground-secondary"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1 ${
              !included ? "bg-primary text-white" : "bg-white text-foreground-secondary"
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
        <label className="text-sm text-foreground-secondary">{variable.label}</label>
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
          className={`w-20 rounded-none border border-border px-2 py-1 text-right text-sm ${FOCUS_RING}`}
        />
      </div>
    );
  }

  // select
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-foreground-secondary">{variable.label}</label>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-none border border-border px-2 py-1 text-sm ${FOCUS_RING}`}
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
