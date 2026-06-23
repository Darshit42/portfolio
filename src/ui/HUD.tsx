import { CATEGORIES, TOTAL_SIGILS } from "../data/categories";
import { questHint } from "../data/quests";
import { FEATURES } from "../data/config";
import { ARENA_WAVES, useGameStore } from "../store/useGameStore";
import { RelicIcon } from "./icons";

/** Sigil tracker + main-quest hint (F7) + health/arena (combat). Top-left. */
export default function HUD() {
  const sigils = useGameStore((s) => s.sigils);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const arenaActive = useGameStore((s) => s.arenaActive);
  const arenaWave = useGameStore((s) => s.arenaWave);
  const coins = useGameStore((s) => s.coins);
  const n = sigils.size;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2 animate-fade-in">
      <div className="panel pointer-events-auto rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-realm-gold">
          <RelicIcon width={18} height={18} />
          <span className="font-display text-sm font-semibold">
            {n} / {TOTAL_SIGILS} sigils
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              title={c.guildName}
              className="h-1.5 w-5 rounded-full transition-colors"
              style={{ background: sigils.has(c.id) ? c.accent : "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>
      </div>
      {FEATURES.combat && (
        <div className="panel pointer-events-auto flex items-center gap-1.5 rounded-lg px-3 py-2">
          {Array.from({ length: maxHealth }, (_, i) => (
            <Heart key={i} full={i < health} />
          ))}
          {arenaActive && (
            <span className="ml-1 font-mono text-xs font-semibold text-realm-ember">
              Arena {arenaWave}/{ARENA_WAVES}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 font-mono text-xs font-semibold text-realm-gold">
            🪙 {coins.toLocaleString()}
          </span>
        </div>
      )}

      <div className="panel max-w-[260px] rounded-lg px-3 py-1.5 text-xs text-realm-muted">
        {questHint(n)}
      </div>
    </div>
  );
}

function Heart({ full }: { full: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-7-4.6-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.4 12 21 12 21Z"
        fill={full ? "#ff5470" : "transparent"}
        stroke={full ? "#ff5470" : "#4a3550"}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}
