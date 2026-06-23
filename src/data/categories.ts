/**
 * Skill-category GUILDS — the scalable spine of the world.
 *
 * A guild is a building that holds an UNBOUNDED, data-driven list of projects
 * sharing a category. The world has more buildings than guilds; the extra ones
 * are "spare" and can be promoted to a guild later by appending one entry here
 * (see the data note in README). Nothing in the engine hard-codes a guild.
 *
 * Adding a project   → append to PROJECTS with a `category` id (projects.ts).
 * Adding a category   → append a Category here with a spare `building` id.
 * Neither touches engine code, placement, or the win condition.
 */

export interface Category {
  /** Stable id used by Project.category and the sigil set. */
  id: string;
  /** The building this guild lives in (see buildings.ts). One guild per building. */
  building: string;
  /** In-world guild name shown on the relic + Codex list. */
  guildName: string;
  /** One-line category framing (the guild's "stack"). */
  tagline: string;
  /** 1–2 sentence story framing, read in the Codex list (the master's pitch). */
  premise: string;
  /** Existing NPC id that masters this guild (reused, never rebuilt). */
  masterNpc?: string;
  /** Theme accent (mirrors the building accent). */
  accent: string;
}

/**
 * The opening premise — the thin narrative hook. Shown on the title screen and
 * the first-load notice. Flavor only: it never gates seeing a project.
 */
export const STORY_PREMISE =
  "You arrive in Devhalla a stranger. To earn your place, prove your worth to each of its guilds — claim every sigil, and the Gate of Contact opens.";

export const CATEGORIES: Category[] = [
  {
    id: "ai-agents",
    building: "agent-forge",
    guildName: "The Arcane Forge",
    tagline: "AI · ML · Agents",
    premise:
      "Here autonomous agents are hammered out of models, reward, and stubborn iteration. Every work enshrined in the Forge thinks, learns, or speaks on its own.",
    masterNpc: "automaton",
    accent: "#ff7a3c",
  },
  {
    id: "systems-infra",
    building: "guild-hall",
    guildName: "The Foundry",
    tagline: "Systems · Infra · Open Source",
    premise:
      "Distributed iron and open-source steel — merged in the open, earned not handed down. The ledger on these walls is every contribution that shipped.",
    masterNpc: "guildmaster",
    accent: "#3aa0ff",
  },
  {
    id: "products-data",
    building: "finddder-market",
    guildName: "Merchants' Exchange",
    tagline: "Products · Data",
    premise:
      "Shipped products and the data that moves them. The merchants here scout signal from noise and turn it into something people use.",
    masterNpc: "merchant",
    accent: "#f2b94c",
  },
  {
    id: "ventures-fullstack",
    building: "the-arena",
    guildName: "Builders' Arena",
    tagline: "Ventures · Full-stack",
    premise:
      "Ventures forged end to end and tested in the open ring. What stands here was built whole — front to back — and proven under load.",
    accent: "#ff5470",
  },
];

/** Win condition: one sigil per guild. */
export const TOTAL_SIGILS = CATEGORIES.length;

export const categoryById = (id: string): Category | undefined =>
  CATEGORIES.find((c) => c.id === id);

export const categoryByBuilding = (buildingId: string): Category | undefined =>
  CATEGORIES.find((c) => c.building === buildingId);

/** Building ids that host a guild (everything else is a spare structure). */
export const GUILD_BUILDINGS = new Set(CATEGORIES.map((c) => c.building));
