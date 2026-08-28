export interface SetpointLimits {
  min_heat: number | null;
  max_heat: number | null;
  min_cool: number | null;
  max_cool: number | null;
}

export interface UnitSummary {
  id: string;
  label: string;
  ip: string;
  connected: boolean;
  last_seen: string | null;
}

export interface UnitState {
  id: string;
  label: string;
  connected: boolean;
  temperature: number | null;
  humidity: number | null;
  mode: string | null;
  operating_state: string | null;
  fan_mode: string | null;
  fan_running: boolean | null;
  ventilating: boolean | null;
  ventilation_ends_at: string | null;
  schedule_hold: boolean | null;
  heat_setpoint: number | null;
  cool_setpoint: number | null;
  single_setpoint: number | null;
  setpoint_limits: SetpointLimits | null;
}

export type WsStatus = "connecting" | "open" | "closed";

export interface VentilationUnitResult {
  unit_id: string;
  ok: boolean;
  error: string | null;
}

export interface VentilationRunResponse {
  results: VentilationUnitResult[];
}
