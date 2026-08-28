import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export function TokenGate({ children }: { children: ReactNode }) {
  const { token, setToken } = useAuth();
  const [input, setInput] = useState("");

  if (token) return <>{children}</>;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) setToken(trimmed);
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-slate-900 p-6 shadow-xl shadow-black/30"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Lennox Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Enter the API token to continue.</p>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="API token"
          className="h-12 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="h-12 w-full rounded-lg bg-sky-500 text-base font-medium text-white active:bg-sky-600 disabled:opacity-40"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
