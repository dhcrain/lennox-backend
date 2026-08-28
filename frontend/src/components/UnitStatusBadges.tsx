import { ArrowLeftRight, Fan, Flame, PauseCircle, Snowflake } from "lucide-react";
import type { UnitState } from "../lib/types";
import { formatDuration, useRemainingSeconds } from "../lib/useCountdown";

const OPERATING_STATE_STYLES: Record<string, string> = {
  heating: "bg-orange-900/60 text-orange-300",
  cooling: "bg-sky-900/60 text-sky-300",
  off: "bg-slate-800 text-slate-400",
};

const OPERATING_STATE_ICONS: Record<string, typeof Flame> = {
  heating: Flame,
  cooling: Snowflake,
};

export function UnitStatusBadges({ live }: { live: UnitState }) {
  const ventilationRemaining = useRemainingSeconds(live.ventilating ? live.ventilation_ends_at : null);

  if (!live.mode) return null;

  const OperatingStateIcon = OPERATING_STATE_ICONS[live.operating_state ?? ""];

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 text-xs">
      <span
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 capitalize ${
          OPERATING_STATE_STYLES[live.operating_state ?? ""] ?? "bg-slate-800 text-slate-400"
        }`}
      >
        {OperatingStateIcon && <OperatingStateIcon size={12} strokeWidth={2} />}
        {live.operating_state ?? live.mode}
      </span>
      {live.fan_mode && (
        <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 capitalize text-slate-400">
          <Fan size={12} strokeWidth={2} />
          {live.fan_mode}
          {live.fan_running ? " · running" : ""}
        </span>
      )}
      {live.ventilating && (
        <span className="flex items-center gap-1 rounded-full bg-emerald-900/60 px-2 py-0.5 text-emerald-300">
          <ArrowLeftRight size={12} strokeWidth={2} />
          ERV running
          {ventilationRemaining !== null && ` · ${formatDuration(ventilationRemaining)} left`}
        </span>
      )}
      {live.schedule_hold && (
        <span className="flex items-center gap-1 rounded-full bg-amber-900/60 px-2 py-0.5 text-amber-300">
          <PauseCircle size={12} strokeWidth={2} />
          On hold
        </span>
      )}
    </div>
  );
}
