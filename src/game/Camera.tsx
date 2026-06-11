import { useThree, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useRef } from "react";
import { playerState } from "./playerState";

// Fixed three-quarter (dimetric) offset — the classic semi-3D RPG angle.
const OFFSET = new Vector3(15, 23, 18);
const LOOK_LIFT = new Vector3(0, 1.2, 0);

/**
 * Camera rig that follows the player from a fixed dimetric angle with gentle,
 * frame-rate-independent damping. Mounted inside <Canvas>.
 */
export default function FollowCamera() {
  const camera = useThree((s) => s.camera);
  const desired = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const initialized = useRef(false);

  useFrame((_, delta) => {
    desired.current.copy(playerState.pos).add(OFFSET);

    if (!initialized.current) {
      camera.position.copy(desired.current);
      initialized.current = true;
    } else {
      // damping: approaches target smoothly regardless of frame rate
      const k = 1 - Math.exp(-7 * delta);
      camera.position.lerp(desired.current, k);
    }

    lookAt.current.copy(playerState.pos).add(LOOK_LIFT);
    camera.lookAt(lookAt.current);
  });

  return null;
}
