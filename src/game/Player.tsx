import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide } from "three";
import type { Group, MeshBasicMaterial } from "three";
import { BUILDINGS } from "../data/buildings";
import { categoryByBuilding } from "../data/categories";
import { NPCS } from "../data/npcs";
import { DOORS } from "../data/interiors";
import { worldlyTraveler } from "../data/travelers";
import { SECRETS } from "../data/quests";
import { FEATURES } from "../data/config";
import { rigConfig } from "../data/rigs";
import { FROZEN_MODES, useGameStore, type Interactable } from "../store/useGameStore";
import { playerState } from "./playerState";
import { resolveMove } from "./collision";
import { getMoveVector } from "./useControls";
import { combat } from "./combat";
import CharacterRig, { makeRigCtrl } from "./CharacterRig";

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

export default function Player() {
  const group = useRef<Group>(null);
  const swing = useRef<Group>(null);
  const swingMat = useRef<MeshBasicMaterial>(null);
  const ctrl = useRef(makeRigCtrl(Math.PI));
  const lastAttack = useRef(combat.lastAttackAt);
  const lastHit = useRef(combat.lastHitAt);

  // Precompute interaction points from data (relics, the forge, the gate, NPCs).
  const interactables = useMemo<InteractPoint[]>(() => {
    const fromBuildings: InteractPoint[] = BUILDINGS.flatMap((b) => {
      const cat = categoryByBuilding(b.id);
      if (cat) {
        return [{
          point: b.approach,
          data: { kind: "guild", id: b.id, label: cat.guildName, prompt: `Enter ${cat.guildName}`, categoryId: cat.id } as Interactable,
        }];
      }
      if (b.kind === "gate") {
        return [{ point: b.approach, data: { kind: "gate", id: b.id, label: b.label, prompt: "Approach the Gate" } as Interactable }];
      }
      if (b.kind === "shrine") {
        return [{ point: b.approach, data: { kind: "skilltree", id: b.id, label: b.label, prompt: "Study the skill tree" } as Interactable }];
      }
      return [];
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

    const fromSecrets: InteractPoint[] = SECRETS.map((s) => ({
      point: s.position,
      data: { kind: "secret", id: s.id, label: s.notice, prompt: s.prompt } as Interactable,
    }));

    // The worldly traveler in the tavern interior — opens the Q&A overlay.
    const traveler = FEATURES.interiors ? worldlyTraveler() : undefined;
    const fromTravelers: InteractPoint[] = traveler
      ? [{
          point: traveler.position,
          data: { kind: "traveler", id: traveler.id, label: traveler.name, prompt: `Speak with ${traveler.name}` } as Interactable,
        }]
      : [];

    return [...fromBuildings, ...fromNpcs, ...fromDoors, ...fromSecrets, ...fromTravelers];
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
    ctrl.current.move = moving ? "walk" : "idle";
    ctrl.current.heading = playerState.facing;

    if (group.current) group.current.position.copy(playerState.pos);

    // fire the attack animation (one-shot) when a swing happens
    if (combat.lastAttackAt !== lastAttack.current) {
      lastAttack.current = combat.lastAttackAt;
      ctrl.current.oneShot = "attack";
      ctrl.current.oneShotSeq++;
    }
    // recoil when the player takes a hit
    if (combat.lastHitAt !== lastHit.current) {
      lastHit.current = combat.lastHitAt;
      ctrl.current.oneShot = "hit";
      ctrl.current.oneShotSeq++;
    }

    // Directional attack slash — a crescent that sweeps across the facing arc
    // in the direction the player is looking (not a radial shockwave).
    if (swing.current) {
      const since = performance.now() - combat.lastAttackAt;
      if (since < 240) {
        const p = since / 240;
        const SWEEP = 1.5; // radians the blade travels during the swing
        swing.current.visible = true;
        swing.current.rotation.y = playerState.facing - SWEEP / 2 + p * SWEEP;
        if (swingMat.current) swingMat.current.opacity = 0.6 * (1 - p);
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
    <group ref={group} position={[playerState.pos.x, 0, playerState.pos.z]}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.7, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* directional attack slash (combat only) — a forward crescent the swing
          logic aims and sweeps along the player's facing; opens toward local +Z */}
      {FEATURES.combat && (
        <group ref={swing} visible={false}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.12, 0]}>
            <ringGeometry args={[1.0, 2.4, 24, 1, -Math.PI / 2 - 0.7, 1.4]} />
            <meshBasicMaterial
              ref={swingMat}
              color="#ffe6a0"
              transparent
              opacity={0.6}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* hero fill — a faint warm lantern-glow on the camera side so the
          player reads everywhere, even between torch pools (§8 readability) */}
      <pointLight position={[1.6, 3.2, 1.8]} color="#b89878" intensity={12} distance={8} decay={2} />

      <CharacterRig config={rigConfig("player")} ctrl={ctrl.current} />
    </group>
  );
}
