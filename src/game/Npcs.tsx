import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { NPCS, type Npc } from "../data/npcs";
import { useGameStore } from "../store/useGameStore";

/** Renders the NPCs (F16). Stationary figures with a floating "talk" marker. */
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

  useFrame((state) => {
    if (marker.current) {
      const t = state.clock.elapsedTime;
      marker.current.position.y = 2.9 + (reduced ? 0 : Math.sin(t * 2 + npc.position[0]) * 0.12);
      if (!reduced) marker.current.rotation.y = t * 1.2;
    }
  });

  return (
    <group position={[npc.position[0], 0, npc.position[1]]} rotation-y={npc.facing ?? 0}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.7, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      {/* robe */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.66, 1.5, 12]} />
        <meshStandardMaterial color={npc.accent} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#e8c29a" />
      </mesh>
      {/* hood collar */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.22, 12]} />
        <meshStandardMaterial color={npc.accent} emissive={npc.accent} emissiveIntensity={0.3} />
      </mesh>

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
