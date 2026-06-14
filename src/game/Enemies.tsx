import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { WORLD_BOUNDS, buildingById } from "../data/buildings";
import { FEATURES } from "../data/config";
import { ARENA_POOL, MOBS, pickMob, type MobType } from "../data/mobs";
import { spriteDef, type Facing, type SpriteDef } from "../data/sprites";
import { ARENA_WAVES, FROZEN_MODES, useGameStore } from "../store/useGameStore";
import { sfxHit, sfxHurt } from "../audio/audio";
import { playerState } from "./playerState";
import { combat, consumeAttack } from "./combat";
import SpriteActor, { makeCtrl } from "./SpriteActor";

const MAX = 12;
const WORLD_COUNT = 6;
const ATTACK_RANGE = 3.0;
const RESPAWN_DELAY = 6000;
const INVULN = 1500;
const KNOCKBACK = 1.6;
const DIE_MS = 480; // hold the death animation before despawning

const WORLD_ANCHORS: [number, number][] = [
  [-34, -26],
  [34, -28],
  [-36, 14],
  [36, 16],
  [2, -36],
  [-28, 32],
];

const ARENA = buildingById("the-arena");
const ARENA_CENTER: [number, number] = ARENA ? ARENA.position : [19, 17];

const facingOf = (vx: number, vz: number): Facing =>
  Math.abs(vx) > Math.abs(vz) ? (vx > 0 ? "right" : "left") : vz > 0 ? "down" : "up";

