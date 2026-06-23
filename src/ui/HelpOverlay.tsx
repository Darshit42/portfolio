import { FEATURES, WORLD_NAME } from "../data/config";
import { TOTAL_SIGILS } from "../data/categories";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";

/** Controls + settings + about (F: controls discoverability). Device-aware. */
export default function HelpOverlay({ touch }: { touch: boolean }) {
  const toggleHelp = useGameStore((s) => s.toggleHelp);
  const openRecruiter = useGameStore((s) => s.openRecruiter);
  const reducedMotion = useGameStore((s) => s.reducedMotion);
  const setReducedMotion = useGameStore((s) => s.setReducedMotion);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const controls: [string, string][] = touch
    ? [
        ["Move", "Drag the joystick (bottom-left)"],
        ["Inspect", "Tap a glowing building, then the prompt"],
        ...(FEATURES.combat ? ([["Attack", "Tap the sword button (bottom-right)"]] as [string, string][]) : []),
        ...(FEATURES.combat ? ([["Inventory", "Tap the bag icon (top-right)"]] as [string, string][]) : []),
        ["Map", "Tap the map icon (top-right)"],
        ["Help", "Tap the “?” icon"],
      ]
    : [
        ["Move", "W A S D or arrow keys"],
        ["Inspect", "E or Enter at a guild"],
        ...(FEATURES.combat ? ([["Attack", "Space — swat the bugs"]] as [string, string][]) : []),
        ...(FEATURES.combat ? ([["Inventory", "I or B"]] as [string, string][]) : []),
        ["Fast travel", "M"],
        ["Help", "?"],
        ["Pause / close", "Esc"],
      ];

  return (
    <Modal title="How to play" subtitle={WORLD_NAME} onClose={toggleHelp} maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-realm-muted">
          Walk the realm and step into each glowing guild to browse its projects and claim its sigil. Earn all{" "}
          {TOTAL_SIGILS} guild sigils to open the Gate of Contact to the south.
        </p>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {controls.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-realm-edge/60 py-1.5">
              <dt className="font-display text-sm font-semibold text-realm-text">{k}</dt>
              <dd className="text-right text-sm text-realm-muted">{v}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-realm-muted">Settings</h3>
          <div className="flex flex-col gap-1.5">
            <SettingToggle
              label="Reduced motion"
              hint="Calms camera, particles & idle animation"
              on={reducedMotion}
              onToggle={() => setReducedMotion(!reducedMotion)}
            />
            {FEATURES.audio && (
              <SettingToggle
                label="Sound"
                hint="Ambient drone + relic chimes"
                on={!muted}
                onToggle={toggleMute}
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-realm-edge bg-realm-panelHi/40 px-4 py-3 text-sm text-realm-muted">
          In a hurry?{" "}
          <button onClick={openRecruiter} className="font-semibold text-realm-gold underline-offset-2 hover:underline">
            Recruiter mode
          </button>{" "}
          drops you into a clean index of every project, résumé, and contact — no game required.
        </div>
      </div>
    </Modal>
  );
}

function SettingToggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left transition hover:bg-realm-panelHi/40"
    >
      <span>
        <span className="block text-sm font-medium text-realm-text">{label}</span>
        <span className="block text-xs text-realm-muted">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-realm-gold" : "bg-realm-edge"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-realm-bg transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}
