import { Fan, Flame, Snowflake } from "lucide-react";
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

  // The E30 command endpoints fire-and-forget: the 202 response body is a snapshot
  // taken before the physical equipment confirms the change, so applying it would
  // flash the old value back on screen. Apply the change optimistically instead and
  // let this unit's WebSocket push (the real confirmed state, a moment later)
  // reconcile it. On failure there's no such correction coming, so revert by hand.
  async function run(optimisticPatch: Partial<UnitState>, action: () => Promise<UnitState>) {
    const previous = unit;
    onUpdate({ ...unit, ...optimisticPatch });
    setPending(true);
    try {
      await action();
    } catch (err) {
      onUpdate(previous);
      const message =
        err instanceof ApiError ? err.message : messageFromError(err, "Request failed");
      pushToast("error", message);
    } finally {
      setPending(false);
    }
  }

  const isOff = unit.mode === "off";
  const isSingleSetpoint = unit.single_setpoint !== null;
  const limits = unit.setpoint_limits;
  const showHeat = unit.mode !== "cool";
  const showCool = unit.mode !== "heat";

  return (
    <div className="space-y-4 border-t border-slate-800 p-4">
      {!isOff && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Setpoints</p>
          <div className="space-y-2">
            {isSingleSetpoint ? (
              <SetpointStepper
                label="Target"
                icon={unit.mode === "heat" ? Flame : unit.mode === "cool" ? Snowflake : undefined}
                value={unit.single_setpoint}
                min={limits?.min_cool ?? limits?.min_heat ?? null}
                max={limits?.max_cool ?? limits?.max_heat ?? null}
                disabled={pending || offline}
                onChange={(setpoint) =>
                  run({ single_setpoint: setpoint }, () =>
                    apiPost<UnitState>(`/units/${unit.id}/setpoints`, { setpoint }),
                  )
                }
              />
            ) : (
              <>
                {showHeat && (
                  <SetpointStepper
                    label="Heat"
                    icon={Flame}
                    value={unit.heat_setpoint}
                    min={limits?.min_heat ?? null}
                    max={limits?.max_heat ?? null}
                    disabled={pending || offline}
                    onChange={(heat_setpoint) =>
                      run({ heat_setpoint }, () =>
                        apiPost<UnitState>(`/units/${unit.id}/setpoints`, { heat_setpoint }),
                      )
                    }
                  />
                )}
                {showCool && (
                  <SetpointStepper
                    label="Cool"
                    icon={Snowflake}
                    value={unit.cool_setpoint}
                    min={limits?.min_cool ?? null}
                    max={limits?.max_cool ?? null}
                    disabled={pending || offline}
                    onChange={(cool_setpoint) =>
                      run({ cool_setpoint }, () =>
                        apiPost<UnitState>(`/units/${unit.id}/setpoints`, { cool_setpoint }),
                      )
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</p>
        <ModeSelector
          value={unit.mode}
          disabled={pending || offline}
          onChange={(mode) => run({ mode }, () => apiPost<UnitState>(`/units/${unit.id}/mode`, { mode }))}
        />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Fan size={12} strokeWidth={2} />
          Fan
        </p>
        <FanSelector
          value={unit.fan_mode}
          disabled={pending || offline}
          onChange={(fan_mode) =>
            run({ fan_mode }, () => apiPost<UnitState>(`/units/${unit.id}/fan`, { fan_mode }))
          }
        />
      </div>
    </div>
  );
}
