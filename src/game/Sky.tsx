import { useMemo } from "react";
import { PALETTE } from "../data/config";

/**
 * Night sky: ~220 static star points + a simple crescent moon, both with fog
 * disabled (they live near the far plane and would otherwise fade to nothing).
 * The moon sits along the moonlight direction (NW) — the side the dimetric
 * camera actually faces. The crescent is the classic two-sphere trick: a
 * sky-coloured sphere overlaps the lit one and carves the shadowed face.
 */

/** Must match the directional "moonlight" position in World.tsx. */
export const MOON_DIR: [number, number, number] = [-40, 60, -25];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Sky() {
  const stars = useMemo(() => {
    const rand = mulberry32(777);
    const n = 220;
    const arr = new Float32Array(n * 3);
    const R = 150;
    for (let i = 0; i < n; i++) {
      const theta = rand() * Math.PI * 2;
      // bias toward the zenith; keep everything well above the horizon
      const phi = Math.acos(0.25 + rand() * 0.72);
      arr[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = R * Math.cos(phi) + 10;
      arr[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  const moonPos = useMemo<[number, number, number]>(() => {
    const [x, y, z] = MOON_DIR;
    const len = Math.hypot(x, y, z);
    const R = 140;
    return [(x / len) * R, (y / len) * R, (z / len) * R];
  }, []);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.7}
          sizeAttenuation={false}
          color="#cdd6f5"
          transparent
          opacity={0.85}
          fog={false}
          depthWrite={false}
        />
      </points>

      <group position={moonPos}>
        {/* lit disc */}
        <mesh>
          <sphereGeometry args={[5.5, 24, 16]} />
          <meshBasicMaterial color="#dfe8ff" toneMapped={false} fog={false} />
        </mesh>
        {/* sky-coloured occluder carves the crescent */}
        <mesh position={[2.6, 1.4, 2.2]}>
          <sphereGeometry args={[5.4, 24, 16]} />
          <meshBasicMaterial color={PALETTE.nightSky} fog={false} />
        </mesh>
      </group>
    </group>
  );
}
