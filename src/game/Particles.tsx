import { Sparkles } from "@react-three/drei";
import { BUILDINGS } from "../data/buildings";
import { useGameStore } from "../store/useGameStore";

/**
 * Ambient FX (F23): drifting motes over the realm + embers rising from the
 * Forge. Fully disabled under prefers-reduced-motion (PRD §5). Uses drei's
 * battle-tested Sparkles so there's no custom shader to babysit.
 */
export default function Particles() {
  const reduced = useGameStore((s) => s.reducedMotion);
  if (reduced) return null;

  const forge = BUILDINGS.find((b) => b.kind === "forge");

  return (
    <group>
      {/* ambient motes across the world */}
      <Sparkles
        count={70}
        scale={[92, 14, 86]}
        position={[0, 7, 0]}
        size={2.2}
        speed={0.22}
        color="#9fd8ff"
        opacity={0.35}
        noise={1.4}
      />
      {/* forge embers */}
      {forge && (
        <Sparkles
          count={26}
          scale={[7, 9, 7]}
          position={[forge.position[0], 5, forge.position[1]]}
          size={3.6}
          speed={0.5}
          color="#ff8a4c"
          opacity={0.75}
        />
      )}
    </group>
  );
}
