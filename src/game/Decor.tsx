import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh } from "three";
import { Instances, Instance } from "@react-three/drei";
import { BUILDINGS, PLAZA_CENTER, WORLD_BOUNDS } from "../data/buildings";
import { useGameStore } from "../store/useGameStore";
import { isTouchDevice } from "./webgl";
import { MAT } from "./materials";
import { RBox } from "./RBox";
import { mulberry32, clearOfStructures } from "./rand";

/**
 * Environment dressing (PRD-art §6): a dense pine ring encloses the town
 * (per-instance colors darken toward the fog so the forest melts into night),
 * plus mid-world scatter — rocks, bushes, fences, a cart, a well, crates —
 * all primitives, all instanced where repeated. Ground-level fog wisps drift
 * on desktop when motion is allowed.
 */

interface Tree {
  x: number;
  z: number;
  s: number;
  rot: number;
  color: Color;
}

interface Item {
  x: number;
  z: number;
  s: number;
  rot: number;
}

// Lifted from the raw palette hex so trees survive the sRGB→linear crush;
// the far color stays deep so the ring still melts into the fog.
const FOLIAGE = new Color("#2c4a32");
const FOLIAGE_FAR = new Color("#101e16");

/** Distance from a point to the plaza→approach path segment of any building. */
function nearAnyPath(x: number, z: number, within: number): boolean {
  for (const b of BUILDINGS) {
    const ax = PLAZA_CENTER[0];
    const az = PLAZA_CENTER[1];
    const bx = b.approach[0];
    const bz = b.approach[1];
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    const px = ax + dx * t;
    const pz = az + dz * t;
    if (Math.hypot(x - px, z - pz) < within) return true;
  }
  return false;
}

function buildTrees(): Tree[] {
  const rand = mulberry32(1337);
  const trees: Tree[] = [];

  // the enclosing ring — darker the deeper into the fog
  const RING = 132;
  for (let i = 0; i < RING; i++) {
    const a = (i / RING) * Math.PI * 2 + (rand() - 0.5) * 0.05;
    const depth = rand();
    const r = 50 + depth * 14;
    const c = FOLIAGE.clone().lerp(FOLIAGE_FAR, Math.min(1, depth * 0.8 + rand() * 0.25));
    trees.push({
      x: Math.cos(a) * r,
      z: 1 + Math.sin(a) * r,
      s: 0.9 + rand() * 0.9,
      rot: rand() * Math.PI * 2,
      color: c,
    });
  }

  // Beyond the playable edge (r 60) the forest must NOT stop at a wall — it
  // fades outward as a DENSITY GRADIENT so the world reads as an endless forest,
  // not a mapped-off edge. Randomly-placed pines in widening annular bands whose
  // density climbs with distance: sparse & gappy just outside (≈ the interior
  // forest), thickening through a middle band, to an impenetrable dark mass far
  // out that melts into the fog. Scale grows and colour darkens with distance so
  // the treeline blends into the horizon. Purely decorative — no collision (the
  // player clamps at the world radius), and instanced with everything else.
  const OUTER_BANDS: { r0: number; r1: number; n: number; gap: number }[] = [
    { r0: 62, r1: 72, n: 130, gap: 0.1 }, //  transition — sparse/medium, small gaps
    { r0: 72, r1: 83, n: 300, gap: 0.04 }, // middle — denser, few gaps
    { r0: 83, r1: 95, n: 470, gap: 0.0 }, //  far — dense enough to hide the end
  ];
  for (const band of OUTER_BANDS) {
    for (let i = 0; i < band.n; i++) {
      if (rand() < band.gap) continue; // occasional openings, never a solid line
      const a = rand() * Math.PI * 2; // random angle — no planted rows
      const rr = band.r0 + rand() * (band.r1 - band.r0) + (rand() - 0.5) * 2.0;
      const distT = Math.max(0, Math.min(1, (rr - 62) / 33));
      // mass grows toward the horizon; ±~18% jitter so no two read the same
      const base = 1.0 + 0.4 * distT;
      // the deeper out, the darker — blends the far treeline into the fog
      const shade = Math.min(1, 0.4 + 0.6 * distT + rand() * 0.18);
      trees.push({
        x: Math.cos(a) * rr,
        z: 1 + Math.sin(a) * rr,
        s: base * (0.85 + rand() * 0.35),
        rot: rand() * Math.PI * 2,
        color: FOLIAGE.clone().lerp(FOLIAGE_FAR, shade),
      });
    }
  }

  // sparse interior trees, clear of structures and paths
  let placed = 0;
  let guard = 0;
  while (placed < 18 && guard < 600) {
    guard++;
    const x = WORLD_BOUNDS.minX + 3 + rand() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX - 6);
    const z = WORLD_BOUNDS.minZ + 3 + rand() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ - 6);
    if (!clearOfStructures(x, z, 5, 15)) continue;
    if (nearAnyPath(x, z, 4)) continue;
    trees.push({
      x,
      z,
      s: 0.8 + rand() * 0.7,
      rot: rand() * Math.PI * 2,
      color: FOLIAGE.clone().lerp(FOLIAGE_FAR, rand() * 0.3),
    });
    placed++;
  }

  return trees;
}

