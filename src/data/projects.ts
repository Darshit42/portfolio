/**
 * The projects. This file is the single source of truth for both the in-world
 * Codex (grouped into guild lists by `category`) and Recruiter Mode.
 *
 * Adding a project is a PURE DATA APPEND: add one entry below with a `category`
 * matching a guild in categories.ts. No building, no placement, no engine edit —
 * it simply appears in that guild's Codex list and Recruiter Mode. See the data
 * note in README for the worked example.
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
  /** Guild category id (see categories.ts). Determines which guild list it shows in. */
  category: string;
  /** Recruiter-mode card subtitle. One line. */
  oneLiner: string;
  /** Codex body — 2-4 sentences. */
  blurb: string;
  stack: string[];
  links: ProjectLink[];
  demo?: { type: "forge-live" | "image" | "video" | "none"; src?: string };
  /** Reads its blurb aloud via TTS in the detail view (the Oracle's voice). */
  speaks?: boolean;
  /** Offers "Enter the Arena" combat from the detail view. */
  arena?: boolean;
  /** Hex — themes the relic glow + Codex accent. */
  accent: string;
}

export const PROJECTS: Project[] = [
  {
    id: "self-healing-agent",
    name: "Self-Healing Agent",
    tier: "flagship",
    category: "ai-agents",
    oneLiner: "An agent that finds, fixes and ships GitHub issues on its own.",
    blurb:
      "An autonomous engineering agent that resolves real GitHub issues unattended: it clones the repo, localizes the fault, generates a patch with a GRPO-trained policy, verifies against the test suite, opens a pull request, and learns from the reward. It runs continuously on a tmux/systemd runtime — no human in the loop.",
    stack: ["LangGraph", "GRPO", "LoRA", "vLLM", "Python", "systemd"],
    links: [
      // TODO(launch): point at the real repo once public.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    demo: { type: "forge-live" },
    accent: "#ff7a3c",
  },
  {
    id: "kubestellar-kyverno",
    name: "KubeStellar + Kyverno",
    tier: "open source",
    category: "systems-infra",
    oneLiner: "CNCF / LFX contributor with a real merge record.",
    blurb:
      "Open-source contributions across two CNCF projects: 10+ merged PRs and 25+ filed issues spanning the KubeStellar Console and Kyverno. The work came from deep manual navigation of unfamiliar codebases and was mentor-endorsed through the LFX program.",
    stack: ["React", "TypeScript", "Go", "CNCF", "Kubernetes"],
    links: [
      { label: "KubeStellar", url: "https://github.com/kubestellar", kind: "github" },
      { label: "Kyverno", url: "https://github.com/kyverno/kyverno", kind: "github" },
    ],
    accent: "#3aa0ff",
  },
  {
    id: "jee-arena",
    name: "JEE Arena",
    tier: "venture",
    category: "ventures-fullstack",
    oneLiner: "A LeetCode-style practice arena for JEE aspirants.",
    blurb:
      "A competitive practice arena for India's JEE exam: timed problem sets, submissions, and a judging pipeline that scores attempts. An ongoing venture built with a co-founder. In Devhalla, this project literally is the combat arena.",
    stack: ["Node.js", "TypeScript", "FastAPI", "Python"],
    links: [
      // TODO(launch): add live URL + repo.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    arena: true,
    accent: "#ff5470",
  },
  {
    id: "voice-agent",
    name: "Voice Agent (revRAG.ai)",
    tier: "production",
    category: "ai-agents",
    oneLiner: "Production real-time voice-agent pipelines.",
    blurb:
      "Production real-time voice agents: speech and telephony triggering, plus a WebSocket account-aggregator integration handling consent and OTP flows. Built for revRAG.ai. In the realm, the Oracle speaks this blurb aloud.",
    stack: ["LiveKit", "WebSockets", "Python", "Telephony"],
    links: [
      // TODO(launch): confirm the public writeup / product URL.
      { label: "revRAG.ai", url: "https://revrag.ai", kind: "external", unverified: true },
    ],
    speaks: true,
    accent: "#b06cff",
  },
  {
    id: "nemotron-rl",
    name: "Nemotron RL",
    tier: "research",
    category: "ai-agents",
    oneLiner: "Full fine-tuning + RL pipeline on a Nemotron-3 Nano model.",
    blurb:
      "An end-to-end fine-tuning and reinforcement-learning pipeline on a Nemotron-3 Nano model: supervised fine-tuning, GRPO, LoRA adapters, and vLLM inference, with a symbolic-solver fallback for hard math reasoning. The familiar in the Spire 'levels up' along the reward curve.",
    stack: ["GRPO", "SFT", "LoRA", "vLLM", "Mamba"],
    links: [
      // TODO(launch): replace with the real Kaggle notebook link.
      { label: "Kaggle", url: "https://kaggle.com/Darshit42", kind: "kaggle", unverified: true },
    ],
    accent: "#39d98a",
  },
  {
    id: "finddder",
    name: "Finddder",
    tier: "product",
    category: "products-data",
    oneLiner: "An internship tracker that scrapes, ranks and surfaces roles.",
    blurb:
      "An internship and opportunity tracker that scrapes listings, ranks them, and surfaces the best matches behind a typed API and a fast React front end. The market merchant 'scouts' roles the way the product does.",
    stack: ["React", "TypeScript", "FastAPI", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/finddrrr", kind: "github" },
    ],
    accent: "#f2b94c",
  },
  {
    id: "multi-agent-rag",
    name: "Multi-Agent RAG",
    tier: "research",
    category: "ai-agents",
    oneLiner: "A multi-agent FastAPI FAQ system over Google Generative AI.",
    blurb:
      "A FastAPI-based FAQ system that automates question answering with Google Generative AI. A multi-agent architecture coordinates document-management endpoints for query processing and response generation, retrieving over a managed corpus before composing an answer.",
    stack: ["FastAPI", "Google Generative AI", "Python", "RAG"],
    links: [
      // TODO(launch): point at the real repo once public.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    accent: "#ffb347",
  },
  {
    id: "openenv-sre",
    name: "OpenEnv — Causal SRE Platform",
    tier: "production",
    category: "systems-infra",
    oneLiner: "RL simulation platform for autonomous SRE incident response.",
    blurb:
      "A production-grade reinforcement-learning simulation platform for autonomous SRE incident response, modeling microservice architectures with realistic anomaly injection. A hybrid ML pipeline — XGBoost (485-feature root-cause classification), Isolation Forest, and an LSTM autoencoder — feeds a causal reasoning engine (PC-algorithm DAG discovery + an SEM counterfactual engine) for safe 'what-if' intervention, with SHAP explainability.",
    stack: ["FastAPI", "React", "Docker", "XGBoost", "PyTorch", "SHAP"],
    links: [
      // TODO(launch): point at the real repo once public.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    accent: "#5ad1c4",
  },
  {
    id: "btc-range-predictor",
    name: "BTC Price-Range Predictor",
    tier: "research",
    category: "products-data",
    oneLiner: "95% next-hour BTC price-range forecasts via Monte Carlo.",
    blurb:
      "A GBM model forecasting the 95% BTC/USDT confidence interval via Monte Carlo (10k paths, Student-t log-returns) — 95.28% coverage on a 30-day backtest. It benchmarks three volatility models (Simple σ, EWM, HAR-RV), tunes hyperparameters by Winkler score, and ships a live Binance feed with SQLite persistence behind an interactive Streamlit + Plotly dashboard.",
    stack: ["Python", "Streamlit", "Plotly", "Monte Carlo", "SQLite", "Binance API"],
    links: [
      // TODO(launch): point at the real repo once public.
      { label: "GitHub", url: "https://github.com/Darshit42", kind: "github", unverified: true },
    ],
    accent: "#e8b04a",
  },
];

/** Lookup helpers (cheap; arrays are tiny). */
export const projectById = (id: string): Project | undefined =>
  PROJECTS.find((p) => p.id === id);

/** All projects in a guild category, in declaration order. Unbounded by design. */
export const projectsByCategory = (categoryId: string): Project[] =>
  PROJECTS.filter((p) => p.category === categoryId);

export const TOTAL_PROJECTS = PROJECTS.length;

const TIER_LABEL: Record<Tier, string> = {
  flagship: "Flagship",
  production: "Production",
  "open source": "Open Source",
  venture: "Venture",
  research: "Research",
  product: "Product",
};

export const tierLabel = (t: Tier): string => TIER_LABEL[t];
