import { Droplet } from "lucide-react";
import { useState } from "react";
import type { UnitState, UnitSummary, WsStatus } from "../lib/types";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { ControlPanel } from "./ControlPanel";
import { SetpointSummary } from "./SetpointSummary";
import { UnitStatusBadges } from "./UnitStatusBadges";

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
          {ready && connected && (
            <SetpointSummary mode={live.mode} heatSetpoint={live.heat_setpoint} coolSetpoint={live.cool_setpoint} />
          )}
        </div>
        {ready && connected ? (
          <div className="flex shrink-0 items-baseline gap-3 text-right">
            <span className="text-3xl font-semibold tabular-nums text-slate-100">
              {live.temperature ?? "--"}&deg;
            </span>
            {live.humidity !== null && (
              <span className="flex items-center gap-0.5 text-sm text-slate-400">
                <Droplet size={13} className="text-slate-500" strokeWidth={2} />
                {live.humidity}%
              </span>
            )}
          </div>
        ) : (
          <span className="shrink-0 text-sm text-slate-500">{ready ? "Offline" : "..."}</span>
        )}
      </button>

      {ready && <UnitStatusBadges live={live} />}

      {expanded && ready && <ControlPanel unit={live} onUpdate={onUpdate} />}
    </div>
  );
}
