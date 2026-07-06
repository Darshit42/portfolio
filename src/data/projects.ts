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
    oneLiner: "A multi-agent FastAPI RAG system over a document corpus.",
    blurb:
      "A FastAPI service that answers questions over an ingested document corpus (built against Hyperledger Fabric docs) using Google Generative AI for embeddings and generation, with ChromaDB as the vector store. Separate ingestion and chat workflows handle document management and retrieval-augmented query answering.",
    stack: ["FastAPI", "Google Generative AI", "ChromaDB", "Python", "RAG"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Multi_agent_RAG", kind: "github" },
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
      { label: "GitHub", url: "https://github.com/Darshit42/OpenEnv", kind: "github" },
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
      { label: "GitHub", url: "https://github.com/Darshit42/BTC_predictor", kind: "github" },
    ],
    accent: "#e8b04a",
  },

  // ── GitHub scan: truthful, non-exaggerated entries for the remaining
  //    non-fork public repos (github.com/Darshit42). ─────────────────────────
  {
    id: "infllm-video-rag",
    name: "infLLM — Short-Form Video RAG",
    tier: "product",
    category: "ai-agents",
    oneLiner: "Ask questions across YouTube & Instagram videos with cited answers.",
    blurb:
      "Paste YouTube and Instagram URLs and the app pulls their transcripts, embeds them with Gemini, and stores the vectors in ChromaDB for cosine retrieval. A LangGraph flow does a dual-retrieve pass and answers with gemini-2.5-flash, streaming the response over SSE into a Next.js UI with timestamped citation chips back to the source video.",
    stack: ["Next.js", "LangGraph", "Gemini", "ChromaDB", "SSE", "Python"],
    links: [
      { label: "Live demo", url: "https://infllm.onrender.com/", kind: "demo" },
      { label: "GitHub", url: "https://github.com/Darshit42/infLLM", kind: "github" },
    ],
    accent: "#c08bff",
  },
  {
    id: "resume-enhancer",
    name: "Resume Enhancer",
    tier: "product",
    category: "ai-agents",
    oneLiner: "A multi-agent résumé reviewer with pluggable LLM providers.",
    blurb:
      "A Streamlit app that reviews a résumé through a multi-agent pipeline built on LangChain and a langgraph StateGraph. It reads the PDF with pypdf and is provider-agnostic — Gemini, OpenAI, OpenRouter, or Groq — so the same review graph can run on whichever model you have keys for.",
    stack: ["LangChain", "langgraph", "Streamlit", "pypdf", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Resume_enhancer", kind: "github" },
    ],
    accent: "#ff9d5c",
  },
  {
    id: "smart-study-assistant",
    name: "Smart Study Assistant",
    tier: "product",
    category: "ai-agents",
    oneLiner: "An AI study companion: summaries, MCQs, and a math mode.",
    blurb:
      "A study helper that pulls a Wikipedia summary for a topic and has gemini-2.5-flash generate a 3-bullet summary, three multiple-choice questions, and a study tip. It includes a math mode, a history of past lookups, and a dark/light theme, served by a small Node/Express backend.",
    stack: ["Node.js", "Express", "Gemini", "Wikipedia API", "JavaScript"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/smart_study_assistant", kind: "github" },
    ],
    accent: "#ffb347",
  },
  {
    id: "project-echo",
    name: "Project Echo",
    tier: "product",
    category: "ai-agents",
    oneLiner: "A Flask RAG chatbot over a source PDF.",
    blurb:
      "A retrieval-augmented chatbot that loads a source PDF with PyPDFLoader, embeds it with Azure OpenAI, and stores the chunks in ChromaDB. A Flask web UI lets you chat against the document, retrieving relevant passages before composing each answer.",
    stack: ["Flask", "Azure OpenAI", "ChromaDB", "PyPDFLoader", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Project_Echo", kind: "github" },
    ],
    accent: "#b06cff",
  },
  {
    id: "hand-gesture-control",
    name: "Hand-Gesture Control",
    tier: "research",
    category: "ai-agents",
    oneLiner: "An early computer-vision project: control the cursor by hand.",
    blurb:
      "A first computer-vision experiment that tracks hand landmarks with OpenCV and MediaPipe and maps gestures to mouse and keyboard actions via pyautogui. Small and exploratory — the project where the CV fundamentals were learned.",
    stack: ["OpenCV", "MediaPipe", "pyautogui", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/hand-guesture", kind: "github" },
    ],
    accent: "#39d98a",
  },
  {
    id: "women-safety-app",
    name: "Women Safety App",
    tier: "venture",
    category: "ventures-fullstack",
    oneLiner: "Hackathon-winning women's safety app (Polaris & Google for Developers).",
    blurb:
      "The hackathon-winning women's safety application — 1st place at the Polaris & Google for Developers hackathon. A React + TypeScript front end backed by a Node server, with an SOS button, fake-call decoy, live location tracking, a geofencing layer, emergency contacts, community alerts, an AI chat assistant, a map view, and auth.",
    stack: ["React", "TypeScript", "Node.js", "Express"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/WOMEN-SAFETY-APP", kind: "github" },
    ],
    accent: "#ff5470",
  },
  {
    id: "ecommerce-cart",
    name: "Mock E-Commerce Cart",
    tier: "venture",
    category: "ventures-fullstack",
    oneLiner: "A MERN shopping cart over the Fake Store API.",
    blurb:
      "A mock e-commerce cart built on the MERN stack — a React/Vite front end with an Express + MongoDB backend, pulling its catalog from the Fake Store API. A full-stack practice build covering product listing and cart state.",
    stack: ["React", "Vite", "Express", "MongoDB", "Node.js"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/E-comm", kind: "github" },
    ],
    accent: "#ff7a9c",
  },
  {
    id: "mini-twitter",
    name: "Mini Twitter",
    tier: "venture",
    category: "ventures-fullstack",
    oneLiner: "A small MERN microblog with a posts/notes API.",
    blurb:
      "A minimal Twitter-style microblog on the MERN stack: an Express notes/posts API with React components for creating and listing posts. A compact full-stack exercise in CRUD and component state.",
    stack: ["React", "Express", "MongoDB", "Node.js"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Mini_Twitter", kind: "github" },
    ],
    accent: "#ff8fb3",
  },
  {
    id: "horse-betting-game",
    name: "Horse-Betting Game",
    tier: "venture",
    category: "ventures-fullstack",
    oneLiner: "A simple browser horse-betting game.",
    blurb:
      "A small JavaScript browser game: bet on one of five horses that race at random speeds to a finish line. A quick, self-contained front-end exercise.",
    stack: ["JavaScript", "HTML", "CSS"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Horse-betting-game", kind: "github" },
    ],
    accent: "#ffa05c",
  },
  {
    id: "finance-dashboard",
    name: "Finance Dashboard",
    tier: "product",
    category: "products-data",
    oneLiner: "A TypeScript finance dashboard with a split front/back end.",
    blurb:
      "A finance dashboard built in TypeScript with a separate frontend and backend. A practice full-stack data app focused on presenting financial figures in a dashboard layout.",
    stack: ["TypeScript", "Node.js", "React"],
    links: [
      { label: "Live demo", url: "https://finance-dashboard-qwfx.onrender.com/", kind: "demo" },
      { label: "GitHub", url: "https://github.com/Darshit42/Finance-dashboard", kind: "github" },
    ],
    accent: "#f2b94c",
  },
  {
    id: "crud-fastapi",
    name: "FastAPI Items CRUD",
    tier: "product",
    category: "products-data",
    oneLiner: "A small items CRUD REST API, deployed live on Vercel.",
    blurb:
      "A compact CRUD REST API for items built with FastAPI and deployed live on Vercel. A clean reference for a typed Python API with create/read/update/delete endpoints.",
    stack: ["FastAPI", "Python", "Vercel"],
    links: [
      { label: "Live demo", url: "https://crud-fastapi-eta.vercel.app", kind: "demo" },
      { label: "GitHub", url: "https://github.com/Darshit42/CRUD_FASTAPI", kind: "github" },
    ],
    accent: "#e8c468",
  },
  {
    id: "forest-fire-predictor",
    name: "Forest-Fire Predictor",
    tier: "research",
    category: "products-data",
    oneLiner: "Ridge regression on the Algerian forest-fires dataset, served by Flask.",
    blurb:
      "A Flask app that predicts a forest-fire indicator using a Ridge regression model trained on the Algerian forest fires dataset. The trained model and its scaler are persisted as pickles and loaded to serve predictions from a simple web form.",
    stack: ["Flask", "scikit-learn", "Ridge regression", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Forest-FIre-predictor", kind: "github" },
    ],
    accent: "#e89a4a",
  },
  {
    id: "california-housing-regression",
    name: "California Housing Regression",
    tier: "research",
    category: "products-data",
    oneLiner: "A learning exercise: multiple linear regression on California housing.",
    blurb:
      "A small learning project applying multiple linear regression to the California housing dataset — fitting and evaluating a baseline model to practice the regression workflow end to end.",
    stack: ["scikit-learn", "pandas", "NumPy", "Python"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Califoria_Housing_Multi_Linear_Regression", kind: "github" },
    ],
    accent: "#d9a85c",
  },
  {
    id: "crm-fiber",
    name: "CRM REST API (Go Fiber)",
    tier: "production",
    category: "systems-infra",
    oneLiner: "A CRM REST API built with Go, Fiber, GORM, and SQLite.",
    blurb:
      "A CRM REST API in Go using the Fiber web framework with GORM over SQLite for persistence. A clean back-end build covering the standard CRUD contact/lead endpoints.",
    stack: ["Go", "Fiber", "GORM", "SQLite"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/CRM_WITH_FIBER", kind: "github" },
    ],
    accent: "#3aa0ff",
  },
  {
    id: "liquid-galaxy-gsoc-task2",
    name: "Liquid Galaxy — GSoC Task 2",
    tier: "open source",
    category: "systems-infra",
    oneLiner: "A Flutter qualification task for Liquid Galaxy (GSoC 2025).",
    blurb:
      "A Flutter app submitted as a GSoC 2025 qualification task for the Liquid Galaxy org. Part of the application process for contributing to the multi-screen Liquid Galaxy rig software.",
    stack: ["Flutter", "Dart"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Darshit_LiquidGalaxy_Task2_GSoC-2025", kind: "github" },
    ],
    accent: "#4db5e8",
  },
  {
    id: "liquid-galaxy-gsoc-task5",
    name: "Liquid Galaxy — GSoC Task 5",
    tier: "open source",
    category: "systems-infra",
    oneLiner: "A second Flutter qualification task for Liquid Galaxy (GSoC 2025).",
    blurb:
      "A second Flutter qualification task for the Liquid Galaxy org's GSoC 2025 application, building on the org's task track for prospective contributors.",
    stack: ["Flutter", "Dart"],
    links: [
      { label: "GitHub", url: "https://github.com/Darshit42/Darshit_Liquid_Galaxy_Task5_Gsoc_2025", kind: "github" },
    ],
    accent: "#5ad1c4",
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
