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
    // Behind the bar when interiors exist; greeting at the door otherwise.
    position: FEATURES.interiors ? [153.9, 58.8] : [4, 25],
    facing: FEATURES.interiors ? Math.PI / 2 : Math.PI * 0.85,
    accent: "#e8c66a",
    lines: [
      { text: "Welcome to the Null Pointer, traveller. Mind the dangling references." },
      { text: "Six relics, six legends. Gather them all and the southern Gate swings open." },
      { text: "In a hurry? There's a recruiter's door up top — straight to the good stuff." },
    ],
  },
  ...(FEATURES.interiors
    ? ([
        {
          id: "automaton",
          name: "The Automaton",
          building: "agent-forge",
          projectId: "self-healing-agent",
          position: [161.2, -59.3],
          facing: -1.2,
          accent: "#ff7a3c",
          lines: [
            { text: "Forged to mend what the makers abandon. I read the trace, shape the patch, and send the scroll." },
            { text: "Every verified fix feeds the policy. I am better today than yesterday; tomorrow, better still." },
            { text: "Would you see my maker's design?" },
          ],
        },
      ] satisfies Npc[])
    : []),
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
  // ---- flavor NPCs (no project) ----
  {
    id: "merchant",
    name: "Wandering Merchant",
    building: "finddder-market",
    position: [-23, 13],
    facing: Math.PI / 2,
    accent: "#f2b94c",
    lines: [
      { text: "Scavenged wares, scouted bargains! I find what others overlook." },
      { text: "Slay a few bugs and bring me coin — the realm rewards a busy blade." },
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
      { text: "Halt. The Gate of Contact opens only to those who've gathered every relic." },
      { text: "Six legends, traveller. Earn them, and the way south is yours." },
    ],
  },
];

export const npcById = (id: string): Npc | undefined =>
  NPCS.find((n) => n.id === id);
