import { projectById } from "../data/projects";
import { FEATURES } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";
import ForgeDemo from "./ForgeDemo";
import { ProjectLinks, StackTags, TierBadge } from "./common";
import { useTts } from "./tts";
import { VolumeIcon, MuteIcon } from "./icons";

/** Per-project Codex panel (F6). The flagship also embeds the live Forge demo. */
export default function CodexModal() {
  const id = useGameStore((s) => s.activeCodex);
  const activeForge = useGameStore((s) => s.activeForge);
  const close = useGameStore((s) => s.closeOverlay);

  const tts = useTts();
  const project = id ? projectById(id) : undefined;
  if (!project) return null;

  const showForge = activeForge || project.demo?.type === "forge-live";
  // The Oracle speaks (F21): the voice-agent project can read its blurb aloud.
  const oracleSpeaks = FEATURES.tts && tts.supported && project.building === "oracles-booth";

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

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-realm-muted">Stack</h3>
          <StackTags stack={project.stack} />
        </div>
      </div>
    </Modal>
  );
}
