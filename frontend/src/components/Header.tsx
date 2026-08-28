import { useAuth } from "../auth/AuthContext";

export function Header() {
  const { clearToken } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <h1 className="text-lg font-semibold text-slate-100">Lennox Dashboard</h1>
      <button
        type="button"
        onClick={clearToken}
        className="text-xs font-medium text-slate-500 underline decoration-dotted underline-offset-4 active:text-slate-300"
      >
        change token
      </button>
    </header>
  );
}
