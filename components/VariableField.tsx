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
    const labelId = `${variable.key}-label`;
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
        <span id={labelId} className="shrink-0 text-sm text-foreground-secondary">
          {variable.label}
        </span>
        <div
          role="group"
          aria-labelledby={labelId}
          className="inline-flex rounded-none border border-border text-sm"
        >
          <button
            type="button"
            onClick={() => onChange(true)}
            aria-pressed={included}
            className={`px-3 py-1 ${
              included ? "bg-primary text-white" : "bg-white text-foreground-secondary"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            aria-pressed={!included}
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
    const inputId = `${variable.key}-input`;
    return (
      <div className="py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label htmlFor={inputId} className="shrink-0 text-sm text-foreground-secondary">
            {variable.label}
          </label>
          <input
            id={inputId}
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
  const selectId = `${variable.key}-select`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
      <label htmlFor={selectId} className="shrink-0 text-sm text-foreground-secondary">
        {variable.label}
      </label>
      <select
        id={selectId}
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
