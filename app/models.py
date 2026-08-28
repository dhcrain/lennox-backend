from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


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
    fan_mode: str | None = None
    fan_running: bool | None = None
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
