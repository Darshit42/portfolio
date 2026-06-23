import { projectById } from "../data/projects";
import { categoryById } from "../data/categories";
import { FEATURES } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";
import ForgeDemo from "./ForgeDemo";
import { ProjectLinks, StackTags, TierBadge } from "./common";
import { useTts } from "./tts";
import { VolumeIcon, MuteIcon, SwordIcon, ArrowRightIcon } from "./icons";

/** Per-project Codex panel (F6). The flagship also embeds the live Forge demo.
 *  Reached from a guild list (with a "back" affordance) or straight from an NPC. */
export default function CodexModal() {
  const id = useGameStore((s) => s.activeCodex);
  const activeForge = useGameStore((s) => s.activeForge);
  const guildId = useGameStore((s) => s.activeGuild);
  const close = useGameStore((s) => s.closeOverlay);
  const backToGuild = useGameStore((s) => s.backToGuild);

  const startArena = useGameStore((s) => s.startArena);
  const tts = useTts();
  const project = id ? projectById(id) : undefined;
  const guild = guildId ? categoryById(guildId) : undefined;
  if (!project) return null;

  const canEnterArena = FEATURES.combat && project.arena === true;

  const showForge = activeForge || project.demo?.type === "forge-live";
  // The Oracle speaks (F21): a project flagged `speaks` can read its blurb aloud.
  const oracleSpeaks = FEATURES.tts && tts.supported && project.speaks === true;

  return (
    <Modal
      title={project.name}
      subtitle={project.oneLiner}
      accent={project.accent}
      onClose={close}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TierBadge tier={project.tier} />
          <ProjectLinks project={project} />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {guild && (
          <button
            onClick={backToGuild}
            className="-mt-1 flex w-fit items-center gap-1.5 text-xs font-semibold text-realm-muted transition hover:text-realm-gold"
          >
            <ArrowRightIcon width={14} height={14} className="rotate-180" />
            {guild.guildName}
          </button>
        )}

        {showForge && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-realm-muted">
              Live demo
            </div>
            <ForgeDemo />
          </div>
        )}

        <p className="text-[15px] leading-relaxed text-realm-text/90">{project.blurb}</p>

        {oracleSpeaks && (
          <button
            onClick={() => (tts.speaking ? tts.stop() : tts.speak(project.blurb))}
            className="btn-ghost w-fit text-sm"
            style={{ borderColor: `${project.accent}66` }}
          >
            {tts.speaking ? <MuteIcon width={16} height={16} /> : <VolumeIcon width={16} height={16} />}
            {tts.speaking ? "Stop the Oracle" : "Hear the Oracle speak"}
          </button>
        )}

        {canEnterArena && (
          <button
            onClick={() => startArena()}
            className="btn-ghost w-fit text-sm"
            style={{ borderColor: `${project.accent}66`, color: project.accent }}
          >
            <SwordIcon width={16} height={16} />
            Enter the Arena — survive the waves
          </button>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-realm-muted">Stack</h3>
          <StackTags stack={project.stack} />
        </div>
      </div>
    </Modal>
  );
}
