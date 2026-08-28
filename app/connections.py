"""Owns one s30api_async LAN connection per E30 unit: connect, message-pump loop,
reconnect on repeated failure, and WebSocket fan-out when zone state changes."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import WebSocket
from lennoxs30api import s30api_async
from lennoxs30api.s30exception import S30Exception

from app.config import UnitConfig
from app.models import SetpointLimits, UnitState

_LOGGER = logging.getLogger("lennox_backend.connections")

POLL_INTERVAL_SECONDS = 1
RECONNECT_AFTER_FAILURES = 5
RECONNECT_BACKOFF_SECONDS = 10


class UnitConnection:
    def __init__(self, unit: UnitConfig):
        self.id = unit.id
        self.label = unit.label
        self.ip = unit.ip
        self.api = s30api_async("none", "none", app_id=f"lennox-backend-{unit.id}", ip_address=unit.ip)
        self.connected = False
        self.last_seen: datetime | None = None

        self._subscribers: set[WebSocket] = set()
        self._last_broadcast: UnitState | None = None
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self._run(), name=f"unit-{self.id}")

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
        await self.api._close_session()

    def _get_zone(self):
        if not self.api.system_list:
            return None
        return self.api.system_list[0].getZone(0)

    def snapshot(self) -> UnitState:
        zone = self._get_zone()
        if zone is None or zone.getTemperature() is None:
            return UnitState(id=self.id, label=self.label, connected=self.connected)

        single = zone.system.single_setpoint_mode
        return UnitState(
            id=self.id,
            label=self.label,
            connected=self.connected,
            temperature=zone.getTemperature(),
            humidity=zone.getHumidity(),
            mode=zone.getSystemMode(),
            fan_mode=zone.getFanMode(),
            fan_running=zone.fan,
            heat_setpoint=None if single else zone.getHeatSP(),
            cool_setpoint=None if single else zone.getCoolSP(),
            single_setpoint=zone.sp if single else None,
            setpoint_limits=SetpointLimits(
                min_heat=zone.minHsp,
                max_heat=zone.maxHsp,
                min_cool=zone.minCsp,
                max_cool=zone.maxCsp,
            ),
        )

    async def _connect(self) -> bool:
        try:
            await self.api.serverConnect()
            for lsystem in self.api.system_list:
                await self.api.subscribe(lsystem)
            self.connected = True
            self.last_seen = datetime.now(timezone.utc)
            _LOGGER.info("[%s] connected, %d system(s)", self.id, len(self.api.system_list))
            return True
        except S30Exception as e:
            self.connected = False
            _LOGGER.error("[%s] connect failed: %s", self.id, e.message)
            return False

    async def _run(self) -> None:
        while not await self._connect():
            await asyncio.sleep(RECONNECT_BACKOFF_SECONDS)

        consecutive_failures = 0
        while True:
            try:
                await self.api.messagePump()
                self.connected = True
                self.last_seen = datetime.now(timezone.utc)
                consecutive_failures = 0
            except S30Exception as e:
                consecutive_failures += 1
                _LOGGER.error("[%s] message pump error (%d in a row): %s", self.id, consecutive_failures, e.message)
                if consecutive_failures >= RECONNECT_AFTER_FAILURES:
                    self.connected = False
                    await self._broadcast_if_changed()
                    while not await self._connect():
                        await asyncio.sleep(RECONNECT_BACKOFF_SECONDS)
                    consecutive_failures = 0

            await self._broadcast_if_changed()
            await asyncio.sleep(POLL_INTERVAL_SECONDS)

    async def _broadcast_if_changed(self) -> None:
        current = self.snapshot()
        if current == self._last_broadcast:
            return
        self._last_broadcast = current
        if not self._subscribers:
            return
        message = {"type": "update", "unit": self.id, "data": current.model_dump(mode="json")}
        dead: set[WebSocket] = set()
        for ws in self._subscribers:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        self._subscribers -= dead

    def add_subscriber(self, ws: WebSocket) -> None:
        self._subscribers.add(ws)

    def remove_subscriber(self, ws: WebSocket) -> None:
        self._subscribers.discard(ws)


class ConnectionManager:
    def __init__(self, units: list[UnitConfig]):
        self.units: dict[str, UnitConnection] = {u.id: UnitConnection(u) for u in units}

    def start_all(self) -> None:
        for conn in self.units.values():
            conn.start()

    async def stop_all(self) -> None:
        await asyncio.gather(*(conn.stop() for conn in self.units.values()), return_exceptions=True)

    def get(self, unit_id: str) -> UnitConnection | None:
        return self.units.get(unit_id)
