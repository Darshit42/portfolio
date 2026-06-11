import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PLAZA_CENTER } from "../data/buildings";
import { PROJECTS } from "../data/projects";
import { useGameStore } from "../store/useGameStore";

/**
 * The plaza totem — the in-world relic tracker. One gem per project rises around
 * an obelisk; each ignites in its accent colour when its relic is claimed.
 */
export default function PlazaTotem() {
  const found = useGameStore((s) => s.foundRelics);
  const reduced = useGameStore((s) => s.reducedMotion);
  const ring = useRef<Group>(null);

  useFrame((state) => {
    if (ring.current && !reduced) ring.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group position={[PLAZA_CENTER[0], 0, PLAZA_CENTER[1]]}>
      {/* base */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.2, 2.6, 0.6, 6]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      {/* obelisk */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.8, 5.4, 6]} />
        <meshStandardMaterial color="#2b3344" />
      </mesh>
      <mesh position={[0, 6, 0]} castShadow>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#e8c66a" emissive="#e8c66a" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      {/* one gem per project, in a slow-spinning ring */}
      <group ref={ring} position={[0, 2.4, 0]}>
        {PROJECTS.map((p, i) => {
          const a = (i / PROJECTS.length) * Math.PI * 2;
          const claimed = found.has(p.id);
          return (
            <mesh key={p.id} position={[Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4]}>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                color={p.accent}
                emissive={p.accent}
                emissiveIntensity={claimed ? 1.6 : 0.08}
                toneMapped={false}
                transparent
                opacity={claimed ? 1 : 0.4}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
