import { Flame, Snowflake } from "lucide-react";

export function SetpointSummary({
  mode,
  heatSetpoint,
  coolSetpoint,
}: {
  mode: string | null;
  heatSetpoint: number | null;
  coolSetpoint: number | null;
}) {
  const showHeat = heatSetpoint !== null && mode !== "off" && mode !== "cool";
  const showCool = coolSetpoint !== null && mode !== "off" && mode !== "heat";

  if (!showHeat && !showCool) return null;

  return (
    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
      {showHeat && (
        <span className="flex items-center gap-0.5">
          <Flame size={13} className="text-orange-400" strokeWidth={2} />
          {heatSetpoint}
        </span>
      )}
      {showCool && (
        <span className="flex items-center gap-0.5">
          <Snowflake size={13} className="text-sky-400" strokeWidth={2} />
          {coolSetpoint}
        </span>
      )}
    </div>
  );
}
