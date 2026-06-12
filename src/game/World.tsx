import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import FollowCamera from "./Camera";
import Ground from "./Ground";
import Decor from "./Decor";
import Sky, { MOON_DIR } from "./Sky";
import Buildings from "./Buildings";
import PlazaTotem from "./PlazaTotem";
import Torches from "./Torches";
import Player from "./Player";
import Npcs from "./Npcs";
import Enemies from "./Enemies";
import Interior from "./Interior";
import Secrets from "./Secrets";
import Particles from "./Particles";
import PostFX from "./PostFX";
import { isTouchDevice } from "./webgl";
import { FEATURES, PALETTE } from "../data/config";

/**
 * The R3F scene — a torchlit town at night. Lighting model (PRD-art §1):
 * exponential fog into the night sky, a whisper of cool ambient, one dim
 * "moonlight" directional (the only shadow caster, PCF-soft), and warm point
 * lights as the real illumination (Torches/fountain/forge). Post bloom +
 * vignette on desktop only. Shadows and AA are trimmed on touch devices to
 * hold the mobile budget; repeated geometry is instanced.
 */
export default function World() {
  const touch = isTouchDevice();
  const postfx = FEATURES.postfx && !touch;

  return (
    <Canvas
      shadows={touch ? false : "soft"}
      dpr={touch ? [1, 1.5] : [1, 2]}
      camera={{ position: [15, 23, 18], fov: 42, near: 0.5, far: 260 }}
      gl={{ antialias: !touch, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        // Moody but not murky — silhouettes must stay readable (§8).
        // ACES filmic rolls off the warm pools, so exposure can run high.
        gl.toneMappingExposure = 1.75;
      }}
      frameloop="always"
    >
      <color attach="background" args={[PALETTE.nightSky]} />
      <fogExp2 attach="fog" args={[PALETTE.nightSky, 0.016]} />

      {/* dim cool base so unlit faces never go fully black.
          NOTE: three r155+ physical light units — point lights need big
          intensities (decay-2 attenuates as 1/d²); these two are unitless. */}
      {/* Light colors stay MID-sRGB: dark hexes crush to ~0.03 in linear and
          multiply against dark albedos to invisible. Hue carries the mood. */}
      <ambientLight color="#3a4258" intensity={1.0} />
      {/* moonlight — the only shadow caster; matches the moon in Sky. */}
      <directionalLight
        position={MOON_DIR}
        color="#8a9cc8"
        intensity={1.5}
        castShadow={!touch}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-64}
        shadow-camera-right={64}
        shadow-camera-top={64}
        shadow-camera-bottom={-64}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
      />
      {/* cool fill from the camera side (SE) — the moon backlights the town,
          so without this every camera-facing wall sits in its own shadow.
          No shadow casting; just lifts silhouettes to readable. */}
      <directionalLight position={[40, 30, 48]} color="#6a7a9e" intensity={0.8} />

      <Suspense fallback={null}>
        <Sky />
        <Ground />
        <Decor />
        <Buildings />
        <Torches />
        <PlazaTotem />
        {FEATURES.npcs && <Npcs />}
        {FEATURES.combat && <Enemies />}
        {FEATURES.interiors && <Interior />}
        <Secrets />
        <Player />
        {FEATURES.particles && !touch && <Particles />}
      </Suspense>

      <FollowCamera />
      {postfx && <PostFX />}
    </Canvas>
  );
}
