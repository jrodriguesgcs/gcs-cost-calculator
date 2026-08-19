import { ProgramVariable } from "@/lib/programs/types";

interface Props {
  variable: ProgramVariable;
  value: boolean | number | string;
  onChange: (value: boolean | number | string) => void;
  disabled?: boolean;
}

const FOCUS_RING = "focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-accent/35";

export function VariableField({ variable, value, onChange, disabled = false }: Props) {
  const helpText = variable.helpText && (
    <p className="mt-0.5 text-xs text-muted-foreground">{variable.helpText}</p>
  );

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
      <div className="py-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground-secondary">{variable.label}</label>
          <input
            type="number"
            min={variable.min}
            max={variable.max}
            value={numericValue}
            disabled={disabled}
            onChange={(event) => {
              const next = Number(event.target.value);
              const clamped = Math.min(
                variable.max ?? Infinity,
                Math.max(variable.min ?? 0, Number.isNaN(next) ? 0 : next),
              );
              onChange(clamped);
            }}
            className={`w-20 rounded-none border border-border px-2 py-1 text-right text-sm disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
          />
        </div>
        {helpText}
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
