import { create } from "zustand";
import { SPAWN, buildingById } from "../data/buildings";
import { TOTAL_SIGILS } from "../data/categories";
import { itemDef } from "../data/items";
import { loadSaved, persist } from "./persist";

export const MAX_HEALTH = 5;
export const ARENA_WAVES = 3;

const saved = loadSaved();
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export type UiMode =
  | "title"
  | "playing"
  | "codex"
  | "dialog"
  | "fasttravel"
  | "recruiter"
  | "help"
  | "paused"
  | "inventory";

/** Modes in which the 3D world is mounted and the player could be moving. */
export const WORLD_MODES: UiMode[] = ["playing", "codex", "dialog", "fasttravel", "help", "paused", "inventory"];

/** Modes in which player input should be frozen (an overlay is up). */
export const FROZEN_MODES: UiMode[] = ["codex", "dialog", "fasttravel", "help", "paused", "inventory", "title", "recruiter"];

export type InteractableKind = "guild" | "gate" | "npc" | "door" | "secret" | "skilltree";

export interface Interactable {
  kind: InteractableKind;
  /** building id, npc id, door id, etc. */
  id: string;
  label: string;
  prompt: string;
  /** Guild category id (for kind === "guild"). Drives the relic glow + sigil. */
  categoryId?: string;
  /** Teleport destination for doors, [x, z]. */
  target?: [number, number];
}

export interface GameState {
  mode: UiMode;
  /** Mode to return to when a transient overlay (help/pause) closes. */
  returnMode: UiMode;

  sigils: Set<string>; // category ids earned (the win condition)
  discovered: Set<string>; // building ids the player has approached

  activeGuild: string | null; // category id — the open Codex LIST
  activeCodex: string | null; // project id — the open project detail
  activeDialog: string | null; // npc id
  activeForge: boolean; // forge demo panel open
  activeGate: boolean; // contact gate panel open
  activeSkills: boolean; // skill-tree shrine panel open
  activeSkillLabel: string | null; // title of the structure that opened it

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

  // ---- day/night ----
  daySegment: "night" | "dawn" | "day" | "dusk";

  // ---- loot + inventory ----
  coins: number;
  inventory: Record<string, number>;

  // ---- combat (F13–F15, F17) ----
  health: number;
  maxHealth: number;
  arenaActive: boolean;
  arenaWave: number;

  // ---- transient notice (death / arena messages) ----
  noticeText: string | null;
  noticeKey: number;

  // ---- actions ----
  setMode: (m: UiMode) => void;
  enterRealm: () => void;
  openRecruiter: () => void;
  /** Open a guild's Codex LIST (and earn its sigil). */
  openGuild: (categoryId: string) => void;
  /** Open a single project's detail (keeps any guild context for "back"). */
  openCodex: (projectId: string) => void;
  /** From a project detail, step back to its guild list. */
  backToGuild: () => void;
  openDialog: (npcId: string) => void;
  openGate: () => void;
  openSkills: (label?: string) => void;
  /** Acts on whatever the player is standing next to (keyboard E or tap). */
  triggerInteract: () => void;
  closeOverlay: () => void;
  toggleHelp: () => void;
  togglePause: () => void;

  earnSigil: (categoryId: string) => void;
  markDiscovered: (buildingId: string) => void;
  setNearby: (i: Interactable | null) => void;

  requestTravel: (pos: [number, number]) => void;
  consumeTravel: () => void;

  toggleMute: () => void;
  setReducedMotion: (v: boolean) => void;
  setWebglFailed: () => void;
  markControlsSeen: () => void;
  setDaySegment: (s: GameState["daySegment"]) => void;

  /** Set by the loot system; called when a mob dies so drops can spawn. */
  onMobKilled?: (mobId: string, x: number, z: number) => void;

  damagePlayer: (n: number) => void;
  healToFull: () => void;
  startArena: () => void;
  stopArena: () => void;
  setArenaWave: (w: number) => void;
  notify: (text: string) => void;

  addItem: (id: string, n?: number) => void;
  useItem: (id: string) => void;
  toggleInventory: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: "title",
  returnMode: "playing",

  sigils: new Set(saved.sigils ?? []),
  discovered: new Set(),

  activeGuild: null,
  activeCodex: null,
  activeDialog: null,
  activeForge: false,
  activeGate: false,
  activeSkills: false,
  activeSkillLabel: null,

  nearby: null,
  travelTarget: null,
  spawn: SPAWN,

  muted: saved.muted ?? true, // audio is "default-soft" per PRD; user opts in
  reducedMotion: saved.reducedMotion ?? prefersReducedMotion,
  webglFailed: false,
  hasSeenControls: false,

  daySegment: "night",

  coins: saved.coins ?? 0,
  inventory: saved.inventory ?? {},

  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  arenaActive: false,
  arenaWave: 0,

  noticeText: null,
  noticeKey: 0,

  setMode: (m) => set({ mode: m }),

