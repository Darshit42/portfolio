/**
 * In-character NPC/traveler chat client — a live call fires ONLY on an explicit
 * player submit (never on load, enter, or a timer).
 *
 * It calls OUR backend endpoint by URL; the Gemini key lives server-side and
 * never touches this bundle. Every failure path (feature off, no server, network
 * error, timeout, rate-limited, kill-switched, keyless) resolves to `ok: false`
 * so the UI can show an honest "can't reach them" note — never an error wall.
 */
import { FEATURES } from "../data/config";

const BASE = (import.meta.env.VITE_AGENT_SERVER as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8001";

const TIMEOUT_MS = 11_000; // a hair above the server's own timeout

export interface AskResult {
  ok: boolean;
  answer?: string;
  reason?: string;
}

/** A stable per-tab id so the server can attribute rate-limit buckets. */
function sessionId(): string {
  if (typeof sessionStorage === "undefined") return "anon";
  let id = sessionStorage.getItem("devhalla:traveler");
  if (!id) {
    id = Math.random().toString(36).slice(2);
    try {
      sessionStorage.setItem("devhalla:traveler", id);
    } catch {
      /* private mode — a throwaway id is fine */
    }
  }
  return id;
}

export async function askAgent(agentId: string, question: string): Promise<AskResult> {
  // Guardrail: no call at all unless the feature is enabled.
  if (!FEATURES.liveNpcChat) return { ok: false, reason: "disabled" };
  const q = question.trim();
  if (!q) return { ok: false, reason: "empty" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, agentId, sessionId: sessionId() }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as AskResult;
    if (data && data.ok && typeof data.answer === "string") {
      return { ok: true, answer: data.answer };
    }
    return { ok: false, reason: data?.reason || "unavailable" };
  } catch {
    // network error or abort/timeout — degrade to baked chatter
    return { ok: false, reason: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
