/** Deterministic PRNG — the world dresses itself identically every visit. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { BUILDINGS, PLAZA_CENTER } from "../data/buildings";

/** True if [x,z] is clear of all building footprints (+margin) and the plaza. */
export function clearOfStructures(x: number, z: number, margin = 4, plazaR = 14): boolean {
  if (Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) < plazaR) return false;
  for (const b of BUILDINGS) {
    const m = Math.max(b.half[0], b.half[1]) + margin;
    if (Math.abs(x - b.position[0]) < m && Math.abs(z - b.position[1]) < m) return false;
  }
  return true;
}
