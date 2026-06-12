/** A "bug" enemy — a squat, glaring little creature built from primitives.
 *  Presentational only; its parent group is moved by the <Enemies> simulation. */
export default function Bug({ accent = "#ff5470" }: { accent?: string }) {
  return (
    <group>
      {/* shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.55, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
      {/* carapace */}
      <mesh position={[0, 0.5, 0]} scale={[1, 0.7, 1.2]} castShadow>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#2a1230" flatShading />
      </mesh>
      {/* eyes */}
      <mesh position={[0.22, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[-0.22, 0.62, 0.5]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* legs */}
      {[-0.45, 0.45].map((x) =>
        [-0.2, 0.2].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.18, z]} rotation-z={x > 0 ? -0.5 : 0.5} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
            <meshStandardMaterial color="#160a1a" />
          </mesh>
        )),
      )}
    </group>
  );
}
