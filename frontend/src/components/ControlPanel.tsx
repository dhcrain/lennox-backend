import { useState } from "react";
import { ApiError, apiPost } from "../lib/api";
import type { UnitState } from "../lib/types";
import { FanSelector } from "./FanSelector";
import { ModeSelector } from "./ModeSelector";
import { SetpointStepper } from "./SetpointStepper";
import { messageFromError, useToast } from "./Toast";

export function ControlPanel({
  unit,
  onUpdate,
}: {
  unit: UnitState;
  onUpdate: (state: UnitState) => void;
}) {
  const { pushToast } = useToast();
  const [pending, setPending] = useState(false);
  const offline = !unit.connected;

  async function run(action: () => Promise<UnitState>) {
    setPending(true);
    try {
      const next = await action();
      onUpdate(next);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : messageFromError(err, "Request failed");
      pushToast("error", message);
    } finally {
      setPending(false);
    }
  }

  const isSingleSetpoint = unit.single_setpoint !== null;
  const limits = unit.setpoint_limits;
  const showHeat = unit.mode !== "cool";
  const showCool = unit.mode !== "heat";

  return (
    <div className="space-y-4 border-t border-slate-800 p-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Setpoints</p>
        <div className="space-y-2">
          {isSingleSetpoint ? (
            <SetpointStepper
              label="Target"
              value={unit.single_setpoint}
              min={limits?.min_cool ?? limits?.min_heat ?? null}
              max={limits?.max_cool ?? limits?.max_heat ?? null}
              disabled={pending || offline}
              onChange={(setpoint) =>
                run(() => apiPost<UnitState>(`/units/${unit.id}/setpoints`, { setpoint }))
              }
            />
          ) : (
            <>
              {showHeat && (
                <SetpointStepper
                  label="Heat"
                  value={unit.heat_setpoint}
                  min={limits?.min_heat ?? null}
                  max={limits?.max_heat ?? null}
                  disabled={pending || offline}
                  onChange={(heat_setpoint) =>
                    run(() => apiPost<UnitState>(`/units/${unit.id}/setpoints`, { heat_setpoint }))
                  }
                />
              )}
              {showCool && (
                <SetpointStepper
                  label="Cool"
                  value={unit.cool_setpoint}
                  min={limits?.min_cool ?? null}
                  max={limits?.max_cool ?? null}
                  disabled={pending || offline}
                  onChange={(cool_setpoint) =>
                    run(() => apiPost<UnitState>(`/units/${unit.id}/setpoints`, { cool_setpoint }))
                  }
                />
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</p>
        <ModeSelector
          value={unit.mode}
          disabled={pending || offline}
          onChange={(mode) => run(() => apiPost<UnitState>(`/units/${unit.id}/mode`, { mode }))}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fan</p>
        <FanSelector
          value={unit.fan_mode}
          disabled={pending || offline}
          onChange={(fan_mode) => run(() => apiPost<UnitState>(`/units/${unit.id}/fan`, { fan_mode }))}
        />
      </div>
    </div>
  );
}
