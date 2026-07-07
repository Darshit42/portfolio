/**
 * Tavern travelers (P2) — three distinct visitors in the Null Pointer Tavern,
 * each a different voice on Darshit. Interacting opens an in-character AI chat
 * (see NpcChat + apps/server personas). Their ambient chatter is baked ($0).
 *
 * Seating: the Wayfarer and the Chronicler share one table (they banter); the
 * Muse sits alone at another. Three different beats so they never feel like one
 * voice repeated:
 *   - Wayfarer   → his TECHNICAL work (projects, stack, how he builds)
 *   - Chronicler → his ACHIEVEMENTS (honours, wins, the open-source trail)
 *   - Muse       → the PERSON (guitar, singing, piano, poetry, sketching, cooking)
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
  /** Opening line shown when the chat opens. */
  intro: string;
}

// Camera looks north-west; face travelers so the player reads them.
const FACE_CAMERA = Math.atan2(15, 18);

export const TAVERN_TRAVELERS: Traveler[] = [
  // ── Table A (near [161.5, 62]) — the Wayfarer & the Chronicler, in conversation
  {
    id: "wayfarer",
    name: "The Wayfarer",
    rigId: "guildmaster",
    accent: "#7cc4ff",
    position: [160.3, 62],
    facing: Math.PI / 2, // faces the table (and the Chronicler across it)
    intro:
      "Pull up a chair. I've built things alongside Darshit — ask me about the work: the projects, the stack, how he puts them together.",
  },
  {
    id: "chronicler",
    name: "The Chronicler",
    rigId: "merchant",
    accent: "#f2b94c",
    position: [162.7, 62],
    facing: -Math.PI / 2, // faces the Wayfarer across the table
    intro:
      "I keep the record of what he's done — the honours, the wins, the trail he left in the open. Ask, and I'll recount it.",
  },
  // ── Table B (near [164, 58]) — the Muse, alone with her thoughts
  {
    id: "muse",
    name: "The Muse",
    rigId: "muse",
    accent: "#e59bd0",
    position: [162.7, 58.2],
    facing: FACE_CAMERA,
    intro:
      "Ah — a visitor to my corner. I know the other Darshit: the one with a guitar, a sketchbook, a kitchen. Ask me about the person, not the pull requests.",
  },
];

export const travelerById = (id: string): Traveler | undefined =>
  TAVERN_TRAVELERS.find((t) => t.id === id);

/**
 * Baked ambient chatter — mostly the Wayfarer ↔ Chronicler banter at their
 * shared table, with the Muse humming to herself now and then. Plays on a loop,
 * client-side, $0. `speaker` is a traveler id.
 */
export interface ChatterLine {
  speaker: string;
  text: string;
}

export const TAVERN_CHATTER: ChatterLine[] = [
  { speaker: "chronicler", text: "You worked the open-source guild with him — the Kyverno merges, wasn't it?" },
  { speaker: "wayfarer", text: "Ten and more, landed in the open. He reads a strange codebase like a map." },
  { speaker: "chronicler", text: "And revRAG? I have it in the ledger as 'voices in the wire.'" },
  { speaker: "wayfarer", text: "Real-time voice agents — consent, OTP, telephony. Uptime enough to let the humans sleep." },
  { speaker: "muse", text: "…and yet he still finds an hour for the guitar. There's more to the man than his commits." },
  { speaker: "chronicler", text: "The hackathon crown too — first place, Polaris and Google put their name on it." },
  { speaker: "wayfarer", text: "Earned, not gifted. Same as the quant run — top fifth of the world." },
  { speaker: "muse", text: "Numbers, always numbers. I prefer his poetry — though he'd never show you unasked." },
];
