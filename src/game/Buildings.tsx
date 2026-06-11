import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { BUILDINGS } from "../data/buildings";
import { projectByBuilding } from "../data/projects";
import { useGameStore, selectGateOpen } from "../store/useGameStore";
import BuildingMesh from "./BuildingMesh";
import RelicMonument from "./RelicMonument";

/** Places every building + its relic monument from data. Adding a building is a
 *  data edit in buildings.ts — this component never changes. */
export default function Buildings() {
  const placements = useMemo(
    () =>
      BUILDINGS.map((b) => {
        const project = projectByBuilding(b.id);
        // Gem sits just outside the door: from the approach point, a step toward
        // the building center.
        const dx = b.position[0] - b.approach[0];
        const dz = b.position[1] - b.approach[1];
        const len = Math.hypot(dx, dz) || 1;
        const gem: [number, number] = [
          b.approach[0] + (dx / len) * 2.2,
          b.approach[1] + (dz / len) * 2.2,
        ];
        return { b, project, gem };
      }),
    [],
  );

  return (
    <group>
      {placements.map(({ b, project, gem }) => (
        <group key={b.id}>
          <group position={[b.position[0], 0, b.position[1]]} rotation-y={b.rotationY ?? 0}>
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
  return (
    <Html
      position={[position[0], 7.6, position[1]]}
      center
      distanceFactor={30}
      pointerEvents="none"
      style={{ pointerEvents: "none", userSelect: "none" }}
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
  return (
    <Html
      position={[position[0], 10, position[1]]}
      center
      distanceFactor={32}
      pointerEvents="none"
      style={{ pointerEvents: "none", userSelect: "none" }}
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
