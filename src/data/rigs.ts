/**
 * Character rig presets — colours, size, and rig kind per entity.
 * Player/NPCs use the default humanoid; mobs pick a distinct silhouette
 * (zombie, goblin, spider, etc.) via `kind`.
 */
export type RigKind = "humanoid" | "zombie" | "goblin" | "spider" | "bat" | "slime" | "mushroom" | "wisp" | "critter";

export interface RigConfig {
  kind?: RigKind;
  scale?: number;
  skin: string;
  torso: string;
  legs: string;
  feet: string;
  eye?: string;
  hideLegs?: boolean;
  headScale?: number;
}

const DEFAULT_EYE = "#15171d";

export const RIGS: Record<string, RigConfig> = {
  player: { skin: "#e8c29a", torso: "#7a2433", legs: "#565b66", feet: "#1c2026", eye: DEFAULT_EYE },

  barkeep: { skin: "#e8c29a", torso: "#7a4a2c", legs: "#4a4f58", feet: "#1c2026" },
  guildmaster: { skin: "#e8c29a", torso: "#27496b", legs: "#3a4452", feet: "#1c2026" },
  oracle: { skin: "#e8c29a", torso: "#5a3a86", legs: "#3c2c52", feet: "#1c1430" },
  automaton: { skin: "#9aa0ad", torso: "#5a4632", legs: "#4a4138", feet: "#22201a", eye: "#ff7a3c" },
  merchant: { skin: "#e8c29a", torso: "#2c6b4a", legs: "#4a4f58", feet: "#1c2026" },
  blacksmith: { skin: "#d8a87a", torso: "#444a52", legs: "#3a3f46", feet: "#1c2026", eye: "#ff6622" },
  guard: { skin: "#e8c29a", torso: "#3a4452", legs: "#2c333d", feet: "#15181d", eye: "#9aa6bf" },
  seer: { skin: "#e8c29a", torso: "#4a3a7a", legs: "#332856", feet: "#1a1430", eye: "#c9b6ff" },

  // mobs — each kind gets its own silhouette
  zombie: {
    kind: "zombie",
    scale: 1.02,
    skin: "#8a9a7a",
    torso: "#4a5a42",
    legs: "#3a4a38",
    feet: "#2a3228",
    eye: "#c44a3a",
  },
  goblin: {
    kind: "goblin",
    scale: 0.78,
    skin: "#c8a060",
    torso: "#5a3a1a",
    legs: "#4a3828",
    feet: "#2a2018",
    eye: "#ffcc22",
  },
  spider: {
    kind: "spider",
    scale: 1.0,
    skin: "#2a1830",
    torso: "#3a2040",
    legs: "#1a1020",
    feet: "#100810",
    eye: "#ff2244",
  },
  bug: {
    kind: "critter",
    scale: 0.62,
    skin: "#2a1230",
    torso: "#3a1830",
    legs: "#241018",
    feet: "#160a1a",
    eye: "#ff5470",
  },
  wisp: {
    kind: "wisp",
    scale: 0.72,
    skin: "#bfeeff",
    torso: "#3a7a96",
    legs: "#1a4a66",
    feet: "#103040",
    eye: "#06121d",
    hideLegs: true,
  },
  slime: {
    kind: "slime",
    scale: 0.74,
    skin: "#39d98a",
    torso: "#2c8a5a",
    legs: "#1a6a45",
    feet: "#124a30",
    eye: "#0a1f14",
    headScale: 1.25,
  },
  critter: {
    kind: "critter",
    scale: 0.6,
    skin: "#4a3420",
    torso: "#5a3d1a",
    legs: "#241810",
    feet: "#160f08",
    eye: "#f2b94c",
  },
  bat: {
    kind: "bat",
    scale: 0.6,
    skin: "#4a3a5a",
    torso: "#3a2a5a",
    legs: "#241c30",
    feet: "#160f20",
    eye: "#b06cff",
    hideLegs: true,
  },
  skeleton: {
    kind: "humanoid",
    scale: 1.0,
    skin: "#e8e4d4",
    torso: "#cfc9b8",
    legs: "#b8b2a0",
    feet: "#5a5648",
    eye: "#9aa6bf",
  },
  mushroom: {
    kind: "mushroom",
    scale: 0.92,
    skin: "#e6ddc8", // stem
    torso: "#c0392b", // red cap
    legs: "#f2ece0", // cap spots
    feet: "#2a2018",
    eye: "#3a2a20",
  },
};

export const rigConfig = (id: string): RigConfig => RIGS[id] ?? RIGS.player;
