/**
 * The stack as an RPG skill tree (shown at the Shrine of Mastery). Each node has
 * a grid column + a y-offset so the tree renders as connected branches without
 * a layout engine. `lv` is flavour (relative mastery, not a real metric).
 */

export type SkillCat = "lang" | "ai" | "web" | "cloud" | "backend";

export interface SkillNode {
  id: string;
  label: string;
  lv: number;
  cat: SkillCat;
  col: number; // 0 = root … 3 = specialization
  y: number; // px (top of the node box)
  parent?: string;
}

export const SKILL_CATS: Record<SkillCat, string> = {
  lang: "#e8c66a",
  ai: "#39d98a",
  web: "#6ad0ff",
  cloud: "#3aa0ff",
  backend: "#ff9a4c",
};

export const CAT_LABELS: Record<SkillCat, string> = {
  lang: "Languages",
  ai: "AI / ML",
  web: "Frontend",
  cloud: "Cloud / Infra",
  backend: "Backend",
};

export const SKILL_W = 150;
export const SKILL_H = 44;
export const SKILL_COLW = 190;
export const SKILL_PAD = 12;
export const SKILL_SVG = { w: SKILL_PAD + 3 * SKILL_COLW + SKILL_W + 24, h: 600 };

export const xOfCol = (col: number) => SKILL_PAD + col * SKILL_COLW;

export const SKILLS: SkillNode[] = [
  // AI / ML branch
  { id: "python", label: "Python", lv: 52, cat: "lang", col: 0, y: 90 },
  { id: "aiml", label: "AI / ML", lv: 48, cat: "ai", col: 1, y: 90, parent: "python" },
  { id: "rl", label: "Reinforcement Learning", lv: 42, cat: "ai", col: 2, y: 40, parent: "aiml" },
  { id: "llm", label: "LLM Engineering", lv: 44, cat: "ai", col: 2, y: 140, parent: "aiml" },
  { id: "grpo", label: "GRPO", lv: 40, cat: "ai", col: 3, y: 12, parent: "rl" },
  { id: "lora", label: "LoRA", lv: 41, cat: "ai", col: 3, y: 68, parent: "rl" },
  { id: "vllm", label: "vLLM", lv: 37, cat: "ai", col: 3, y: 124, parent: "llm" },
  { id: "sft", label: "SFT", lv: 39, cat: "ai", col: 3, y: 180, parent: "llm" },

  // Frontend branch
  { id: "ts", label: "TypeScript", lv: 46, cat: "web", col: 0, y: 270 },
  { id: "frontend", label: "Frontend", lv: 44, cat: "web", col: 1, y: 270, parent: "ts" },
  { id: "react", label: "React", lv: 45, cat: "web", col: 2, y: 270, parent: "frontend" },
  { id: "three", label: "Three.js / R3F", lv: 36, cat: "web", col: 3, y: 270, parent: "react" },

  // Cloud branch
  { id: "go", label: "Go", lv: 31, cat: "cloud", col: 0, y: 360 },
  { id: "cloud", label: "Cloud / CNCF", lv: 34, cat: "cloud", col: 1, y: 360, parent: "go" },
  { id: "k8s", label: "Kubernetes", lv: 33, cat: "cloud", col: 2, y: 360, parent: "cloud" },
  { id: "kubestellar", label: "KubeStellar", lv: 30, cat: "cloud", col: 3, y: 332, parent: "k8s" },
  { id: "kyverno", label: "Kyverno", lv: 28, cat: "cloud", col: 3, y: 388, parent: "k8s" },

  // Backend branch
  { id: "node", label: "Node.js", lv: 34, cat: "backend", col: 0, y: 470 },
  { id: "backend", label: "Backend / APIs", lv: 38, cat: "backend", col: 1, y: 470, parent: "node" },
  { id: "fastapi", label: "FastAPI", lv: 36, cat: "backend", col: 2, y: 440, parent: "backend" },
  { id: "realtime", label: "Realtime", lv: 35, cat: "backend", col: 2, y: 500, parent: "backend" },
  { id: "livekit", label: "LiveKit", lv: 33, cat: "backend", col: 3, y: 480, parent: "realtime" },
  { id: "websockets", label: "WebSockets", lv: 36, cat: "backend", col: 3, y: 530, parent: "realtime" },
];
