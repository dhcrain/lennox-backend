import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import type { UnitState, WsStatus } from "../lib/types";

const MAX_BACKOFF_MS = 15000;

export function useUnitStream(
  unitId: string,
  onUpdate: (unitId: string, state: UnitState) => void,
  onStatus: (unitId: string, status: WsStatus) => void,
) {
  const { token, clearToken } = useAuth();
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      onStatus(unitId, "connecting");
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${location.host}/units/${unitId}/stream?token=${encodeURIComponent(token as string)}`);

      ws.onopen = () => {
        attemptRef.current = 0;
        onStatus(unitId, "open");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "update" && payload.data) {
            onUpdate(unitId, payload.data as UnitState);
          }
        } catch {
          // ignore malformed frame
        }
      };

      ws.onclose = (event) => {
        onStatus(unitId, "closed");
        if (cancelled) return;
        if (event.code === 4401) {
          clearToken();
          return;
        }
        const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_BACKOFF_MS);
        attemptRef.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible" || cancelled) return;
      // iOS suspends WebSockets on lock/background without always firing onclose promptly;
      // force a reconnect on resume if the socket isn't actually open.
      if (ws && ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        attemptRef.current = 0;
        connect();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [unitId, token, onUpdate, onStatus, clearToken]);
}
