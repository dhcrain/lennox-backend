# lennox-backend

FastAPI service that owns the LAN connections to 3 Lennox E30 thermostats and
exposes a REST/WebSocket API for dashboards/mobile. Depends on `lennoxs30api`
(PyPI) rather than vendoring it.

## Setup

```
cp config.example.yaml config.yaml   # fill in real IPs and a real api_token
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API

- `GET /health` — process liveness (no auth)
- `GET /units` — list units + connection status

  ```
  curl -H "Authorization: Bearer <api_token>" http://localhost:8000/units
  ```
- `GET /units/{id}` — full zone state
- `POST /units/{id}/mode` — `{"mode": "cool"}`
- `POST /units/{id}/fan` — `{"fan_mode": "auto"}`
- `POST /units/{id}/setpoints` — `{"heat_setpoint": 68, "cool_setpoint": 74}` or `{"setpoint": 72}`
- `GET /units/{id}/stream?token=...` — WebSocket, pushes `{"type": "update", ...}` on change

All REST routes require `Authorization: Bearer <api_token>`. The WebSocket route
takes the token as a query param since browsers can't set headers on the
handshake.
