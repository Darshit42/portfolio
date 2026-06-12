import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, PointLight } from "three";
import { PLAZA_CENTER } from "../data/buildings";
import { PROJECTS } from "../data/projects";
import { PALETTE } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import { MAT } from "./materials";

/**
 * The plaza centerpiece (PRD-art §2): a stone fountain-monument lit from
 * within — the brightest focal point in town — that doubles as the in-world
 * relic tracker. One gem per project floats in a slow ring around the core;
 * each ignites in its accent colour when its relic is claimed.
 */
export default function PlazaTotem() {
  const found = useGameStore((s) => s.foundRelics);
  const reduced = useGameStore((s) => s.reducedMotion);
  const ring = useRef<Group>(null);
  const light = useRef<PointLight>(null);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    if (ring.current) ring.current.rotation.y = t * 0.3;
    if (light.current) {
      light.current.intensity = 3 * (1 + (Math.sin(t * 6.1) * 0.6 + Math.sin(t * 15.7) * 0.4) * 0.1);
    }
  });

  return (
    <group position={[PLAZA_CENTER[0], 0, PLAZA_CENTER[1]]}>
      {/* basin */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow material={MAT.stone}>
        <cylinderGeometry args={[3.4, 3.7, 0.9, 12]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={MAT.stoneDark}>
        <cylinderGeometry args={[3.0, 3.4, 0.18, 12]} />
      </mesh>
      {/* warm water surface, lit from beneath */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.88, 0]}>
        <circleGeometry args={[2.9, 24]} />
        <meshStandardMaterial
          color="#3a2c14"
          emissive={PALETTE.warmLight}
          emissiveIntensity={0.42}
        />
      </mesh>

      {/* central monument */}
      <mesh position={[0, 2.2, 0]} castShadow material={MAT.stone}>
        <cylinderGeometry args={[0.55, 1.0, 3.4, 6]} />
      </mesh>
      {/* the glowing heart — pushes past the bloom threshold */}
      <mesh position={[0, 3.0, 0]} material={MAT.warmCore}>
        <cylinderGeometry args={[0.3, 0.3, 1.6, 6]} />
      </mesh>
      <mesh position={[0, 4.45, 0]} castShadow material={MAT.stoneDark}>
        <coneGeometry args={[0.7, 0.9, 6]} />
      </mesh>
      <mesh position={[0, 5.1, 0]} material={MAT.warmCore}>
        <octahedronGeometry args={[0.32]} />
      </mesh>

      {/* the town's hearth-light */}
      <pointLight
        ref={light}
        position={[0, 3.4, 0]}
        color={PALETTE.warmLight}
        intensity={3}
        distance={24}
        decay={2}
      />

      {/* relic tracker: one gem per project, igniting as relics are claimed */}
      <group ref={ring} position={[0, 2.6, 0]}>
        {PROJECTS.map((p, i) => {
          const a = (i / PROJECTS.length) * Math.PI * 2;
          const claimed = found.has(p.id);
          return (
            <mesh key={p.id} position={[Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5]}>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color={p.accent}
                emissive={p.accent}
                emissiveIntensity={claimed ? 1.6 : 0.07}
                toneMapped={false}
                transparent
                opacity={claimed ? 1 : 0.38}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
