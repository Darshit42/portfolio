import type { MobId } from "../data/mobs";
import Bug from "./Bug";

/**
 * Mob mesh variants (presentational only — the <Enemies> sim moves the parent
 * slot group). One per MobId; <Enemies> mounts all four per slot and toggles
 * visibility so a slot's kind can change at runtime with no React churn.
 */
export default function MobMesh({ id, accent }: { id: MobId; accent: string }) {
  switch (id) {
    case "bug":
      return <Bug accent={accent} />;
    case "wisp":
      return <Wisp accent={accent} />;
    case "slime":
      return <Slime accent={accent} />;
    case "critter":
      return <Critter accent={accent} />;
  }
}

/** A floating will-o'-wisp: a glowing core in a soft halo. Blooms. */
function Wisp({ accent }: { accent: string }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 18, 18]} />
        <meshBasicMaterial color={accent} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* eyes */}
      {[0.11, -0.11].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.26]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#08111d" />
        </mesh>
      ))}
      <pointLight color={accent} intensity={3} distance={4} decay={2} />
    </group>
  );
}

/** A translucent hopping slime. */
function Slime({ accent }: { accent: string }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.78, 1]} castShadow>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} transparent opacity={0.82} flatShading />
      </mesh>
      {/* eyes */}
      {[0.18, -0.18].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.42]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#0a1f14" />
        </mesh>
      ))}
    </group>
  );
}

/** A quick shell-backed critter. */
function Critter({ accent }: { accent: string }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.42, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.3, 0]} scale={[1, 0.7, 1.25]} castShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#4a3420" flatShading />
      </mesh>
      {/* shell */}
      <mesh position={[0, 0.46, -0.05]} scale={[1, 0.6, 1.1]} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} flatShading />
      </mesh>
      {/* eyes */}
      {[0.13, -0.13].map((x) => (
        <mesh key={x} position={[x, 0.34, 0.42]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#10160a" />
        </mesh>
      ))}
      {/* antennae */}
      {[0.1, -0.1].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.36]} rotation-x={-0.6} rotation-z={x > 0 ? -0.3 : 0.3}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 4]} />
          <meshStandardMaterial color="#2a1c10" />
        </mesh>
      ))}
      {/* legs */}
      {[-0.32, 0.32].map((x) =>
        [-0.12, 0.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.12, z]} rotation-z={x > 0 ? -0.5 : 0.5}>
            <boxGeometry args={[0.34, 0.07, 0.07]} />
            <meshStandardMaterial color="#241810" />
          </mesh>
        )),
      )}
    </group>
  );
}
