import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  MeshStandardMaterial,
  SpriteMaterial,
  type Group,
  type Mesh,
  type PointLight,
  type Sprite,
} from "three";
import type { BuildingKind } from "../data/buildings";
import { PALETTE } from "../data/config";
import { useGameStore, selectGateOpen } from "../store/useGameStore";
import { MAT, accentMat } from "./materials";

/**
 * Building pass (PRD-art §5). Every structure is modeled with its FRONT at
 * local +z; Buildings.tsx rotates each group so the front faces its approach
 * point. Shared palette materials throughout — only animated materials (forge
 * maw, gate portal) own unique instances. Torch flames here are emissive-only;
 * the budgeted real lights live in Torches.tsx (plus the forge's inner glow).
 */
export default function BuildingMesh({ kind, accent }: { kind: BuildingKind; accent: string }) {
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

/* ------------------------------- shared bits ------------------------------ */

/** Pyramid roof with a visible eaves overhang. */
function Roof({ w, d, top, h }: { w: number; d: number; top: number; h: number }) {
  const r = (Math.max(w, d) + 1.8) / Math.SQRT2;
  return (
    <group>
      <mesh position={[0, top + 0.1, 0]} castShadow material={MAT.roof}>
        <boxGeometry args={[w + 1.1, 0.22, d + 1.1]} />
      </mesh>
      <mesh position={[0, top + h / 2 + 0.2, 0]} rotation-y={Math.PI / 4} castShadow material={MAT.roof}>
        <coneGeometry args={[r, h, 4]} />
      </mesh>
    </group>
  );
}

function Window({ pos, rotY = 0, w = 0.95, h = 1.25 }: { pos: [number, number, number]; rotY?: number; w?: number; h?: number }) {
  return (
    <mesh position={pos} rotation-y={rotY} material={MAT.window}>
      <boxGeometry args={[w, h, 0.14]} />
    </mesh>
  );
}

function Door({ pos, w = 2.2, h = 3 }: { pos: [number, number, number]; w?: number; h?: number }) {
  return (
    <group>
      <mesh position={pos} material={MAT.woodLight}>
        <boxGeometry args={[w, h, 0.22]} />
      </mesh>
      <mesh position={[pos[0], 0.06, pos[2] + 0.5]} material={MAT.stoneDark}>
        <boxGeometry args={[w + 0.5, 0.12, 1.0]} />
      </mesh>
    </group>
  );
}

/** Hanging sign on a bracket, tinted with the building's accent. */
function Sign({ accent, pos }: { accent: string; pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.45, -0.35]} material={MAT.woodDark}>
        <boxGeometry args={[0.12, 0.12, 1.0]} />
      </mesh>
      <mesh material={accentMat(accent, 0.55)}>
        <boxGeometry args={[1.15, 0.8, 0.08]} />
      </mesh>
    </group>
  );
}

/** 3 slowly rising, fading smoke sprites above a chimney. */
function Smoke({ pos }: { pos: [number, number, number] }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const mats = useMemo(
    () =>
      Array.from(
        { length: 3 },
        () => new SpriteMaterial({ color: "#8d93a1", transparent: true, opacity: 0, depthWrite: false }),
      ),
    [],
  );
  const refs = useRef<(Sprite | null)[]>([]);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < 3; i++) {
      const s = refs.current[i];
      if (!s) continue;
      const p = (t * 0.3 + i / 3) % 1;
      s.position.set(pos[0] + Math.sin(t * 0.7 + i * 2.4) * 0.35 * p, pos[1] + p * 3.8, pos[2]);
      s.scale.setScalar(0.55 + p * 1.5);
      mats[i].opacity = (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85) * 0.2;
    }
  });

  if (reduced) return null;
  return (
    <>
      {mats.map((m, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          material={m}
          position={pos}
        />
      ))}
    </>
  );
}

function Chimney({ pos, h = 3.2 }: { pos: [number, number, number]; h?: number }) {
  return (
    <group>
      <mesh position={pos} castShadow material={MAT.stone}>
        <cylinderGeometry args={[0.55, 0.7, h, 8]} />
      </mesh>
      <Smoke pos={[pos[0], pos[1] + h / 2 + 0.2, pos[2]]} />
    </group>
  );
}

