import { useEffect, useRef } from "react";
import { BUILDINGS, WORLD_BOUNDS } from "../data/buildings";
import { projectByBuilding } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import { playerState } from "../game/playerState";

const SIZE = 150;
const PAD = 10;
const W = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX;
const D = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ;

function toMap(x: number, z: number): [number, number] {
  const px = PAD + ((x - WORLD_BOUNDS.minX) / W) * (SIZE - PAD * 2);
  const py = PAD + ((z - WORLD_BOUNDS.minZ) / D) * (SIZE - PAD * 2);
  return [px, py];
}

/** Minimap (F19). Static building dots + a live player marker updated off-React
 *  via rAF so it never triggers re-renders. */
export default function Minimap() {
  const marker = useRef<SVGGElement>(null);
  const found = useGameStore((s) => s.foundRelics);
  const requestTravel = useGameStore((s) => s.requestTravel);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (marker.current) {
        const { x, z } = playerState.pos;
        // Hide the marker while the player is in an interior (off this map).
        const inWorld =
          x >= WORLD_BOUNDS.minX - 2 && x <= WORLD_BOUNDS.maxX + 2 && z >= WORLD_BOUNDS.minZ - 2 && z <= WORLD_BOUNDS.maxZ + 2;
        marker.current.setAttribute("visibility", inWorld ? "visible" : "hidden");
        const [px, py] = toMap(x, z);
        const deg = (playerState.facing * 180) / Math.PI;
        marker.current.setAttribute("transform", `translate(${px} ${py}) rotate(${deg})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 hidden animate-fade-in sm:block">
      <svg
        width={SIZE}
        height={SIZE}
        className="rounded-xl border border-[#4a3526] shadow-panel"
        style={{ background: "rgba(11,14,26,0.92)" }}
        role="img"
        aria-label="Map of the realm"
      >
        {/* plaza ref ring — the town hearth */}
        {(() => {
          const [cx, cy] = toMap(0, 2);
          return (
            <g>
              <circle cx={cx} cy={cy} r={9} fill="none" stroke="#6b4a2f" strokeWidth={1} />
              <circle cx={cx} cy={cy} r={2} fill="#ffaa44" opacity={0.9} />
            </g>
          );
        })()}

        {BUILDINGS.map((b) => {
          const [x, y] = toMap(b.position[0], b.position[1]);
          const project = projectByBuilding(b.id);
          const claimed = project ? found.has(project.id) : false;
          return (
            <g key={b.id} onClick={() => requestTravel(b.approach)} style={{ cursor: "pointer" }}>
              <circle
                cx={x}
                cy={y}
                r={b.kind === "gate" ? 3 : 4}
                fill={claimed ? b.accent : `${b.accent}44`}
                stroke={claimed ? b.accent : "#6b4a2f"}
                strokeWidth={1.2}
              />
            </g>
          );
        })}

        {/* player marker (live) */}
        <g ref={marker}>
          <path d="M0,-5 L3.5,4 L0,1.5 L-3.5,4 Z" fill="#ffaa44" stroke="#0b0e1a" strokeWidth={0.8} />
        </g>
      </svg>
    </div>
  );
}