  enterRealm: () => set({ mode: "playing" }),

  openRecruiter: () => set({ mode: "recruiter" }),

  openGuild: (categoryId) => {
    get().earnSigil(categoryId);
    set({
      mode: "codex",
      activeGuild: categoryId,
      activeCodex: null,
      activeForge: false,
      activeGate: false,
      activeSkills: false,
      activeDialog: null,
    });
  },

  openCodex: (projectId) =>
    set({ mode: "codex", activeCodex: projectId, activeForge: false, activeGate: false, activeSkills: false, activeDialog: null }),

  backToGuild: () => set({ activeCodex: null }),

  openDialog: (npcId) => set({ mode: "dialog", activeDialog: npcId }),

  openGate: () => set({ mode: "codex", activeGate: true, activeForge: false, activeSkills: false, activeGuild: null, activeCodex: null }),

  openSkills: (label) =>
    set({ mode: "codex", activeSkills: true, activeSkillLabel: label ?? null, activeForge: false, activeGate: false, activeGuild: null, activeCodex: null }),

  triggerInteract: () => {
    const n = get().nearby;
    if (!n) return;
    switch (n.kind) {
      case "guild":
        if (n.categoryId) get().openGuild(n.categoryId);
        break;
      case "gate":
        if (selectGateOpen(get())) get().openGate();
        break;
      case "skilltree":
        get().openSkills(n.label);
        break;
      case "npc":
        get().openDialog(n.id);
        break;
      case "door":
        if (n.target) get().requestTravel(n.target);
        break;
      case "secret":
        // The label carries the easter-egg notice text.
        get().notify(n.label);
        break;
    }
  },

  closeOverlay: () =>
    set({
      mode: "playing",
      activeGuild: null,
      activeCodex: null,
      activeDialog: null,
      activeForge: false,
      activeGate: false,
      activeSkills: false,
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

  earnSigil: (categoryId) => {
    const have = get().sigils;
    if (have.has(categoryId)) return;
    const next = new Set(have);
    next.add(categoryId);
    set({ sigils: next });
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
  setDaySegment: (s) => set({ daySegment: s }),

  notify: (text) => set((s) => ({ noticeText: text, noticeKey: s.noticeKey + 1 })),

  damagePlayer: (n) => {
    const next = get().health - n;
    if (next > 0) {
      set({ health: next });
      return;
    }
    // Death is generous: full heal + respawn at the Tavern, no death screen.
    const wasArena = get().arenaActive;
    set({ health: get().maxHealth, arenaActive: false, arenaWave: 0 });
    get().requestTravel(get().spawn);
    get().notify(wasArena ? "The Arena bested you — back to the Tavern" : "You fell — back to the Tavern");
  },

  healToFull: () => set((s) => ({ health: s.maxHealth })),

  startArena: () => {
    const arena = buildingById("the-arena");
    set({ arenaActive: true, arenaWave: 1, health: get().maxHealth });
    if (arena) get().requestTravel([arena.position[0], arena.position[1]]);
    get().notify("The Arena — Wave 1");
  },

  stopArena: () => set({ arenaActive: false, arenaWave: 0 }),
  setArenaWave: (w) => set({ arenaWave: w }),

  addItem: (id, n = 1) => {
    const def = itemDef(id);
    if (def.kind === "currency") {
      set((s) => ({ coins: s.coins + n }));
      return;
    }
    set((s) => ({
      inventory: { ...s.inventory, [id]: Math.min(def.stack, (s.inventory[id] ?? 0) + n) },
    }));
  },

  useItem: (id) => {
    const have = get().inventory[id] ?? 0;
    if (have <= 0) return;
    const def = itemDef(id);
    if (def.effect?.heal) {
      set((s) => ({ health: Math.min(s.maxHealth, s.health + def.effect!.heal!) }));
      get().notify(`Used ${def.name}`);
    }
    set((s) => {
      const next = (s.inventory[id] ?? 0) - 1;
      const inv = { ...s.inventory };
      if (next <= 0) delete inv[id];
      else inv[id] = next;
      return { inventory: inv };
    });
  },

  toggleInventory: () => {
    const m = get().mode;
    if (m === "inventory") set({ mode: "playing" });
    else if (m === "playing") set({ mode: "inventory" });
  },
}));

/** Derived selector: is every guild sigil earned? */
export const selectGateOpen = (s: GameState): boolean => s.sigils.size >= TOTAL_SIGILS;

// Dev-only handle for the screenshot driver (programmatic arena/travel etc.).
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __store: typeof useGameStore }).__store = useGameStore;
}

// Persist relics + settings locally (F22). The persist() helper no-ops unless
// the flag is on and only writes when the snapshot actually changes.
useGameStore.subscribe((s) =>
  persist({
    sigils: [...s.sigils],
    muted: s.muted,
    reducedMotion: s.reducedMotion,
    coins: s.coins,
    inventory: s.inventory,
  }),
);
