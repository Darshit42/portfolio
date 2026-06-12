import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import FollowCamera from "./Camera";
import Ground from "./Ground";
import Decor from "./Decor";
import Buildings from "./Buildings";
import PlazaTotem from "./PlazaTotem";
import Player from "./Player";
import Npcs from "./Npcs";
import Enemies from "./Enemies";
import Interior from "./Interior";
import Particles from "./Particles";
import { isTouchDevice } from "./webgl";
import { FEATURES } from "../data/config";

/**
 * The R3F scene. Shadows + higher DPR on desktop; trimmed on touch devices to
 * hold the mobile frame-rate budget (PRD §5). The scene graph is kept shallow
 * and repeated geometry is instanced (see Decor).
 */
export default function World() {
  const touch = isTouchDevice();

  return (
    <Canvas
      shadows={!touch}
      dpr={touch ? [1, 1.5] : [1, 2]}
      camera={{ position: [15, 23, 18], fov: 42, near: 0.5, far: 220 }}
      gl={{ antialias: !touch, powerPreference: "high-performance" }}
      frameloop="always"
    >
      <color attach="background" args={["#0a0c12"]} />
      <fog attach="fog" args={["#0a0c12", 46, 96]} />

      <hemisphereLight args={["#3a4a6a", "#0b0d13", 0.55]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[24, 34, 12]}
        intensity={1.15}
        color="#fff1d6"
        castShadow={!touch}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-64}
        shadow-camera-right={64}
        shadow-camera-top={64}
        shadow-camera-bottom={-64}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
      />

      <Suspense fallback={null}>
        <Ground />
        <Decor />
        <Buildings />
        <PlazaTotem />
        {FEATURES.npcs && <Npcs />}
        {FEATURES.combat && <Enemies />}
        {FEATURES.interiors && <Interior />}
        <Player />
        {FEATURES.particles && !touch && <Particles />}
      </Suspense>

      <FollowCamera />
    </Canvas>
  );
}