/** Emissive-only torch (pole + flame). Real lights are budgeted elsewhere. */
function TorchPillar({ pos, h = 3.4 }: { pos: [number, number, number]; h?: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]} castShadow material={MAT.stone}>
        <cylinderGeometry args={[0.4, 0.5, h, 6]} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} material={MAT.flame}>
        <coneGeometry args={[0.22, 0.6, 6]} />
      </mesh>
    </group>
  );
}

/* ------------------------------ the buildings ----------------------------- */

function Forge({ accent }: { accent: string }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const light = useRef<PointLight>(null);
  const maw = useMemo(
    () =>
      new MeshStandardMaterial({
        color: PALETTE.ember,
        emissive: PALETTE.ember,
        emissiveIntensity: 1.6,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    if (light.current) light.current.intensity = 3 * (1 + (Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4) * 0.15);
    maw.emissiveIntensity = 1.6 + Math.sin(t * 9) * 0.45;
  });

  return (
    <group>
      {/* closed back volume + open-front side walls */}
      <mesh position={[0, 2.5, -2.5]} castShadow receiveShadow material={MAT.stoneDark}>
        <boxGeometry args={[12, 5, 7]} />
      </mesh>
      {[-4.25, 4.25].map((x) => (
        <mesh key={x} position={[x, 2.5, 3.5]} castShadow material={MAT.stoneDark}>
          <boxGeometry args={[3.5, 5, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 4.5, 5.4]} castShadow material={MAT.stoneDark}>
        <boxGeometry args={[5, 1.1, 1.0]} />
      </mesh>

      <Roof w={12} d={12} top={5} h={3.4} />
      <Chimney pos={[3.5, 6.6, -3.5]} h={3.6} />

      {/* the glowing workshop inside the opening */}
      <mesh position={[0, 1.35, 1.6]} material={MAT.stone}>
        <boxGeometry args={[3.2, 2.7, 1.4]} />
      </mesh>
      <mesh position={[0, 1.15, 2.42]} material={maw}>
        <boxGeometry args={[1.8, 1.3, 0.2]} />
      </mesh>
      {/* anvil */}
      <mesh position={[1.1, 0.35, 4.0]} material={MAT.stoneDark}>
        <boxGeometry args={[0.7, 0.7, 0.55]} />
      </mesh>
      <mesh position={[1.1, 0.85, 4.0]} material={MAT.metal}>
        <boxGeometry args={[1.6, 0.4, 0.5]} />
      </mesh>
      <Sparks origin={[0.4, 1.1, 3.2]} />

      {/* the budgeted strong interior glow */}
      <pointLight ref={light} position={[0, 2.2, 3.2]} color="#ff5522" intensity={3} distance={16} decay={2} />

      {/* side windows + sign */}
      <Window pos={[-6.06, 2.6, -1.5]} rotY={Math.PI / 2} />
      <Window pos={[6.06, 2.6, -1.5]} rotY={Math.PI / 2} />
      <Sign accent={accent} pos={[3.4, 3.7, 6.15]} />
    </group>
  );
}

function Sparks({ origin }: { origin: [number, number, number] }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const refs = useRef<(Mesh | null)[]>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        phase: i * 0.41,
        dx: ((i % 3) - 1) * 0.55 + 0.2,
        dz: (((i * 7) % 3) - 1) * 0.45,
        spd: 0.85 + (i % 2) * 0.5,
      })),
    [],
  );

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const s = seeds[i];
      const c = (t * s.spd + s.phase) % 1;
      const on = c < 0.22;
      m.visible = on;
      if (on) {
        const p = c / 0.22;
        m.position.set(origin[0] + s.dx * p, origin[1] + 1.7 * p, origin[2] + s.dz * p);
        m.scale.setScalar(1 - p * 0.7);
      }
    }
  });

  if (reduced) return null;
  return (
    <>
      {seeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          material={MAT.spark}
          visible={false}
        >
          <sphereGeometry args={[0.07, 6, 6]} />
        </mesh>
      ))}
    </>
  );
}

