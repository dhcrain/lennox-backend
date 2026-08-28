import { HVAC_MODES } from "../lib/constants";

export function ModeSelector({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled: boolean;
  onChange: (mode: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {HVAC_MODES.map((mode) => {
        const active = mode === value;
        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={`min-h-12 min-w-16 flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize leading-tight transition-colors disabled:opacity-40 ${
              active ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 active:bg-slate-700"
            }`}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}
