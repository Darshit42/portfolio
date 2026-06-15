import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { RigConfig } from "../data/rigs";
import { useGameStore } from "../store/useGameStore";

/**
 * Thick-stickman rig (hyper-casual / capsule-runner style), built from
 * primitives. Each limb is a Group pivoted at its joint, so every animation is
 * pure local rotation. Lit standard materials → reuses the town lighting + the
 * day/night cycle and casts shadows. The parent positions the enclosing group;
 * this rig yaws itself to `ctrl.heading` and plays the 5 animations.
 *
 *   root (yaw to heading)
 *     bob (whole-body bounce + death tilt)
 *       torso · headPivot(head+eyes) · shoulderL/R(arms) · hipL/R(legs+feet)
 */

export type RigAnim = "attack" | "hit" | "death";

export interface RigCtrl {
  move: "idle" | "walk";
  heading: number; // radians (yaw the rig faces)
  speed: number; //   walk-cadence multiplier (0..~2)
  oneShot: RigAnim | null;
  oneShotSeq: number;
}

export function makeRigCtrl(heading = Math.PI): RigCtrl {
  return { move: "idle", heading, speed: 1, oneShot: null, oneShotSeq: 0 };
}

const DUR: Record<RigAnim, number> = { attack: 0.34, hit: 0.22, death: 0.55 };

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

export default function CharacterRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const bob = useRef<Group>(null);
  const head = useRef<Group>(null);
  const shL = useRef<Group>(null);
  const shR = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);

  const anim = useRef({ phase: 0, headingInit: false, oneShot: null as RigAnim | null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#15171d";

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    const reduced = useGameStore.getState().reducedMotion;
    const t = state.clock.elapsedTime;

    // face heading
    if (root.current) {
      if (!a.headingInit) {
        root.current.rotation.y = ctrl.heading;
        a.headingInit = true;
      } else {
        root.current.rotation.y = lerpAngle(root.current.rotation.y, ctrl.heading, 0.2);
      }
    }

    // one-shot trigger
    if (ctrl.oneShotSeq !== a.lastSeq) {
      a.lastSeq = ctrl.oneShotSeq;
      if (ctrl.oneShot) {
        a.oneShot = ctrl.oneShot;
        a.t = 0;
      }
    }
    let u = 0;
    if (a.oneShot) {
      const dur = DUR[a.oneShot];
      a.t += dt;
      u = a.t / dur;
      if (u >= 1) {
        if (a.oneShot === "death") u = 1; // hold the toppled pose
        else a.oneShot = null;
      }
    }

    // ---- base locomotion ----
    const walking = ctrl.move === "walk";
    a.phase += dt * (walking ? 7 * (0.6 + 0.4 * Math.min(2, ctrl.speed)) : 0);
    const p = a.phase;

    let shLx: number;
    let shRx: number;
    let hLx: number;
    let hRx: number;
    let bobY: number;
    let twist: number;

    if (walking) {
      const sw = Math.sin(p) * 0.9;
      shLx = sw;
      shRx = -sw; // arms opposed
      hLx = -sw;
      hRx = sw; // legs opposed to arms
      bobY = Math.abs(Math.sin(p)) * 0.08;
      twist = Math.sin(p) * 0.06;
    } else {
      const sway = reduced ? 0 : Math.sin(t * 1.6) * 0.08;
      shLx = sway;
      shRx = sway;
      hLx = 0;
      hRx = 0;
      bobY = reduced ? 0 : Math.sin(t * 2) * 0.04;
      twist = 0;
    }

    let leanX = 0;
    let scale = 1;
    let sink = 0;

    // ---- one-shot overlays ----
    if (a.oneShot === "attack") {
      // right arm: windup back, then strike forward (forward = -x)
      const uu = Math.min(u, 1);
      shRx = uu < 0.35 ? (uu / 0.35) * 1.7 : 1.7 - easeOut((uu - 0.35) / 0.65) * 3.4;
      shLx = -0.3;
      leanX = Math.sin(uu * Math.PI) * 0.16; // lean into the swing
    } else if (a.oneShot === "hit") {
      const k = 1 - Math.min(u, 1);
      leanX = -0.4 * k; // recoil back
      shLx = -0.7 * k;
      shRx = -0.7 * k;
      scale = 1 + 0.08 * k;
    } else if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      leanX = -1.5 * e; // topple backward
      sink = -0.25 * e;
      shLx = -1.2 * e;
      shRx = -1.2 * e;
      hLx = 0.5 * e;
      hRx = 0.5 * e;
    }

    if (shL.current) shL.current.rotation.x = shLx;
    if (shR.current) shR.current.rotation.x = shRx;
    if (hipL.current) hipL.current.rotation.x = hLx;
    if (hipR.current) hipR.current.rotation.x = hRx;
    if (head.current) head.current.rotation.x = leanX * 0.3 + (walking ? Math.sin(p) * 0.04 : 0);
    if (bob.current) {
      bob.current.position.y = bobY + sink;
      bob.current.rotation.x = leanX;
      bob.current.rotation.y = twist;
      bob.current.scale.setScalar(scale);
    }
  });

  const s = config.scale ?? 1;
  const hs = config.headScale ?? 1;

  return (
    <group ref={root} scale={s}>
      <group ref={bob}>
        {/* torso */}
        <mesh position={[0, 1.22, 0]} castShadow>
          <capsuleGeometry args={[0.46, 0.5, 4, 14]} />
          <meshStandardMaterial color={config.torso} />
        </mesh>

        {/* head + eyes */}
        <group ref={head} position={[0, 1.74, 0]}>
          <mesh position={[0, 0.3 * hs, 0]} castShadow scale={hs}>
            <sphereGeometry args={[0.44, 18, 16]} />
            <meshStandardMaterial color={config.skin} />
          </mesh>
          {[-0.16, 0.16].map((x) => (
            <mesh key={x} position={[x, 0.3 * hs, 0.38 * hs]}>
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={config.eye ? 0.5 : 0} toneMapped={false} />
            </mesh>
          ))}
        </group>

        {/* arms */}
        {([[-0.56, shL], [0.56, shR]] as const).map(([x, ref], i) => (
          <group key={i} ref={ref} position={[x, 1.52, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <capsuleGeometry args={[0.17, 0.5, 4, 10]} />
              <meshStandardMaterial color={config.skin} />
            </mesh>
          </group>
        ))}

        {/* legs + feet */}
        {!config.hideLegs &&
          ([[-0.24, hipL], [0.24, hipR]] as const).map(([x, ref], i) => (
            <group key={i} ref={ref} position={[x, 0.92, 0]}>
              <mesh position={[0, -0.42, 0]} castShadow>
                <capsuleGeometry args={[0.2, 0.5, 4, 10]} />
                <meshStandardMaterial color={config.legs} />
              </mesh>
              <mesh position={[0, -0.84, 0.08]} castShadow>
                <boxGeometry args={[0.3, 0.16, 0.42]} />
                <meshStandardMaterial color={config.feet} />
              </mesh>
            </group>
          ))}
      </group>
    </group>
  );
}
