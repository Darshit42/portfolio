import { useAgentStore } from "../agents/agentStore";
import { startLive, stopLive } from "../agents/live";
import { FEATURES } from "../data/config";

/**
 * "Run live tick" control + budget indicator (R9.1, R9.8). Gated by
 * FEATURES.liveAgentWs AND agentTown — when off it renders nothing, so the
 * default portfolio never even references the live server. Live mode never
 * auto-starts; it begins only when the visitor clicks here.
 */
export default function LiveControl() {
  const live = useAgentStore((s) => s.live);
  const ready = useAgentStore((s) => s.ready);
  if (!FEATURES.agentTown || !FEATURES.liveAgentWs || !ready) return null;

  const on = live.status === "live" || live.status === "connecting";
  const label =
    live.status === "live"
      ? "Live"
      : live.status === "connecting"
        ? "Connecting…"
        : live.status === "fallback"
          ? "Replay (live ended)"
          : "Run live tick";

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
      <button
        onClick={() => (on ? stopLive() : startLive())}
        className="flex items-center gap-2 rounded-full border border-realm-edge bg-realm-bg/85 px-4 py-2 text-sm font-semibold shadow-panel backdrop-blur-sm hover:border-realm-gold"
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: live.status === "live" ? "#39d98a" : live.status === "connecting" ? "#e8c66a" : "#8b97b0",
            boxShadow: live.status === "live" ? "0 0 8px #39d98a" : undefined,
          }}
        />
        {label}
        {live.tokensRemaining != null && (
          <span className="font-mono text-[11px] text-realm-muted">
            {live.tokensRemaining.toLocaleString()} tok
          </span>
        )}
      </button>
    </div>
  );
}
