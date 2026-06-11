import { useEffect, useReducer, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { SparkIcon } from "./icons";

/**
 * The Agent Forge live demo (F11). A scripted-but-convincing stream of the
 * self-healing agent loop, with three live-ticking stats. Reused in the in-world
 * Codex and in Recruiter Mode. Fails silently to a static line if anything
 * breaks — it must never take down the page.
 *
 * P2 (F24): swap the scripted generator for a WebSocket feed behind FEATURES.liveAgentWs.
 */

type Stage = "scan" | "detect" | "reason" | "patch" | "verify" | "pr" | "reward";

interface LogLine {
  id: number;
  stage: Stage;
  text: string;
}

const STAGE_LABEL: Record<Stage, string> = {
  scan: "scan",
  detect: "detect",
  reason: "reason",
  patch: "patch",
  verify: "verify",
  pr: "pr",
  reward: "reward",
};

const STAGE_COLOR: Record<Stage, string> = {
  scan: "#6ad0ff",
  detect: "#ff7a3c",
  reason: "#e8c66a",
  patch: "#b06cff",
  verify: "#39d98a",
  pr: "#3aa0ff",
  reward: "#ff5470",
};

// A small pool of realistic targets so the loop reads as varied, not looped.
const REPOS = [
  "octo/parser",
  "acme/scheduler",
  "nimbus/cache",
  "forge/router",
  "vega/auth-svc",
  "lumen/cli",
];
const FILES = [
  "src/lexer.ts:142",
  "internal/queue.go:88",
  "lib/store.py:209",
  "pkg/router.go:51",
  "app/session.ts:317",
  "cmd/root.py:74",
];
const TESTS = [
  "TestParseNested",
  "test_retry_backoff",
  "TestEvictLRU",
  "test_route_match",
  "TestRefreshToken",
  "test_parse_flags",
];
const TITLES = [
  "fix: handle empty nested groups",
  "fix: clamp retry backoff ceiling",
  "fix: evict on capacity, not count",
  "fix: trailing-slash route match",
  "fix: refresh before expiry window",
  "fix: parse repeated short flags",
];

const pick = <T,>(a: T[], i: number): T => a[i % a.length];

let lineId = 0;

function buildCycle(seed: number): LogLine[] {
  const repo = pick(REPOS, seed);
  const file = pick(FILES, seed * 3 + 1);
  const test = pick(TESTS, seed * 5 + 2);
  const title = pick(TITLES, seed * 5 + 2);
  const files = 40 + ((seed * 37) % 900);
  const pass = 30 + ((seed * 13) % 200);
  const pr = 100 + ((seed * 7) % 900);
  const steps: { stage: Stage; text: string }[] = [
    { stage: "scan", text: `cloning ${repo} · indexing ${files} files` },
    { stage: "detect", text: `failing test: ${test}` },
    { stage: "reason", text: `localizing fault → ${file}` },
    { stage: "patch", text: `generating diff (GRPO policy)` },
    { stage: "verify", text: `running suite … ${pass} passed` },
    { stage: "pr", text: `opened #${pr} "${title}"` },
    { stage: "reward", text: `+1.0 → policy updated` },
  ];
  return steps.map((l) => ({ ...l, id: ++lineId }));
}

interface State {
  lines: LogLine[];
  resolved: number;
  passRate: number; // 0..100
  avgReward: number;
  igniting: boolean;
}

type Action =
  | { type: "push"; line: LogLine }
  | { type: "cycleDone"; passRate: number }
  | { type: "ignite" };

const MAX_LINES = 9;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ignite":
      return { ...state, igniting: true };
    case "push": {
      const lines = [...state.lines, action.line].slice(-MAX_LINES);
      return { ...state, lines, igniting: false };
    }
    case "cycleDone":
      return {
        ...state,
        resolved: state.resolved + 1,
        // Smooth the displayed pass rate toward the cycle's value.
        passRate: Math.round(state.passRate * 0.7 + action.passRate * 0.3),
        avgReward: Math.min(1, state.avgReward * 0.8 + 0.2 * (0.85 + Math.random() * 0.15)),
      };
    default:
      return state;
  }
}

export default function ForgeDemo({ compact = false }: { compact?: boolean }) {
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const [state, dispatch] = useReducer(reducer, {
    lines: [],
    resolved: 247,
    passRate: 92,
    avgReward: 0.86,
    igniting: false,
  });
  const seedRef = useRef(Math.floor(Math.random() * REPOS.length));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number;

    const run = () => {
      const cycle = buildCycle(seedRef.current++);
      let i = 0;
      const step = () => {
        if (cancelled) return;
        if (i < cycle.length) {
          dispatch({ type: "push", line: cycle[i] });
          if (cycle[i].stage === "verify") {
            const passNum = parseInt(cycle[i].text.match(/(\d+) passed/)?.[1] ?? "90", 10);
            dispatch({ type: "cycleDone", passRate: Math.min(100, 70 + (passNum % 30)) });
          }
          i++;
          timer = window.setTimeout(step, reducedMotion ? 220 : 520 + Math.random() * 260);
        } else {
          dispatch({ type: "ignite" });
          timer = window.setTimeout(run, reducedMotion ? 400 : 900);
        }
      };
      step();
    };

    // Seed with a couple of lines immediately so the panel is never empty.
    dispatch({ type: "push", line: buildCycle(seedRef.current)[0] });
    timer = window.setTimeout(run, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state.lines]);

  return (
    <div className="overflow-hidden rounded-xl border border-realm-edge bg-[#0a0c12]">
      {/* header / stats */}
      <div className="flex items-center justify-between gap-3 border-b border-realm-edge bg-realm-panel/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-realm-ember">
          <SparkIcon className={reducedMotion ? "" : "animate-pulse-glow"} width={18} height={18} />
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-realm-ember">
            Agent Forge · live
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-realm-muted">
          <Stat label="resolved" value={state.resolved.toLocaleString()} color="#39d98a" />
          <Stat label="pass" value={`${state.passRate}%`} color="#6ad0ff" />
          <Stat label="reward" value={state.avgReward.toFixed(2)} color="#e8c66a" />
        </div>
      </div>

      {/* log stream */}
      <div
        ref={scrollRef}
        className="scroll-thin overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
        style={{ height: compact ? 160 : 224 }}
        aria-live="off"
      >
        {state.lines.map((l) => (
          <div key={l.id} className="flex gap-2 animate-fade-in-fast">
            <span
              className="w-[58px] shrink-0 select-none font-medium"
              style={{ color: STAGE_COLOR[l.stage] }}
            >
              [{STAGE_LABEL[l.stage]}]
            </span>
            <span className="text-realm-text/90">{l.text}</span>
          </div>
        ))}
        <div className="mt-0.5 flex gap-2">
          <span className="w-[58px] shrink-0" />
          <span className="text-realm-ember animate-blink">▌</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="tabular-nums font-semibold" style={{ color }}>
        {value}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
