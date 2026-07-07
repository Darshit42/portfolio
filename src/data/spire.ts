/**
 * The Spire of Training — Darshit's OWN-voice record: the journey (a timeline of
 * chapters, rendered as tomes) and what he is building NOW (the seer's report).
 *
 * SOURCE OF TRUTH. Adding a chapter = append one entry to CHAPTERS. Updating the
 * current work = edit CURRENT_WORK. No engine/interior code changes — the Spire
 * interior + the Chronicle panel iterate these arrays. The wizard-seer's framing
 * lines live with the other NPCs in npcs.ts (they reuse the dialog system).
 *
 * VOICE: this is his own voice (first person). It must NOT restate the guild
 * project catalog (what he built, by category) or the Tavern travelers (others'
 * voices). Chapters are journey beats — the narrative thread — not project cards.
 *
 * NOTE: the timeline below is a DRAFT assembled from verified facts (LeetCode,
 * LFX/Kyverno, revRAG, the hackathon, WorldQuant). Edit the prose/eras freely.
 */

export interface SpireChapter {
  id: string;
  /** Short era/time tag shown on the tome spine (e.g. "2025", "The grind"). */
  era: string;
  title: string;
  /** 1–3 sentences, first person. The chapter's story. */
  blurb: string;
  link?: { label: string; url: string };
}

export interface CurrentWork {
  name: string;
  /** One-line hook shown under the name. */
  tagline?: string;
  /** First person — what it is and where it stands right now. */
  detail: string;
  stack?: string[];
  link?: { label: string; url: string };
}

export const SPIRE = {
  title: "Spire of Training",
  subtitle: "My road, and what I'm forging now",
  accent: "#9b8cff",
} as const;

/** Ordered oldest → newest. TODO(darshit): refine wording, eras, and order. */
export const CHAPTERS: SpireChapter[] = [
  {
    id: "foundations",
    era: "The grind",
    title: "Cutting my teeth",
    blurb:
      "Before any title, there were the reps — 450+ algorithmic problems on LeetCode. That's where I learned hard problems yield to patience and pattern, not cleverness.",
  },
  {
    id: "open-source",
    era: "Into the open",
    title: "First merges in the open",
    blurb:
      "I earned my way into CNCF work through the LFX program: 10+ merged pull requests and 25+ issues across KubeStellar and Kyverno, mentor-endorsed. I learned to read a codebase I didn't write and ship into it — in public.",
    link: { label: "KubeStellar", url: "https://github.com/kubestellar" },
  },
  {
    id: "revrag",
    era: "Production",
    title: "Voices in the wire — revRAG",
    blurb:
      "At revRAG.ai I built production real-time voice agents: speech and telephony triggering, plus consent and OTP flows over WebSockets. Real users, real uptime — the kind of work that has to answer the phone at 3am.",
    link: { label: "revRAG.ai", url: "https://revrag.ai" },
  },
  {
    id: "hackathon",
    era: "Feb 2025",
    title: "First place, real stakes",
    blurb:
      "A women's safety application took 1st at the Polaris & Google for Developers hackathon — building something that actually matters, fast, with a team.",
    link: { label: "The app", url: "https://github.com/Darshit42/WOMEN-SAFETY-APP" },
  },
  {
    id: "quant",
    era: "2026",
    title: "Against the world's quants",
    blurb:
      "Team \"Cornflakes\" finished in the top 20% globally in Stage 1 of the WorldQuant International Quant Championship — proof the pattern-work pays off under pressure.",
  },
];

/** The seer's hard-truth report — what I'm building right now. */
export const CURRENT_WORK: CurrentWork[] = [
  {
    name: "Apiary",
    tagline: "An autonomous coding-agent fleet that fixes bounded issues and opens PRs — never merging on its own.",
    detail:
      "My main build right now. A deterministic control plane (bash + systemd + SQLite) gates which issues are safe and dispatches ephemeral Claude agents to fix the bounded ones in isolated worktrees — the LLM only writes the fix, so safety is code, not prompts. Multi-tenant SaaS with structurally-enforced org isolation. Honest stage: the single-tenant loop is proven end-to-end on a live EC2 server; per-tenant execution and billing are what's left before paying clients.",
    stack: ["Bash", "systemd", "SQLite", "FastAPI", "Postgres", "React/TS", "Claude", "AWS"],
  },
  {
    name: "Finddder",
    tagline: "An internship & opportunity tracker that scrapes, ranks, and surfaces roles.",
    detail:
      "An internship and opportunity tracker that scrapes listings, ranks them, and surfaces the best matches behind a typed API and a fast React front end. Actively building.",
    stack: ["React", "TypeScript", "FastAPI", "Python"],
    link: { label: "GitHub", url: "https://github.com/Darshit42/finddrrr" },
  },
];
