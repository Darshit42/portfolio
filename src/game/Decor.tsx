import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { BUILDINGS, PLAZA_CENTER, WORLD_BOUNDS } from "../data/buildings";

/**
 * Atmospheric scatter (trees + rocks) rendered via instancing — one draw call
 * per kind regardless of count (PRD perf requirement). Positions are generated
 * once, deterministically, and kept clear of buildings and the plaza.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Item {
  pos: [number, number, number];
  scale: number;
  rot: number;
}

function generate(count: number, seed: number, minScale: number, maxScale: number): Item[] {
  const rand = mulberry32(seed);
  const items: Item[] = [];
  let guard = 0;
  while (items.length < count && guard < count * 40) {
    guard++;
    const x = WORLD_BOUNDS.minX - 6 + rand() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 12);
    const z = WORLD_BOUNDS.minZ - 6 + rand() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 12);

    // keep clear of the plaza
    if (Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) < 14) continue;
    // keep clear of buildings (+ margin)
    let tooClose = false;
    for (const b of BUILDINGS) {
      const m = Math.max(b.half[0], b.half[1]) + 4;
      if (Math.abs(x - b.position[0]) < m && Math.abs(z - b.position[1]) < m) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    items.push({
      pos: [x, 0, z],
      scale: minScale + rand() * (maxScale - minScale),
      rot: rand() * Math.PI * 2,
    });
  }
  return items;
}

export default function Decor() {
  const trees = useMemo(() => generate(46, 1337, 0.8, 1.6), []);
  const rocks = useMemo(() => generate(16, 4242, 0.6, 1.3), []);

  return (
    <group>
      {/* trunks */}
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 2, 6]} />
        <meshStandardMaterial color="#3a2a1c" />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.pos[0], t.scale, t.pos[2]]} scale={[1, t.scale, 1]} rotation-y={t.rot} />
        ))}
      </Instances>
      {/* foliage */}
      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.3, 3, 7]} />
        <meshStandardMaterial color="#1f3d2b" flatShading />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.pos[0], t.scale * 2 + 1.2, t.pos[2]]}
            scale={[t.scale, t.scale, t.scale]}
            rotation-y={t.rot}
          />
        ))}
      </Instances>
      {/* rocks */}
      <Instances limit={rocks.length} castShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#39404e" flatShading />
        {rocks.map((r, i) => (
          <Instance key={i} position={[r.pos[0], r.scale * 0.4, r.pos[2]]} scale={r.scale} rotation-y={r.rot} />
        ))}
      </Instances>
    </group>
  );
}
