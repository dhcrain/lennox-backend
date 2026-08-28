# lennox-backend

FastAPI service that owns the LAN connections to 3 Lennox E30 thermostats and
exposes a REST/WebSocket API for dashboards/mobile. Depends on `lennoxs30api`
(PyPI) rather than vendoring it.

## Local dev

```
cp config.example.yaml config.yaml   # fill in real IPs and a real api_token
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend serves the built frontend from `app/static`. To work on the UI
with hot reload instead, run the Vite dev server alongside the backend (it
proxies `/units` and `/health` to `localhost:8000`):

```
cd frontend
npm install
npm run dev
```

To build the frontend into `app/static` (what the backend serves in
production):

```
cd frontend
npm run build
```

## Docker

```
cp config.example.yaml config.yaml   # fill in real IPs and a real api_token
docker compose up -d --build
```

This builds the frontend and backend into a single image and runs it with
`config.yaml` mounted read-only. Useful when running alongside other
containerized services on the same host (e.g. a Raspberry Pi) — no shared
Python/Node versions or dependencies to conflict.

To update after pulling changes:

```
docker compose up -d --build
```

Logs: `docker compose logs -f`. Stop: `docker compose down`.

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
