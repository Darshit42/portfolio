import { PROJECTS, TOTAL_RELICS } from "../data/projects";
import { questHint } from "../data/quests";
import { useGameStore } from "../store/useGameStore";
import { RelicIcon } from "./icons";

/** Relic tracker + main-quest hint (F7). Top-left, non-blocking. */
export default function HUD() {
  const found = useGameStore((s) => s.foundRelics);
  const n = found.size;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2 animate-fade-in">
      <div className="panel pointer-events-auto rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-realm-gold">
          <RelicIcon width={18} height={18} />
          <span className="font-display text-sm font-semibold">
            {n} / {TOTAL_RELICS} relics
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {PROJECTS.map((p) => (
            <span
              key={p.id}
              title={p.name}
              className="h-1.5 w-5 rounded-full transition-colors"
              style={{ background: found.has(p.id) ? p.accent : "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>
      </div>
      <div className="panel max-w-[260px] rounded-lg px-3 py-1.5 text-xs text-realm-muted">
        {questHint(n)}
      </div>
    </div>
  );
}
