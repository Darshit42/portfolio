/**
 * Live Mode client (R9) — optional, explicitly user-activated, never on load.
 * Streams world events from the FastAPI sim over SSE and feeds them into the
 * same runtime that plays the baked log. Any failure silently falls back to the
 * baked replay (R9.7): the town keeps running, no error wall.
 *
 * Gated by FEATURES.liveAgentWs. The server enforces the real cost caps (token
 * budget, timeout, kill switch); this client only reflects them in the UI.
 */
import { useAgentStore } from "./agentStore";
import { runtime } from "./runtime";
import type { WorldEvent } from "./types";

const BASE = (import.meta.env.VITE_AGENT_SERVER as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

let source: EventSource | null = null;

export function isLiveSupported(): boolean {
  return typeof window !== "undefined" && "EventSource" in window;
}

export function startLive(): void {
  if (source) return;
  const store = useAgentStore.getState();
  if (!isLiveSupported()) {
    store.setLive("fallback");
    return;
  }
  store.setLive("connecting");
  try {
    source = new EventSource(`${BASE}/events`);
  } catch {
    store.setLive("fallback");
    return;
  }
  runtime.setLiveMode(true); // freeze baked replay; play streamed events

  source.onopen = () => useAgentStore.getState().setLive("live", useAgentStore.getState().live.tokensRemaining);

  source.onmessage = (e) => {
    let msg: { type: string; remaining?: number };
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.type === "session_end") {
      stopLive("fallback");
      return;
    }
    if (typeof msg.remaining === "number") {
      useAgentStore.getState().setLive("live", msg.remaining);
    }
    runtime.pushLive(msg as unknown as WorldEvent);
  };

  // R9.7: lost/failed connection → silent fallback to replay.
  source.onerror = () => stopLive("fallback");
}

export function stopLive(status: "off" | "fallback" = "off"): void {
  if (source) {
    source.close();
    source = null;
  }
  runtime.setLiveMode(false); // resume the baked replay
  // Keep the last known token budget visible after fallback (R9.8).
  const last = useAgentStore.getState().live.tokensRemaining;
  useAgentStore.getState().setLive(status, status === "fallback" ? last : null);
}

export async function seedRumor(agentId: string, text: string): Promise<void> {
  try {
    await fetch(`${BASE}/rumor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, text }),
    });
  } catch {
    /* best-effort; replay is unaffected */
  }
}
