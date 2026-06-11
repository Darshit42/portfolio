import { create } from "zustand";
import { SPAWN } from "../data/buildings";
import { TOTAL_RELICS } from "../data/projects";

export type UiMode =
  | "title"
  | "playing"
  | "codex"
  | "dialog"
  | "fasttravel"
  | "recruiter"
  | "help"
  | "paused";

/** Modes in which the 3D world is mounted and the player could be moving. */
export const WORLD_MODES: UiMode[] = ["playing", "codex", "dialog", "fasttravel", "help", "paused"];

/** Modes in which player input should be frozen (an overlay is up). */
export const FROZEN_MODES: UiMode[] = ["codex", "dialog", "fasttravel", "help", "paused", "title", "recruiter"];

export type InteractableKind = "relic" | "gate" | "npc" | "forge";

export interface Interactable {
  kind: InteractableKind;
  /** building id, npc id, etc. */
  id: string;
  label: string;
  prompt: string;
  projectId?: string;
}

export interface GameState {
  mode: UiMode;
  /** Mode to return to when a transient overlay (help/pause) closes. */
  returnMode: UiMode;

  foundRelics: Set<string>; // project ids
  discovered: Set<string>; // building ids the player has approached

  activeCodex: string | null; // project id
  activeDialog: string | null; // npc id
  activeForge: boolean; // forge demo panel open
  activeGate: boolean; // contact gate panel open

  /** What the player is currently standing next to (drives the prompt). */
  nearby: Interactable | null;

  /** Set by fast-travel/respawn; the Player consumes it to teleport. */
  travelTarget: [number, number] | null;

  /** Spawn position, also used for respawn. */
  spawn: [number, number];

  muted: boolean;
  reducedMotion: boolean;
  webglFailed: boolean;
  hasSeenControls: boolean;

  // ---- actions ----
  setMode: (m: UiMode) => void;
  enterRealm: () => void;
  openRecruiter: () => void;
  openCodex: (projectId: string) => void;
  openForge: () => void;
  openDialog: (npcId: string) => void;
  openGate: () => void;
  /** Acts on whatever the player is standing next to (keyboard E or tap). */
  triggerInteract: () => void;
  closeOverlay: () => void;
  toggleHelp: () => void;
  togglePause: () => void;

  findRelic: (projectId: string) => void;
  markDiscovered: (buildingId: string) => void;
  setNearby: (i: Interactable | null) => void;

  requestTravel: (pos: [number, number]) => void;
  consumeTravel: () => void;

  toggleMute: () => void;
  setReducedMotion: (v: boolean) => void;
  setWebglFailed: () => void;
  markControlsSeen: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: "title",
  returnMode: "playing",

  foundRelics: new Set(),
  discovered: new Set(),

  activeCodex: null,
  activeDialog: null,
  activeForge: false,
  activeGate: false,

  nearby: null,
  travelTarget: null,
  spawn: SPAWN,

  muted: true, // audio is "default-soft" per PRD; user opts in
  reducedMotion:
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  webglFailed: false,
  hasSeenControls: false,

  setMode: (m) => set({ mode: m }),

  enterRealm: () => set({ mode: "playing" }),

  openRecruiter: () => set({ mode: "recruiter" }),

  openCodex: (projectId) =>
    set({ mode: "codex", activeCodex: projectId, activeForge: false, activeGate: false, activeDialog: null }),

  openForge: () => set({ mode: "codex", activeForge: true, activeGate: false, activeCodex: "self-healing-agent" }),

  openDialog: (npcId) => set({ mode: "dialog", activeDialog: npcId }),

  openGate: () => set({ mode: "codex", activeGate: true, activeForge: false, activeCodex: null }),

  triggerInteract: () => {
    const n = get().nearby;
    if (!n) return;
    switch (n.kind) {
      case "forge":
        get().findRelic(n.projectId ?? "self-healing-agent");
        get().openForge();
        break;
      case "relic":
        if (n.projectId) {
          get().findRelic(n.projectId);
          get().openCodex(n.projectId);
        }
        break;
      case "gate":
        if (selectGateOpen(get())) get().openGate();
        break;
      case "npc":
        get().openDialog(n.id);
        break;
    }
  },

  closeOverlay: () =>
    set({
      mode: "playing",
      activeCodex: null,
      activeDialog: null,
      activeForge: false,
      activeGate: false,
    }),

  toggleHelp: () => {
    const { mode, returnMode } = get();
    if (mode === "help") set({ mode: returnMode });
    else set({ returnMode: mode === "title" || mode === "recruiter" ? mode : "playing", mode: "help" });
  },

  togglePause: () => {
    const { mode } = get();
    if (mode === "paused") set({ mode: "playing" });
    else if (mode === "playing") set({ mode: "paused" });
  },

  findRelic: (projectId) => {
    const found = get().foundRelics;
    if (found.has(projectId)) return;
    const next = new Set(found);
    next.add(projectId);
    set({ foundRelics: next });
  },

  markDiscovered: (buildingId) => {
    const d = get().discovered;
    if (d.has(buildingId)) return;
    const next = new Set(d);
    next.add(buildingId);
    set({ discovered: next });
  },

  setNearby: (i) => {
    // Avoid needless renders: only update if the target actually changed.
    const cur = get().nearby;
    if (cur?.id === i?.id && cur?.kind === i?.kind) return;
    set({ nearby: i });
  },

  requestTravel: (pos) => set({ travelTarget: pos, mode: "playing", nearby: null }),

  consumeTravel: () => set({ travelTarget: null }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setWebglFailed: () => set({ webglFailed: true, mode: "recruiter" }),
  markControlsSeen: () => set({ hasSeenControls: true }),
}));

/** Derived selector: are all relics found? */
export const selectGateOpen = (s: GameState): boolean => s.foundRelics.size >= TOTAL_RELICS;
