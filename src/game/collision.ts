import type { Vector3 } from "three";
import { BUILDINGS, WORLD_CENTER, WORLD_RADIUS } from "../data/buildings";
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

// Interior rooms are rectangular walkable zones (far from the exterior, reached
// only by a door teleport). The EXTERIOR is a disc (see resolveMove) so the
// player can walk right up to the circular treeline on every side.
const INTERIOR_ZONES: Rect[] = INTERIOR_ROOMS.map((r) => ({
  minX: r.center[0] - r.half[0],
  maxX: r.center[0] + r.half[0],
  minZ: r.center[1] - r.half[1],
  maxZ: r.center[1] + r.half[1],
}));

function interiorZoneFor(x: number, z: number): Rect | null {
  for (const r of INTERIOR_ZONES) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r;
  }
  return null;
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
 * area: an interior room (rectangle) or the exterior world (disc).
 */
export function resolveMove(pos: Vector3, dx: number, dz: number): void {
  const room = interiorZoneFor(pos.x, pos.z);

  const nx = pos.x + dx;
  if (!blocked(nx, pos.z)) pos.x = nx;
  const nz = pos.z + dz;
  if (!blocked(pos.x, nz)) pos.z = nz;

  if (room) {
    pos.x = clamp(pos.x, room.minX, room.maxX);
    pos.z = clamp(pos.z, room.minZ, room.maxZ);
    return;
  }
  // exterior: clamp to the playable disc
  const ox = pos.x - WORLD_CENTER[0];
  const oz = pos.z - WORLD_CENTER[1];
  const d = Math.hypot(ox, oz);
  if (d > WORLD_RADIUS) {
    pos.x = WORLD_CENTER[0] + (ox / d) * WORLD_RADIUS;
    pos.z = WORLD_CENTER[1] + (oz / d) * WORLD_RADIUS;
  }
}
