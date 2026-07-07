import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { TAVERN_CHATTER, TAVERN_TRAVELERS, type Traveler } from "../data/travelers";
import { INTERIOR_ROOMS } from "../data/interiors";
import { rigConfig } from "../data/rigs";
import { useGameStore } from "../store/useGameStore";
import CharacterRig, { makeRigCtrl } from "./CharacterRig";
import { useNear } from "./useNear";

/**
 * Tavern travelers (P2) — a few figures resting in the tavern interior whose
 * ambient chatter is fully BAKED (the curated exchange in data/travelers.ts,
 * cycled client-side, zero API). One of them is the worldly traveler the player
 * can question; that Q&A lives in the DOM overlay (TravelerChat), not here.
 *
 * The chatter clock only runs while the player is actually in the tavern, and
 * pauses while the Q&A overlay is open — so it costs nothing off-screen.
 */
const CHATTER_MS = 4800;

export default function TavernTravelers() {
  const tavern = INTERIOR_ROOMS.find((r) => r.kind === "tavern");
  const inTavern = useNear(tavern?.center[0] ?? 160, tavern?.center[1] ?? 60, 18);
  const reduced = useGameStore((s) => s.reducedMotion);
  const chatOpen = useGameStore((s) => s.activeTraveler != null);

  // Advance the baked exchange only while the player is here and not chatting.
  const [step, setStep] = useState(0);
  const active = inTavern && !chatOpen;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setStep((s) => s + 1), CHATTER_MS);
    return () => window.clearInterval(id);
  }, [active]);

  const current = active ? TAVERN_CHATTER[step % TAVERN_CHATTER.length] : null;

  return (
    <group>
      {TAVERN_TRAVELERS.map((t) => (
        <TravelerFigure
          key={t.id}
          traveler={t}
          reduced={reduced}
          bubble={current?.speaker === t.id ? current.text : null}
        />
      ))}
    </group>
  );
}

function TravelerFigure({
  traveler,
  reduced,
  bubble,
}: {
  traveler: Traveler;
  reduced: boolean;
  bubble: string | null;
}) {
  const ctrl = useRef(makeRigCtrl(traveler.facing));
  const near = useGameStore(
    (s) => s.nearby?.kind === "traveler" && s.nearby.id === traveler.id,
  );
  const marker = useRef<import("three").Group>(null);
  const config = useMemo(() => rigConfig(traveler.rigId), [traveler.rigId]);

  return (
    <group position={[traveler.position[0], 0, traveler.position[1]]}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.6, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      <CharacterRig config={config} ctrl={ctrl.current} />

      {/* interact marker — every traveler is chattable */}
      <group ref={marker} position={[0, 2.9, 0]}>
        <mesh scale={near ? 1.3 : 1}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={traveler.accent}
            emissive={traveler.accent}
            emissiveIntensity={near ? 2 : 1.1}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* baked ambient speech bubble */}
      {bubble && (
        <Html
          position={[0, 3.4, 0]}
          center
          distanceFactor={22}
          pointerEvents="none"
          zIndexRange={[18, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            className={reduced ? "" : "agent-bubble-in"}
            style={{
              maxWidth: 210,
              whiteSpace: "normal",
              textAlign: "center",
              borderRadius: 10,
              border: `1px solid ${traveler.accent}55`,
              background: "rgba(10,12,18,0.9)",
              color: "#eef2fb",
              padding: "6px 10px",
              fontSize: 12.5,
              lineHeight: 1.3,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ color: traveler.accent, fontWeight: 700, fontSize: 10.5, marginBottom: 2 }}>
              {traveler.name}
            </div>
            {bubble}
          </div>
        </Html>
      )}
    </group>
  );
}
