from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SetpointLimits(BaseModel):
    min_heat: float | None
    max_heat: float | None
    min_cool: float | None
    max_cool: float | None


class UnitSummary(BaseModel):
    id: str
    label: str
    ip: str
    connected: bool
    last_seen: datetime | None


class UnitState(BaseModel):
    id: str
    label: str
    connected: bool
    temperature: float | None = None
    humidity: float | None = None
    mode: str | None = None
    operating_state: str | None = None
    fan_mode: str | None = None
    fan_running: bool | None = None
    ventilating: bool | None = None
    ventilation_ends_at: datetime | None = None
    schedule_hold: bool | None = None
    heat_setpoint: float | None = None
    cool_setpoint: float | None = None
    single_setpoint: float | None = None
    setpoint_limits: SetpointLimits | None = None


class ModeRequest(BaseModel):
    mode: str


class FanRequest(BaseModel):
    fan_mode: str


class SetpointsRequest(BaseModel):
    heat_setpoint: float | None = None
    cool_setpoint: float | None = None
    setpoint: float | None = None


class VentilationRequest(BaseModel):
    duration_minutes: int = Field(gt=0, le=360)


class VentilationUnitResult(BaseModel):
    unit_id: str
    ok: bool
    error: str | None = None


class VentilationRunResponse(BaseModel):
    results: list[VentilationUnitResult]
