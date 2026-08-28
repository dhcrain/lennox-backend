import type { WsStatus } from "../lib/types";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function ConnectionStatusBadge({
  connected,
  lastSeen,
  wsStatus,
}: {
  connected: boolean;
  lastSeen: string | null;
  wsStatus: WsStatus | undefined;
}) {
  const live = connected && wsStatus === "open";
  const label = live
    ? "Online"
    : wsStatus === "connecting" || wsStatus === undefined
      ? "Connecting..."
      : `Offline · last seen ${relativeTime(lastSeen)}`;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
      <span
        className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-slate-500"}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
