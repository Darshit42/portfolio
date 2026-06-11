/**
 * NPC definitions + static dialog (F16). Positions are deliberately offset from
 * each building's relic interaction point so an NPC and a relic never compete
 * for the same proximity prompt. Each NPC can branch into "tell me more" →
 * opens the related project Codex.
 */

export interface NpcDialogLine {
  text: string;
}

export interface Npc {
  id: string;
  name: string;
  /** Building the NPC stands near. */
  building: string;
  /** Optional project this NPC can point the visitor toward. */
  projectId?: string;
  position: [number, number]; // [x, z]
  /** Facing angle (radians) for the mesh. */
  facing?: number;
  accent: string;
  lines: NpcDialogLine[];
  /** If set, the lines are spoken aloud via TTS (F21). Used by the Oracle. */
  speaks?: boolean;
}

export const NPCS: Npc[] = [
  {
    id: "barkeep",
    name: "The Barkeep",
    building: "null-pointer-tavern",
    position: [4, 25],
    facing: Math.PI * 0.85,
    accent: "#e8c66a",
    lines: [
      { text: "Welcome to the Null Pointer, traveller. Mind the dangling references." },
      { text: "Six relics, six legends. Gather them all and the southern Gate swings open." },
      { text: "In a hurry? There's a recruiter's door up top — straight to the good stuff." },
    ],
  },
  {
    id: "guildmaster",
    name: "The Guildmaster",
    building: "guild-hall",
    projectId: "kubestellar-kyverno",
    position: [26, -15],
    facing: Math.PI * 1.15,
    accent: "#3aa0ff",
    lines: [
      { text: "Every plaque on this wall is a merged pull request. Earned in the open, not handed down." },
      { text: "Ten merges, twenty-five issues, across KubeStellar and Kyverno. Mentor-endorsed, all of it." },
      { text: "Care to read the open-source ledger yourself?" },
    ],
  },
  {
    id: "oracle",
    name: "The Oracle",
    building: "oracles-booth",
    projectId: "voice-agent",
    position: [-23, 4],
    facing: 0,
    accent: "#b06cff",
    speaks: true,
    lines: [
      { text: "I am the voice in the wire. I answer the calls no human has the hours for." },
      { text: "Consent, OTP, the handshake of trust — I speak them all, in real time, over the line." },
      { text: "Would you hear the whole of my making?" },
    ],
  },
];

export const npcById = (id: string): Npc | undefined =>
  NPCS.find((n) => n.id === id);
