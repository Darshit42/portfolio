/**
 * Building definitions + world placement. Positions are [x, z] on the ground
 * plane (y is up). The dimetric camera looks toward -z, so smaller z is "north"
 * (far) and larger z is "south" (near spawn).
 *
 * Layout mirrors PRD §4.3:
 *
 *      [Spire]            [Guild Hall]
 *  [Oracle]      * plaza totem *      [Forge ★]
 *      [Market]           [Arena]
 *              [Tavern]  ← spawn
 *              [Gate]    ← south edge, opens at 6/6
 */

export type BuildingKind =
  | "forge"
  | "guildhall"
  | "arena"
  | "booth"
  | "spire"
  | "market"
  | "tavern"
  | "gate";

export interface Building {
  id: string;
  label: string;
  kind: BuildingKind;
  /** Project relic enshrined here. Empty for non-project structures (tavern/gate). */
  projectId?: string;
  /** World position of the building's center, [x, z]. */
  position: [number, number];
  /** Where the player stands to interact + where fast-travel drops them, [x, z]. */
  approach: [number, number];
  rotationY?: number;
  /** Half-extents for AABB collision, [halfX, halfZ]. */
  half: [number, number];
  /** Theming accent; falls back to the project accent. */
  accent: string;
  /** If false, the player can walk through it (e.g., the open Arena ring). */
  solid?: boolean;
  interior?: boolean; // P1
}

// Just north of (in front of) the Tavern, clear of its footprint, facing the
// plaza/world. The Tavern occupies z 27–37, so spawning at 30 would embed the
// player in a wall.
export const SPAWN: [number, number] = [0, 23];
export const PLAZA_CENTER: [number, number] = [0, 2];

/** World bounds (player is clamped inside, with a margin from the edge). */
export const WORLD_BOUNDS = { minX: -46, maxX: 46, minZ: -42, maxZ: 44 };

export const BUILDINGS: Building[] = [
  {
    id: "spire-of-training",
    label: "Spire of Training",
    kind: "spire",
    projectId: "nemotron-rl",
    position: [-19, -24],
    approach: [-19, -16],
    half: [4, 4],
    accent: "#39d98a",
  },
  {
    id: "guild-hall",
    label: "Open Source Guild Hall",
    kind: "guildhall",
    projectId: "kubestellar-kyverno",
    position: [19, -24],
    approach: [19, -16],
    half: [6, 5],
    accent: "#3aa0ff",
  },
  {
    id: "oracles-booth",
    label: "Oracle's Booth",
    kind: "booth",
    projectId: "voice-agent",
    position: [-31, -2],
    approach: [-23, -2],
    half: [4, 4],
    accent: "#b06cff",
  },
  {
    id: "agent-forge",
    label: "The Agent Forge",
    kind: "forge",
    projectId: "self-healing-agent",
    position: [31, -2],
    approach: [23, -2],
    half: [6, 6],
    accent: "#ff7a3c",
  },
  {
    id: "finddder-market",
    label: "Finddder Market",
    kind: "market",
    projectId: "finddder",
    position: [-19, 17],
    approach: [-19, 9],
    half: [5, 4],
    accent: "#f2b94c",
  },
  {
    id: "the-arena",
    label: "The Arena",
    kind: "arena",
    projectId: "jee-arena",
    position: [19, 17],
    approach: [19, 9],
    half: [6, 6],
    accent: "#ff5470",
    solid: false, // open ring — the player fights inside it
  },
  {
    id: "null-pointer-tavern",
    label: "Null Pointer Tavern",
    kind: "tavern",
    position: [0, 32],
    approach: [0, 26],
    half: [6, 5],
    accent: "#e8c66a",
    interior: false,
  },
  {
    id: "gate-of-contact",
    label: "Gate of Contact",
    kind: "gate",
    position: [0, 41],
    approach: [0, 36],
    half: [5, 2],
    accent: "#6ad0ff",
  },
];

export const buildingById = (id: string): Building | undefined =>
  BUILDINGS.find((b) => b.id === id);

/** Buildings that hold a project relic, in a sensible quest/fast-travel order. */
export const RELIC_BUILDINGS = BUILDINGS.filter((b) => b.projectId);

export const TAVERN = buildingById("null-pointer-tavern")!;
export const GATE = buildingById("gate-of-contact")!;
