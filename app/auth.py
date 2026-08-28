"""Bearer-token auth for REST routes, plus a query-param check for the WebSocket route
(browsers can't set custom headers on a WebSocket handshake)."""

from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, Request


def verify_token(request: Request, authorization: str = Header(default="")) -> None:
    expected = request.app.state.config.api_token
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail={"code": "unauthorized", "message": "missing or invalid bearer token"})


def verify_ws_token(expected: str, token: str | None) -> bool:
    return token is not None and hmac.compare_digest(token, expected)
