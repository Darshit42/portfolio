import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { playerState } from "./playerState";

/**
 * True while the player is within `radius` of [x, z]. Polls the live player
 * position each frame but only re-renders on threshold crossings — used to
 * fade world labels in/out (PRD-art §8) and to gate per-relic lights (§7).
 * Must be used inside the Canvas.
 */
export function useNear(x: number, z: number, radius = 12): boolean {
  const [near, setNear] = useState(false);
  const ref = useRef(false);

  useFrame(() => {
    const n = Math.hypot(playerState.pos.x - x, playerState.pos.z - z) < radius;
    if (n !== ref.current) {
      ref.current = n;
      setNear(n);
    }
  });

  return near;
}
