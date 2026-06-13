import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshBasicMaterial, PointsMaterial } from "three";
import { daynight } from "./daynight";

/**
 * Night sky that follows the cycle: ~220 stars fade out by day, and a single
 * celestial body position (daynight.sunDir) holds the warm sun by day and the
 * crescent moon by night, cross-fading at dawn/dusk. All fog-disabled (they
 * live near the far plane and would otherwise vanish into the fog).
 */

const R = 150;

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
  const starMat = useRef<PointsMaterial>(null);
  const sun = useRef<Group>(null);
  const sunMat = useRef<MeshBasicMaterial>(null);
  const sunGlow = useRef<MeshBasicMaterial>(null);
  const moon = useRef<Group>(null);
  const moonMat = useRef<MeshBasicMaterial>(null);
  const moonShade = useRef<Mesh>(null);

  const stars = useMemo(() => {
    const rand = mulberry32(777);
    const n = 220;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(0.25 + rand() * 0.72); // bias to the zenith
      arr[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = R * Math.cos(phi) + 10;
      arr[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);

  useFrame(() => {
    if (starMat.current) starMat.current.opacity = daynight.starOpacity * 0.9;

    const d = daynight.sunDir;
    const px = d[0] * R;
    const py = Math.max(d[1] * R, -20);
    const pz = d[2] * R;

    if (sun.current) sun.current.position.set(px, py, pz);
    if (moon.current) moon.current.position.set(px, py, pz);
    if (sunMat.current) sunMat.current.opacity = daynight.sunDiscOpacity;
    if (sunGlow.current) sunGlow.current.opacity = daynight.sunDiscOpacity * 0.4;
    if (moonMat.current) moonMat.current.opacity = daynight.moonDiscOpacity;
    if (moonShade.current) {
      const m = moonShade.current.material as MeshBasicMaterial;
      // shade tracks the sky color so the crescent carve stays invisible —
      // simplest is to ride the moon's own fade
      m.opacity = daynight.moonDiscOpacity;
    }
  });

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starMat}
          size={1.7}
          sizeAttenuation={false}
          color="#cdd6f5"
          transparent
          opacity={0.85}
          fog={false}
          depthWrite={false}
        />
      </points>

      {/* sun */}
      <group ref={sun}>
        <mesh>
          <sphereGeometry args={[6, 24, 16]} />
          <meshBasicMaterial ref={sunMat} color="#ffdf9a" transparent toneMapped={false} fog={false} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[10, 24, 16]} />
          <meshBasicMaterial ref={sunGlow} color="#ffb860" transparent opacity={0.4} toneMapped={false} fog={false} depthWrite={false} />
        </mesh>
      </group>

      {/* moon (crescent: lit disc + sky-shaded occluder) */}
      <group ref={moon}>
        <mesh>
          <sphereGeometry args={[5.2, 24, 16]} />
          <meshBasicMaterial ref={moonMat} color="#dfe8ff" transparent toneMapped={false} fog={false} depthWrite={false} />
        </mesh>
        <mesh ref={moonShade} position={[2.5, 1.3, 2.0]}>
          <sphereGeometry args={[5.1, 24, 16]} />
          <meshBasicMaterial color="#0b0e1a" transparent fog={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
