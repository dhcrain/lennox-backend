import type { ComponentType } from "react";

export function SetpointStepper({
  label,
  icon: Icon,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  value: number | null;
  min: number | null;
  max: number | null;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  const canDecrement = value !== null && (min === null || value - 1 >= min);
  const canIncrement = value !== null && (max === null || value + 1 <= max);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 p-2">
      <span className="flex items-center gap-1.5 pl-2 text-sm font-medium text-slate-300">
        {Icon && <Icon size={15} strokeWidth={2} className="text-slate-400" />}
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || !canDecrement}
          onClick={() => value !== null && onChange(value - 1)}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-xl font-semibold text-white active:bg-slate-600 disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          &minus;
        </button>
        <span className="w-10 text-center text-lg font-semibold tabular-nums text-slate-100">
          {value ?? "--"}
        </span>
        <button
          type="button"
          disabled={disabled || !canIncrement}
          onClick={() => value !== null && onChange(value + 1)}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-xl font-semibold text-white active:bg-slate-600 disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
