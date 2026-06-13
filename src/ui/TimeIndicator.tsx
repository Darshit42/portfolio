import { useEffect, useState } from "react";
import { DAY_NIGHT } from "../data/config";
import { daynight, inGameClock, segmentOf } from "../game/daynight";

const GLYPH: Record<string, string> = { night: "🌙", dawn: "🌅", day: "☀️", dusk: "🌆" };
const LABEL: Record<string, string> = { night: "Night", dawn: "Dawn", day: "Day", dusk: "Dusk" };

/** Subtle in-world clock — makes the day/night cycle legible. Own 1s tick so
 *  only this pill re-renders, not the whole HUD. */
export default function TimeIndicator() {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!DAY_NIGHT.enabled) return null;
  const seg = segmentOf(daynight.phase);

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 animate-fade-in">
      <div className="panel flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs text-realm-text/90">
        <span aria-hidden>{GLYPH[seg]}</span>
        <span className="tabular-nums">{inGameClock(daynight.phase)}</span>
        <span className="text-realm-muted">{LABEL[seg]}</span>
      </div>
    </div>
  );
}
