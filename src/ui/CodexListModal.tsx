import { categoryById } from "../data/categories";
import { projectsByCategory } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";
import { TierBadge } from "./common";
import { ArrowRightIcon } from "./icons";

/**
 * A guild's Codex LIST — the scalable index of every project in one category.
 * Selecting a row opens that project's detail (CodexModal). This component never
 * changes as projects are added: it just maps over projectsByCategory(). Adding
 * a project to the guild is a pure data append in projects.ts.
 */
export default function CodexListModal() {
  const guildId = useGameStore((s) => s.activeGuild);
  const close = useGameStore((s) => s.closeOverlay);
  const openCodex = useGameStore((s) => s.openCodex);

  const cat = guildId ? categoryById(guildId) : undefined;
  if (!cat) return null;
  const projects = projectsByCategory(cat.id);

  return (
    <Modal title={cat.guildName} subtitle={cat.tagline} accent={cat.accent} onClose={close} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-realm-muted">{cat.premise}</p>

        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => openCodex(p.id)}
              className="group flex items-center gap-3 rounded-xl border border-realm-edge bg-realm-panelHi/40 px-3.5 py-3 text-left transition hover:border-realm-gold/50"
              style={{ boxShadow: `inset 3px 0 0 ${p.accent}` }}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-display text-sm font-semibold text-realm-text">{p.name}</span>
                  <TierBadge tier={p.tier} />
                </span>
                <span className="mt-0.5 block truncate text-xs text-realm-muted">{p.oneLiner}</span>
              </span>
              <ArrowRightIcon
                width={16}
                height={16}
                className="shrink-0 text-realm-muted transition group-hover:translate-x-0.5 group-hover:text-realm-gold"
              />
            </button>
          ))}
        </div>

        <p className="text-center font-mono text-[11px] text-realm-muted/60">
          {projects.length} {projects.length === 1 ? "work" : "works"} enshrined here
        </p>
      </div>
    </Modal>
  );
}
