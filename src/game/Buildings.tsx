import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { BUILDINGS } from "../data/buildings";
import { projectByBuilding } from "../data/projects";
import { useGameStore, selectGateOpen } from "../store/useGameStore";
import BuildingMesh from "./BuildingMesh";
import RelicMonument from "./RelicMonument";
import { useNear } from "./useNear";

/** Places every building + its relic monument from data. Adding a building is a
 *  data edit in buildings.ts — this component never changes.
 *
 *  Each mesh is modeled with its front at local +z and rotated here to face its
 *  approach point. All computed yaws are multiples of 90°, and the only
 *  90°-rotated footprints are square, so axis-aligned collision stays exact. */
export default function Buildings() {
  const placements = useMemo(
    () =>
      BUILDINGS.map((b) => {
        const project = projectByBuilding(b.id);
        const dx = b.position[0] - b.approach[0];
        const dz = b.position[1] - b.approach[1];
        const len = Math.hypot(dx, dz) || 1;
        // Gem sits just outside the door: from the approach point, a step
        // toward the building center.
        const gem: [number, number] = [
          b.approach[0] + (dx / len) * 2.2,
          b.approach[1] + (dz / len) * 2.2,
        ];
        // Face the front (+z) toward the approach.
        const yaw = b.rotationY ?? Math.atan2(b.approach[0] - b.position[0], b.approach[1] - b.position[1]);
        return { b, project, gem, yaw };
      }),
    [],
  );

  return (
    <group>
      {placements.map(({ b, project, gem, yaw }) => (
        <group key={b.id}>
          <group position={[b.position[0], 0, b.position[1]]} rotation-y={yaw}>
            <BuildingMesh kind={b.kind} accent={b.accent} />
          </group>

          {project && (
            <RelicMonument
              position={gem}
              accent={project.accent}
              projectId={project.id}
              label={b.label}
            />
          )}

          {b.kind === "tavern" && <StructureLabel position={b.position} label={b.label} accent={b.accent} />}
          {b.kind === "gate" && <GateLabel position={b.position} label={b.label} />}
        </group>
      ))}
    </group>
  );
}

function StructureLabel({
  position,
  label,
  accent,
}: {
  position: [number, number];
  label: string;
  accent: string;
}) {
  const near = useNear(position[0], position[1], 14);
  return (
    <Html
      position={[position[0], 7.6, position[1]]}
      center
      distanceFactor={30}
      pointerEvents="none"
      style={{ pointerEvents: "none", userSelect: "none", opacity: near ? 1 : 0, transition: "opacity 0.3s" }}
      zIndexRange={[10, 0]}
    >
      <div
        className="whitespace-nowrap rounded-md border border-white/10 bg-realm-bg/70 px-2 py-0.5 font-display text-[13px] font-semibold"
        style={{ color: accent }}
      >
        {label}
      </div>
    </Html>
  );
}

function GateLabel({ position, label }: { position: [number, number]; label: string }) {
  const open = useGameStore(selectGateOpen);
  const near = useNear(position[0], position[1], 16);
  return (
    <Html
      position={[position[0], 10, position[1]]}
      center
      distanceFactor={32}
      pointerEvents="none"
      style={{ pointerEvents: "none", userSelect: "none", opacity: near ? 1 : 0, transition: "opacity 0.3s" }}
      zIndexRange={[10, 0]}
    >
      <div
        className="whitespace-nowrap rounded-md border px-2 py-0.5 font-display text-[13px] font-semibold"
        style={{
          borderColor: open ? "#6ad0ff" : "rgba(255,255,255,0.1)",
          color: open ? "#6ad0ff" : "#9aa6bf",
          background: "rgba(10,12,18,0.7)",
        }}
      >
        {open ? "✦ " : "🔒 "}
        {label}
      </div>
    </Html>
  );
}
