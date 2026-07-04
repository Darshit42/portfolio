import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { travelerById, randomDeflection } from "../data/travelers";
import { FEATURES } from "../data/config";
import { askTraveler } from "../agents/ask";
import { ArrowRightIcon } from "./icons";

/**
 * The worldly traveler's Q&A overlay (P2). Opens from the tavern; the player
 * types a question and — ONLY on submit, and ONLY when FEATURES.tavernLiveQA is
 * on with a reachable server — the guarded backend returns a grounded answer.
 * Every other path shows a baked in-character deflection. Never an error wall.
 */
interface Msg {
  role: "traveler" | "player";
  text: string;
}

export default function TravelerChat() {
  const travelerId = useGameStore((s) => s.activeTraveler);
  const close = useGameStore((s) => s.closeOverlay);
  const traveler = travelerId ? travelerById(travelerId) : undefined;

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Seed the intro line whenever a (new) traveler opens.
  useEffect(() => {
    if (!traveler) return;
    setMsgs(traveler.intro ? [{ role: "traveler", text: traveler.intro }] : []);
    setDraft("");
    setPending(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [traveler]);

  // Keep the log pinned to the latest line.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending]);

  if (!traveler) return null;

  const submit = async () => {
    const q = draft.trim();
    if (!q || pending) return;
    setMsgs((m) => [...m, { role: "player", text: q }]);
    setDraft("");
    setPending(true);
    const res = await askTraveler(q);
    const reply = res.ok && res.answer ? res.answer : randomDeflection();
    setMsgs((m) => [...m, { role: "traveler", text: reply }]);
    setPending(false);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 animate-fade-in">
      <div
        className="panel w-full max-w-2xl rounded-2xl p-5 shadow-panel"
        style={{ boxShadow: `inset 0 3px 0 ${traveler.accent}, 0 10px 40px -12px #000` }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="font-display text-lg font-bold" style={{ color: traveler.accent }}>
            {traveler.name}
          </div>
          {!FEATURES.tavernLiveQA && (
            <span className="text-[11px] text-realm-muted/70">telling tales</span>
          )}
        </div>

        <div ref={logRef} className="scroll-thin mb-3 max-h-56 space-y-2 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "player" ? "text-right" : "text-left"}>
              <span
                className="inline-block max-w-[85%] rounded-2xl px-3 py-1.5 text-[14px] leading-relaxed"
                style={
                  m.role === "player"
                    ? { background: "rgba(255,255,255,0.08)", color: "#e6ebf5" }
                    : { background: `${traveler.accent}1a`, color: "#eef2fb" }
                }
              >
                {m.text}
              </span>
            </div>
          ))}
          {pending && (
            <div className="text-left">
              <span className="inline-block rounded-2xl px-3 py-1.5 text-[14px] text-realm-muted">
                <span className="animate-blink">…</span> the traveler considers
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Keep keys local so world/dialog handlers don't also react.
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            maxLength={280}
            disabled={pending}
            placeholder="Ask about Darshit's work…"
            className="flex-1 rounded-xl border border-realm-edge bg-realm-bg/70 px-3 py-2 text-[14px] text-realm-text outline-none placeholder:text-realm-muted/60 focus:border-realm-gold disabled:opacity-60"
          />
          <button
            onClick={() => void submit()}
            disabled={pending || !draft.trim()}
            className="btn-primary text-sm disabled:opacity-40"
          >
            Ask
            <ArrowRightIcon width={15} height={15} />
          </button>
          <button onClick={close} className="btn-ghost text-sm">
            Farewell
          </button>
        </div>
      </div>
    </div>
  );
}
