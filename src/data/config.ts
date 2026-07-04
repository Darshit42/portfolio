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
  /** Served from /public — the real résumé PDF (Darshit_Sengra_2026). */
  resumeUrl: string;
  linkedin?: string;
}

export const OWNER: Owner = {
  name: "Darshit Sengra",
  role: "Forward Deployed Engineer · AI / full-stack",
  bio: "I build autonomous agents, ML pipelines, and full-stack products — from a causal SRE platform to self-healing engineering agents. This realm is my portfolio: every building below enshrines a project you can inspect.",
  github: "https://github.com/Darshit42",
  email: "darshit02736@gmail.com",
  resumeUrl: "/resume.pdf",
  linkedin: undefined, // TODO: add full LinkedIn URL (résumé links "Darshit Sengra")
};

/**
 * Accomplishments & certifications — the recruiter-facing honors list, kept in
 * sync with the résumé. Rendered in Recruiter Mode under the project index.
 */
export interface Accomplishment {
  title: string;
  detail: string;
  /** Optional year/timeframe shown as a chip. */
  when?: string;
}

export const ACCOMPLISHMENTS: Accomplishment[] = [
  {
    title: "Hackathon Winner — Polaris & Google for Developers",
    detail: "1st place for an innovative women's safety application.",
    when: "Feb 2025",
  },
  {
    title: "WorldQuant International Quant Championship",
    detail: "Top 20% of teams globally in Stage 1 (team \"Cornflakes\").",
    when: "2026",
  },
  {
    title: "AWS Cloud Practitioner Essentials",
    detail: "Core AWS services, security, architecture, and pricing.",
  },
  {
    title: "Competitive Programming",
    detail: "Solved 450+ algorithmic problems on LeetCode.",
  },
];

/**
 * Feature flags. Each milestone stays shippable by toggling these.
 * MVP (M0+M1) ships with combat/audio/interiors OFF.
 */
export const FEATURES = {
  combat: true, //    P1 (F13–F15, F17)
  audio: true, //     P1 (F20)
  npcs: true, //      P1 (F16) — barkeep / guildmaster / oracle dialog
  agentTown: true, // P2 — Smallville-style autonomous agents (baked replay; live gated by liveAgentWs)
  interiors: true, //  P1 (F18) — Tavern + Forge rooms via teleporting doors
  minimap: true, //   P1 (F19)
  tts: true, //       P1 (F21) — Voice Oracle reads its blurb
  liveAgentWs: false, // P2 (F24) — real agent feed over WebSocket
  tavernLiveQA: false, // P2 — worldly traveler live Q&A (needs a deployed server + VITE_AGENT_SERVER); baked chatter otherwise
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
