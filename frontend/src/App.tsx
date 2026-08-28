import { AuthProvider } from "./auth/AuthContext";
import { TokenGate } from "./auth/TokenGate";
import { Dashboard } from "./Dashboard";
import { ToastProvider } from "./components/Toast";
import { UnitsProvider } from "./units/UnitsContext";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TokenGate>
          <UnitsProvider>
            <Dashboard />
          </UnitsProvider>
        </TokenGate>
      </AuthProvider>
    </ToastProvider>
  );
}
