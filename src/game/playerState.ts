import { Vector3 } from "three";
import { SPAWN } from "../data/buildings";

/**
 * Authoritative live player transform, kept OUTSIDE React/Zustand so it can be
 * read/written every frame (camera, proximity, minimap) without triggering
 * re-renders. The store only holds discrete, UI-relevant facts.
 */
export const playerState = {
  pos: new Vector3(SPAWN[0], 0, SPAWN[1]),
  /** Facing angle in radians (around Y). */
  facing: Math.PI,
  /** True while the player is actively moving (for footstep/anim, P1). */
  moving: false,
};

export function resetPlayer(to: [number, number]) {
  playerState.pos.set(to[0], 0, to[1]);
  playerState.moving = false;
}