function GuildHall({ accent }: { accent: string }) {
  return (
    <group>
      {/* the grandest hall in town */}
      <mesh position={[0, 0.4, 0]} receiveShadow material={MAT.stoneDark}>
        <boxGeometry args={[12.6, 0.8, 10.6]} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow material={MAT.stone}>
        <boxGeometry args={[12, 7, 10]} />
      </mesh>
      {/* front pilasters */}
      {[-5.6, 5.6].map((x) => (
        <mesh key={x} position={[x, 3.5, 5.1]} castShadow material={MAT.stoneDark}>
          <boxGeometry args={[0.7, 7, 0.5]} />
        </mesh>
      ))}

      <Roof w={12} d={10} top={7} h={3} />
      <Chimney pos={[-4, 8.2, -2.5]} h={3.2} />

      {/* banners between the windows */}
      {[-3.6, 0, 3.6].map((x) => (
        <mesh key={x} position={[x, 4.6, 5.12]} material={accentMat(accent, 0.4)}>
          <boxGeometry args={[1.3, 3.4, 0.08]} />
        </mesh>
      ))}

      <Window pos={[-1.9, 5.5, 5.06]} />
      <Window pos={[1.9, 5.5, 5.06]} />
      <Window pos={[-5.0, 2.4, 5.06]} w={0.8} h={1.1} />
      <Window pos={[5.0, 2.4, 5.06]} w={0.8} h={1.1} />

      <Door pos={[0, 1.55, 5.12]} w={2.4} h={3.1} />
      <Sign accent={accent} pos={[-2.2, 3.9, 5.4]} />

      {/* notice board out front */}
      <group position={[4.6, 0, 7.2]} rotation-y={-0.15}>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 0.85, 0]} material={MAT.woodDark}>
            <boxGeometry args={[0.14, 1.7, 0.14]} />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0]} material={MAT.woodDark}>
          <boxGeometry args={[1.95, 1.1, 0.1]} />
        </mesh>
        {[
          [-0.55, 1.55],
          [0.1, 1.3],
          [0.6, 1.6],
        ].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.07]} material={MAT.paper}>
            <boxGeometry args={[0.42, 0.5, 0.02]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Arena({ accent }: { accent: string }) {
  return (
    <group>
      {/* night sand */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[6, 36]} />
        <meshStandardMaterial color="#6e5d42" />
      </mesh>
      {/* low stone ring with a front gap */}
      <mesh position={[0, 0.85, 0]} material={MAT.stone}>
        <cylinderGeometry args={[6.6, 6.85, 1.7, 36, 1, true, 0.35, Math.PI * 2 - 0.7]} />
      </mesh>
      <mesh position={[0, 1.78, 0]} material={MAT.stoneDark}>
        <torusGeometry args={[6.72, 0.16, 6, 36]} />
      </mesh>

      {/* four pillar torches (emissive flames; no lights — §2 budget) */}
      {[45, 135, 225, 315].map((deg) => {
        const a = (deg / 180) * Math.PI;
        return <TorchPillar key={deg} pos={[Math.cos(a) * 6.7, 0, Math.sin(a) * 6.7]} />;
      })}

      {/* champion's banner at the back */}
      <mesh position={[0, 3.6, -6.8]} castShadow material={accentMat(accent, 0.45)}>
        <boxGeometry args={[4.4, 1.8, 0.14]} />
      </mesh>
      {[-2.0, 2.0].map((x) => (
        <mesh key={x} position={[x, 2.2, -6.8]} material={MAT.woodDark}>
          <boxGeometry args={[0.16, 4.4, 0.16]} />
        </mesh>
      ))}
    </group>
  );
}

function Booth({ accent }: { accent: string }) {
  return (
    <group>
      {/* low walls under a tent-like angular canopy */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow material={MAT.woodDark}>
        <boxGeometry args={[6.2, 2.5, 6.2]} />
      </mesh>
      {[
        [-3.0, -3.0],
        [3.0, -3.0],
        [-3.0, 3.0],
        [3.0, 3.0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]} material={MAT.woodLight}>
          <boxGeometry args={[0.22, 3.0, 0.22]} />
        </mesh>
      ))}
      <mesh position={[0, 4.2, 0]} rotation-y={Math.PI / 4} castShadow material={accentMat(accent, 0.12)}>
        <coneGeometry args={[5.4, 3.4, 4]} />
      </mesh>

      {/* purple-tinted window glow + hanging crystal */}
      <Window pos={[-1.9, 1.6, 3.18]} w={0.75} h={0.95} />
      <mesh position={[1.9, 1.6, 3.18]} material={accentMat(accent, 1.25)}>
        <boxGeometry args={[0.75, 0.95, 0.14]} />
      </mesh>
      <mesh position={[0, 3.55, 3.6]} material={MAT.woodDark}>
        <boxGeometry args={[0.06, 0.9, 0.06]} />
      </mesh>
      <mesh position={[0, 2.95, 3.6]} material={accentMat(accent, 1.5)}>
        <octahedronGeometry args={[0.42, 0]} />
      </mesh>

      <Door pos={[0, 1.2, 3.18]} w={1.6} h={2.4} />
      <Sign accent={accent} pos={[2.6, 2.9, 3.45]} />
    </group>
  );
}

