import { Header } from "./components/Header";
import { UnitCard } from "./components/UnitCard";
import { useUnits } from "./units/UnitsContext";

export function Dashboard() {
  const { units, liveState, wsStatus, loading, applyUnitState } = useUnits();

  return (
    <div className="min-h-svh bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Header />
      <main className="px-4">
        {loading ? (
          <p className="pt-8 text-center text-sm text-slate-500">Loading units...</p>
        ) : units.length === 0 ? (
          <p className="pt-8 text-center text-sm text-slate-500">No units configured.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                summary={unit}
                live={liveState[unit.id]}
                wsStatus={wsStatus[unit.id]}
                onUpdate={(state) => applyUnitState(unit.id, state)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
