import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import type { RigConfig } from "../data/rigs";
import { useGameStore } from "../store/useGameStore";
import CharacterRig, { type RigCtrl } from "./CharacterRig";

export type { RigAnim, RigCtrl } from "./CharacterRig";
export { makeRigCtrl, resetRigCtrl } from "./CharacterRig";

const DUR = { attack: 0.34, hit: 0.22, death: 0.55 } as const;
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

interface AnimState {
  phase: number;
  headingInit: boolean;
  oneShot: keyof typeof DUR | null;
  t: number;
  lastSeq: number;
}

function useOneShot(ctrl: RigCtrl, a: AnimState, dt: number) {
  if (ctrl.oneShotSeq !== a.lastSeq) {
    a.lastSeq = ctrl.oneShotSeq;
    a.oneShot = ctrl.oneShot;
    a.t = 0;
  }
  let u = 0;
  if (a.oneShot) {
    const dur = DUR[a.oneShot];
    a.t += dt;
    u = a.t / dur;
    if (u >= 1) {
      if (a.oneShot === "death") u = 1;
      else a.oneShot = null;
    }
  }
  return u;
}

function faceHeading(root: Group | null, ctrl: RigCtrl, a: AnimState) {
  if (!root) return;
  if (!a.headingInit) {
    root.rotation.y = ctrl.heading;
    a.headingInit = true;
  } else {
    root.rotation.y = lerpAngle(root.rotation.y, ctrl.heading, 0.2);
  }
}

/** Dispatch to the correct procedural mob silhouette. */
export default function MonsterRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const kind = config.kind ?? "humanoid";
  switch (kind) {
    case "zombie":
      return <ZombieRig config={config} ctrl={ctrl} />;
    case "goblin":
      return <GoblinRig config={config} ctrl={ctrl} />;
    case "spider":
      return <SpiderRig config={config} ctrl={ctrl} />;
    case "bat":
      return <BatRig config={config} ctrl={ctrl} />;
    case "slime":
      return <SlimeRig config={config} ctrl={ctrl} />;
    case "mushroom":
      return <MushroomRig config={config} ctrl={ctrl} />;
    case "wisp":
      return <WispRig config={config} ctrl={ctrl} />;
    case "critter":
      return <CritterRig config={config} ctrl={ctrl} />;
    default:
      return <CharacterRig config={config} ctrl={ctrl} />;
  }
}

// ---- Zombie: hunched shambler — arms out, drag-shuffle, no human gait ----

function ZombieRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const bob = useRef<Group>(null);
  const head = useRef<Group>(null);
  const shL = useRef<Group>(null);
  const shR = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#c44a3a";
  const s = config.scale ?? 1;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    const reduced = useGameStore.getState().reducedMotion;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const walking = ctrl.move === "walk";
    const spd = 0.5 + 0.5 * Math.min(2, ctrl.speed);
    a.phase += dt * (walking ? 2.6 * spd : 0);
    const p = a.phase;

    // arms reach forward (default zombie pose) — not a runner swing
    let shLx = 0.74;
    let shRx = 0.7;
    let shLz = -0.22;
    let shRz = 0.22;
    let hLx = -0.12;
    let hRx = -0.12;
    let bobY = 0;
    let bobZ = 0;
    let leanX = 0.4;
    let swayZ = 0;
    let headX = 0.24;
    let headZ = 0;

    if (walking) {
      // two-beat shuffle: one leg drags while the other bears weight — no opposed swing
      const beat = p * 0.55;
      const leftUp = Math.max(0, Math.sin(beat));
      const rightUp = Math.max(0, Math.sin(beat + Math.PI));

      hLx = -0.1 - leftUp * 0.22 + rightUp * 0.1;
      hRx = -0.1 - rightUp * 0.22 + leftUp * 0.1;

      // arms stay out front, only twitch
      shLx = 0.76 + Math.sin(beat * 0.35) * 0.04;
      shRx = 0.72 + Math.sin(beat * 0.35 + 1.8) * 0.04;

      bobY = Math.max(leftUp, rightUp) * 0.035;
      bobZ = Math.max(leftUp, rightUp) * 0.07;
      swayZ = (leftUp - rightUp) * 0.13;
      leanX = 0.42 + Math.sin(beat * 0.5) * 0.05;
      headX = 0.26 + Math.sin(beat * 0.3) * 0.1;
      headZ = Math.sin(beat * 0.42 + 0.9) * 0.16;
    } else if (!reduced) {
      const t = state.clock.elapsedTime;
      bobY = Math.sin(t * 0.9) * 0.015;
      headZ = Math.sin(t * 0.7) * 0.1;
      shLx += Math.sin(t * 0.5) * 0.02;
      shRx += Math.sin(t * 0.5 + 1) * 0.02;
    }

    let sink = 0;
    if (a.oneShot === "hit") {
      const k = 1 - Math.min(u, 1);
      leanX += -0.3 * k;
      shLx += -0.2 * k;
      shRx += -0.2 * k;
      headX += -0.2 * k;
    } else if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      leanX = -1.4 * e;
      sink = -0.25 * e;
      shLx = 0.3 - 0.9 * e;
      shRx = 0.3 - 0.9 * e;
      hLx = 0.4 * e;
      hRx = 0.4 * e;
    }

    if (shL.current) {
      shL.current.rotation.x = shLx;
      shL.current.rotation.z = shLz;
    }
    if (shR.current) {
      shR.current.rotation.x = shRx;
      shR.current.rotation.z = shRz;
    }
    if (hipL.current) hipL.current.rotation.x = hLx;
    if (hipR.current) hipR.current.rotation.x = hRx;
    if (head.current) {
      head.current.rotation.x = headX;
      head.current.rotation.z = headZ;
    }
    if (bob.current) {
      bob.current.position.y = bobY + sink;
      bob.current.position.z = bobZ;
      bob.current.rotation.x = leanX;
      bob.current.rotation.z = swayZ;
    }
  });

  return (
    <group ref={root} scale={s}>
      <group ref={bob}>
        <mesh position={[0, 1.1, 0.08]} castShadow>
          <capsuleGeometry args={[0.44, 0.42, 4, 12]} />
          <meshStandardMaterial color={config.torso} />
        </mesh>
        <group ref={head} position={[0, 1.62, 0.06]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <sphereGeometry args={[0.4, 14, 12]} />
            <meshStandardMaterial color={config.skin} />
          </mesh>
          {[-0.14, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.26, 0.34]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.4} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {([[-0.52, shL], [0.52, shR]] as const).map(([x, ref], i) => (
          <group key={i} ref={ref} position={[x, 1.38, 0.1]}>
            <mesh position={[0, -0.38, 0.06]} castShadow>
              <capsuleGeometry args={[0.14, 0.55, 4, 8]} />
              <meshStandardMaterial color={config.skin} />
            </mesh>
          </group>
        ))}
        {([[-0.22, hipL], [0.22, hipR]] as const).map(([x, ref], i) => (
          <group key={i} ref={ref} position={[x, 0.82, 0]}>
            <mesh position={[0, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.17, 0.48, 4, 8]} />
              <meshStandardMaterial color={config.legs} />
            </mesh>
            <mesh position={[0, -0.78, 0.06]}>
              <boxGeometry args={[0.26, 0.14, 0.36]} />
              <meshStandardMaterial color={config.feet} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ---- Goblin: crouched gremlin scurry — high knees, bouncy, sneaky ----

function GoblinRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const bob = useRef<Group>(null);
  const head = useRef<Group>(null);
  const shL = useRef<Group>(null);
  const shR = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#ffcc22";
  const s = config.scale ?? 1;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    const reduced = useGameStore.getState().reducedMotion;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const walking = ctrl.move === "walk";
    const spd = 0.6 + 0.4 * Math.min(2, ctrl.speed);
    a.phase += dt * (walking ? 12 * spd : 0);
    const p = a.phase;

    // crouched idle — low and twitchy
    let shLx = 0.4;
    let shRx = 0.4;
    let hLx = -0.3;
    let hRx = -0.3;
    let bobY = 0;
    let bobZ = 0;
    let leanX = 0.34;
    let twist = 0;
    let headX = 0.22;
    let headY = 0;
    let headZ = 0;

    if (walking) {
      const step = Math.sin(p);
      const hop = Math.sin(p * 2);
      const wobble = Math.sin(p * 1.35 + 0.6) * 0.25; // slight irregularity

      // high-knee crouch trot — knees lift, body stays low
      hLx = -step * 1.1 - 0.38 + wobble;
      hRx = step * 1.1 - 0.38 - wobble;

      // arms pump low at the sides (not overhead runner swing)
      shLx = step * 0.7 + 0.42;
      shRx = -step * 0.7 + 0.42;

      bobY = Math.abs(hop) * 0.15;
      bobZ = Math.max(0, hop) * 0.05;
      leanX = 0.4 + Math.abs(step) * 0.1;
      twist = step * 0.12;
      headX = 0.3 + Math.abs(step) * 0.06;
      headY = Math.sin(p * 0.65) * 0.22;
      headZ = Math.sin(p * 0.9) * 0.07;
    } else if (!reduced) {
      const t = state.clock.elapsedTime;
      bobY = Math.sin(t * 3.5) * 0.025;
      headY = Math.sin(t * 2.2) * 0.15;
      headZ = Math.sin(t * 1.7) * 0.06;
    }

    let sink = 0;
    if (a.oneShot === "hit") {
      const k = 1 - Math.min(u, 1);
      leanX += -0.35 * k;
      bobY += 0.08 * k;
    } else if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      leanX = -1.5 * e;
      sink = -0.2 * e;
      shLx = 0.4 - 1.2 * e;
      shRx = 0.4 - 1.2 * e;
    }

    if (shL.current) shL.current.rotation.x = shLx;
    if (shR.current) shR.current.rotation.x = shRx;
    if (hipL.current) hipL.current.rotation.x = hLx;
    if (hipR.current) hipR.current.rotation.x = hRx;
    if (head.current) {
      head.current.rotation.x = headX;
      head.current.rotation.y = headY;
      head.current.rotation.z = headZ;
    }
    if (bob.current) {
      bob.current.position.y = bobY + sink;
      bob.current.position.z = bobZ;
      bob.current.rotation.x = leanX;
      bob.current.rotation.y = twist;
    }
  });

  return (
    <group ref={root} scale={s}>
      <group ref={bob}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <capsuleGeometry args={[0.38, 0.32, 4, 10]} />
          <meshStandardMaterial color={config.torso} />
        </mesh>
        <group ref={head} position={[0, 1.38, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <sphereGeometry args={[0.36, 14, 12]} />
            <meshStandardMaterial color={config.skin} />
          </mesh>
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.42, 0]} rotation-z={x > 0 ? -0.4 : 0.4}>
              <coneGeometry args={[0.1, 0.28, 6]} />
              <meshStandardMaterial color={config.skin} />
            </mesh>
          ))}
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.2, 0.3]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {([[-0.46, shL], [0.46, shR]] as const).map(([x, ref], i) => (
          <group key={i} ref={ref} position={[x, 1.22, 0]}>
            <mesh position={[0, -0.32, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.42, 4, 8]} />
              <meshStandardMaterial color={config.skin} />
            </mesh>
          </group>
        ))}
        {([[-0.18, hipL], [0.18, hipR]] as const).map(([x, ref], i) => (
          <group key={i} ref={ref} position={[x, 0.72, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <capsuleGeometry args={[0.13, 0.32, 4, 8]} />
              <meshStandardMaterial color={config.legs} />
            </mesh>
            <mesh position={[0, -0.52, 0.05]}>
              <boxGeometry args={[0.22, 0.1, 0.28]} />
              <meshStandardMaterial color={config.feet} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ---- Spider: low body + 8 skittering legs ----

const SPIDER_LEG_ANGLES = [-0.7, -0.35, 0.35, 0.7];
const SPIDER_LEG_PHASE = [0, 0.5, 0.25, 0.75];

function SpiderRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legs = useRef<(Group | null)[]>([]);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#ff2244";
  const s = config.scale ?? 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const walking = ctrl.move === "walk";
    a.phase += dt * (walking ? 14 * (0.5 + 0.5 * Math.min(2, ctrl.speed)) : 0);
    const p = a.phase;

    let bodyY = 0.32;
    let bodyTilt = 0;
    let bodyRoll = 0;

    if (walking) {
      bodyY = 0.32 + Math.sin(p * 2) * 0.04;
      bodyTilt = Math.sin(p) * 0.06;
      bodyRoll = Math.sin(p * 0.5) * 0.04;
    }

    if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      bodyTilt = -0.5 * e;
      bodyY = 0.32 - 0.2 * e;
    }

    if (body.current) {
      body.current.position.y = bodyY;
      body.current.rotation.x = bodyTilt;
      body.current.rotation.z = bodyRoll;
    }

    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const side = i < 4 ? -1 : 1;
      const idx = i % 4;
      const phase = SPIDER_LEG_PHASE[idx];
      if (walking) {
        const lift = Math.max(0, Math.sin(p + phase * Math.PI * 2)) * 0.55;
        leg.rotation.x = -0.3 + lift;
        leg.rotation.z = side * (SPIDER_LEG_ANGLES[idx] + Math.sin(p + phase * Math.PI * 2) * 0.15);
      } else {
        leg.rotation.x = -0.2;
        leg.rotation.z = side * SPIDER_LEG_ANGLES[idx];
      }
    });
  });

  return (
    <group ref={root} scale={s}>
      <group ref={body}>
        <mesh castShadow scale={[1.1, 0.55, 1.3]}>
          <sphereGeometry args={[0.42, 12, 10]} />
          <meshStandardMaterial color={config.torso} />
        </mesh>
        <mesh position={[0, 0.12, 0.38]} scale={[0.7, 0.5, 0.8]} castShadow>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color={config.skin} />
        </mesh>
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.18, 0.52]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const side = i < 4 ? -1 : 1;
          const idx = i % 4;
          const z = (idx - 1.5) * 0.22;
          return (
            <group
              key={i}
              ref={(el) => {
                legs.current[i] = el;
              }}
              position={[side * 0.38, -0.05, z]}
            >
              <mesh position={[side * 0.35, -0.12, 0]} rotation-z={side * 0.5} castShadow>
                <capsuleGeometry args={[0.04, 0.42, 3, 6]} />
                <meshStandardMaterial color={config.legs} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ---- Bat: small body + flapping wings ----

function BatRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#b06cff";
  const s = config.scale ?? 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    const reduced = useGameStore.getState().reducedMotion;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const flying = ctrl.move === "walk";
    a.phase += dt * (flying ? 16 : 4);
    const p = a.phase;
    const flap = reduced ? 0.3 : Math.sin(p) * 0.7;

    if (wingL.current) wingL.current.rotation.z = 0.4 + flap;
    if (wingR.current) wingR.current.rotation.z = -0.4 - flap;

    if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      if (root.current) root.current.rotation.x = 0.8 * e;
    } else if (root.current) {
      root.current.rotation.x *= 0.9;
    }
  });

  return (
    <group ref={root} scale={s}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={config.torso} />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.04, 0.16]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      ))}
      <group ref={wingL} position={[-0.18, 0, 0]}>
        <mesh position={[-0.35, 0, 0]} rotation-y={0.3}>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color={config.skin} transparent opacity={0.85} side={DoubleSide} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.18, 0, 0]}>
        <mesh position={[0.35, 0, 0]} rotation-y={-0.3}>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color={config.skin} transparent opacity={0.85} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ---- Slime: squash-stretch blob ----

function SlimeRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const blob = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#0a1f14";
  const s = config.scale ?? 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const hopping = ctrl.move === "walk";
    a.phase += dt * (hopping ? 6 * ctrl.speed : 0);
    const p = a.phase;

    let sy = 0.75;
    let sx = 1;
    let y = 0.35;

    if (hopping) {
      const hop = Math.abs(Math.sin(p));
      sy = 0.65 + hop * 0.35;
      sx = 1.15 - hop * 0.2;
      y = 0.2 + hop * 0.35;
    }

    if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      sy = 0.75 * (1 - e * 0.6);
      sx = 1 + e * 0.5;
      y = 0.35 * (1 - e);
    }

    if (blob.current) {
      blob.current.position.y = y;
      blob.current.scale.set(sx, sy, sx);
    }
  });

  return (
    <group ref={root} scale={s}>
      <group ref={blob}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 14, 12]} />
          <meshStandardMaterial color={config.torso} transparent opacity={0.88} />
        </mesh>
        {[-0.16, 0.16].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.38]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={eye} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---- Mushroom: dome cap + stub body, springy hop ----

function MushroomRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null); // hops (y) + death tilt
  const cap = useRef<Group>(null); //  squash-stretch on the hop
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#3a2a20";
  const s = config.scale ?? 1;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    const reduced = useGameStore.getState().reducedMotion;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const moving = ctrl.move === "walk";
    a.phase += dt * (moving ? 5 * (0.6 + 0.4 * Math.min(2, ctrl.speed)) : 1.5);
    const p = a.phase;

    let y = 0;
    let capY = 1;
    let capX = 1;
    let tilt = 0;
    let sink = 0;

    if (moving) {
      const hop = Math.abs(Math.sin(p)); // springy bounce
      y = hop * 0.34;
      capY = 0.82 + hop * 0.26; // stretch at apex, squash on land
      capX = 1.18 - hop * 0.2;
    } else if (!reduced) {
      const t = state.clock.elapsedTime;
      capY = 1 + Math.sin(t * 1.6) * 0.05; // gentle breathing
      capX = 1 - Math.sin(t * 1.6) * 0.04;
    }

    if (a.oneShot === "hit") {
      const k = 1 - Math.min(u, 1);
      capY = 0.7 + 0.3 * (1 - k);
      capX = 1.2 - 0.2 * (1 - k);
    } else if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      tilt = 1.4 * e;
      sink = -0.22 * e;
    }

    if (body.current) {
      body.current.position.y = y + sink;
      body.current.rotation.x = tilt;
    }
    if (cap.current) cap.current.scale.set(capX, capY, capX);
  });

  return (
    <group ref={root} scale={s}>
      <group ref={body}>
        {/* stub stem */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.32, 0.55, 10]} />
          <meshStandardMaterial color={config.skin} />
        </mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.32, 0.27]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={eye} />
          </mesh>
        ))}
        {/* dome cap */}
        <group ref={cap} position={[0, 0.54, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={config.torso} />
          </mesh>
          {(
            [
              [0.2, 0.22, 0.16],
              [-0.24, 0.16, 0.02],
              [0.02, 0.34, -0.2],
              [-0.06, 0.2, 0.28],
            ] as const
          ).map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color={config.legs} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ---- Wisp: glowing orb ----

function WispRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const s = config.scale ?? 1;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    faceHeading(root.current, ctrl, a);
    useOneShot(ctrl, a, dt);
    if (root.current && ctrl.move === "walk") {
      root.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.08;
    }
  });

  return (
    <group ref={root} scale={s}>
      <mesh>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial color={config.torso} emissive={config.torso} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 14, 14]} />
        <meshBasicMaterial color={config.torso} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color={config.torso} intensity={2.5} distance={4} decay={2} />
    </group>
  );
}

