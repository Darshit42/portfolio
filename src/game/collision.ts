import type { Vector3 } from "three";
import { BUILDINGS, WORLD_BOUNDS } from "../data/buildings";

/** Axis-aligned bounding rect in world XZ. */
interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const PLAYER_RADIUS = 0.9;

// Static collider registry, built once from building footprints. Buildings are
// unique and never move, so a flat array + linear scan is plenty (n < 10).
const colliders: Rect[] = BUILDINGS.map((b) => ({
  minX: b.position[0] - b.half[0],
  maxX: b.position[0] + b.half[0],
  minZ: b.position[1] - b.half[1],
  maxZ: b.position[1] + b.half[1],
}));

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
 * player slides along walls instead of sticking, then clamp to world bounds.
 */
export function resolveMove(pos: Vector3, dx: number, dz: number): void {
  const nx = pos.x + dx;
  if (!blocked(nx, pos.z)) pos.x = nx;
  const nz = pos.z + dz;
  if (!blocked(pos.x, nz)) pos.z = nz;

  pos.x = clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
  pos.z = clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
}
