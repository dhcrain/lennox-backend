import { useState } from "react";
import type { UnitState, UnitSummary, WsStatus } from "../lib/types";
import { formatDuration, useRemainingSeconds } from "../lib/useCountdown";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { ControlPanel } from "./ControlPanel";

const OPERATING_STATE_STYLES: Record<string, string> = {
  heating: "bg-orange-900/60 text-orange-300",
  cooling: "bg-sky-900/60 text-sky-300",
  off: "bg-slate-800 text-slate-400",
};

export function UnitCard({
  summary,
  live,
  wsStatus,
  onUpdate,
}: {
  summary: UnitSummary;
  live: UnitState | undefined;
  wsStatus: WsStatus | undefined;
  onUpdate: (state: UnitState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ready = live !== undefined;
  const connected = live?.connected ?? summary.connected;
  const ventilationRemaining = useRemainingSeconds(live?.ventilating ? live.ventilation_ends_at : null);

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-lg shadow-black/20">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={!ready}
        className="flex w-full items-center justify-between gap-4 p-4 text-left active:bg-slate-800/60 disabled:active:bg-transparent"
      >
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-100">{summary.label}</p>
          <ConnectionStatusBadge connected={connected} lastSeen={summary.last_seen} wsStatus={wsStatus} />
        </div>
        {ready && connected ? (
          <div className="flex shrink-0 items-baseline gap-3 text-right">
            <span className="text-3xl font-semibold tabular-nums text-slate-100">
              {live.temperature ?? "--"}&deg;
            </span>
            {live.humidity !== null && (
              <span className="text-sm text-slate-400">{live.humidity}% RH</span>
            )}
          </div>
        ) : (
          <span className="shrink-0 text-sm text-slate-500">{ready ? "Offline" : "..."}</span>
        )}
      </button>

      {ready && live.mode && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 capitalize ${
              OPERATING_STATE_STYLES[live.operating_state ?? ""] ?? "bg-slate-800 text-slate-400"
            }`}
          >
            {live.operating_state ?? live.mode}
          </span>
          {live.fan_mode && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 capitalize text-slate-400">
              fan: {live.fan_mode}
              {live.fan_running ? " · running" : ""}
            </span>
          )}
          {live.ventilating && (
            <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-emerald-300">
              ERV running
              {ventilationRemaining !== null && ` · ${formatDuration(ventilationRemaining)} left`}
            </span>
          )}
        </div>
      )}

      {expanded && ready && <ControlPanel unit={live} onUpdate={onUpdate} />}
    </div>
  );
}
