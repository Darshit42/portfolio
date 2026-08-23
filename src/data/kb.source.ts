/**
 * KB source — the single place that projects the frontend data (`/src/data`,
 * the source of truth) into the flat object the traveler's backend grounds on.
 *
 * This file is NOT imported by the app bundle. `scripts/build-kb.mjs` bundles it
 * with esbuild and writes `public/kb.json`, which the Python backend reads. Keep
 * it dependency-light (data modules only) so the bundle stays trivial.
 */
import { OWNER, ACCOMPLISHMENTS, HOBBIES, SITE_URL } from "./config";
import { PROJECTS } from "./projects";
import { CATEGORIES } from "./categories";
import { SKILLS } from "./skills";
import { CHAPTERS, CURRENT_WORK } from "./spire";

export interface Kb {
  owner: { name: string; role: string; bio: string; github: string; email: string; site: string };
  accomplishments: { title: string; detail: string; when?: string }[];
  projects: { name: string; tier: string; oneLiner: string; blurb: string; stack: string[] }[];
  guilds: { guildName: string; tagline: string }[];
  skills: { label: string }[];
  timeline: { era: string; title: string; blurb: string }[];
  currentWork: { name: string; tagline?: string; detail: string }[];
  hobbies: { summary: string; items: string[] };
}

export function buildKb(): Kb {
  return {
    owner: {
      name: OWNER.name,
      role: OWNER.role,
      bio: OWNER.bio,
      github: OWNER.github,
      email: OWNER.email,
      site: SITE_URL,
    },
    accomplishments: ACCOMPLISHMENTS.map((a) => ({
      title: a.title,
      detail: a.detail,
      ...(a.when ? { when: a.when } : {}),
    })),
    projects: PROJECTS.map((p) => ({
      name: p.name,
      tier: p.tier,
      oneLiner: p.oneLiner,
      blurb: p.blurb,
      stack: p.stack,
    })),
    guilds: CATEGORIES.map((c) => ({ guildName: c.guildName, tagline: c.tagline })),
    skills: SKILLS.map((s) => ({ label: s.label })),
    timeline: CHAPTERS.map((c) => ({ era: c.era, title: c.title, blurb: c.blurb })),
    currentWork: CURRENT_WORK.map((w) => ({
      name: w.name,
      ...(w.tagline ? { tagline: w.tagline } : {}),
      detail: w.detail,
    })),
    hobbies: { summary: HOBBIES.summary, items: [...HOBBIES.items] },
  };
}
