import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Post-processing (PRD-art §3): Bloom sells every warm emissive (flames,
 * windows, relics, the fountain core) as actual glow; Vignette pulls the eye
 * to the center. Nothing else. Desktop-only — World gates this behind the
 * postfx feature flag + touch detection, so mobile never pays for it.
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom luminanceThreshold={0.6} intensity={0.7} mipmapBlur />
      <Vignette darkness={0.5} />
    </EffectComposer>
  );
}
