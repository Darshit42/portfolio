/**
 * Global, content-driven configuration for Devhalla.
 * Renaming the world, flipping a feature, or swapping a link happens here —
 * never in engine code.
 */

export const WORLD_NAME = "Devhalla";
export const WORLD_TAGLINE = "A hall where the legends are the projects.";

/**
 * The single world palette — a cozy medieval town at night, lit almost
 * entirely by warm sources against deep blue-charcoal darkness. Every world
 * material derives from these (see game/materials.ts); relic accents stay
 * per-project in projects.ts.
 */
export const PALETTE = {
  nightSky: "#0b0e1a",
  ground: "#1a1812",
  stone: "#3a3530",
  woodDark: "#4a3526",
  woodLight: "#6b4a2f",
  roof: "#2e2218",
  warmLight: "#ffaa44",
  ember: "#ff6622",
  foliage: "#1d3320",
  path: "#2a2620",
} as const;

export interface Owner {
  name: string;
  role: string;
  bio: string;
  github: string;
  email: string;
  /** Served from /public. Replace the placeholder PDF before launch. */
  resumeUrl: string;
  linkedin?: string;
}

export const OWNER: Owner = {
  name: "Darshit",
  role: "Autonomous-systems & full-stack engineer",
  bio: "I build self-healing agents, ship open-source to CNCF, and turn hard ideas into working software. This realm is my portfolio — every building below enshrines a project you can inspect.",
  github: "https://github.com/Darshit42",
  email: "shadow6920223@gmail.com",
  resumeUrl: "/resume.pdf", // TODO(launch): drop the real resume into /public/resume.pdf
  linkedin: undefined, // TODO(launch): add LinkedIn URL if desired
};

/**
 * Feature flags. Each milestone stays shippable by toggling these.
 * MVP (M0+M1) ships with combat/audio/interiors OFF.
 */
export const FEATURES = {
  combat: true, //    P1 (F13–F15, F17)
  audio: true, //     P1 (F20)
  npcs: true, //      P1 (F16) — barkeep / guildmaster / oracle dialog
  interiors: true, //  P1 (F18) — Tavern + Forge rooms via teleporting doors
  minimap: true, //   P1 (F19)
  tts: true, //       P1 (F21) — Voice Oracle reads its blurb
  liveAgentWs: false, // P2 (F24) — real agent feed over WebSocket
  localSave: true, //  P2 (F22)
  particles: true, //  P2 (F23) — cheap glow/sparks, always gated by reduced-motion
  postfx: true, //     Bloom + vignette; auto-disabled on touch devices for perf
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Day/night cycle. The realm opens at night (the signature torchlit look) and
 * then animates through dawn → day → dusk → night on a compressed clock, so a
 * lingering visitor sees the whole cycle and the mobs shift with it. Set
 * `useRealTime` to sync the phase to the visitor's local clock instead.
 */
export const DAY_NIGHT = {
  enabled: true,
  periodSeconds: 420, // length of one full in-world day
  startPhase: 0.78, //  open at golden dusk (~18:40) — warm and clearly lit
  useRealTime: false,
} as const;

/** Quick top-bar links, derived from the owner. */
export const QUICK_LINKS = {
  github: OWNER.github,
  email: `mailto:${OWNER.email}`,
  resume: OWNER.resumeUrl,
} as const;
