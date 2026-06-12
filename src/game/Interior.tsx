import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial, PointLight } from "three";
import { INTERIOR_ROOMS, type InteriorRoom } from "../data/interiors";
import { useGameStore } from "../store/useGameStore";

/**
 * Interior scenes (F18) for the Tavern and the Forge. Rooms sit far beyond the
 * fog plane so each reads as its own scene. Full walls face north + west (the
 * dimetric camera's backdrop); low rails face south + east so the camera sees
 * in. Prop visuals match the PROP_COLLIDERS entries in data/interiors.ts.
 */
export default function Interior() {
  return (
    <group>
      {INTERIOR_ROOMS.map((room) => (
        <RoomShell key={room.id} room={room} />
      ))}
      <TavernProps />
      <ForgeProps />
    </group>
  );
}

function RoomShell({ room }: { room: InteriorRoom }) {
  const [cx, cz] = room.center;
  const [hx, hz] = room.half;
  const minX = cx - hx;
  const maxX = cx + hx;
  const minZ = cz - hz;
  const maxZ = cz + hz;
  const width = hx * 2;
  const depth = hz * 2;

  // South rail is split around the door gap.
  const gap = 1.3;
  const westSegLen = room.doorX - gap - (minX - 0.8);
  const westSegCx = (minX - 0.8 + (room.doorX - gap)) / 2;
  const eastSegLen = maxX + 0.8 - (room.doorX + gap);
  const eastSegCx = (room.doorX + gap + (maxX + 0.8)) / 2;

  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, -0.01, cz]}>
        <planeGeometry args={[width + 1.8, depth + 1.8]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>

      {/* full walls: north + west (the backdrop) */}
      <mesh position={[cx, 2.1, minZ - 0.4]}>
        <boxGeometry args={[width + 1.6, 4.2, 0.8]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[minX - 0.4, 2.1, cz]}>
        <boxGeometry args={[0.8, 4.2, depth + 1.6]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>

      {/* accent trim along the wall tops */}
      <mesh position={[cx, 4.0, minZ - 0.4]}>
        <boxGeometry args={[width + 1.6, 0.12, 0.14]} />
        <meshStandardMaterial color={room.accent} emissive={room.accent} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[minX - 0.4, 4.0, cz]}>
        <boxGeometry args={[0.14, 0.12, depth + 1.6]} />
        <meshStandardMaterial color={room.accent} emissive={room.accent} emissiveIntensity={0.35} />
      </mesh>

      {/* low rails: east + south (camera side), door gap in the south */}
      <mesh position={[maxX + 0.3, 0.42, cz]}>
        <boxGeometry args={[0.6, 0.85, depth + 1.6]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[westSegCx, 0.42, maxZ + 0.3]}>
        <boxGeometry args={[westSegLen, 0.85, 0.6]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      <mesh position={[eastSegCx, 0.42, maxZ + 0.3]}>
        <boxGeometry args={[eastSegLen, 0.85, 0.6]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>

      {/* door mat at the gap */}
      <mesh position={[room.doorX, 0.01, maxZ + 0.2]}>
        <boxGeometry args={[2.4, 0.05, 1.2]} />
        <meshStandardMaterial color={room.accent} emissive={room.accent} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

const WOOD = "#5a4030";
const WOOD_LIGHT = "#6b4f37";
const STONE = "#2b3344";

function TavernProps() {
  const reduced = useGameStore((s) => s.reducedMotion);
  const fireLight = useRef<PointLight>(null);

  useFrame((state) => {
    if (reduced || !fireLight.current) return;
    const t = state.clock.elapsedTime;
    // physical light units (three r155+): hearth glow needs candela-scale values
    fireLight.current.intensity = 18 + Math.sin(t * 7.3) * 3 + Math.sin(t * 19) * 1.4;
  });

  const bottleColors = ["#b06cff", "#39d98a", "#e8c66a", "#ff5470", "#6ad0ff"];

  return (
    <group>
      {/* bar counter (collider at [154.8, 58.8] half [0.7, 2.6]) */}
      <mesh position={[154.8, 0.55, 58.8]} castShadow>
        <boxGeometry args={[1.4, 1.1, 5.2]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[154.8, 1.16, 58.8]}>
        <boxGeometry args={[1.7, 0.12, 5.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} />
      </mesh>

      {/* shelves + bottles on the west wall */}
      {[1.8, 2.5].map((y) => (
        <mesh key={y} position={[153.25, y, 58.8]}>
          <boxGeometry args={[0.28, 0.1, 4.2]} />
          <meshStandardMaterial color={WOOD_LIGHT} />
        </mesh>
      ))}
      {bottleColors.map((c, i) => (
        <mesh key={c} position={[153.25, (i % 2 === 0 ? 1.8 : 2.5) + 0.22, 57.2 + i * 0.8]}>
          <cylinderGeometry args={[0.09, 0.09, 0.34, 8]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* bar stools */}
      {[56.9, 58.8, 60.7].map((z) => (
        <mesh key={z} position={[156.7, 0.33, z]} castShadow>
          <cylinderGeometry args={[0.34, 0.3, 0.66, 10]} />
          <meshStandardMaterial color={WOOD_LIGHT} />
        </mesh>
      ))}

      {/* tables (colliders at [161.5,62] and [164,58]) */}
      {(
        [
          [161.5, 62],
          [164, 58],
        ] as const
      ).map(([x, z]) => (
        <group key={`${x}-${z}`}>
          <mesh position={[x, 0.48, z]}>
            <cylinderGeometry args={[0.16, 0.2, 0.95, 8]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          <mesh position={[x, 1.0, z]} castShadow>
            <cylinderGeometry args={[0.95, 0.95, 0.1, 16]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          {/* candle */}
          <mesh position={[x, 1.16, z]}>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 8]} />
            <meshStandardMaterial color="#e8e0c8" />
          </mesh>
          <mesh position={[x, 1.32, z]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#ffb066" emissive="#ffb066" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          {/* stools */}
          <mesh position={[x - 1.45, 0.28, z]}>
            <cylinderGeometry args={[0.3, 0.27, 0.55, 10]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
          <mesh position={[x + 1.45, 0.28, z]}>
            <cylinderGeometry args={[0.3, 0.27, 0.55, 10]} />
            <meshStandardMaterial color={WOOD_LIGHT} />
          </mesh>
        </group>
      ))}

      {/* fireplace (collider at [163.5, 55.2] half [1.2, 0.7]) */}
      <mesh position={[163.5, 1.35, 55.2]} castShadow>
        <boxGeometry args={[2.4, 2.7, 1.1]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <mesh position={[163.5, 2.05, 55.2]}>
        <boxGeometry args={[2.6, 0.15, 1.25]} />
        <meshStandardMaterial color="#39404e" />
      </mesh>
      <mesh position={[163.5, 0.72, 55.82]}>
        <boxGeometry args={[1.3, 1.1, 0.2]} />
        <meshStandardMaterial color="#ff9a4c" emissive="#ff9a4c" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      <pointLight ref={fireLight} position={[163.5, 1.8, 56.6]} color="#ff9a4c" intensity={18} distance={18} decay={2} />

      {/* rug */}
      <mesh rotation-x={-Math.PI / 2} position={[158.8, 0.02, 61]}>
        <circleGeometry args={[1.9, 24]} />
        <meshStandardMaterial color="#5a2430" />
      </mesh>
    </group>
  );
}

function ForgeProps() {
  const reduced = useGameStore((s) => s.reducedMotion);
  const forgeLight = useRef<PointLight>(null);
  const maw = useRef<Mesh>(null);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    // physical light units (three r155+)
    if (forgeLight.current) forgeLight.current.intensity = 30 + Math.sin(t * 9) * 6 + Math.sin(t * 23) * 3;
    if (maw.current) {
      (maw.current.material as unknown as MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 9) * 0.45;
    }
  });

  return (
    <group>
      {/* great furnace (collider at [160, -64.4] half [1.8, 1.0]) */}
      <mesh position={[160, 1.7, -64.4]} castShadow>
        <boxGeometry args={[3.6, 3.4, 1.8]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <mesh ref={maw} position={[160, 1.05, -63.42]}>
        <boxGeometry args={[1.9, 1.5, 0.25]} />
        <meshStandardMaterial color="#ff7a3c" emissive="#ff7a3c" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[161.2, 4.3, -64.6]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 2.4, 10]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      <pointLight ref={forgeLight} position={[160, 1.9, -62.4]} color="#ff7a3c" intensity={30} distance={20} decay={2} />

      {/* anvil (collider at [159, -59.5] half [0.8, 0.5]) */}
      <mesh position={[159, 0.3, -59.5]}>
        <boxGeometry args={[0.8, 0.6, 0.6]} />
        <meshStandardMaterial color="#1c2230" />
      </mesh>
      <mesh position={[159, 0.8, -59.5]} castShadow>
        <boxGeometry args={[1.7, 0.42, 0.55]} />
        <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* workbench (collider at [154.2, -61] half [0.8, 1.8]) */}
      <mesh position={[154.2, 0.92, -61]} castShadow>
        <boxGeometry args={[1.5, 0.14, 3.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} />
      </mesh>
      {(
        [
          [153.6, -62.5],
          [154.8, -62.5],
          [153.6, -59.5],
          [154.8, -59.5],
        ] as const
      ).map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.45, z]}>
          <boxGeometry args={[0.16, 0.9, 0.16]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      {/* tools on the bench */}
      <mesh position={[154.2, 1.05, -61.8]} rotation-y={0.5}>
        <boxGeometry args={[0.7, 0.08, 0.16]} />
        <meshStandardMaterial color="#39404e" />
      </mesh>
      <mesh position={[154.2, 1.05, -60.4]} rotation-y={-0.3}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
        <meshStandardMaterial color="#4a3526" />
      </mesh>

      {/* quench barrel (collider at [164.5, -57.5] half [0.6, 0.6]) */}
      <mesh position={[164.5, 0.47, -57.5]} castShadow>
        <cylinderGeometry args={[0.6, 0.55, 0.95, 12]} />
        <meshStandardMaterial color="#4a3526" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[164.5, 0.96, -57.5]}>
        <circleGeometry args={[0.5, 12]} />
        <meshStandardMaterial color="#1c4a5a" emissive="#2a8aaa" emissiveIntensity={0.3} />
      </mesh>

      {/* broken artifacts awaiting repair */}
      {(
        [
          [157.6, -63.4, 0.35, 0],
          [158.3, -63.9, 0.28, 0.4],
          [157.9, -62.7, 0.3, 0.25],
        ] as const
      ).map(([x, z, r, glow], i) => (
        <mesh key={i} position={[x, r * 0.7, z]} rotation-y={x + z}>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial
            color="#39404e"
            flatShading
            emissive="#ff7a3c"
            emissiveIntensity={glow}
          />
        </mesh>
      ))}

      {/* rising embers */}
      {!reduced && (
        <Sparkles
          count={18}
          scale={[4.5, 3, 3]}
          position={[160, 1.8, -62.6]}
          size={3.4}
          speed={0.55}
          color="#ff8a4c"
          opacity={0.8}
        />
      )}
    </group>
  );
}
