import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { clearToken as removeToken, getToken, setToken as persistToken } from "../lib/token";

interface AuthContextValue {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const setToken = useCallback((next: string) => {
    persistToken(next);
    setTokenState(next);
  }, []);

  const clearToken = useCallback(() => {
    removeToken();
    setTokenState(null);
  }, []);

  return <AuthContext.Provider value={{ token, setToken, clearToken }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
