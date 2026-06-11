import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { useGameStore } from "../store/useGameStore";

/**
 * A floating relic above a pedestal at a building's entrance. Pulses to draw the
 * eye; brightens when the player is near; settles into a "claimed" halo once
 * inspected. Visuals only — proximity/interaction is resolved centrally in
 * <Player>; this just reflects store state.
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

  const emissive = found ? 1 : near ? 2.2 : 1.5;

  return (
    <group position={[position[0], 0, position[1]]}>
      {/* pedestal */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.8, 12]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.7, 0.9, 0.15, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={found ? 0.6 : 0.3} />
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
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1} toneMapped={false} />
          </mesh>
        </group>
      )}

      {/* name label — non-interactive, scales with distance */}
      <Html
        position={[0, 4.1, 0]}
        center
        distanceFactor={26}
        pointerEvents="none"
        style={{ pointerEvents: "none", userSelect: "none" }}
        zIndexRange={[10, 0]}
      >
        <div
          className="whitespace-nowrap rounded-md border px-2 py-0.5 font-display text-[13px] font-semibold"
          style={{
            borderColor: near ? accent : "rgba(255,255,255,0.12)",
            color: found ? "#e6ebf5" : near ? accent : "#9aa6bf",
            background: "rgba(10,12,18,0.7)",
            opacity: near ? 1 : 0.85,
          }}
        >
          {found ? "✓ " : ""}
          {label}
        </div>
      </Html>
    </group>
  );
}
