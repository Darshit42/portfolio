import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial, PointLight } from "three";
import type { BuildingKind } from "../data/buildings";
import { useGameStore, selectGateOpen } from "../store/useGameStore";

const STONE = "#2b3344";
const STONE_DARK = "#1c2230";
const WOOD = "#4a3526";

/** Dispatch to the right silhouette for each building kind. */
export default function BuildingMesh({
  kind,
  accent,
}: {
  kind: BuildingKind;
  accent: string;
}) {
  switch (kind) {
    case "forge":
      return <Forge accent={accent} />;
    case "guildhall":
      return <GuildHall accent={accent} />;
    case "arena":
      return <Arena accent={accent} />;
    case "booth":
      return <Booth accent={accent} />;
    case "spire":
      return <Spire accent={accent} />;
    case "market":
      return <Market accent={accent} />;
    case "tavern":
      return <Tavern accent={accent} />;
    case "gate":
      return <Gate accent={accent} />;
  }
}

/** Pyramid roof via a 4-sided cone. */
function Roof({ size, height, y, color }: { size: number; height: number; y: number; color: string }) {
  return (
    <mesh position={[0, y, 0]} rotation-y={Math.PI / 4} castShadow>
      <coneGeometry args={[size, height, 4]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Forge({ accent }: { accent: string }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const light = useRef<PointLight>(null);
  const core = useRef<Mesh>(null);
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const flicker = 2.6 + Math.sin(t * 9) * 0.5 + Math.sin(t * 23) * 0.25;
    if (light.current) light.current.intensity = flicker;
    if (core.current) {
      const m = core.current.material as unknown as MeshStandardMaterial;
      m.emissiveIntensity = 1.4 + Math.sin(t * 9) * 0.4;
    }
  });
  return (
    <group>
      {/* stone base */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 5, 12]} />
        <meshStandardMaterial color={STONE_DARK} />
      </mesh>
      {/* roof */}
      <Roof size={9} height={3.5} y={6.5} color="#3a2f26" />
      {/* chimney */}
      <mesh position={[3.5, 8, -3.5]} castShadow>
        <cylinderGeometry args={[1, 1.2, 6, 12]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      {/* glowing forge mouth */}
      <mesh ref={core} position={[0, 1.8, 6]} castShadow>
        <boxGeometry args={[4, 2.6, 1.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* anvil */}
      <mesh position={[0, 0.9, 8.2]} castShadow>
        <boxGeometry args={[2, 1, 1.1]} />
        <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.4} />
      </mesh>
      <pointLight ref={light} position={[0, 3, 7]} color={accent} intensity={2.6} distance={26} decay={2} />
    </group>
  );
}

function GuildHall({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 5, 10]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <Roof size={9} height={3} y={6.3} color="#243a52" />
      {/* banners */}
      {[-3.5, 0, 3.5].map((x) => (
        <mesh key={x} position={[x, 3, 5.05]} castShadow>
          <boxGeometry args={[1.3, 3.2, 0.1]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* doorway */}
      <mesh position={[0, 1.6, 5.05]}>
        <boxGeometry args={[2.6, 3.2, 0.2]} />
        <meshStandardMaterial color={STONE_DARK} />
      </mesh>
    </group>
  );
}

function Arena({ accent }: { accent: string }) {
  const pillars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.cos(a) * 6.4, Math.sin(a) * 6.4] as const;
  });
  return (
    <group>
      {/* sand floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[6, 36]} />
        <meshStandardMaterial color="#b89b6b" />
      </mesh>
      {/* low wall ring */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[6.6, 6.8, 2, 36, 1, true]} />
        <meshStandardMaterial color={STONE} side={2} />
      </mesh>
      {pillars.map(([x, z], i) => (
        <mesh key={i} position={[x, 2, z]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 4, 8]} />
          <meshStandardMaterial color="#cdb78a" />
        </mesh>
      ))}
      {/* arena banner */}
      <mesh position={[0, 4.6, -6.4]} castShadow>
        <boxGeometry args={[5, 2, 0.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Booth({ accent }: { accent: string }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const orb = useRef<Mesh>(null);
  useFrame((state) => {
    if (orb.current) {
      orb.current.position.y = 5.4 + (reduced ? 0 : Math.sin(state.clock.elapsedTime * 1.5) * 0.25);
      if (!reduced) orb.current.rotation.y = state.clock.elapsedTime * 0.6;
    }
  });
  return (
    <group>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 4, 6]} />
        <meshStandardMaterial color="#322a45" />
      </mesh>
      {/* dome */}
      <mesh position={[0, 4, 0]} castShadow>
        <sphereGeometry args={[3.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#473a63" />
      </mesh>
      {/* floating oracle orb */}
      <mesh ref={orb} position={[0, 5.4, 0]}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Spire({ accent }: { accent: string }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const orb = useRef<Mesh>(null);
  useFrame((state) => {
    if (orb.current && !reduced) orb.current.rotation.y = state.clock.elapsedTime;
  });
  return (
    <group>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 3, 12, 12]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <Roof size={3.4} height={4.5} y={14.2} color="#1f3a2c" />
      {/* glowing top orb */}
      <mesh ref={orb} position={[0, 12.4, 0]}>
        <octahedronGeometry args={[0.9]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* windows */}
      {[3, 6, 9].map((y) => (
        <mesh key={y} position={[0, y, 2.6]}>
          <boxGeometry args={[0.8, 1.3, 0.2]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Market({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {/* striped awning */}
      <mesh position={[0, 3.4, 2.6]} rotation-x={-0.5} castShadow>
        <boxGeometry args={[8.4, 0.2, 3]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {/* crates */}
      {[
        [-2.6, 4],
        [2.8, 3.4],
        [3.4, 4.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.7, z]} castShadow>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#6b4f37" />
        </mesh>
      ))}
    </group>
  );
}

function Tavern({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 5, 9]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <Roof size={9} height={3} y={6.3} color="#3a2418" />
      {/* chimney */}
      <mesh position={[4, 7.5, -2.5]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 4, 10]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      {/* warm windows */}
      {[-3.5, 0, 3.5].map((x) => (
        <mesh key={x} position={[x, 2.6, 4.55]}>
          <boxGeometry args={[1.6, 1.8, 0.15]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* hanging sign */}
      <mesh position={[0, 4, 5.1]} castShadow>
        <boxGeometry args={[3.4, 1.2, 0.2]} />
        <meshStandardMaterial color="#241a12" />
      </mesh>
    </group>
  );
}

function Gate({ accent }: { accent: string }) {
  const open = useGameStore(selectGateOpen);
  const reduced = useGameStore((s) => s.reducedMotion);
  const portal = useRef<Mesh>(null);
  useFrame((state) => {
    if (portal.current && open && !reduced) {
      const m = portal.current.material as unknown as MeshStandardMaterial;
      m.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });
  return (
    <group>
      {/* pillars */}
      {[-3.5, 3.5].map((x) => (
        <mesh key={x} position={[x, 4, 0]} castShadow>
          <boxGeometry args={[1.6, 8, 1.6]} />
          <meshStandardMaterial color={STONE} />
        </mesh>
      ))}
      {/* lintel */}
      <mesh position={[0, 8.3, 0]} castShadow>
        <boxGeometry args={[9, 1.4, 1.8]} />
        <meshStandardMaterial color={STONE_DARK} />
      </mesh>
      {/* portal */}
      <mesh ref={portal} position={[0, 4, 0]}>
        <planeGeometry args={[6, 7.4]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={open ? 1 : 0.05}
          transparent
          opacity={open ? 0.6 : 0.12}
          toneMapped={false}
        />
      </mesh>
      {open && <pointLight position={[0, 4, 2]} color={accent} intensity={2} distance={22} decay={2} />}
    </group>
  );
}
