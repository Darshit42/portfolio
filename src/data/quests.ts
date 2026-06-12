/**
 * The single main quest. Scope contract: one "collect the relics" arc, no
 * branching chains. Hints are picked by remaining relics, not a state machine.
 */

import { TOTAL_RELICS } from "./projects";

export interface MainQuest {
  id: string;
  title: string;
  intro: string;
  /** Shown when all relics are found and the Gate is open. */
  complete: string;
}

export const MAIN_QUEST: MainQuest = {
  id: "gather-the-relics",
  title: "Gather the Relics",
  intro:
    "Six relics are bound in the buildings of Devhalla. Find each one to learn the legend it holds — and open the Gate of Contact.",
  complete:
    "Every relic is yours. The Gate of Contact stands open to the south.",
};

/** Contextual quest hint for the HUD, given how many relics are found. */
export function questHint(found: number): string {
  if (found === 0) return "Walk to a glowing building and inspect its relic.";
  if (found >= TOTAL_RELICS)
    return "The Gate of Contact is open — head south to reach out.";
  const left = TOTAL_RELICS - found;
  return `${found}/${TOTAL_RELICS} relics gathered · ${left} to go.`;
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
