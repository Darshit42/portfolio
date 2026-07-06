/**
 * Interior rooms (F18) for the Tavern and the Forge. Rooms live far east of the
 * exterior world (x ≈ 160) — beyond the fog's far plane, so each reads as its
 * own scene. Doors are teleporting interactables; the player physically cannot
 * walk between zones (movement clamps to the zone they're standing in).
 *
 * Camera note: the dimetric camera sits south-east of the player looking
 * north-west, so rooms render FULL walls on the north + west (the backdrop)
 * and LOW rails on the south + east (the open, see-through sides).
 */

export interface InteriorRoom {
  id: string;
  buildingId: string;
  kind: "tavern" | "forge" | "spire";
  label: string;
  /** Room center, [x, z]. */
  center: [number, number];
  /** Walkable half-extents, [halfX, halfZ]. The zone clamp uses exactly this. */
  half: [number, number];
  /** X position of the door gap in the south rail. */
  doorX: number;
  floorColor: string;
  wallColor: string;
  accent: string;
}

export const INTERIOR_ROOMS: InteriorRoom[] = [
  {
    id: "tavern-room",
    buildingId: "null-pointer-tavern",
    kind: "tavern",
    label: "Null Pointer Tavern — inside",
    center: [160, 60],
    half: [7, 5.5],
    doorX: 158,
    floorColor: "#3a2a1c",
    wallColor: "#4a3526",
    accent: "#e8c66a",
  },
  {
    id: "forge-room",
    buildingId: "agent-forge",
    kind: "forge",
    label: "The Agent Forge — inside",
    center: [160, -60],
    half: [7, 6],
    doorX: 158,
    floorColor: "#23222b",
    wallColor: "#1c2230",
    accent: "#ff7a3c",
  },
  {
    id: "spire-room",
    buildingId: "spire-of-training",
    kind: "spire",
    label: "Spire of Training — inside",
    center: [160, 0],
    half: [8, 6.5],
    doorX: 158,
    floorColor: "#221d33",
    wallColor: "#2a2340",
    accent: "#9b8cff",
  },
];

export interface Door {
  id: string;
  /** Shown in the proximity prompt. */
  prompt: string;
  label: string;
  /** Where the door stands (interaction point), [x, z]. */
  position: [number, number];
  /** Where interacting teleports the player, [x, z]. */
  target: [number, number];
}

export const DOORS: Door[] = [
  // Tavern (exterior door faces the plaza at the building's approach)
  {
    id: "tavern-enter",
    prompt: "Enter the Tavern",
    label: "Null Pointer Tavern",
    position: [0, 26],
    target: [157.5, 62.8],
  },
  {
    id: "tavern-exit",
    prompt: "Step outside",
    label: "Tavern door",
    position: [158, 64.9],
    target: [0, 24.6],
  },
  // Forge (exterior door on the south face, clear of the relic on the west)
  {
    id: "forge-enter",
    prompt: "Enter the Forge",
    label: "The Agent Forge",
    position: [28, 5.8],
    target: [157.5, -56.5],
  },
  {
    id: "forge-exit",
    prompt: "Step outside",
    label: "Forge door",
    position: [158, -54.6],
    target: [28, 6.8],
  },
  // Spire (exterior door at the building's approach point)
  {
    id: "spire-enter",
    prompt: "Enter the Spire",
    label: "Spire of Training",
    position: [-19, -16],
    target: [157.5, 3.5],
  },
  {
    id: "spire-exit",
    prompt: "Step outside",
    label: "Spire door",
    position: [158, 5.4],
    target: [-19, -14],
  },
];

/** Solid props inside rooms (the only interior collision besides the zone). */
export const PROP_COLLIDERS: { center: [number, number]; half: [number, number] }[] = [
  // tavern
  { center: [154.8, 58.8], half: [0.7, 2.6] }, // bar counter
  { center: [161.5, 62], half: [0.95, 0.95] }, // table 1
  { center: [164, 58], half: [0.95, 0.95] }, // table 2
  { center: [163.5, 55.2], half: [1.2, 0.7] }, // fireplace
  // forge
  { center: [160, -64.4], half: [1.8, 1.0] }, // furnace
  { center: [159, -59.5], half: [0.8, 0.5] }, // anvil
  { center: [154.2, -61], half: [0.8, 1.8] }, // workbench
  { center: [164.5, -57.5], half: [0.6, 0.6] }, // quench barrel
  // spire
  { center: [156, -5.2], half: [2.2, 0.5] }, // west bookshelf (north wall)
  { center: [163.5, -5.2], half: [2.2, 0.5] }, // east bookshelf (north wall)
  { center: [153.6, 0], half: [0.5, 2.4] }, // tall shelf (west wall)
  { center: [164.4, 2.4], half: [0.9, 0.7] }, // current-work lectern
];
