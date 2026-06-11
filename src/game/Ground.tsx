import { useMemo } from "react";
import { BUILDINGS, PLAZA_CENTER, WORLD_BOUNDS } from "../data/buildings";

/**
 * The ground plane, central plaza, and stone paths linking each building's
 * approach point back to the plaza. All flat primitives — cheap and readable.
 */
export default function Ground() {
  const width = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 24;
  const depth = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 24;
  const cx = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2;
  const cz = (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) / 2;

  const paths = useMemo(() => {
    return BUILDINGS.map((b) => {
      const [ax, az] = b.approach;
      const dx = ax - PLAZA_CENTER[0];
      const dz = az - PLAZA_CENTER[1];
      const len = Math.hypot(dx, dz) + 3;
      // rotation-y that maps a box's local +Z onto (dx, dz).
      const yaw = Math.atan2(dx, dz);
      const midX = (ax + PLAZA_CENTER[0]) / 2;
      const midZ = (az + PLAZA_CENTER[1]) / 2;
      return { id: b.id, midX, midZ, len, yaw };
    });
  }, []);

  return (
    <group>
      {/* grass / earth */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, -0.02, cz]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0f1b16" />
      </mesh>

      {/* paths — thin flat boxes oriented from the plaza to each approach */}
      {paths.map((p) => (
        <mesh key={p.id} rotation-y={p.yaw} position={[p.midX, 0.0, p.midZ]} receiveShadow>
          <boxGeometry args={[3.2, 0.06, p.len]} />
          <meshStandardMaterial color="#26303f" />
        </mesh>
      ))}

      {/* central plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[PLAZA_CENTER[0], 0.01, PLAZA_CENTER[1]]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#2a3446" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[PLAZA_CENTER[0], 0.02, PLAZA_CENTER[1]]} receiveShadow>
        <ringGeometry args={[11.4, 12, 48]} />
        <meshStandardMaterial color="#3a4763" />
      </mesh>
    </group>
  );
}
