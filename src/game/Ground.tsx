import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { Instances, Instance } from "@react-three/drei";
import { BUILDINGS, PLAZA_CENTER, WORLD_BOUNDS } from "../data/buildings";
import { MAT, makeGroundTexture } from "./materials";
import { mulberry32, clearOfStructures } from "./rand";

/**
 * Ground & paths (PRD-art §4). The ground is one large plane with a subtle
 * procedural stone-tile texture (~2-unit tiles). Paths are runs of slightly
 * jittered, overlapping flat segments — irregular edges, not perfect
 * rectangles. Scattered detail (slabs, grass tufts, pebbles) is instanced:
 * three draw calls for ~100 pieces.
 */

interface Seg {
  x: number;
  z: number;
  yaw: number;
  len: number;
  w: number;
}

interface Item {
  pos: [number, number, number];
  scale: number;
  rot: number;
}

function buildPaths(): Seg[] {
  const segs: Seg[] = [];
  BUILDINGS.forEach((b, bi) => {
    const rand = mulberry32(101 + bi * 17);
    const dx = b.approach[0] - PLAZA_CENTER[0];
    const dz = b.approach[1] - PLAZA_CENTER[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    const yaw = Math.atan2(dx, dz);
    const start = 10.5; // from the plaza edge
    const total = len - start + 2.5;
    const n = Math.max(2, Math.ceil(total / 5));
    const step = total / n;
    for (let i = 0; i < n; i++) {
      const d = start + step * (i + 0.5);
      const jx = -uz * (rand() - 0.5) * 1.0;
      const jz = ux * (rand() - 0.5) * 1.0;
      segs.push({
        x: PLAZA_CENTER[0] + ux * d + jx,
        z: PLAZA_CENTER[1] + uz * d + jz,
        yaw: yaw + (rand() - 0.5) * 0.14,
        len: step + 1.4,
        w: 2.8 + rand() * 0.7,
      });
    }
  });
  return segs;
}

function scatter(count: number, seed: number, minS: number, maxS: number, margin = 3): Item[] {
  const rand = mulberry32(seed);
  const items: Item[] = [];
  let guard = 0;
  while (items.length < count && guard < count * 50) {
    guard++;
    const x = WORLD_BOUNDS.minX + 2 + rand() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX - 4);
    const z = WORLD_BOUNDS.minZ + 2 + rand() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ - 4);
    if (!clearOfStructures(x, z, margin, 13)) continue;
    items.push({ pos: [x, 0, z], scale: minS + rand() * (maxS - minS), rot: rand() * Math.PI * 2 });
  }
  return items;
}

export default function Ground() {
  // The plane runs well past the playable bounds so the outer forest gradient
  // (trees out to r≈95) sits on terrain, not void — its far edge (~r108) is
  // hidden behind the dense far treeline + fog, never seen from the map edge.
  const width = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 92;
  const depth = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 92;
  const cx = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
  const cz = (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) / 2;

  // Texture + its material are created exactly once.
  const groundMat = useMemo(() => {
    const tex = makeGroundTexture();
    tex.repeat.set(width / 8, depth / 8); // canvas covers 8 world units
    return new MeshStandardMaterial({ map: tex });
  }, [width, depth]);

  const paths = useMemo(buildPaths, []);
  const slabs = useMemo(() => scatter(14, 2024, 0.8, 1.3), []);
  const grass = useMemo(() => scatter(60, 3033, 0.7, 1.4, 2.5), []);
  const pebbles = useMemo(() => scatter(26, 4044, 0.5, 1.1, 2.5), []);

  return (
    <group>
      {/* tiled town ground */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, -0.02, cz]} receiveShadow material={groundMat}>
        <planeGeometry args={[width, depth]} />
      </mesh>

      {/* paths — jittered overlapping segments */}
      {paths.map((p, i) => (
        <mesh key={i} rotation-y={p.yaw} position={[p.x, 0.0, p.z]} receiveShadow material={MAT.path}>
          <boxGeometry args={[p.w, 0.05, p.len]} />
        </mesh>
      ))}

      {/* central plaza — a touch lighter than the paths, with a rim */}
      <mesh rotation-x={-Math.PI / 2} position={[PLAZA_CENTER[0], 0.01, PLAZA_CENTER[1]]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#423c33" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[PLAZA_CENTER[0], 0.02, PLAZA_CENTER[1]]} receiveShadow>
        <ringGeometry args={[11.3, 12, 48]} />
        <meshStandardMaterial color="#564e44" />
      </mesh>

      {/* scattered detail — one instanced draw call per kind */}
      <Instances limit={slabs.length} receiveShadow>
        <boxGeometry args={[1.2, 0.07, 0.9]} />
        <primitive object={MAT.stoneDark} attach="material" />
        {slabs.map((s, i) => (
          <Instance key={i} position={[s.pos[0], 0.02, s.pos[2]]} scale={s.scale} rotation-y={s.rot} />
        ))}
      </Instances>

      <Instances limit={grass.length}>
        <coneGeometry args={[0.2, 0.55, 5]} />
        <primitive object={MAT.foliage} attach="material" />
        {grass.map((g, i) => (
          <Instance
            key={i}
            position={[g.pos[0], 0.26 * g.scale, g.pos[2]]}
            scale={g.scale}
            rotation-y={g.rot}
          />
        ))}
      </Instances>

      <Instances limit={pebbles.length}>
        <dodecahedronGeometry args={[0.13, 0]} />
        <primitive object={MAT.rock} attach="material" />
        {pebbles.map((p, i) => (
          <Instance key={i} position={[p.pos[0], 0.08 * p.scale, p.pos[2]]} scale={p.scale} rotation-y={p.rot} />
        ))}
      </Instances>
    </group>
  );
}