function Spire({ accent }: { accent: string }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const runes = useRef<Group>(null);

  useFrame((state) => {
    if (runes.current && !reduced) runes.current.rotation.y = state.clock.elapsedTime * 0.35;
  });

  return (
    <group>
      <mesh position={[0, 0.55, 0]} receiveShadow material={MAT.stoneDark}>
        <cylinderGeometry args={[3.6, 3.9, 1.1, 10]} />
      </mesh>
      <mesh position={[0, 6.5, 0]} castShadow receiveShadow material={MAT.stone}>
        <cylinderGeometry args={[2.4, 3.2, 12, 10]} />
      </mesh>
      <mesh position={[0, 13.2, 0]} material={MAT.stoneDark}>
        <cylinderGeometry args={[2.7, 2.5, 0.5, 10]} />
      </mesh>
      <mesh position={[0, 15.4, 0]} castShadow material={MAT.roof}>
        <coneGeometry args={[3.2, 4.2, 10]} />
      </mesh>

      {/* warm lower windows + the glowing top chamber */}
      <Window pos={[0, 3.0, 3.0]} w={0.8} h={1.2} />
      <Window pos={[0, 6.2, 2.82]} w={0.8} h={1.2} />
      <Window pos={[0, 11.4, 2.52]} w={1.0} h={1.4} />

      {/* slowly orbiting runes (static under reduced motion) */}
      <group ref={runes} position={[0, 8.6, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 3.7, (i % 2) * 0.7 - 0.35, Math.sin(a) * 3.7]}
              rotation-y={-a + Math.PI / 2}
              material={accentMat(accent, 1.5, true)}
            >
              <planeGeometry args={[0.45, 0.65]} />
            </mesh>
          );
        })}
      </group>

      <Door pos={[0, 1.45, 3.12]} w={1.8} h={2.6} />
      <Sign accent={accent} pos={[2.4, 3.0, 2.9]} />
    </group>
  );
}

function Market({ accent }: { accent: string }) {
  const produce = ["#7a3030", "#5a6a32", "#a06028", "#6a5a86", "#86683a", "#5a3a4a"];
  return (
    <group>
      {/* back storage shed */}
      <mesh position={[0, 1.5, -1.9]} castShadow receiveShadow material={MAT.woodDark}>
        <boxGeometry args={[8.4, 3.0, 3.4]} />
      </mesh>
      <mesh position={[0, 3.15, -1.9]} material={MAT.roof}>
        <boxGeometry args={[9.0, 0.3, 4.0]} />
      </mesh>
      <Chimney pos={[-3.2, 4.0, -2.2]} h={1.8} />

      {/* stall posts + striped awning */}
      {[-4.1, 4.1].map((x) => (
        <mesh key={x} position={[x, 1.8, 3.4]} material={MAT.woodLight}>
          <boxGeometry args={[0.18, 3.6, 0.18]} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh
          key={i}
          position={[-3.55 + i * 1.42, 3.85, 1.7]}
          rotation-x={-0.42}
          castShadow
          material={i % 2 === 0 ? accentMat(accent, 0.32) : MAT.woodLight}
        >
          <boxGeometry args={[1.4, 0.09, 4.4]} />
        </mesh>
      ))}

      {/* counter + produce */}
      <mesh position={[0, 0.6, 3.3]} castShadow material={MAT.woodLight}>
        <boxGeometry args={[7.2, 1.2, 1.2]} />
      </mesh>
      {produce.map((c, i) => (
        <mesh key={c} position={[-2.7 + i * 1.1, 1.45, 3.3]} rotation-y={i * 0.7} material={accentMat(c, 0.08)}>
          <boxGeometry args={[0.55, 0.5, 0.55]} />
        </mesh>
      ))}

      {/* crates beside the stall */}
      {[
        [-3.4, 5.2, 0.9],
        [3.6, 5.0, 1.1],
        [4.3, 5.6, 0.75],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, (s * 1.0) / 2, z]} rotation-y={i} castShadow material={MAT.woodDark}>
          <boxGeometry args={[s, s, s]} />
        </mesh>
      ))}

      <Sign accent={accent} pos={[0, 2.9, 4.3]} />
    </group>
  );
}