// ---- Critter: shell-backed beetle ----

function CritterRig({ config, ctrl }: { config: RigConfig; ctrl: RigCtrl }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const anim = useRef<AnimState>({ phase: 0, headingInit: false, oneShot: null, t: 0, lastSeq: ctrl.oneShotSeq });
  const eye = config.eye ?? "#f2b94c";
  const s = config.scale ?? 1;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    faceHeading(root.current, ctrl, a);
    const u = useOneShot(ctrl, a, dt);

    const scurrying = ctrl.move === "walk";
    a.phase += dt * (scurrying ? 18 * ctrl.speed : 0);
    const p = a.phase;

    let bob = 0;
    let wobble = 0;
    if (scurrying) {
      bob = Math.abs(Math.sin(p * 2)) * 0.04;
      wobble = Math.sin(p) * 0.08;
    }

    if (a.oneShot === "death") {
      const e = easeOut(Math.min(u, 1));
      wobble = 0.5 * e;
    }

    if (body.current) {
      body.current.position.y = 0.3 + bob;
      body.current.rotation.z = wobble;
    }
  });

  return (
    <group ref={root} scale={s}>
      <group ref={body}>
        <mesh scale={[1, 0.65, 1.2]} castShadow>
          <dodecahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color={config.legs} flatShading />
        </mesh>
        <mesh position={[0, 0.14, -0.04]} scale={[1, 0.55, 1]} castShadow>
          <sphereGeometry args={[0.3, 10, 8]} />
          <meshStandardMaterial color={config.torso} flatShading />
        </mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.1, 0.36]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={eye} emissive={eye} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        ))}
        {[-0.3, 0.3].map((x) =>
          [-0.1, 0.1].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.05, z]} rotation-z={x > 0 ? -0.4 : 0.4}>
              <boxGeometry args={[0.28, 0.06, 0.06]} />
              <meshStandardMaterial color={config.feet} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}
