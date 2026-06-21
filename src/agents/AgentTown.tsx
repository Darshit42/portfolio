import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import CharacterRig from "../game/CharacterRig";
import Npcs from "../game/Npcs";
import { rigConfig } from "../data/rigs";
import { useGameStore } from "../store/useGameStore";
import { useAgentStore } from "./agentStore";
import { runtime } from "./runtime";
import type { SimDocument } from "./types";

/**
 * Agent Town — replaces the static <Npcs> with living, replayed agents when
 * FEATURES.agentTown is on. Loads the baked log, drives every agent's rig from
 * the runtime each frame, and lets the player click an agent to inspect its
 * mind. If the log is missing or malformed, it silently falls back to the
 * static NPCs (R8.8 / R15.1) so the town is never broken.
 */
export default function AgentTown() {
  const ready = useAgentStore((s) => s.ready);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}sim-logs/default.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`sim-log ${r.status}`);
        return r.json();
      })
      .then((doc: SimDocument) => {
        if (!alive) return;
        if (!doc?.meta?.agents?.length) throw new Error("empty sim-log");
        runtime.load(doc);
      })
      .catch((e) => {
        console.warn("[AgentTown] replay unavailable, using static NPCs:", e);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return <Npcs />; // graceful degradation
  if (!ready) return null;
  return <AgentScene />;
}

function AgentScene() {
  const refs = useRef(new Map<string, Group>());
  const agents = runtime.agentList();

  // Single driver: advance the sim once per frame, then push positions to rigs.
  useFrame((_, delta) => {
    runtime.advance(delta);
    refs.current.forEach((grp, id) => {
      const p = runtime.posOf(id);
      if (p) {
        grp.position.x = p[0];
        grp.position.z = p[1];
      }
    });
  });

  return (
    <group>
      {agents.map((a) => (
        <AgentFigure
          key={a.id}
          id={a.id}
          register={(g) => {
            if (g) refs.current.set(a.id, g);
            else refs.current.delete(a.id);
          }}
        />
      ))}
    </group>
  );
}

function AgentFigure({ id, register }: { id: string; register: (g: Group | null) => void }) {
  const reduced = useGameStore((s) => s.reducedMotion);
  const open = useAgentStore((s) => s.openInspector);
  const inspecting = useAgentStore((s) => s.inspectorId === id);
  const [hover, setHover] = useState(false);
  const marker = useRef<Group>(null);
  const ctrl = runtime.ctrlOf(id)!;
  const accent = markerAccent(id);
  const bubble = useAgentStore((s) => s.bubbles.find((b) => b.agentId === id));
  const flash = useAgentStore((s) => s.flashes.find((f) => f.agentId === id));

  useFrame((state) => {
    if (marker.current && !reduced) {
      const t = state.clock.elapsedTime;
      marker.current.position.y = 2.95 + Math.sin(t * 2 + id.length) * 0.1;
      marker.current.rotation.y = t * 1.1;
    }
  });

  return (
    <group ref={register}>
      {/* contact shadow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.6, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      <CharacterRig config={rigConfig(id)} ctrl={ctrl} />

      {/* speech bubble — rides the group, drei projects it to screen space */}
      {bubble && (
        <Html
          position={[0, 3.5, 0]}
          center
          distanceFactor={26}
          pointerEvents="none"
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            key={bubble.key}
            className={reduced ? "" : "agent-bubble-in"}
            style={{
              maxWidth: 190,
              whiteSpace: "normal",
              textAlign: "center",
              borderRadius: 10,
              border: `1px solid ${accent}66`,
              background: "rgba(10,12,18,0.86)",
              color: "#eef2fb",
              padding: "5px 9px",
              fontSize: 12.5,
              lineHeight: 1.25,
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ color: accent, fontWeight: 700, fontSize: 11, marginBottom: 1 }}>
              {bubble.name}
            </div>
            {bubble.text}
          </div>
        </Html>
      )}

      {/* economy flash (trade / production) */}
      {flash && (
        <Html position={[0.6, 2.4, 0]} center distanceFactor={24} pointerEvents="none" zIndexRange={[19, 0]}>
          <div
            key={flash.key}
            className={reduced ? "" : "agent-flash-in"}
            style={{
              whiteSpace: "nowrap",
              fontWeight: 800,
              fontSize: 13,
              color: flash.tone === "gain" ? "#39d98a" : flash.tone === "spend" ? "#ff7a7a" : "#ffb066",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {flash.text}
          </div>
        </Html>
      )}

      {/* clickable "inspect mind" marker */}
      <group
        ref={marker}
        position={[0, 2.95, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          open(id);
        }}
      >
        <mesh scale={hover || inspecting ? 1.4 : 1}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={hover || inspecting ? 2.4 : 1.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function markerAccent(id: string): string {
  const m: Record<string, string> = {
    barkeep: "#e8c66a",
    guildmaster: "#3aa0ff",
    oracle: "#b06cff",
    automaton: "#ff7a3c",
    merchant: "#f2b94c",
    blacksmith: "#ff6622",
    guard: "#9aa6bf",
  };
  return m[id] ?? "#8ad0ff";
}
