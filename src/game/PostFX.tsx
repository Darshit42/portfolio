import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Post-processing (PRD-art §3): Bloom sells every warm emissive (flames,
 * windows, relics, the fountain core) as actual glow; Vignette pulls the eye
 * to the center.
 *
 * The composer disables the renderer's tone mapping (so effects can manage it),
 * which left bright daytime HDR unmapped — it overflowed the bloom target to
 * black. The ACES ToneMapping pass (last, as it must be) maps HDR → display so
 * every phase of the cycle renders correctly. Desktop-only (World gates it).
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom luminanceThreshold={0.7} intensity={0.6} mipmapBlur radius={0.7} />
      <Vignette darkness={0.45} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
