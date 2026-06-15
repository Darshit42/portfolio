import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { NPCS, type Npc } from "../data/npcs";
import { rigConfig } from "../data/rigs";
import { useGameStore } from "../store/useGameStore";
import CharacterRig, { makeRigCtrl } from "./CharacterRig";

// NPCs face the dimetric camera so the player sees them greet.
const CAMERA_HEADING = Math.atan2(15, 18);

/** Renders the NPCs (F16) as pixel sprites with a floating "talk" marker. */
export default function Npcs() {
  return (
    <group>
      {NPCS.map((npc) => (
        <NpcFigure key={npc.id} npc={npc} />
      ))}
    </group>
  );
}

function NpcFigure({ npc }: { npc: Npc }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const near = useGameStore((s) => s.nearby?.kind === "npc" && s.nearby.id === npc.id);
  const marker = useRef<Group>(null);
  const ctrl = useRef(makeRigCtrl(CAMERA_HEADING));

  useFrame((state) => {
    if (marker.current) {
      const t = state.clock.elapsedTime;
      marker.current.position.y = 2.9 + (reduced ? 0 : Math.sin(t * 2 + npc.position[0]) * 0.12);
      if (!reduced) marker.current.rotation.y = t * 1.2;
    }
  });

  return (
    <group position={[npc.position[0], 0, npc.position[1]]}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.6, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      <CharacterRig config={rigConfig(npc.id)} ctrl={ctrl.current} />

      {/* floating talk marker */}
      <group ref={marker} position={[0, 2.9, 0]}>
        <mesh scale={near ? 1.3 : 1}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={npc.accent}
            emissive={npc.accent}
            emissiveIntensity={near ? 2 : 1.1}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
