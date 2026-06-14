/**
 * Mob types (F13 "1–2 bug types" → expanded). Each kind has its own stats and
 * movement feel, and each time-of-day favours different kinds, so the bestiary
 * visibly shifts with the day/night cycle. Combat stays light and generous.
 */

export type MobId = "bug" | "wisp" | "slime" | "critter" | "bat" | "skeleton";
export type BobStyle = "ground" | "float" | "hop";

export interface MobType {
  id: MobId;
  name: string;
  hp: number;
  wanderSpeed: number;
  chaseSpeed: number;
  detect: number; // chase radius
  touch: number; //  contact-damage range
  scale: number;
  bob: BobStyle;
  baseY: number; // resting height of the slot
  accent: string;
}

export const MOBS: Record<MobId, MobType> = {
  // night: the classic skittering bug
  bug: {
    id: "bug",
    name: "Bug",
    hp: 2,
    wanderSpeed: 2.2,
    chaseSpeed: 4.3,
    detect: 13,
    touch: 1.35,
    scale: 1,
    bob: "ground",
    baseY: 0,
    accent: "#ff5470",
  },
  // night: a fast, fragile floating wisp
  wisp: {
    id: "wisp",
    name: "Wisp",
    hp: 1,
    wanderSpeed: 2.7,
    chaseSpeed: 5.4,
    detect: 16,
    touch: 1.3,
    scale: 0.9,
    bob: "float",
    baseY: 1.5,
    accent: "#6ad0ff",
  },
  // day: a slow, tanky hopping slime
  slime: {
    id: "slime",
    name: "Slime",
    hp: 3,
    wanderSpeed: 1.5,
    chaseSpeed: 2.7,
    detect: 11,
    touch: 1.55,
    scale: 1.1,
    bob: "hop",
    baseY: 0,
    accent: "#39d98a",
  },
  // day: a quick little shell-backed critter
  critter: {
    id: "critter",
    name: "Critter",
    hp: 2,
    wanderSpeed: 2.5,
    chaseSpeed: 4.0,
    detect: 12,
    touch: 1.3,
    scale: 0.85,
    bob: "ground",
    baseY: 0,
    accent: "#f2b94c",
  },
  // night/dusk: a fast, fragile flapping bat
  bat: {
    id: "bat",
    name: "Bat",
    hp: 1,
    wanderSpeed: 3.0,
    chaseSpeed: 6.0,
    detect: 15,
    touch: 1.2,
    scale: 0.9,
    bob: "float",
    baseY: 1.9,
    accent: "#b06cff",
  },
  // deep night: a slow, tanky skeleton
  skeleton: {
    id: "skeleton",
    name: "Skeleton",
    hp: 4,
    wanderSpeed: 1.6,
    chaseSpeed: 3.0,
    detect: 12,
    touch: 1.4,
    scale: 1.0,
    bob: "ground",
    baseY: 0,
    accent: "#cfc9b8",
  },
};

/** Stable order for the per-slot mesh variants in <Enemies>. */
export const MOB_ORDER: MobId[] = ["bug", "wisp", "slime", "critter"];

// Which kinds roam in each segment (repeats bias the odds).
const POOLS: Record<string, MobId[]> = {
  night: ["bug", "wisp", "skeleton", "bat", "bug"],
  dawn: ["critter", "bug", "bat"],
  day: ["slime", "critter", "critter"],
  dusk: ["bug", "wisp", "bat", "critter"],
};

export function pickMob(segment: string, r: number): MobType {
  const pool = POOLS[segment] ?? POOLS.night;
  return MOBS[pool[Math.floor(r * pool.length) % pool.length]];
}

/** The Arena throws the whole bestiary at you, deepening by wave. */
export const ARENA_POOL: MobId[] = ["bug", "critter", "bat", "wisp", "slime", "skeleton"];
