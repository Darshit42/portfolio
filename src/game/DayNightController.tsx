import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, FogExp2, type AmbientLight, type DirectionalLight } from "three";
import { useGameStore } from "../store/useGameStore";
import { advancePhase, daynight, sample, segmentOf } from "./daynight";

/**
 * Drives the day/night cycle (PRD §day-night): owns the celestial lights, fog,
 * background color and tone-mapping exposure, advancing them through the day.
 * The sun is the sole shadow caster and arcs east→overhead→west; at night it
 * becomes a fixed cool moonlight. Writes the live `daynight` snapshot for Sky
 * and pushes the coarse segment to the store so mobs can react.
 */
export default function DayNightController({ touch }: { touch: boolean }) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const reduced = useGameStore((s) => s.reducedMotion);

  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const fill = useRef<DirectionalLight>(null);

  // own the scene fog + background (mutated each frame, never reallocated)
  const fog = useMemo(() => new FogExp2("#0b0e1a", 0.016), []);
  const bg = useMemo(() => new Color("#0b0e1a"), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = bg;
    if (import.meta.env.DEV) {
      Object.assign(window as object, { __scene: scene, __gl: gl, __bg: bg });
    }
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fog, bg, gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const phase = advancePhase(dt, reduced);
    const s = sample(phase);

    bg.copy(s.sky);
    fog.color.copy(s.fog);
    fog.density = s.fogDensity;
    gl.toneMappingExposure = s.exposure;

    if (ambient.current) {
      ambient.current.color.copy(s.ambient);
      ambient.current.intensity = s.ambientI;
    }
    if (sun.current) {
      sun.current.color.copy(s.sunColor);
      sun.current.intensity = s.sunI;
      sun.current.position.set(s.sunDir[0] * 90, s.sunDir[1] * 90, s.sunDir[2] * 90);
    }
    if (fill.current) fill.current.intensity = s.fillI;

    // publish snapshot for Sky + the warm-light dimmer for Torches
    daynight.starOpacity = s.starOpacity;
    daynight.sunDiscOpacity = s.sunDiscOpacity;
    daynight.moonDiscOpacity = s.moonDiscOpacity;
    daynight.warm = 1 - s.sunDiscOpacity * 0.85;
    daynight.sunDir[0] = s.sunDir[0];
    daynight.sunDir[1] = s.sunDir[1];
    daynight.sunDir[2] = s.sunDir[2];

    // coarse segment → store (only on change; drives mob spawning)
    const seg = segmentOf(phase);
    if (seg !== daynight.segment) {
      daynight.segment = seg;
      useGameStore.getState().setDaySegment(seg);
    }
  });

  return (
    <group>
      <ambientLight ref={ambient} color="#3a4258" intensity={1.0} />
      {/* sun / moon — the sole shadow caster, repositioned each frame */}
      <directionalLight
        ref={sun}
        position={[-50, 65, -36]}
        color="#8a9cc8"
        intensity={1.5}
        castShadow={!touch}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-66}
        shadow-camera-right={66}
        shadow-camera-top={66}
        shadow-camera-bottom={-66}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
      />
      {/* cool camera-side fill so backlit walls still read */}
      <directionalLight ref={fill} position={[40, 30, 48]} color="#6a7a9e" intensity={0.8} />
    </group>
  );
}
