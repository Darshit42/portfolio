import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { BUILDINGS } from "../data/buildings";
import { NPCS } from "../data/npcs";
import { DOORS } from "../data/interiors";
import { FEATURES } from "../data/config";
import { FROZEN_MODES, useGameStore, type Interactable } from "../store/useGameStore";
import { playerState } from "./playerState";
import { resolveMove } from "./collision";
import { getMoveVector } from "./useControls";
import { combat } from "./combat";

const SPEED = 9; // units / second
const PROX = 3.6; // interaction radius from a building's approach point

// Camera-relative basis (the dimetric camera yaw is fixed, so compute once).
// OFFSET in Camera.tsx is (15, 23, 18); ground-forward = -(x,z).
const fLen = Math.hypot(15, 18);
const FORWARD = { x: -15 / fLen, z: -18 / fLen };
const RIGHT = { x: -FORWARD.z, z: FORWARD.x };

interface InteractPoint {
  point: [number, number];
  data: Interactable;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export default function Player() {
  const group = useRef<Group>(null);
  const body = useRef<Group>(null);
  const swing = useRef<Mesh>(null);

  // Precompute interaction points from data (relics, the forge, the gate, NPCs).
  const interactables = useMemo<InteractPoint[]>(() => {
    const fromBuildings: InteractPoint[] = BUILDINGS.filter(
      (b) => b.projectId || b.kind === "gate",
    ).map((b) => {
      const kind = b.kind === "forge" ? "forge" : b.kind === "gate" ? "gate" : "relic";
      const prompt =
        kind === "forge" ? "Ignite the Forge" : kind === "gate" ? "Approach the Gate" : "Inspect relic";
      return {
        point: b.approach,
        data: { kind, id: b.id, label: b.label, prompt, projectId: b.projectId },
      };
    });

    const fromNpcs: InteractPoint[] = FEATURES.npcs
      ? NPCS.map((n) => ({
          point: n.position,
          data: { kind: "npc", id: n.id, label: n.name, prompt: `Talk to ${n.name}` } as Interactable,
        }))
      : [];

    const fromDoors: InteractPoint[] = FEATURES.interiors
      ? DOORS.map((d) => ({
          point: d.position,
          data: { kind: "door", id: d.id, label: d.label, prompt: d.prompt, target: d.target } as Interactable,
        }))
      : [];

    return [...fromBuildings, ...fromNpcs, ...fromDoors];
  }, []);

  useFrame((_, delta) => {
    const st = useGameStore.getState();

    // Fast-travel / respawn teleport.
    if (st.travelTarget) {
      playerState.pos.set(st.travelTarget[0], 0, st.travelTarget[1]);
      st.consumeTravel();
    }

    const dt = Math.min(delta, 0.05); // clamp huge frames (tab refocus)
    const frozen = FROZEN_MODES.includes(st.mode);
    const mv = frozen ? { x: 0, z: 0 } : getMoveVector();

    let moving = false;
    if (mv.x !== 0 || mv.z !== 0) {
      const wx = RIGHT.x * mv.x + FORWARD.x * -mv.z;
      const wz = RIGHT.z * mv.x + FORWARD.z * -mv.z;
      const l = Math.hypot(wx, wz) || 1;
      const nx = wx / l;
      const nz = wz / l;
      resolveMove(playerState.pos, nx * SPEED * dt, nz * SPEED * dt);
      playerState.facing = Math.atan2(nx, nz);
      moving = true;
    }
    playerState.moving = moving;

    if (group.current) {
      group.current.position.copy(playerState.pos);
      group.current.rotation.y = lerpAngle(group.current.rotation.y, playerState.facing, 0.18);
    }
    if (body.current) {
      // subtle walk bob
      const t = performance.now() / 1000;
      body.current.position.y = moving && !st.reducedMotion ? Math.abs(Math.sin(t * 10)) * 0.12 : 0;
    }

    // attack swing shockwave
    if (swing.current) {
      const since = performance.now() - combat.lastAttackAt;
      if (since < 220) {
        const p = since / 220;
        swing.current.visible = true;
        swing.current.scale.setScalar(0.4 + p * 2.8);
        (swing.current.material as MeshBasicMaterial).opacity = 0.5 * (1 - p);
      } else {
        swing.current.visible = false;
      }
    }

    // Proximity → nearest interactable within radius.
    let best: InteractPoint | null = null;
    let bestD = PROX;
    for (const it of interactables) {
      const d = Math.hypot(playerState.pos.x - it.point[0], playerState.pos.z - it.point[1]);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    if (best) st.markDiscovered(best.data.id);
    st.setNearby(best ? best.data : null);
  });

  return (
    <group ref={group} position={[playerState.pos.x, 0, playerState.pos.z]} rotation-y={playerState.facing}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.85, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      {/* attack swing shockwave (combat only) */}
      {FEATURES.combat && (
        <mesh ref={swing} rotation-x={-Math.PI / 2} position={[0, 0.1, 0]} visible={false}>
          <ringGeometry args={[0.7, 1, 28]} />
          <meshBasicMaterial color="#e8c66a" transparent opacity={0.5} toneMapped={false} />
        </mesh>
      )}

      <group ref={body}>
        {/* cloak / body */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.7, 1.5, 12]} />
          <meshStandardMaterial color="#3b6ea5" />
        </mesh>
        {/* head */}
        <mesh position={[0, 2.0, 0]} castShadow>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshStandardMaterial color="#e8c29a" />
        </mesh>
        {/* hood trim */}
        <mesh position={[0, 1.55, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.25, 12]} />
          <meshStandardMaterial color="#e8c66a" emissive="#e8c66a" emissiveIntensity={0.25} />
        </mesh>
        {/* facing indicator (nose), points +z */}
        <mesh position={[0, 2.0, 0.4]} rotation-x={Math.PI / 2} castShadow>
          <coneGeometry args={[0.12, 0.3, 8]} />
          <meshStandardMaterial color="#c98b5e" />
        </mesh>
      </group>
    </group>
  );
}
