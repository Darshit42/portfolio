import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { npcById } from "../data/npcs";
import { travelerById } from "../data/travelers";
import { projectById } from "../data/projects";
import { FEATURES } from "../data/config";
import { askAgent } from "../agents/ask";
import { useTts } from "./tts";
import { ArrowRightIcon } from "./icons";

/**
 * In-character chat with any NPC or traveler. The player types; the character
 * answers via Gemini through our backend (grounded in the KB, key server-side).
 * The opening line is the NPC's authored greeting; every reply after is live.
 * If the backend can't be reached, we show an HONEST system note — never a
 * fake in-character canned reply.
 */
interface Msg {
  role: "npc" | "player" | "system";
  text: string;
}

function systemNote(reason: string | undefined, name: string): string {
  switch (reason) {
    case "rate":
      return `— ${name} needs a breath; you're asking faster than the wire allows. —`;
    case "disabled":
    case "offline":
    case "no_kb":
      return `— ${name} is silent: the realm's server isn't answering (no key/KB). —`;
    default:
      return `— you can't reach ${name} right now. Is the realm's server (apps/server) running? —`;
  }
}

export default function NpcChat() {
  const travelerId = useGameStore((s) => s.activeTraveler);
  const npcId = useGameStore((s) => s.activeDialog);
  const close = useGameStore((s) => s.closeOverlay);
  const openGuild = useGameStore((s) => s.openGuild);
  const openCodex = useGameStore((s) => s.openCodex);
  const openSpire = useGameStore((s) => s.openSpire);
  const tts = useTts();

  // Resolve whichever agent is active — a traveler or a fixed NPC.
  const npc = npcId ? npcById(npcId) : undefined;
  const traveler = travelerId ? travelerById(travelerId) : undefined;
  const agentId = travelerId ?? npcId ?? "";
  const name = traveler?.name ?? npc?.name ?? "Someone";
  const accent = traveler?.accent ?? npc?.accent ?? "#9b8cff";
  const intro = traveler?.intro ?? npc?.lines?.[0]?.text ?? "";
  const speaks = npc?.speaks && FEATURES.tts;

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Seed the greeting whenever a (new) agent opens.
  useEffect(() => {
    if (!agentId) return;
    setMsgs(intro ? [{ role: "npc", text: intro }] : []);
    setDraft("");
    setPending(false);
    if (speaks && intro) tts.speak(intro);
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending]);

  if (!agentId) return null;

  const submit = async () => {
    const q = draft.trim();
    if (!q || pending) return;
    setMsgs((m) => [...m, { role: "player", text: q }]);
    setDraft("");
    setPending(true);
    const res = await askAgent(agentId, q);
    if (res.ok && res.answer) {
      setMsgs((m) => [...m, { role: "npc", text: res.answer! }]);
      if (speaks) tts.speak(res.answer);
    } else {
      setMsgs((m) => [...m, { role: "system", text: systemNote(res.reason, name) }]);
    }
    setPending(false);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  const guildId = npc?.categoryId;
  const project = npc?.projectId ? projectById(npc.projectId) : undefined;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 animate-fade-in">
      <div
        className="panel w-full max-w-2xl rounded-2xl p-5 shadow-panel"
        style={{ boxShadow: `inset 0 3px 0 ${accent}, 0 10px 40px -12px #000` }}
      >
        <div className="mb-2 font-display text-lg font-bold" style={{ color: accent }}>
          {name}
        </div>

        <div ref={logRef} className="scroll-thin mb-3 max-h-56 space-y-2 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "player" ? "text-right" : "text-left"}>
              {m.role === "system" ? (
                <span className="text-[12px] italic text-realm-muted/70">{m.text}</span>
              ) : (
                <span
                  className="inline-block max-w-[85%] rounded-2xl px-3 py-1.5 text-[14px] leading-relaxed"
                  style={
                    m.role === "player"
                      ? { background: "rgba(255,255,255,0.08)", color: "#e6ebf5" }
                      : { background: `${accent}1a`, color: "#eef2fb" }
                  }
                >
                  {m.text}
                </span>
              )}
            </div>
          ))}
          {pending && (
            <div className="text-left">
              <span className="inline-block rounded-2xl px-3 py-1.5 text-[14px] text-realm-muted">
                <span className="animate-blink">…</span> {name} considers
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            maxLength={280}
            disabled={pending}
            placeholder={`Ask ${name} anything…`}
            className="min-w-[10rem] flex-1 rounded-xl border border-realm-edge bg-realm-bg/70 px-3 py-2 text-[14px] text-realm-text outline-none placeholder:text-realm-muted/60 focus:border-realm-gold disabled:opacity-60"
          />
          <button
            onClick={() => void submit()}
            disabled={pending || !draft.trim()}
            className="btn-primary text-sm disabled:opacity-40"
          >
            Ask
            <ArrowRightIcon width={15} height={15} />
          </button>

          {/* character-specific shortcuts, kept alongside the chat */}
          {npc?.opensSpire && (
            <button onClick={(e) => { e.stopPropagation(); openSpire(); }} className="btn-ghost text-sm">
              Read the Chronicle
            </button>
          )}
          {guildId && (
            <button onClick={(e) => { e.stopPropagation(); openGuild(guildId); }} className="btn-ghost text-sm">
              Browse the guild
            </button>
          )}
          {project && (
            <button onClick={(e) => { e.stopPropagation(); openCodex(project.id); }} className="btn-ghost text-sm">
              Open the project
            </button>
          )}
          <button onClick={close} className="btn-ghost text-sm">
            Farewell
          </button>
        </div>
      </div>
    </div>
  );
}
