import { create } from "zustand";

/** DOM-facing Agent Town state. Per-frame position/anim live in the runtime
 *  (off React); only these low-frequency bits go through the store. */

export interface Bubble {
  agentId: string;
  name: string;
  text: string;
  key: number; // unique per utterance, for React keys + fade restart
}

export type LiveStatus = "off" | "connecting" | "live" | "fallback";

interface AgentUiState {
  ready: boolean; // baked log loaded + replaying
  bubbles: Bubble[];
  inspectorId: string | null;
  live: { status: LiveStatus; tokensRemaining: number | null };

  setReady: (v: boolean) => void;
  setBubbles: (b: Bubble[]) => void;
  openInspector: (id: string) => void;
  closeInspector: () => void;
  setLive: (status: LiveStatus, tokensRemaining?: number | null) => void;
}

export const useAgentStore = create<AgentUiState>((set) => ({
  ready: false,
  bubbles: [],
  inspectorId: null,
  live: { status: "off", tokensRemaining: null },

  setReady: (v) => set({ ready: v }),
  setBubbles: (bubbles) => set({ bubbles }),
  openInspector: (id) => set({ inspectorId: id }),
  closeInspector: () => set({ inspectorId: null }),
  setLive: (status, tokensRemaining = null) => set({ live: { status, tokensRemaining } }),
}));

// Dev-only handle for the screenshot driver (open the inspector programmatically).
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __agentStore: typeof useAgentStore }).__agentStore = useAgentStore;
}
