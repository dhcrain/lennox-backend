import { FAN_MODES } from "../lib/constants";

export function FanSelector({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled: boolean;
  onChange: (fanMode: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {FAN_MODES.map((fanMode) => {
        const active = fanMode === value;
        return (
          <button
            key={fanMode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(fanMode)}
            className={`h-12 flex-1 rounded-lg px-3 text-sm font-medium capitalize transition-colors disabled:opacity-40 ${
              active ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-300 active:bg-slate-700"
            }`}
          >
            {fanMode}
          </button>
        );
      })}
    </div>
  );
}
