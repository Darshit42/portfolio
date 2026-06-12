/**
 * Global, content-driven configuration for Devhalla.
 * Renaming the world, flipping a feature, or swapping a link happens here —
 * never in engine code.
 */

export const WORLD_NAME = "Devhalla";
export const WORLD_TAGLINE = "A hall where the legends are the projects.";

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
  interiors: false, // P1 (F18)
  minimap: true, //   P1 (F19)
  tts: true, //       P1 (F21) — Voice Oracle reads its blurb
  liveAgentWs: false, // P2 (F24) — real agent feed over WebSocket
  localSave: true, //  P2 (F22)
  particles: true, //  P2 (F23) — cheap glow/sparks, always gated by reduced-motion
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/** Quick top-bar links, derived from the owner. */
export const QUICK_LINKS = {
  github: OWNER.github,
  email: `mailto:${OWNER.email}`,
  resume: OWNER.resumeUrl,
} as const;
