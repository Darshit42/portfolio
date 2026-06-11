/**
 * NPC definitions + static dialog (P1 / F16). Defined now so M2 is a data-add,
 * not an engine change. Each NPC can branch into "tell me more" → opens the
 * related project Codex.
 */

export interface NpcDialogLine {
  text: string;
}

export interface Npc {
  id: string;
  name: string;
  /** Building the NPC stands at. */
  building: string;
  /** Optional project this NPC can point the visitor toward. */
  projectId?: string;
  position: [number, number]; // [x, z]
  accent: string;
  lines: NpcDialogLine[];
  /** If set, "speak aloud" via TTS (F21). Used by the Oracle. */
  speaks?: boolean;
}

export const NPCS: Npc[] = [
  {
    id: "barkeep",
    name: "The Barkeep",
    building: "null-pointer-tavern",
    position: [0, 28],
    accent: "#e8c66a",
    lines: [
      { text: "Welcome to the Null Pointer, traveller. Mind the dangling references." },
      { text: "Six relics, six legends. Gather them and the southern Gate opens." },
      { text: "In a hurry? There's a recruiter's door up top — straight to the goods." },
    ],
  },
  {
    id: "guildmaster",
    name: "The Guildmaster",
    building: "guild-hall",
    projectId: "kubestellar-kyverno",
    position: [19, -18],
    accent: "#3aa0ff",
    lines: [
      { text: "Every plaque on this wall is a merged pull request. Earned, not given." },
      { text: "Ask, and I'll show you the open-source ledger." },
    ],
  },
  {
    id: "oracle",
    name: "The Oracle",
    building: "oracles-booth",
    projectId: "voice-agent",
    position: [-23, -2],
    accent: "#b06cff",
    speaks: true,
    lines: [
      { text: "I am the voice in the wire. I answer calls no human has time for." },
      { text: "Consent, OTP, the handshake of trust — I speak them all, in real time." },
    ],
  },
];

export const npcById = (id: string): Npc | undefined =>
  NPCS.find((n) => n.id === id);
