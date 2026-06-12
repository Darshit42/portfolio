import type { Vector3 } from "three";
import { BUILDINGS, WORLD_BOUNDS } from "../data/buildings";
import { INTERIOR_ROOMS, PROP_COLLIDERS } from "../data/interiors";

/** Axis-aligned bounding rect in world XZ. */
interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const PLAYER_RADIUS = 0.9;

// Static collider registry, built once from solid building footprints plus
// interior props. Nothing here ever moves, so a flat array + linear scan is
// plenty (n < 20).
const colliders: Rect[] = [
  ...BUILDINGS.filter((b) => b.solid !== false).map((b) => ({
    minX: b.position[0] - b.half[0],
    maxX: b.position[0] + b.half[0],
    minZ: b.position[1] - b.half[1],
    maxZ: b.position[1] + b.half[1],
  })),
  ...PROP_COLLIDERS.map((p) => ({
    minX: p.center[0] - p.half[0],
    maxX: p.center[0] + p.half[0],
    minZ: p.center[1] - p.half[1],
    maxZ: p.center[1] + p.half[1],
  })),
];

// Walkable zones: the exterior world plus each interior room. The player is
// clamped to whichever zone they are currently standing in — rooms therefore
// need no wall colliders, and the only way between zones is a door teleport.
const ZONES: Rect[] = [
  { minX: WORLD_BOUNDS.minX, maxX: WORLD_BOUNDS.maxX, minZ: WORLD_BOUNDS.minZ, maxZ: WORLD_BOUNDS.maxZ },
  ...INTERIOR_ROOMS.map((r) => ({
    minX: r.center[0] - r.half[0],
    maxX: r.center[0] + r.half[0],
    minZ: r.center[1] - r.half[1],
    maxZ: r.center[1] + r.half[1],
  })),
];

function zoneFor(x: number, z: number): Rect {
  for (const r of ZONES) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r;
  }
  return ZONES[0];
}

function blocked(x: number, z: number): boolean {
  for (const r of colliders) {
    if (
      x > r.minX - PLAYER_RADIUS &&
      x < r.maxX + PLAYER_RADIUS &&
      z > r.minZ - PLAYER_RADIUS &&
      z < r.maxZ + PLAYER_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Move `pos` by (dx, dz) in place, resolving collisions axis-by-axis so the
 * player slides along walls instead of sticking, then clamp to the walkable
 * zone the move started in.
 */
export function resolveMove(pos: Vector3, dx: number, dz: number): void {
  const zone = zoneFor(pos.x, pos.z);

  const nx = pos.x + dx;
  if (!blocked(nx, pos.z)) pos.x = nx;
  const nz = pos.z + dz;
  if (!blocked(pos.x, nz)) pos.z = nz;

  pos.x = clamp(pos.x, zone.minX, zone.maxX);
  pos.z = clamp(pos.z, zone.minZ, zone.maxZ);
}
