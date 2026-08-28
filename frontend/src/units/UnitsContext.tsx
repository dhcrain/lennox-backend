import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { messageFromError, useToast } from "../components/Toast";
import { apiGet } from "../lib/api";
import type { UnitState, UnitSummary, WsStatus } from "../lib/types";
import { useUnitStream } from "./useUnitStream";

interface UnitsContextValue {
  units: UnitSummary[];
  liveState: Record<string, UnitState | undefined>;
  wsStatus: Record<string, WsStatus | undefined>;
  loading: boolean;
  applyUnitState: (unitId: string, state: UnitState) => void;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

function UnitStreamMount({
  unitId,
  onUpdate,
  onStatus,
}: {
  unitId: string;
  onUpdate: (unitId: string, state: UnitState) => void;
  onStatus: (unitId: string, status: WsStatus) => void;
}) {
  useUnitStream(unitId, onUpdate, onStatus);
  return null;
}

export function UnitsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [liveState, setLiveState] = useState<Record<string, UnitState | undefined>>({});
  const [wsStatus, setWsStatus] = useState<Record<string, WsStatus | undefined>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    apiGet<{ units: UnitSummary[] }>("/units")
      .then((data) => {
        if (!cancelled) setUnits(data.units);
      })
      .catch((err) => {
        if (!cancelled) pushToast("error", messageFromError(err, "Failed to load units"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, pushToast]);

  const applyUnitState = useCallback((unitId: string, state: UnitState) => {
    setLiveState((prev) => ({ ...prev, [unitId]: state }));
  }, []);

  const updateStatus = useCallback((unitId: string, status: WsStatus) => {
    setWsStatus((prev) => ({ ...prev, [unitId]: status }));
  }, []);

  return (
    <UnitsContext.Provider value={{ units, liveState, wsStatus, loading, applyUnitState }}>
      {units.map((u) => (
        <UnitStreamMount key={u.id} unitId={u.id} onUpdate={applyUnitState} onStatus={updateStatus} />
      ))}
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}
