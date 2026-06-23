/**
 * The single main quest. Scope contract: one "earn every guild sigil" arc, no
 * branching chains. Hints are picked by remaining sigils, not a state machine.
 */

import { TOTAL_SIGILS } from "./categories";

export interface MainQuest {
  id: string;
  title: string;
  intro: string;
  /** Shown when every sigil is earned and the Gate is open. */
  complete: string;
}

export const MAIN_QUEST: MainQuest = {
  id: "earn-the-sigils",
  title: "Earn the Guild Sigils",
  intro:
    "Each guild of Devhalla guards a sigil. Prove yourself at every one — inspect the works it enshrines — to open the Gate of Contact.",
  complete:
    "Every sigil is yours. The Gate of Contact stands open to the south.",
};

/** Contextual quest hint for the HUD, given how many sigils are earned. */
export function questHint(earned: number): string {
  if (earned === 0) return "Walk to a glowing guild and step inside to claim its sigil.";
  if (earned >= TOTAL_SIGILS)
    return "The Gate of Contact is open — head south to reach out.";
  const left = TOTAL_SIGILS - earned;
  return `${earned}/${TOTAL_SIGILS} sigils earned · ${left} to go.`;
}

/** Hidden delights (F25). Interacting shows the notice — nothing more. */
export interface Secret {
  id: string;
  position: [number, number]; // [x, z]
  prompt: string;
  notice: string;
}

export const SECRETS: Secret[] = [
  {
    id: "infinite-sidequests",
    position: [-42, -38], // deep in the north-west woods
    prompt: "Inspect the odd stone",
    notice: "Side quests completed: ∞",
  },
];
