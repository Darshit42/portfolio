import { BUILDINGS } from "../data/buildings";
import { projectByBuilding } from "../data/projects";
import { selectGateOpen, useGameStore } from "../store/useGameStore";
import Modal from "./Modal";

/** Fast-travel menu (F8). Jump to any building, the Tavern, or the Gate. */
export default function FastTravel() {
  const close = useGameStore((s) => s.closeOverlay);
  const requestTravel = useGameStore((s) => s.requestTravel);
  const found = useGameStore((s) => s.foundRelics);
  const gateOpen = useGameStore(selectGateOpen);

  return (
    <Modal title="Fast Travel" subtitle="Jump anywhere in the realm" accent="#6ad0ff" onClose={close} maxWidth="max-w-lg">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BUILDINGS.map((b) => {
          const project = projectByBuilding(b.id);
          const claimed = project ? found.has(project.id) : false;
          const locked = b.kind === "gate" && !gateOpen;
          const sub = project
            ? project.oneLiner
            : b.kind === "gate"
              ? gateOpen
                ? "Open — reach out"
                : "Locked until 6/6"
              : "Hub & spawn point";
          return (
            <button
              key={b.id}
              onClick={() => requestTravel(b.approach)}
              className="flex items-center gap-3 rounded-xl border border-realm-edge bg-realm-panelHi/40 px-3 py-2.5 text-left transition hover:border-realm-gold/50"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold"
                style={{ background: `${b.accent}22`, border: `1px solid ${b.accent}`, color: b.accent }}
              >
                {claimed ? "✓" : locked ? "🔒" : "›"}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-semibold text-realm-text">{b.label}</span>
                <span className="block truncate text-xs text-realm-muted">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