interface E {
  pos: Vector3;
  vx: number;
  vz: number;
  tx: number;
  tz: number;
  wanderT: number;
  alive: boolean;
  active: boolean;
  hp: number;
  respawnAt: number;
  hitUntil: number;
  dyingUntil: number;
  mode: "world" | "arena";
  type: MobType;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Roaming mobs (F13–F15) + the Arena wave driver (F17), now rendered as pixel
 * sprites. The sim runs off-React in one useFrame mutating per-slot transform
 * groups + sprite controls; each slot shows ONE SpriteActor whose def is React
 * state (changed only when a slot's kind changes — infrequent). Kinds are
 * chosen by the day/night segment. Death plays a one-shot 'die' before despawn.
 */
export default function Enemies() {
  const slots = useRef<(Group | null)[]>([]);
  const bobs = useRef<(Group | null)[]>([]);
  const ctrls = useRef(Array.from({ length: MAX }, () => makeCtrl("down")));
  const prevArena = useRef(false);
  const waveSpawned = useRef(0);
  const prevSegment = useRef<string>("");

  const data = useRef<E[]>(
    Array.from({ length: MAX }, (_, i) => {
      const a = WORLD_ANCHORS[i % WORLD_ANCHORS.length];
      return {
        pos: new Vector3(a[0], 0, a[1]),
        vx: 0,
        vz: 1,
        tx: 0,
        tz: 1,
        wanderT: 0,
        alive: i < WORLD_COUNT,
        active: i < WORLD_COUNT,
        hp: MOBS.bug.hp,
        respawnAt: 0,
        hitUntil: 0,
        dyingUntil: 0,
        mode: i < WORLD_COUNT ? "world" : "arena",
        type: MOBS.bug,
      };
    }),
  );

  // Per-slot sprite def lives in React state; only changes when a slot's kind
  // changes, so the per-frame sim never re-renders.
  const [defs, setDefs] = useState<SpriteDef[]>(() => data.current.map((e) => spriteDef(e.type.id)));
  const dirty = useRef(false);

  const setType = (e: E, type: MobType) => {
    if (e.type.id !== type.id) dirty.current = true;
    e.type = type;
  };

  const spawnArenaWave = (n: number) => {
    const count = Math.min(2 + n, MAX - WORLD_COUNT);
    for (let s = WORLD_COUNT; s < MAX; s++) {
      const e = data.current[s];
      const idx = s - WORLD_COUNT;
      if (idx < count) {
        const a = (idx / count) * Math.PI * 2 + Math.random();
        e.pos.set(ARENA_CENTER[0] + Math.cos(a) * 5, 0, ARENA_CENTER[1] + Math.sin(a) * 5);
        e.alive = true;
        e.active = true;
        e.hitUntil = 0;
        e.dyingUntil = 0;
        setType(e, MOBS[ARENA_POOL[Math.min(ARENA_POOL.length - 1, Math.floor(idx / 2 + (n - 1)) % ARENA_POOL.length)]]);
        e.hp = e.type.hp;
      } else {
        e.active = false;
        e.alive = false;
      }
    }
    waveSpawned.current = n;
  };

  const setupWorld = (segment: string) => {
    for (let s = 0; s < MAX; s++) {
      const e = data.current[s];
      if (s < WORLD_COUNT) {
        const a = WORLD_ANCHORS[s];
        e.pos.set(a[0], 0, a[1]);
        setType(e, pickMob(segment, Math.random()));
        e.alive = true;
        e.active = true;
        e.hp = e.type.hp;
        e.respawnAt = 0;
        e.hitUntil = 0;
        e.dyingUntil = 0;
        e.mode = "world";
      } else {
        e.active = false;
        e.alive = false;
      }
    }
  };

  useFrame((state, delta) => {
    const st = useGameStore.getState();
    if (!FEATURES.combat) {
      slots.current.forEach((g) => g && (g.visible = false));
      return;
    }
    if (FROZEN_MODES.includes(st.mode)) return;

    const now = performance.now();
    const tSec = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const arena = st.arenaActive;
    const ppos = playerState.pos;
    const reduced = st.reducedMotion;

    if (arena !== prevArena.current) {
      if (arena) {
        for (let s = 0; s < WORLD_COUNT; s++) {
          data.current[s].active = false;
          data.current[s].alive = false;
        }
        spawnArenaWave(1);
      } else {
        setupWorld(st.daySegment);
        prevSegment.current = st.daySegment;
        waveSpawned.current = 0;
      }
      prevArena.current = arena;
    }

    if (!arena && st.daySegment !== prevSegment.current) {
      setupWorld(st.daySegment);
      prevSegment.current = st.daySegment;
    }

    const attacking = consumeAttack();
    let arenaAlive = 0;

    for (let s = 0; s < MAX; s++) {
      const e = data.current[s];
      const slot = slots.current[s];
      const ctrl = ctrls.current[s];
      if (!e.active) {
        if (slot) slot.visible = false;
        continue;
      }

      // dead → maybe still playing the death animation, else respawn or hide
      if (!e.alive) {
        if (now < e.dyingUntil) {
          // hold death pose; no AI/damage
          if (slot) {
            slot.visible = true;
            slot.position.set(e.pos.x, 0, e.pos.z);
            slot.scale.setScalar(e.type.scale);
          }
          continue;
        }
        if (e.mode === "world" && now >= e.respawnAt) {
          const a = WORLD_ANCHORS[s % WORLD_ANCHORS.length];
          e.pos.set(a[0], 0, a[1]);
          setType(e, pickMob(st.daySegment, Math.random()));
          e.alive = true;
          e.hp = e.type.hp;
          ctrl.oneShot = null;
        } else {
          if (slot) slot.visible = false;
          continue;
        }
      }

      const ty = e.type;
      const dx = ppos.x - e.pos.x;
      const dz = ppos.z - e.pos.z;
      const dist = Math.hypot(dx, dz) || 0.0001;

      let speed = ty.wanderSpeed;
      if (arena || dist < ty.detect) {
        speed = ty.chaseSpeed;
        e.vx = dx / dist;
        e.vz = dz / dist;
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          const anchor = WORLD_ANCHORS[s % WORLD_ANCHORS.length];
          const ax = anchor[0] - e.pos.x;
          const az = anchor[1] - e.pos.z;
          const ad = Math.hypot(ax, az);
          if (ad > 10) {
            e.tx = ax / ad;
            e.tz = az / ad;
          } else {
            const a = Math.random() * Math.PI * 2;
            e.tx = Math.cos(a);
            e.tz = Math.sin(a);
          }
          e.wanderT = 2 + Math.random() * 2;
        }
        e.vx = e.tx;
        e.vz = e.tz;
      }
      e.pos.x = clamp(e.pos.x + e.vx * speed * dt, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
      e.pos.z = clamp(e.pos.z + e.vz * speed * dt, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);

      if (attacking && dist < ATTACK_RANGE) {
        e.hp -= 1;
        e.hitUntil = now + 150;
        e.pos.x -= (dx / dist) * KNOCKBACK;
        e.pos.z -= (dz / dist) * KNOCKBACK;
        if (e.hp <= 0) {
          e.alive = false;
          e.dyingUntil = now + DIE_MS;
          e.respawnAt = now + RESPAWN_DELAY;
          ctrl.oneShot = "die";
          ctrl.oneShotSeq++;
          sfxHit();
          st.onMobKilled?.(e.type.id, e.pos.x, e.pos.z);
        }
      }

      if (e.alive && dist < ty.touch && now > combat.invulnUntil) {
        combat.invulnUntil = now + INVULN;
        combat.lastHitAt = now;
        st.damagePlayer(1);
        sfxHurt();
      }

      if (e.alive && e.mode === "arena") arenaAlive++;

      // drive the sprite
      ctrl.move = "walk";
      ctrl.facing = facingOf(e.vx, e.vz);

      if (slot) {
        slot.visible = true;
        slot.position.set(e.pos.x, 0, e.pos.z);
        slot.scale.setScalar(ty.scale * (now < e.hitUntil ? 1.2 : 1));
      }
      const bob = bobs.current[s];
      if (bob) {
        let y = 0;
        if (!reduced) {
          if (ty.bob === "float") y = ty.baseY + Math.sin(tSec * 2 + s) * 0.28;
          else if (ty.bob === "hop") y = Math.abs(Math.sin(tSec * 4 + s)) * 0.45;
          else y = ty.baseY;
        } else y = ty.baseY;
        bob.position.y = y;
      }
    }

    if (arena && arenaAlive === 0 && waveSpawned.current > 0) {
      if (waveSpawned.current < ARENA_WAVES) {
        const next = waveSpawned.current + 1;
        spawnArenaWave(next);
        st.setArenaWave(next);
        st.notify(`The Arena — Wave ${next}`);
      } else {
        st.healToFull();
        st.notify("The Arena is cleared! 🏆");
        st.stopArena();
      }
    }

    if (dirty.current) {
      dirty.current = false;
      setDefs(data.current.map((e) => spriteDef(e.type.id)));
    }
  });

  return (
    <group>
      {Array.from({ length: MAX }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            slots.current[i] = el;
          }}
          visible={false}
        >
          {/* ground shadow stays put while the sprite bobs */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
            <circleGeometry args={[0.42, 14]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.28} />
          </mesh>
          <group
            ref={(el) => {
              bobs.current[i] = el;
            }}
          >
            <SpriteActor def={defs[i]} ctrl={ctrls.current[i]} />
          </group>
        </group>
      ))}
    </group>
  );
}
