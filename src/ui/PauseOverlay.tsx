import { WORLD_NAME } from "../data/config";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";
import { CompassIcon } from "./icons";

/** Pause screen (Esc). Generous exits — never traps the visitor. */
export default function PauseOverlay() {
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const openRecruiter = useGameStore((s) => s.openRecruiter);
  const setMode = useGameStore((s) => s.setMode);

  return (
    <Modal title="Paused" subtitle={WORLD_NAME} onClose={togglePause} maxWidth="max-w-sm">
      <div className="flex flex-col gap-2.5 py-1">
        <button onClick={togglePause} className="btn-primary w-full py-3">
          <CompassIcon width={18} height={18} /> Resume
        </button>
        <button onClick={openRecruiter} className="btn-ghost w-full py-3">
          Recruiter mode (project index)
        </button>
        <button onClick={toggleHelp} className="btn-ghost w-full py-3">
          How to play
        </button>
        <button onClick={() => setMode("title")} className="btn-ghost w-full py-3">
          Back to title
        </button>
      </div>
    </Modal>
  );
}
