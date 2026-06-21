import { useEffect, useState } from "react";
import { useAgentStore } from "../agents/agentStore";
import { runtime } from "../agents/runtime";
import { FEATURES } from "../data/config";
import { itemMeta, needMeta } from "../data/economy";
import { CloseIcon } from "./icons";
import type { EconSnapshot, MemoryLine, TxnLine } from "../agents/types";

/**
 * Agent Inspector (R12) — a right-docked panel showing one agent's mind: bio,
 * current activity, today's plan, relationships, and a live-updating memory
 * feed derived from replayed events. Deliberately NOT a centered modal: the
 * player keeps watching the town while inspecting. It uses its own store state
 * (never the dialog UiMode) so the scripted NPC system is untouched.
 */
export default function AgentInspector() {
  const id = useAgentStore((s) => s.inspectorId);
  const close = useAgentStore((s) => s.closeInspector);
  const [data, setData] = useState<ReturnType<typeof runtime.inspector>>(null);

  // Poll the runtime while open so the memory feed tracks the replay clock
  // without per-frame store churn.
  useEffect(() => {
    if (!id) return;
    const pull = () => setData(runtime.inspector(id));
    pull();
    const t = setInterval(pull, 300);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [id, close]);

  if (!id || !data) return null;
  const { snapshot, activity, memories, econ, transactions } = data;
  const nameOf = (aid: string) =>
    runtime.meta?.agents.find((a) => a.id === aid)?.name ?? aid;

  return (
    <aside
      className="absolute right-0 top-0 z-40 flex h-full w-[340px] max-w-[88vw] flex-col border-l border-realm-edge bg-realm-bg/95 shadow-panel backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="false"
      aria-label={`${snapshot.name} — agent inspector`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-realm-edge px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-realm-muted">Agent mind</p>
          <h2 className="font-display text-lg font-bold text-realm-text">{snapshot.name}</h2>
        </div>
        <button onClick={close} aria-label="Close inspector" className="btn-ghost shrink-0 rounded-lg p-2">
          <CloseIcon width={16} height={16} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
        <Section label="Bio">
          <p className="leading-snug text-realm-muted">{snapshot.bio}</p>
        </Section>

        <Section label="Now">
          <p className="leading-snug text-realm-text">{activity || "—"}</p>
        </Section>

        <EconomyPanel econ={econ} transactions={transactions} />

        <Section label="Today's plan">
          <ul className="space-y-1">
            {snapshot.plan.map((s, i) => (
              <li key={i} className="flex gap-2 text-realm-muted">
                <span className="shrink-0 font-mono text-[12px] text-realm-text">
                  {String(s.time).padStart(2, "0")}:00
                </span>
                <span className="leading-snug">{s.description}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section label="Relationships">
          {Object.keys(snapshot.relationships).length === 0 ? (
            <p className="text-realm-muted">A loner, for now.</p>
          ) : (
            <ul className="space-y-1">
              {Object.entries(snapshot.relationships).map(([aid, desc]) => (
                <li key={aid} className="text-realm-muted">
                  <span className="text-realm-text">{nameOf(aid)}</span> — {desc}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section label="Memory stream">
          {memories.length === 0 ? (
            <p className="text-realm-muted">Nothing yet today.</p>
          ) : (
            <ul className="space-y-1.5">
              {memories.map((m, i) => (
                <MemoryRow key={i} m={m} />
              ))}
            </ul>
          )}
        </Section>

        {FEATURES.liveAgentWs && <RumorSeed agentId={id} />}
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-[11px] uppercase tracking-wider text-realm-muted/80">{label}</h3>
      {children}
    </section>
  );
}

function EconomyPanel({ econ, transactions }: { econ: EconSnapshot; transactions: TxnLine[] }) {
  const inv = Object.entries(econ.inventory).filter(([, q]) => q > 0);
  return (
    <Section label="Economy">
      <div className="space-y-2">
        {/* coin */}
        <div className="flex items-center gap-2">
          <span className="text-realm-muted">Coin</span>
          <span className="font-mono font-semibold text-realm-gold">{Math.round(econ.coin)}c</span>
        </div>

        {/* needs as bars */}
        <div className="space-y-1">
          {Object.entries(econ.needs).map(([id, v]) => {
            const m = needMeta(id);
            return (
              <div key={id} className="flex items-center gap-2">
                <span className="w-14 text-[12px] text-realm-muted">{m.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: m.color }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-[11px] text-realm-muted">{Math.round(v)}</span>
              </div>
            );
          })}
        </div>

        {/* inventory */}
        <div className="flex flex-wrap gap-1.5">
          {inv.length === 0 ? (
            <span className="text-[12px] text-realm-muted">empty pack</span>
          ) : (
            inv.map(([item, qty]) => {
              const m = itemMeta(item);
              return (
                <span
                  key={item}
                  className="rounded-md border border-realm-edge px-1.5 py-0.5 text-[12px]"
                  title={m.label}
                >
                  {m.icon} {m.label} ×{qty}
                </span>
              );
            })
          )}
        </div>

        {/* recent transactions */}
        {transactions.length > 0 && (
          <ul className="space-y-0.5 pt-0.5">
            {transactions.map((t, i) => (
              <li key={i} className="font-mono text-[11px] text-realm-muted">
                <span style={{ color: TXN_COLOR[t.kind] }}>{t.kind}</span> {t.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

const TXN_COLOR: Record<TxnLine["kind"], string> = {
  trade: "#39d98a",
  produce: "#ff9a4c",
  consume: "#6ad0ff",
};

const KIND_COLOR: Record<MemoryLine["kind"], string> = {
  said: "#6ad0ff",
  did: "#e8c66a",
  moved: "#8b97b0",
  reflected: "#b06cff",
};

function MemoryRow({ m }: { m: MemoryLine }) {
  return (
    <li className="flex gap-2 leading-snug">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[m.kind] }} />
      <span className="text-realm-muted">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: KIND_COLOR[m.kind] }}>
          {m.kind}
        </span>{" "}
        {m.text}
      </span>
    </li>
  );
}

/** Live-only: inject a rumor into an agent's memory (R13). Hidden in replay. */
function RumorSeed({ agentId }: { agentId: string }) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    // Wired to the live server in live mode; no-op placeholder in replay.
    import("../agents/live").then((m) => m.seedRumor(agentId, t)).catch(() => {});
    setText("");
  };
  return (
    <Section label="Seed a rumor">
      <div className="flex gap-2">
        <input
          value={text}
          maxLength={140}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Whisper something…"
          className="min-w-0 flex-1 rounded-lg border border-realm-edge bg-black/30 px-2 py-1 text-sm outline-none focus:border-realm-gold"
        />
        <button onClick={submit} className="btn-ghost rounded-lg px-3 text-sm">
          Seed
        </button>
      </div>
    </Section>
  );
}
