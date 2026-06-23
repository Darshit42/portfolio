import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { PointLight } from "three";
import { Instances, Instance } from "@react-three/drei";
import { BUILDINGS, PLAZA_CENTER } from "../data/buildings";
import { categoryByBuilding } from "../data/categories";
import { useGameStore } from "../store/useGameStore";
import { MAT } from "./materials";
import { daynight } from "./daynight";

/**
 * The town's torch posts — the world's real illumination (PRD-art §2).
 *
 * LIGHT BUDGET (forward renderer: every light costs every draw call):
 *   5  entrance lights (spire, guild, oracle, market, tavern — one shared
 *      light per flanking torch pair, placed over the door)
 *   2  shared plaza lights (cover the 6-torch plaza ring)
 *   1  fountain core (PlazaTotem)   1  forge interior glow (BuildingMesh)
 *   1  gate portal (conditional)    0–2 transient relic lights (proximity)
 * ≈ 12 worst case. Path / gate / arena torches are EMISSIVE-ONLY.
 * Torch geometry is instanced: one draw call for poles, one for flames.
 */

interface P2 {
  x: number;
  z: number;
}

function buildLayout(): { torches: P2[]; lights: P2[] } {
  const torches: P2[] = [];
  const lights: P2[] = [];

  for (const b of BUILDINGS) {
    if (b.kind === "arena") continue; // the arena has its own pillar torches

    // Door = the wall point facing the approach.
    const dx = b.approach[0] - b.position[0];
    const dz = b.approach[1] - b.position[1];
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const wall = Math.abs(ux) > Math.abs(uz) ? b.half[0] : b.half[1];
    const doorX = b.position[0] + ux * (wall + 0.9);
    const doorZ = b.position[1] + uz * (wall + 0.9);
    const px = -uz;
    const pz = ux;

    torches.push({ x: doorX + px * 1.8, z: doorZ + pz * 1.8 });
    torches.push({ x: doorX - px * 1.8, z: doorZ - pz * 1.8 });

    // One real light per entrance pair — guild + spare structures (the forge's
    // budget goes to its interior glow instead) plus the tavern. Gate stays
    // emissive-only.
    const litStructure =
      (categoryByBuilding(b.id) && b.kind !== "forge") ||
      b.kind === "spire" ||
      b.kind === "booth" ||
      b.kind === "tavern";
    if (litStructure) {
      lights.push({ x: doorX + ux * 0.6, z: doorZ + uz * 0.6 });
    }
  }

  // Spawn welcome pair — the spawn zone sits on the tavern's far side from
  // the camera (its door pool is self-occluded), so light the path start.
  torches.push({ x: -2.6, z: 21.5 });
  torches.push({ x: 2.6, z: 21.5 });
  lights.push({ x: 0, z: 21.5 });

  // Plaza ring: 6 torches, lit by 2 shared lights.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    torches.push({
      x: PLAZA_CENTER[0] + Math.cos(a) * 13.4,
      z: PLAZA_CENTER[1] + Math.sin(a) * 13.4,
    });
  }
  lights.push({ x: PLAZA_CENTER[0] + 8.5, z: PLAZA_CENTER[1] + 8.5 });
  lights.push({ x: PLAZA_CENTER[0] - 8.5, z: PLAZA_CENTER[1] - 8.5 });

  // A few torches along the longer paths — emissive only.
  for (const id of ["spire-of-training", "guild-hall", "finddder-market", "the-arena"]) {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b) continue;
    const dx = b.approach[0] - PLAZA_CENTER[0];
    const dz = b.approach[1] - PLAZA_CENTER[1];
    const len = Math.hypot(dx, dz) || 1;
    torches.push({
      x: PLAZA_CENTER[0] + dx * 0.55 - (dz / len) * 2.4,
      z: PLAZA_CENTER[1] + dz * 0.55 + (dx / len) * 2.4,
    });
  }

  return { torches, lights };
}

export default function Torches() {
  const reduced = useGameStore((s) => s.reducedMotion);
  const { torches, lights } = useMemo(buildLayout, []);
  const phases = useMemo(() => lights.map((_, i) => i * 1.73 + 0.61), [lights]);
  const lightRefs = useRef<(PointLight | null)[]>([]);

  // three r155+ physical units: decay-2 lights attenuate as 1/d², so a
  // readable torch pool needs a large candela value, not the legacy ~2.5.
  const TORCH_INTENSITY = 35;

  // Flicker: jitter each light ±15% with a per-torch phase. Static when
  // reduced-motion is on.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // fade the warm pools out in daylight (multiplier from the cycle)
    const warm = daynight.warm;
    for (let i = 0; i < lights.length; i++) {
      const l = lightRefs.current[i];
      if (!l) continue;
      const flick = reduced
        ? 1
        : 1 + (Math.sin(t * 9 + phases[i]) * 0.6 + Math.sin(t * 23 + phases[i] * 2) * 0.4) * 0.15;
      l.intensity = TORCH_INTENSITY * flick * warm;
    }
  });

  return (
    <group>
      {/* poles — one instanced draw call */}
      <Instances limit={torches.length} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 2.3, 8]} />
        <primitive object={MAT.woodDark} attach="material" />
        {torches.map((t, i) => (
          <Instance key={i} position={[t.x, 1.15, t.z]} />
        ))}
      </Instances>

      {/* flames — one instanced draw call, blooms past the threshold */}
      <Instances limit={torches.length}>
        <coneGeometry args={[0.16, 0.5, 8]} />
        <primitive object={MAT.flame} attach="material" />
        {torches.map((t, i) => (
          <Instance key={i} position={[t.x, 2.5, t.z]} />
        ))}
      </Instances>

      {/* the budgeted real lights */}
      {lights.map((l, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightRefs.current[i] = el;
          }}
          position={[l.x, 2.8, l.z]}
          color="#ff9944"
          intensity={35}
          distance={10}
          decay={2}
        />
      ))}
    </group>
  );
}
