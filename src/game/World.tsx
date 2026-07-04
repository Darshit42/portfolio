import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import FollowCamera from "./Camera";
import Ground from "./Ground";
import Decor from "./Decor";
import Sky from "./Sky";
import DayNightController from "./DayNightController";
import Buildings from "./Buildings";
import PlazaTotem from "./PlazaTotem";
import Torches from "./Torches";
import Player from "./Player";
import Npcs from "./Npcs";
import AgentTown from "../agents/AgentTown";
import Enemies from "./Enemies";
import Pickups from "./Pickups";
import Interior from "./Interior";
import TavernTravelers from "./TavernTravelers";
import Secrets from "./Secrets";
import Particles from "./Particles";
import PostFX from "./PostFX";
import { isTouchDevice } from "./webgl";
import { FEATURES } from "../data/config";

/**
 * The R3F scene — a torchlit medieval town under a full day/night cycle
 * (DayNightController owns lighting, fog, background + exposure). Warm point
 * lights (Torches/fountain/forge) are the real illumination after dark; bloom
 * + vignette on desktop. Shadows and AA are trimmed on touch devices to hold
 * the mobile budget; repeated geometry is instanced.
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
      frameloop="always"
    >
      {/* Lighting, fog, background + exposure are all driven by the cycle.
          Light colors stay MID-sRGB: dark hexes crush to ~0.03 in linear and
          multiply against dark albedos to invisible — hue carries the mood. */}
      <DayNightController touch={touch} />

      <Suspense fallback={null}>
        <Sky />
        <Ground />
        <Decor />
        <Buildings />
        <Torches />
        <PlazaTotem />
        {FEATURES.npcs && (FEATURES.agentTown ? <AgentTown /> : <Npcs />)}
        {FEATURES.combat && <Enemies />}
        {FEATURES.combat && <Pickups />}
        {FEATURES.interiors && <Interior />}
        {FEATURES.interiors && FEATURES.npcs && <TavernTravelers />}
        <Secrets />
        <Player />
        {FEATURES.particles && !touch && <Particles />}
      </Suspense>

      <FollowCamera />
      {postfx && <PostFX />}
    </Canvas>
  );
}