function scatterItems(count: number, seed: number, minS: number, maxS: number): Item[] {
  const rand = mulberry32(seed);
  const items: Item[] = [];
  let guard = 0;
  while (items.length < count && guard < count * 50) {
    guard++;
    const x = WORLD_BOUNDS.minX + 3 + rand() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX - 6);
    const z = WORLD_BOUNDS.minZ + 3 + rand() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ - 6);
    if (!clearOfStructures(x, z, 4, 14) || nearAnyPath(x, z, 3)) continue;
    items.push({ x, z, s: minS + rand() * (maxS - minS), rot: rand() * Math.PI * 2 });
  }
  return items;
}

/** Fence posts + rails alongside a path segment. */
function fenceRun(
  from: [number, number],
  to: [number, number],
  offset: number,
  t0: number,
  t1: number,
  posts: number,
) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz) || 1;
  const px = (-dz / len) * offset;
  const pz = (dx / len) * offset;
  const yaw = Math.atan2(dx, dz);
  const pts: { x: number; z: number }[] = [];
  for (let i = 0; i < posts; i++) {
    const t = t0 + ((t1 - t0) * i) / (posts - 1);
    pts.push({ x: from[0] + dx * t + px, z: from[1] + dz * t + pz });
  }
  const midT = (t0 + t1) / 2;
  return {
    posts: pts,
    rail: {
      x: from[0] + dx * midT + px,
      z: from[1] + dz * midT + pz,
      yaw,
      len: (t1 - t0) * len + 0.4,
    },
  };
}

