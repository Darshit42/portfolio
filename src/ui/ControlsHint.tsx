import { useEffect } from "react";
import { useGameStore } from "../store/useGameStore";

/** First-load control hint (device-aware). Auto-dismisses; never nags. */
export default function ControlsHint({ touch }: { touch: boolean }) {
  const seen = useGameStore((s) => s.hasSeenControls);
  const mark = useGameStore((s) => s.markControlsSeen);
  const mode = useGameStore((s) => s.mode);

  useEffect(() => {
    if (seen) return;
    const id = window.setTimeout(mark, 8000);
    return () => window.clearTimeout(id);
  }, [seen, mark]);

  if (seen || mode !== "playing") return null;

  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 animate-fade-in px-4">
      <div className="panel pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2 text-center text-sm text-realm-text">
        <span>
          {touch
            ? "Drag the joystick to move · tap a glowing building to inspect"
            : "WASD to move · E to inspect · Space to swat bugs · M for the map"}
        </span>
        <button onClick={mark} className="shrink-0 text-xs font-semibold text-realm-gold">
          Got it
        </button>
      </div>
    </div>
  );
}
