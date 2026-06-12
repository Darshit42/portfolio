import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { useGameStore } from "../store/useGameStore";
import { MAT } from "./materials";
import { useNear } from "./useNear";

/**
 * A relic shrine (PRD-art §7): stone pedestal, a floating spinning gem, a soft
 * emissive ring on the ground, and an accent point light that only exists
 * while the player is nearby (so the global light budget holds — at most a
 * couple are ever active). Collected relics dim to a faint glow. The name
 * label fades in within ~13 units (§8).
 */
export default function RelicMonument({
  position,
  accent,
  projectId,
  label,
}: {
  position: [number, number];
  accent: string;
  projectId: string;
  label: string;
}) {
  const found = useGameStore((s) => s.foundRelics.has(projectId));
  const near = useGameStore((s) => s.nearby?.projectId === projectId);
  const reduced = useGameStore((s) => s.reducedMotion);
  const nearLabel = useNear(position[0], position[1], 13);

  const gem = useRef<Mesh>(null);
  const halo = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (gem.current) {
      gem.current.position.y = 2.6 + (reduced ? 0 : Math.sin(t * 1.6) * 0.22);
      if (!reduced) gem.current.rotation.y = t * 0.9;
      const target = near ? 1.25 : 1;
      const cur = gem.current.scale.x;
      gem.current.scale.setScalar(cur + (target - cur) * 0.1);
    }
    if (halo.current && !reduced) halo.current.rotation.z = t * 0.5;
  });

  // Collected relics settle to a faint glow; live ones burn bright.
  const emissive = found ? 0.45 : near ? 2.2 : 1.5;

  return (
    <group position={[position[0], 0, position[1]]}>
      {/* pedestal */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow material={MAT.stone}>
        <cylinderGeometry args={[0.9, 1.1, 0.8, 12]} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.15, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={found ? 0.25 : 0.4} />
      </mesh>

      {/* soft accent ring on the ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.35, 1.7, 28]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={found ? 0.18 : 0.5}
          transparent
          opacity={found ? 0.45 : 0.8}
        />
      </mesh>

      {/* the relic */}
      <mesh ref={gem} position={[0, 2.6, 0]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={emissive}
          toneMapped={false}
          flatShading
        />
      </mesh>

      {/* claimed halo */}
      {found && (
        <group ref={halo} position={[0, 2.6, 0]} rotation-x={Math.PI / 2}>
          <mesh>
            <torusGeometry args={[1.15, 0.05, 8, 32]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* proximity-gated accent light — at most a couple active world-wide */}
      {nearLabel && (
        <pointLight
          position={[0, 2.4, 0]}
          color={accent}
          intensity={found ? 7 : 14}
          distance={6}
          decay={2}
        />
      )}

      {/* name label — fades in within ~13 units */}
      <Html
        position={[0, 4.1, 0]}
        center
        distanceFactor={26}
        pointerEvents="none"
        style={{
          pointerEvents: "none",
          userSelect: "none",
          opacity: nearLabel ? 1 : 0,
          transition: "opacity 0.3s",
        }}
        zIndexRange={[10, 0]}
      >
        <div
          className="whitespace-nowrap rounded-md border px-2 py-0.5 font-display text-[13px] font-semibold"
          style={{
            borderColor: near ? accent : "rgba(255,255,255,0.12)",
            color: found ? "#e6ebf5" : near ? accent : "#9aa6bf",
            background: "rgba(11,14,26,0.75)",
          }}
        >
          {found ? "✓ " : ""}
          {label}
        </div>
      </Html>
    </group>
  );
}