export default function Decor() {
  const reduced = useGameStore((s) => s.reducedMotion);
  const touch = useMemo(() => isTouchDevice(), []);

  const trees = useMemo(buildTrees, []);
  const rocks = useMemo(() => scatterItems(18, 4242, 0.6, 1.4), []);
  const bushes = useMemo(() => scatterItems(14, 5151, 0.5, 1.0), []);

  const fences = useMemo(() => {
    const tavern = BUILDINGS.find((b) => b.id === "null-pointer-tavern")!;
    const guild = BUILDINGS.find((b) => b.id === "guild-hall")!;
    return [
      fenceRun(PLAZA_CENTER, tavern.approach, 3.1, 0.5, 0.92, 5),
      fenceRun(PLAZA_CENTER, guild.approach, -3.1, 0.45, 0.85, 5),
    ];
  }, []);

  return (
    <group>
      {/* pines — trunk + two foliage tiers, three instanced draw calls.
          frustumCulled must be OFF: the InstancedMesh's bounding sphere is the
          bare geometry's at the origin, so three would cull the entire forest
          the moment the world origin leaves the camera frustum (reachable now
          that the player can roam to the treeline). */}
      <Instances limit={trees.length} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.22, 0.32, 2, 8]} />
        <primitive object={MAT.trunk} attach="material" />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, t.s, t.z]} scale={[1, t.s, 1]} rotation-y={t.rot} />
        ))}
      </Instances>
      <Instances limit={trees.length} castShadow frustumCulled={false}>
        <coneGeometry args={[1.5, 2.6, 7]} />
        <primitive object={MAT.instWhite} attach="material" />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.s * 2 + 0.9, t.z]}
            scale={t.s}
            rotation-y={t.rot}
            color={t.color}
          />
        ))}
      </Instances>
      <Instances limit={trees.length} castShadow frustumCulled={false}>
        <coneGeometry args={[1.0, 2.0, 7]} />
        <primitive object={MAT.instWhite} attach="material" />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.s * 2 + 2.3 * t.s, t.z]}
            scale={t.s}
            rotation-y={t.rot + 0.4}
            color={t.color}
          />
        ))}
      </Instances>

      {/* rocks + bushes */}
      <Instances limit={rocks.length} castShadow frustumCulled={false}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <primitive object={MAT.rock} attach="material" />
        {rocks.map((r, i) => (
          <Instance key={i} position={[r.x, r.s * 0.4, r.z]} scale={r.s} rotation-y={r.rot} />
        ))}
      </Instances>
      <Instances limit={bushes.length} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[0.7, 0]} />
        <primitive object={MAT.foliage} attach="material" />
        {bushes.map((b, i) => (
          <Instance key={i} position={[b.x, b.s * 0.45, b.z]} scale={[b.s, b.s * 0.7, b.s]} rotation-y={b.rot} />
        ))}
      </Instances>

      {/* fences along two paths */}
      <Instances limit={fences.length * 5}>
        <boxGeometry args={[0.14, 1.0, 0.14]} />
        <primitive object={MAT.woodLight} attach="material" />
        {fences.flatMap((f, fi) =>
          f.posts.map((p, i) => <Instance key={`${fi}-${i}`} position={[p.x, 0.5, p.z]} />),
        )}
      </Instances>
      {fences.map((f, i) => (
        <group key={i}>
          <mesh position={[f.rail.x, 0.78, f.rail.z]} rotation-y={f.rail.yaw} material={MAT.woodDark}>
            <boxGeometry args={[0.09, 0.08, f.rail.len]} />
          </mesh>
          <mesh position={[f.rail.x, 0.45, f.rail.z]} rotation-y={f.rail.yaw} material={MAT.woodDark}>
            <boxGeometry args={[0.09, 0.08, f.rail.len]} />
          </mesh>
        </group>
      ))}

      {/* a hand cart by the market */}
      <group position={[-13, 0, 21]} rotation-y={0.7}>
        <mesh position={[0, 0.75, 0]} castShadow material={MAT.woodDark}>
          <boxGeometry args={[1.5, 0.5, 2.4]} />
        </mesh>
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 0.55, 0.3]} rotation-z={Math.PI / 2} material={MAT.woodLight}>
            <cylinderGeometry args={[0.55, 0.55, 0.12, 10]} />
          </mesh>
        ))}
        {/* handles */}
        <mesh position={[0.5, 0.85, -1.7]} rotation-x={0.5} material={MAT.woodLight}>
          <boxGeometry args={[0.08, 0.08, 1.4]} />
        </mesh>
        <mesh position={[-0.5, 0.85, -1.7]} rotation-x={0.5} material={MAT.woodLight}>
          <boxGeometry args={[0.08, 0.08, 1.4]} />
        </mesh>
        <mesh position={[0, 1.15, 0.2]} material={MAT.woodLight}>
          <boxGeometry args={[1.1, 0.35, 1.2]} />
        </mesh>
      </group>

      {/* the old well, south-west of the plaza */}
      <group position={[-11, 0, 14]}>
        <mesh position={[0, 0.5, 0]} castShadow material={MAT.stone}>
          <cylinderGeometry args={[1.0, 1.1, 1.0, 10]} />
        </mesh>
        <mesh position={[0, 1.02, 0]} material={MAT.stoneDark}>
          <cylinderGeometry args={[1.05, 1.05, 0.12, 10]} />
        </mesh>
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} material={MAT.woodDark}>
            <boxGeometry args={[0.12, 1.4, 0.12]} />
          </mesh>
        ))}
        <mesh position={[0, 2.5, 0]} rotation-y={Math.PI / 4} castShadow material={MAT.roof}>
          <coneGeometry args={[1.5, 0.9, 4]} />
        </mesh>
        <mesh position={[0, 1.95, 0]} rotation-z={Math.PI / 2} material={MAT.woodLight}>
          <cylinderGeometry args={[0.07, 0.07, 1.5, 6]} />
        </mesh>
      </group>

      {/* crates by the guild hall */}
      {[
        [13.5, -19.5, 0.9, 0.3],
        [14.5, -18.9, 0.7, 1.1],
        [13.9, -20.5, 0.6, 0.7],
      ].map(([x, z, s, r], i) => (
        <RBox key={i} position={[x, s / 2, z]} rotation-y={r} castShadow material={MAT.woodDark} args={[s, s, s]} radius={0.08} />
      ))}

      {/* drifting ground-fog wisps — desktop + motion only */}
      {!touch && !reduced && <FogWisps />}
    </group>
  );
}

function FogWisps() {
  const refs = useRef<(Mesh | null)[]>([]);
  const bases = useMemo(
    () => [
      { x: -18, z: -12, s: 1.0 },
      { x: 16, z: 20, s: 1.3 },
      { x: 4, z: -28, s: 0.9 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < bases.length; i++) {
      const m = refs.current[i];
      if (!m) continue;
      m.position.x = bases[i].x + Math.sin(t * 0.045 + i * 2.3) * 9;
      m.position.z = bases[i].z + Math.cos(t * 0.034 + i * 1.7) * 6;
    }
  });

  return (
    <>
      {bases.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          rotation-x={-Math.PI / 2}
          position={[b.x, 0.55 + i * 0.18, b.z]}
          scale={b.s}
        >
          <planeGeometry args={[26, 11]} />
          <meshBasicMaterial color="#10141f" transparent opacity={0.07} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
