import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group, type MeshStandardMaterial } from "three";
import { FROZEN_MODES, useGameStore } from "../store/useGameStore";
import { itemDef, rollDrops } from "../data/items";
import { sfxPickup } from "../audio/audio";
import { playerState } from "./playerState";

const MAX = 24;
const LIFE = 30000; // ms before a dropped item fades
const MAGNET = 3.6; // pulled toward the player within this range
const COLLECT = 1.2;

interface P {
  active: boolean;
  item: string;
  pos: Vector3;
  born: number;
}

/**
 * Loot drops + pickups. Registers itself as the store's onMobKilled handler;
 * each mob death rolls its drop table and spawns bobbing glow-orbs that magnet
 * to the player and flow into the inventory (coins to the counter). Pool +
 * sim run off-React; only inventory writes touch the store.
 */
export default function Pickups() {
  const groups = useRef<(Group | null)[]>([]);
  const mats = useRef<(MeshStandardMaterial | null)[]>([]);
  const pool = useRef<P[]>(
    Array.from({ length: MAX }, () => ({ active: false, item: "coin", pos: new Vector3(), born: 0 })),
  );

  useEffect(() => {
    const spawn = (mobId: string, x: number, z: number) => {
      for (const item of rollDrops(mobId)) {
        const slot = pool.current.find((p) => !p.active);
        if (!slot) break;
        slot.active = true;
        slot.item = item;
        slot.born = performance.now();
        slot.pos.set(x + (Math.random() - 0.5) * 1.4, 0, z + (Math.random() - 0.5) * 1.4);
      }
    };
    useGameStore.setState({ onMobKilled: spawn });
    return () => useGameStore.setState({ onMobKilled: undefined });
  }, []);

  useFrame((state, delta) => {
    const st = useGameStore.getState();
    if (FROZEN_MODES.includes(st.mode)) return;
    const now = performance.now();
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const pp = playerState.pos;

    for (let i = 0; i < MAX; i++) {
      const p = pool.current[i];
      const g = groups.current[i];
      if (!p.active) {
        if (g) g.visible = false;
        continue;
      }
      if (now - p.born > LIFE) {
        p.active = false;
        if (g) g.visible = false;
        continue;
      }

      const dx = pp.x - p.pos.x;
      const dz = pp.z - p.pos.z;
      const dist = Math.hypot(dx, dz) || 0.001;

      if (dist < COLLECT) {
        st.addItem(p.item, 1);
        sfxPickup();
        p.active = false;
        if (g) g.visible = false;
        continue;
      }
      if (dist < MAGNET) {
        const speed = (1 + (MAGNET - dist) * 2.5) * dt; // accelerates as it nears
        p.pos.x += (dx / dist) * speed;
        p.pos.z += (dz / dist) * speed;
      }

      if (g) {
        g.visible = true;
        g.position.set(p.pos.x, 0.7 + Math.sin(t * 3 + i) * 0.12, p.pos.z);
        g.rotation.y = t * 2;
      }
      const m = mats.current[i];
      if (m) {
        const c = itemDef(p.item).color;
        m.color.set(c);
        m.emissive.set(c);
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
          <mesh>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[i] = el;
              }}
              color="#f2c14c"
              emissive="#f2c14c"
              emissiveIntensity={1.3}
              toneMapped={false}
            />
          </mesh>
          {/* ground glow */}
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.66, 0]}>
            <circleGeometry args={[0.34, 16]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
