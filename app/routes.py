from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from lennoxs30api import FAN_MODES
from lennoxs30api.s30exception import EC_BAD_PARAMETERS, S30Exception

from app.auth import verify_token, verify_ws_token
from app.connections import ConnectionManager, UnitConnection
from app.models import FanRequest, ModeRequest, SetpointsRequest, UnitState

_LOGGER = logging.getLogger("lennox_backend.routes")

router = APIRouter(dependencies=[Depends(verify_token)])


def _manager(request: Request) -> ConnectionManager:
    return request.app.state.manager


def _get_unit_or_404(manager: ConnectionManager, unit_id: str) -> UnitConnection:
    conn = manager.get(unit_id)
    if conn is None:
        raise HTTPException(status_code=404, detail={"code": "unit_not_found", "message": f"no unit '{unit_id}'"})
    return conn


def _get_zone_or_503(conn: UnitConnection):
    zone = conn._get_zone()
    if not conn.connected or zone is None or zone.getTemperature() is None:
        raise HTTPException(
            status_code=503,
            detail={"code": "unit_disconnected", "message": f"{conn.label} unit is offline"},
        )
    return zone


def _raise_s30_as_400(e: S30Exception):
    if e.error_code == EC_BAD_PARAMETERS:
        raise HTTPException(status_code=400, detail={"code": "invalid_request", "message": e.message}) from e
    raise HTTPException(status_code=502, detail={"code": "unit_error", "message": e.message}) from e


@router.get("/units")
def list_units(request: Request):
    manager = _manager(request)
    return {
        "units": [
            {
                "id": conn.id,
                "label": conn.label,
                "ip": conn.ip,
                "connected": conn.connected,
                "last_seen": conn.last_seen,
            }
            for conn in manager.units.values()
        ]
    }


@router.get("/units/{unit_id}", response_model=UnitState)
def get_unit(unit_id: str, request: Request):
    conn = _get_unit_or_404(_manager(request), unit_id)
    return conn.snapshot()


@router.post("/units/{unit_id}/mode", response_model=UnitState, status_code=202)
async def set_mode(unit_id: str, body: ModeRequest, request: Request):
    conn = _get_unit_or_404(_manager(request), unit_id)
    zone = _get_zone_or_503(conn)
    try:
        await zone.setHVACMode(body.mode)
    except S30Exception as e:
        _raise_s30_as_400(e)
    return conn.snapshot()


@router.post("/units/{unit_id}/fan", response_model=UnitState, status_code=202)
async def set_fan(unit_id: str, body: FanRequest, request: Request):
    conn = _get_unit_or_404(_manager(request), unit_id)
    zone = _get_zone_or_503(conn)
    if body.fan_mode not in FAN_MODES:
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_request", "message": f"fan_mode must be one of {sorted(FAN_MODES)}"},
        )
    try:
        await zone.setFanMode(body.fan_mode)
    except S30Exception as e:
        _raise_s30_as_400(e)
    return conn.snapshot()


@router.post("/units/{unit_id}/setpoints", response_model=UnitState, status_code=202)
async def set_setpoints(unit_id: str, body: SetpointsRequest, request: Request):
    conn = _get_unit_or_404(_manager(request), unit_id)
    zone = _get_zone_or_503(conn)
    try:
        await zone.perform_setpoint(r_hsp=body.heat_setpoint, r_csp=body.cool_setpoint, r_sp=body.setpoint)
    except S30Exception as e:
        _raise_s30_as_400(e)
    return conn.snapshot()


ws_router = APIRouter()


@ws_router.websocket("/units/{unit_id}/stream")
async def stream_unit(websocket: WebSocket, unit_id: str, token: str | None = None):
    manager: ConnectionManager = websocket.app.state.manager
    expected_token = websocket.app.state.config.api_token
    conn = manager.get(unit_id)

    if conn is None or not verify_ws_token(expected_token, token):
        await websocket.close(code=4401)
        return

    await websocket.accept()
    conn.add_subscriber(websocket)
    try:
        await websocket.send_json({"type": "update", "unit": conn.id, "data": conn.snapshot().model_dump(mode="json")})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        conn.remove_subscriber(websocket)
