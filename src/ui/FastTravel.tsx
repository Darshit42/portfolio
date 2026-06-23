import { BUILDINGS } from "../data/buildings";
import { categoryByBuilding } from "../data/categories";
import { selectGateOpen, useGameStore } from "../store/useGameStore";
import Modal from "./Modal";

/** Fast-travel menu (F8). Jump to any building, the Tavern, or the Gate. */
export default function FastTravel() {
  const close = useGameStore((s) => s.closeOverlay);
  const requestTravel = useGameStore((s) => s.requestTravel);
  const sigils = useGameStore((s) => s.sigils);
  const gateOpen = useGameStore(selectGateOpen);

  return (
    <Modal title="Fast Travel" subtitle="Jump anywhere in the realm" accent="#6ad0ff" onClose={close} maxWidth="max-w-lg">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BUILDINGS.map((b) => {
          const category = categoryByBuilding(b.id);
          const claimed = category ? sigils.has(category.id) : false;
          const locked = b.kind === "gate" && !gateOpen;
          const sub = category
            ? category.tagline
            : b.kind === "gate"
              ? gateOpen
                ? "Open — reach out"
                : "Locked until every sigil"
              : "Hub & spawn point";
          const title = category ? category.guildName : b.label;
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
                <span className="block truncate font-display text-sm font-semibold text-realm-text">{title}</span>
                <span className="block truncate text-xs text-realm-muted">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