function Tavern({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} receiveShadow material={MAT.stoneDark}>
        <boxGeometry args={[12.5, 0.7, 9.5]} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow material={MAT.woodDark}>
        <boxGeometry args={[12, 5, 9]} />
      </mesh>
      {/* timber framing on the facade */}
      {[-4.5, -1.6, 1.6, 4.5].map((x) => (
        <mesh key={x} position={[x, 2.5, 4.56]} material={MAT.woodLight}>
          <boxGeometry args={[0.24, 5, 0.14]} />
        </mesh>
      ))}

      <Roof w={12} d={9} top={5} h={3.4} />
      <Chimney pos={[4, 6.6, -2.5]} h={3.4} />

      <Window pos={[-3.1, 2.7, 4.6]} />
      <Window pos={[3.1, 2.7, 4.6]} />
      <Window pos={[6.06, 2.6, 1.0]} rotY={Math.PI / 2} />

      <Door pos={[0, 1.6, 4.62]} w={2.4} h={3.2} />
      <Sign accent={accent} pos={[1.9, 4.0, 5.0]} />

      {/* lantern string across the front */}
      {[
        [-4.5, 4.3],
        [-1.5, 4.05],
        [1.5, 4.05],
        [4.5, 4.3],
      ].map(([x, y], i) => (
        <group key={i} position={[x, y, 4.95]}>
          <mesh position={[0, 0.22, 0]} material={MAT.woodDark}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
          </mesh>
          <mesh material={accentMat(PALETTE.warmLight, 1.5)}>
            <sphereGeometry args={[0.16, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* barrels + bench outside */}
      {[
        [-5.1, 5.5],
        [-6.0, 4.7],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.55, 0]} castShadow material={MAT.woodLight}>
            <cylinderGeometry args={[0.55, 0.5, 1.1, 10]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={MAT.stoneDark}>
            <cylinderGeometry args={[0.57, 0.57, 0.14, 10]} />
          </mesh>
        </group>
      ))}
      <group position={[3.9, 0, 5.5]}>
        <mesh position={[0, 0.5, 0]} material={MAT.woodLight}>
          <boxGeometry args={[2.2, 0.14, 0.6]} />
        </mesh>
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]} material={MAT.woodDark}>
            <boxGeometry args={[0.14, 0.5, 0.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Gate({ accent }: { accent: string }) {
  const open = useGameStore(selectGateOpen);
  const reduced = useGameStore((s) => s.reducedMotion);
  const portalMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.12,
        toneMapped: false,
        side: 2,
      }),
    [accent],
  );

  useFrame((state) => {
    portalMat.emissiveIntensity = open ? 1 : 0.05;
    portalMat.opacity = open
      ? reduced
        ? 0.6
        : 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      : 0.12;
  });

  return (
    <group>
      {[-3.5, 3.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.5, 0]} receiveShadow material={MAT.stoneDark}>
            <boxGeometry args={[2.2, 1.0, 2.2]} />
          </mesh>
          <mesh position={[x, 4, 0]} castShadow material={MAT.stone}>
            <boxGeometry args={[1.6, 8, 1.6]} />
          </mesh>
          {/* rune plaque */}
          <mesh position={[x, 5.2, 0.85]} material={accentMat(accent, 0.5)}>
            <boxGeometry args={[0.6, 1.1, 0.08]} />
          </mesh>
          {/* brazier */}
          <mesh position={[x, 8.35, 0]} material={MAT.stoneDark}>
            <cylinderGeometry args={[0.5, 0.32, 0.45, 8]} />
          </mesh>
          <mesh position={[x, 8.8, 0]} material={MAT.flame}>
            <coneGeometry args={[0.26, 0.65, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 8.3, 0]} castShadow material={MAT.stoneDark}>
        <boxGeometry args={[9, 1.4, 1.8]} />
      </mesh>

      {/* the portal itself */}
      <mesh position={[0, 4, 0]} material={portalMat}>
        <planeGeometry args={[6, 7.4]} />
      </mesh>
      {open && <pointLight position={[0, 4, 2]} color={accent} intensity={2} distance={22} decay={2} />}
    </group>
  );
}
