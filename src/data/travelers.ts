/**
 * Tavern travelers (P2) — visitors resting in the Null Pointer Tavern interior.
 *
 * VOICE: travelers are OTHERS' voices — people who have crossed paths with
 * Darshit. They speak of him in the third person: what he built, what it was
 * like to work alongside him. This is deliberately a different door from the
 * Oracle/Automaton/Spire (which are his OWN work speaking); travelers only trade
 * in real, shared history (LFX/Kyverno, revRAG, WorldQuant, the hackathon).
 *
 * Their ambient chatter is BAKED — the curated exchange below plays purely
 * client-side, zero API calls. ONE traveler is `worldly`: interacting with them
 * opens a text Q&A that (only when FEATURES.tavernLiveQA + a deployed server)
 * asks the guarded backend for a grounded answer, and otherwise degrades to a
 * baked in-character deflection.
 */

export interface Traveler {
  id: string;
  name: string;
  /** Reuses a RIGS silhouette/palette (see data/rigs.ts). */
  rigId: string;
  accent: string;
  /** Interior position in the tavern room (x ≈ 160, z ≈ 60). */
  position: [number, number];
  facing: number;
  /** The single interactive traveler who answers questions. */
  worldly?: boolean;
  /** Opening line shown when the Q&A opens (worldly only). */
  intro?: string;
}

// Camera looks north-west; face travelers roughly toward it so the player reads them.
const FACE_CAMERA = Math.atan2(15, 18);

export const TAVERN_TRAVELERS: Traveler[] = [
  {
    id: "wayfarer",
    name: "The Wayfarer",
    rigId: "guildmaster",
    accent: "#7cc4ff",
    position: [161.4, 63.5],
    facing: FACE_CAMERA,
    worldly: true,
    intro:
      "Pull up a stool. I've shared a road or two with the one they call Darshit — ask me what he's like to build alongside.",
  },
  {
    id: "chronicler",
    name: "The Chronicler",
    rigId: "merchant",
    accent: "#f2b94c",
    position: [164.2, 56.7],
    facing: Math.PI * 0.9,
  },
  {
    id: "ranger",
    name: "The Ranger",
    rigId: "guard",
    accent: "#8fe3b0",
    position: [159.2, 62.6],
    facing: -0.5,
  },
];

export const travelerById = (id: string): Traveler | undefined =>
  TAVERN_TRAVELERS.find((t) => t.id === id);

export const worldlyTraveler = (): Traveler | undefined =>
  TAVERN_TRAVELERS.find((t) => t.worldly);

/**
 * Baked ambient chatter — an alternating exchange between travelers, grounded in
 * REAL collaborations only. Plays on a loop, client-side, $0. `speaker` is a
 * traveler id.
 */
export interface ChatterLine {
  speaker: string;
  text: string;
}

export const TAVERN_CHATTER: ChatterLine[] = [
  { speaker: "chronicler", text: "You crossed the open-source guild with him, didn't you? The Kyverno merges." },
  { speaker: "wayfarer", text: "Aye — pull requests landed in the open, no favours asked. He reads a strange codebase like a map." },
  { speaker: "ranger", text: "I heard he ran voice agents at revRAG. Real-time, over the wire." },
  { speaker: "wayfarer", text: "Consent flows, OTP handshakes, the lot — uptime enough to let the humans sleep." },
  { speaker: "chronicler", text: "And the quant championship? The team they called Cornflakes?" },
  { speaker: "ranger", text: "Top fifth of the world in the first stage. The numbers don't flatter." },
  { speaker: "wayfarer", text: "The hackathon crown, too — a safety app for women, first place." },
  { speaker: "chronicler", text: "Polaris and Google put their name on it. Earned, not gifted." },
];

/** In-character fallbacks when live Q&A is off/unreachable — never an error wall. */
export const TRAVELER_DEFLECTIONS: string[] = [
  "That tale hasn't reached my ears tonight, friend. Ask me again when the ale's flowing.",
  "The road's been long and my memory's gone to fog. Come find me later.",
  "Hah — the wind's carried that story off. Try me another time.",
  "I've no answer for you just now. The night is young; ask again.",
];

export const randomDeflection = (): string =>
  TRAVELER_DEFLECTIONS[Math.floor(Math.random() * TRAVELER_DEFLECTIONS.length)];
