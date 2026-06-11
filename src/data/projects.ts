/**
 * The six projects. Each is one Relic. This file is the single source of truth
 * for both the in-world Codex and Recruiter Mode. Adding a 7th project is an
 * edit here (plus a building in buildings.ts) — zero engine changes.
 */

export type Tier =
  | "flagship"
  | "production"
  | "open source"
  | "venture"
  | "research"
  | "product";

export interface ProjectLink {
  label: string;
  url: string;
  kind: "github" | "demo" | "external" | "kaggle";
  /** Guessed/placeholder URLs are flagged so they're easy to audit pre-launch. */
  unverified?: boolean;
}

export interface Project {
  id: string;
  name: string;
  tier: Tier;
  /** Recruiter-mode card subtitle. One line. */
  oneLiner: string;
  /** Codex body — 2-4 sentences. */
  blurb: string;
  stack: string[];
  links: ProjectLink[];
  /** Building id this relic lives in (see buildings.ts). */
  building: string;
  demo?: { type: "forge-live" | "image" | "video" | "none"; src?: string };
  /** Hex — themes the building and the relic glow. */
  accent: string;
}

export const PROJECTS: Project[] = [
  {
    id: "self-healing-agent",
    name: "Self-Healing Agent",
    tier: "flagship",
    oneLiner: "An agent that finds, fixes and ships GitHub issues on its own.",
    blurb:
      "An autonomous engineering agent that resolves real GitHub issues unattended: it clones the repo, localizes the fault, generates a patch with a GRPO-trained policy, verifies against the test suite, opens a pull request, and learns from the reward. It runs continuously on a tmux/systemd runtime — no human in the loop.",
    stack: ["LangGraph", "GRPO", "LoRA", "vLLM", "Python", "systemd"],
    links: [
      // TODO(launch): point at the real repo once public.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    building: "agent-forge",
    demo: { type: "forge-live" },
    accent: "#ff7a3c",
  },
  {
    id: "kubestellar-kyverno",
    name: "KubeStellar + Kyverno",
    tier: "open source",
    oneLiner: "CNCF / LFX contributor with a real merge record.",
    blurb:
      "Open-source contributions across two CNCF projects: 10+ merged PRs and 25+ filed issues spanning the KubeStellar Console and Kyverno. The work came from deep manual navigation of unfamiliar codebases and was mentor-endorsed through the LFX program.",
    stack: ["React", "TypeScript", "Go", "CNCF", "Kubernetes"],
    links: [
      { label: "KubeStellar", url: "https://github.com/kubestellar", kind: "github" },
      { label: "Kyverno", url: "https://github.com/kyverno/kyverno", kind: "github" },
    ],
    building: "guild-hall",
    accent: "#3aa0ff",
  },
  {
    id: "jee-arena",
    name: "JEE Arena",
    tier: "venture",
    oneLiner: "A LeetCode-style practice arena for JEE aspirants.",
    blurb:
      "A competitive practice arena for India's JEE exam: timed problem sets, submissions, and a judging pipeline that scores attempts. An ongoing venture built with a co-founder. In Devhalla, this project literally is the combat arena.",
    stack: ["Node.js", "TypeScript", "FastAPI", "Python"],
    links: [
      // TODO(launch): add live URL + repo.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    building: "the-arena",
    accent: "#ff5470",
  },
  {
    id: "voice-agent",
    name: "Voice Agent (revRAG.ai)",
    tier: "production",
    oneLiner: "Production real-time voice-agent pipelines.",
    blurb:
      "Production real-time voice agents: speech and telephony triggering, plus a WebSocket account-aggregator integration handling consent and OTP flows. Built for revRAG.ai. In the realm, the Oracle speaks this blurb aloud.",
    stack: ["LiveKit", "WebSockets", "Python", "Telephony"],
    links: [
      // TODO(launch): confirm the public writeup / product URL.
      { label: "revRAG.ai", url: "https://revrag.ai", kind: "external", unverified: true },
    ],
    building: "oracles-booth",
    accent: "#b06cff",
  },
  {
    id: "nemotron-rl",
    name: "Nemotron RL",
    tier: "research",
    oneLiner: "Full fine-tuning + RL pipeline on a Nemotron-3 Nano model.",
    blurb:
      "An end-to-end fine-tuning and reinforcement-learning pipeline on a Nemotron-3 Nano model: supervised fine-tuning, GRPO, LoRA adapters, and vLLM inference, with a symbolic-solver fallback for hard math reasoning. The familiar in the Spire 'levels up' along the reward curve.",
    stack: ["GRPO", "SFT", "LoRA", "vLLM", "Mamba"],
    links: [
      // TODO(launch): replace with the real Kaggle notebook link.
      { label: "Kaggle", url: "https://kaggle.com/Darshit42", kind: "kaggle", unverified: true },
    ],
    building: "spire-of-training",
    accent: "#39d98a",
  },
  {
    id: "finddder",
    name: "Finddder",
    tier: "product",
    oneLiner: "An internship tracker that scrapes, ranks and surfaces roles.",
    blurb:
      "An internship and opportunity tracker that scrapes listings, ranks them, and surfaces the best matches behind a typed API and a fast React front end. The market merchant 'scouts' roles the way the product does.",
    stack: ["React", "TypeScript", "FastAPI", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/finddrrr", kind: "github" },
    ],
    building: "finddder-market",
    accent: "#f2b94c",
  },
];

/** Lookup helpers (cheap; arrays are tiny). */
export const projectById = (id: string): Project | undefined =>
  PROJECTS.find((p) => p.id === id);

export const projectByBuilding = (buildingId: string): Project | undefined =>
  PROJECTS.find((p) => p.building === buildingId);

export const TOTAL_RELICS = PROJECTS.length;

const TIER_LABEL: Record<Tier, string> = {
  flagship: "Flagship",
  production: "Production",
  "open source": "Open Source",
  venture: "Venture",
  research: "Research",
  product: "Product",
};

export const tierLabel = (t: Tier): string => TIER_LABEL[t];
