import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { WORLD_BOUNDS, buildingById } from "../data/buildings";
import { FEATURES } from "../data/config";
import { ARENA_WAVES, FROZEN_MODES, useGameStore } from "../store/useGameStore";
import { sfxHit, sfxHurt } from "../audio/audio";
import { playerState } from "./playerState";
import { combat, consumeAttack } from "./combat";
import Bug from "./Bug";

const MAX = 12;
const WORLD_COUNT = 6; // slots 0..5 roam the world; 6..11 are the arena pool
const DETECT = 13; // chase radius
const TOUCH = 1.35; // contact-damage range
const ATTACK_RANGE = 3.0; // forgiving omnidirectional swing
const SPEED_WANDER = 2.2;
const SPEED_CHASE = 4.3;
const ENEMY_HP = 2;
const RESPAWN_DELAY = 6000;
const INVULN = 1500;
const KNOCKBACK = 1.6;

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
  mode: "world" | "arena";
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Roaming bug enemies (F13–F15) + the Arena wave driver (F17). The whole sim
 * runs off-React in one useFrame, mutating mesh refs directly. Combat is light
 * and generous: 2 HP bugs, a forgiving swing, and respawn-to-Tavern on defeat.
 */
export default function Enemies() {
  const groups = useRef<(Group | null)[]>([]);
  const prevArena = useRef(false);
  const waveSpawned = useRef(0);
  const accents = useMemo(() => ["#ff5470", "#b06cff", "#ff7a3c"], []);

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
        hp: ENEMY_HP,
        respawnAt: 0,
        hitUntil: 0,
        mode: i < WORLD_COUNT ? "world" : "arena",
      };
    }),
  );

  const spawnArenaWave = (n: number) => {
    const count = Math.min(2 + n, MAX - WORLD_COUNT); // wave 1=3, 2=4, 3=5
    for (let s = WORLD_COUNT; s < MAX; s++) {
      const e = data.current[s];
      const idx = s - WORLD_COUNT;
      if (idx < count) {
        const a = (idx / count) * Math.PI * 2 + Math.random();
        e.pos.set(ARENA_CENTER[0] + Math.cos(a) * 5, 0, ARENA_CENTER[1] + Math.sin(a) * 5);
        e.alive = true;
        e.active = true;
        e.hp = ENEMY_HP;
        e.hitUntil = 0;
      } else {
        e.active = false;
        e.alive = false;
      }
    }
    waveSpawned.current = n;
  };

  const setupWorld = () => {
    for (let s = 0; s < MAX; s++) {
      const e = data.current[s];
      if (s < WORLD_COUNT) {
        const a = WORLD_ANCHORS[s];
        e.pos.set(a[0], 0, a[1]);
        e.alive = true;
        e.active = true;
        e.hp = ENEMY_HP;
        e.respawnAt = 0;
        e.hitUntil = 0;
      } else {
        e.active = false;
        e.alive = false;
      }
    }
  };

  useFrame((_, delta) => {
    const st = useGameStore.getState();
    if (!FEATURES.combat) {
      groups.current.forEach((g) => g && (g.visible = false));
      return;
    }
    // Freeze the whole sim while an overlay is up — the player must never take
    // a hit while reading a Codex or talking to an NPC.
    if (FROZEN_MODES.includes(st.mode)) return;

    const dt = Math.min(delta, 0.05);
    const now = performance.now();
    const arena = st.arenaActive;
    const ppos = playerState.pos;

    // phase transitions
    if (arena !== prevArena.current) {
      if (arena) {
        for (let s = 0; s < WORLD_COUNT; s++) {
          data.current[s].active = false;
          data.current[s].alive = false;
        }
        spawnArenaWave(1);
      } else {
        setupWorld();
        waveSpawned.current = 0;
      }
      prevArena.current = arena;
    }

    const attacking = consumeAttack();
    let arenaAlive = 0;

    for (let s = 0; s < MAX; s++) {
      const e = data.current[s];
      const g = groups.current[s];
      if (!e.active) {
        if (g) g.visible = false;
        continue;
      }
      if (!e.alive) {
        if (e.mode === "world" && now >= e.respawnAt) {
          const a = WORLD_ANCHORS[s % WORLD_ANCHORS.length];
          e.pos.set(a[0], 0, a[1]);
          e.alive = true;
          e.hp = ENEMY_HP;
        } else {
          if (g) g.visible = false;
          continue;
        }
      }

      const dx = ppos.x - e.pos.x;
      const dz = ppos.z - e.pos.z;
      const dist = Math.hypot(dx, dz) || 0.0001;

      let speed = SPEED_WANDER;
      if (arena || dist < DETECT) {
        speed = SPEED_CHASE;
        e.vx = dx / dist;
        e.vz = dz / dist;
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          // Drift back toward the home anchor if the random walk strayed far,
          // so world bugs stay in their corners instead of crowding the relics.
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
          e.respawnAt = now + RESPAWN_DELAY;
          sfxHit();
        }
      }

      if (e.alive && dist < TOUCH && now > combat.invulnUntil) {
        combat.invulnUntil = now + INVULN;
        combat.lastHitAt = now;
        st.damagePlayer(1);
        sfxHurt();
      }

      if (e.alive && e.mode === "arena") arenaAlive++;

      if (g) {
        g.visible = e.alive;
        g.position.set(e.pos.x, 0, e.pos.z);
        g.rotation.y = Math.atan2(e.vx, e.vz);
        g.scale.setScalar(now < e.hitUntil ? 1.3 : 1);
      }
    }

    // arena wave progression
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
  });

  return (
    <group>
      {Array.from({ length: MAX }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          visible={false}
        >
          <Bug accent={accents[i % accents.length]} />
        </group>
      ))}
    </group>
  );
}
