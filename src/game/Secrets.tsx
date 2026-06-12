import { SECRETS } from "../data/quests";

/** The hidden stones (F25). Deliberately subtle — a faint rune-glow among the
 *  trees rewards players who wander off the paths. */
export default function Secrets() {
  return (
    <group>
      {SECRETS.map((s) => (
        <group key={s.id} position={[s.position[0], 0, s.position[1]]}>
          <mesh position={[0, 0.45, 0]} rotation-y={0.6} rotation-z={0.12} castShadow>
            <dodecahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color="#39404e" flatShading emissive="#6ad0ff" emissiveIntensity={0.22} />
          </mesh>
          {/* moss cap */}
          <mesh position={[0, 0.95, 0]} rotation-y={1.1}>
            <dodecahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#1f3d2b" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
