import { selectGateOpen, useGameStore } from "../store/useGameStore";
import { isTouchDevice } from "../game/webgl";
import { ArrowRightIcon } from "./icons";

/** Floating proximity prompt (F5) — also the tap-to-interact target on touch. */
export default function InteractPrompt() {
  const nearby = useGameStore((s) => s.nearby);
  const trigger = useGameStore((s) => s.triggerInteract);
  const gateOpen = useGameStore(selectGateOpen);

  if (!nearby) return null;
  const touch = isTouchDevice();
  const gateLocked = nearby.kind === "gate" && !gateOpen;

  return (
    <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2 animate-fade-in">
      {gateLocked ? (
        <div className="panel rounded-full px-4 py-2 text-sm text-realm-muted">
          🔒 Earn every guild sigil to open the Gate
        </div>
      ) : (
        <button onClick={trigger} className="btn-primary pointer-events-auto rounded-full px-5 py-2.5 shadow-glow shadow-realm-gold/40">
          {touch ? (
            <span className="font-semibold">Tap</span>
          ) : (
            <kbd className="rounded border border-realm-bg/30 bg-realm-bg/20 px-1.5 py-0.5 font-mono text-xs font-semibold">
              E
            </kbd>
          )}
          <span>{nearby.prompt}</span>
          <ArrowRightIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
}
