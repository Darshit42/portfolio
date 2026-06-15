/**
 * Thick-stickman rig presets — colours + size per character. The rig geometry
 * is shared (see game/CharacterRig.tsx); only these vary. Mobs are the same
 * rig recoloured/resized; floaty mobs hide their legs and hover.
 */
export interface RigConfig {
  scale?: number;
  skin: string; // head + arms
  torso: string;
  legs: string;
  feet: string;
  eye?: string; // default dark
  hideLegs?: boolean; // floaty mobs hover, no legs
  headScale?: number;
}

const DEFAULT_EYE = "#15171d";

export const RIGS: Record<string, RigConfig> = {
  // hero — default maroon torso
  player: { skin: "#e8c29a", torso: "#7a2433", legs: "#565b66", feet: "#1c2026", eye: DEFAULT_EYE },

  // NPCs (per-role torso colours)
  barkeep: { skin: "#e8c29a", torso: "#7a4a2c", legs: "#4a4f58", feet: "#1c2026" },
  guildmaster: { skin: "#e8c29a", torso: "#27496b", legs: "#3a4452", feet: "#1c2026" },
  oracle: { skin: "#e8c29a", torso: "#5a3a86", legs: "#3c2c52", feet: "#1c1430" },
  automaton: { skin: "#9aa0ad", torso: "#5a4632", legs: "#4a4138", feet: "#22201a", eye: "#ff7a3c" },
  merchant: { skin: "#e8c29a", torso: "#2c6b4a", legs: "#4a4f58", feet: "#1c2026" },
  blacksmith: { skin: "#d8a87a", torso: "#444a52", legs: "#3a3f46", feet: "#1c2026", eye: "#ff6622" },
  guard: { skin: "#e8c29a", torso: "#3a4452", legs: "#2c333d", feet: "#15181d", eye: "#9aa6bf" },

  // mobs — size/colour variants
  bug: { scale: 0.62, skin: "#2a1230", torso: "#3a1830", legs: "#241018", feet: "#160a1a", eye: "#ff5470" },
  wisp: { scale: 0.72, skin: "#bfeeff", torso: "#3a7a96", legs: "#1a4a66", feet: "#103040", eye: "#06121d", hideLegs: true },
  slime: { scale: 0.74, skin: "#39d98a", torso: "#2c8a5a", legs: "#1a6a45", feet: "#124a30", eye: "#0a1f14", headScale: 1.25 },
  critter: { scale: 0.6, skin: "#4a3420", torso: "#5a3d1a", legs: "#241810", feet: "#160f08", eye: "#f2b94c" },
  bat: { scale: 0.6, skin: "#4a3a5a", torso: "#3a2a5a", legs: "#241c30", feet: "#160f20", eye: "#b06cff", hideLegs: true },
  skeleton: { scale: 1.0, skin: "#e8e4d4", torso: "#cfc9b8", legs: "#b8b2a0", feet: "#5a5648", eye: "#9aa6bf" },
};

export const rigConfig = (id: string): RigConfig => RIGS[id] ?? RIGS.player;
