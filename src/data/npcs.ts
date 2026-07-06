/**
 * NPC definitions + static dialog (F16). Positions are deliberately offset from
 * each building's relic interaction point so an NPC and a relic never compete
 * for the same proximity prompt. Each NPC can branch into "tell me more" →
 * opens the related project Codex.
 *
 * With interiors enabled, the Barkeep stands behind the bar inside the Tavern
 * and the Automaton works the Forge room; with interiors off they fall back to
 * (or are dropped from) the exterior.
 */
import { FEATURES } from "./config";

export interface NpcDialogLine {
  text: string;
}

export interface Npc {
  id: string;
  name: string;
  /** Building the NPC stands near. */
  building: string;
  /** If set, this NPC masters a guild — dialog can open its whole Codex list. */
  categoryId?: string;
  /** Optional single project this NPC points the visitor toward (no guild). */
  projectId?: string;
  position: [number, number]; // [x, z]
  /** Facing angle (radians) for the mesh. */
  facing?: number;
  accent: string;
  lines: NpcDialogLine[];
  /** If set, the lines are spoken aloud via TTS (F21). Used by the Oracle. */
  speaks?: boolean;
  /** If set, the dialog branches into the Spire's own-voice Chronicle panel. */
  opensSpire?: boolean;
}

export const NPCS: Npc[] = [
  {
    id: "barkeep",
    name: "The Barkeep",
    building: "null-pointer-tavern",
    // Behind the bar when interiors exist; greeting at the door otherwise.
    position: FEATURES.interiors ? [153.9, 58.8] : [4, 25],
    facing: FEATURES.interiors ? Math.PI / 2 : Math.PI * 0.85,
    accent: "#e8c66a",
    lines: [
      { text: "Welcome to the Null Pointer, traveller. Mind the dangling references." },
      { text: "Every guild here guards a sigil. Earn them all and the southern Gate swings open." },
      { text: "In a hurry? There's a recruiter's door up top — straight to the good stuff." },
    ],
  },
  ...(FEATURES.interiors
    ? ([
        {
          id: "automaton",
          name: "The Automaton",
          building: "agent-forge",
          categoryId: "ai-agents",
          position: [161.2, -59.3],
          facing: -1.2,
          accent: "#ff7a3c",
          lines: [
            { text: "Welcome to the Arcane Forge — where models are hammered into agents that think and learn." },
            { text: "I am one such work; there are others enshrined here beside me." },
            { text: "Would you browse the Forge's ledger?" },
          ],
        },
      ] satisfies Npc[])
    : []),
  {
    id: "guildmaster",
    name: "The Guildmaster",
    building: "guild-hall",
    categoryId: "systems-infra",
    position: [26, -15],
    facing: Math.PI * 1.15,
    accent: "#3aa0ff",
    lines: [
      { text: "This is the Foundry — distributed systems and open-source steel, merged in the open." },
      { text: "Every plaque is earned, not handed down: contributions that actually shipped." },
      { text: "Care to read the Foundry's ledger yourself?" },
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
  // ---- flavor NPCs (no project) ----
  {
    id: "merchant",
    name: "The Merchant",
    building: "finddder-market",
    categoryId: "products-data",
    position: [-23, 13],
    facing: Math.PI / 2,
    accent: "#f2b94c",
    lines: [
      { text: "Welcome to the Exchange — shipped products and the data that moves them." },
      { text: "I scout signal from noise, then turn it into something people actually use." },
      { text: "Care to browse the wares on offer?" },
    ],
  },
  {
    id: "blacksmith",
    name: "The Blacksmith",
    building: "agent-forge",
    position: [23.5, 3],
    facing: Math.PI,
    accent: "#ff6622",
    lines: [
      { text: "Bring me scrap and ember and I'll forge you something worth swinging." },
      { text: "Everything in this town was hammered into shape. You included, soon enough." },
    ],
  },
  {
    id: "guard",
    name: "Gate Sentinel",
    building: "gate-of-contact",
    position: [6, 35],
    facing: Math.PI,
    accent: "#9aa6bf",
    lines: [
      { text: "Halt. The Gate of Contact opens only to those who've earned every guild's sigil." },
      { text: "Prove yourself at each guild, traveller, and the way south is yours." },
    ],
  },
  // The wizard-seer of the Spire interior — Darshit's own voice. Static lines
  // (reuses the dialog system, no LLM), branching into the Chronicle panel.
  ...(FEATURES.interiors
    ? ([
        {
          id: "seer",
          name: "The Seer",
          building: "spire-of-training",
          position: [159, 1.5], // inside the spire room (center [160,0])
          facing: Math.atan2(15, 18),
          accent: "#9b8cff",
          opensSpire: true,
          lines: [
            { text: "You climbed the Spire. Good — most only ever look up at it." },
            { text: "This place keeps my own record: the road that brought me here, and what I'm forging now. No polish, no myth." },
            { text: "Read the Chronicle, if you want the honest version." },
          ],
        },
      ] satisfies Npc[])
    : []),
];

export const npcById = (id: string): Npc | undefined =>
  NPCS.find((n) => n.id === id);
