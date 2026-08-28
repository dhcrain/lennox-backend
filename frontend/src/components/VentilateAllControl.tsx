import { useState } from "react";
import { apiPost, ApiError } from "../lib/api";
import { messageFromError, useToast } from "./Toast";
import type { UnitSummary, VentilationRunResponse } from "../lib/types";

const DURATION_PRESETS_MINUTES = [20, 40, 60];

export function VentilateAllControl({ units }: { units: UnitSummary[] }) {
  const { pushToast } = useToast();
  const [pending, setPending] = useState(false);

  async function runAll(duration_minutes: number) {
    setPending(true);
    try {
      const res = await apiPost<VentilationRunResponse>("/ventilation/run", { duration_minutes });
      const failures = res.results.filter((r) => !r.ok);
      if (failures.length === 0) {
        pushToast("success", `ERV running on all units for ${duration_minutes} min`);
      } else {
        const names = failures
          .map((f) => units.find((u) => u.id === f.unit_id)?.label ?? f.unit_id)
          .join(", ");
        pushToast("error", `ERV failed to start on: ${names}`);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : messageFromError(err, "Request failed");
      pushToast("error", message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-4 mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 shadow-lg shadow-black/20">
      <span className="text-sm font-medium text-slate-300">Run ERV on all units</span>
      <div className="flex gap-2">
        {DURATION_PRESETS_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            disabled={pending}
            onClick={() => runAll(minutes)}
            className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-medium text-emerald-300 disabled:opacity-50 active:bg-emerald-800/60"
          >
            {minutes} min
          </button>
        ))}
      </div>
    </div>
  );
}
