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
      {/* ambient motes — cool night air, kept dim against the warm town */}
      <Sparkles
        count={70}
        scale={[92, 14, 86]}
        position={[0, 7, 0]}
        size={2.0}
        speed={0.22}
        color="#7d9cc8"
        opacity={0.28}
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
          color="#ff6622"
          opacity={0.75}
        />
      )}
    </group>
  );
}
