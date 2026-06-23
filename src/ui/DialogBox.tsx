import { useEffect, useRef, useState } from "react";
import { FEATURES } from "../data/config";
import { npcById } from "../data/npcs";
import { projectById } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import { useTts } from "./tts";
import { ArrowRightIcon } from "./icons";

/** NPC dialog (F16): typed lines, advance on key/tap, branch into the Codex.
 *  The Oracle (speaks) also reads each line aloud (F21). */
export default function DialogBox() {
  const npcId = useGameStore((s) => s.activeDialog);
  const close = useGameStore((s) => s.closeOverlay);
  const openCodex = useGameStore((s) => s.openCodex);
  const openGuild = useGameStore((s) => s.openGuild);
  const tts = useTts();

  const npc = npcId ? npcById(npcId) : undefined;
  const [lineIdx, setLineIdx] = useState(0);
  const [shown, setShown] = useState("");
  const typing = useRef(false);

  const line = npc?.lines[lineIdx]?.text ?? "";
  const isLast = npc ? lineIdx >= npc.lines.length - 1 : true;
  // A guild master opens its whole Codex list; a lone NPC points at one project.
  const guildId = npc?.categoryId;
  const project = npc?.projectId ? projectById(npc.projectId) : undefined;

  // Reset on NPC change.
  useEffect(() => {
    setLineIdx(0);
  }, [npcId]);

  // Typewriter + optional TTS per line.
  useEffect(() => {
    if (!npc || !line) return;
    const reduced = useGameStore.getState().reducedMotion;
    if (npc.speaks && FEATURES.tts) tts.speak(line);

    if (reduced) {
      setShown(line);
      typing.current = false;
      return;
    }
    setShown("");
    typing.current = true;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setShown(line.slice(0, i));
      if (i >= line.length) {
        window.clearInterval(id);
        typing.current = false;
      }
    }, 22);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  const advance = () => {
    if (typing.current) {
      setShown(line); // first tap completes the line
      typing.current = false;
      return;
    }
    if (!isLast) setLineIdx((i) => i + 1);
    else close();
  };

  // Keyboard advance (Enter / Space / E).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "enter" || k === " " || k === "e") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!npc) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 animate-fade-in" onClick={advance}>
      <div
        className="panel w-full max-w-2xl rounded-2xl p-5 shadow-panel"
        style={{ boxShadow: `inset 0 3px 0 ${npc.accent}, 0 10px 40px -12px #000` }}
      >
        <div className="mb-2 font-display text-lg font-bold" style={{ color: npc.accent }}>
          {npc.name}
        </div>
        <p className="min-h-[3.5rem] text-[15px] leading-relaxed text-realm-text/90">
          {shown}
          {typing.current && <span className="animate-blink">▌</span>}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {guildId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openGuild(guildId);
              }}
              className="btn-ghost text-sm"
            >
              Enter the guild
              <ArrowRightIcon width={15} height={15} />
            </button>
          ) : (
            project && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCodex(project.id);
                }}
                className="btn-ghost text-sm"
              >
                Tell me more
                <ArrowRightIcon width={15} height={15} />
              </button>
            )
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
            className="btn-primary text-sm"
          >
            {isLast ? "Farewell" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
