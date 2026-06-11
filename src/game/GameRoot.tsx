import { useMemo } from "react";
import World from "./World";
import { useKeyboardControls } from "./useControls";
import { isTouchDevice } from "./webgl";
import { useGameStore } from "../store/useGameStore";
import { FEATURES } from "../data/config";
import HUD from "../ui/HUD";
import TopBar from "../ui/TopBar";
import InteractPrompt from "../ui/InteractPrompt";
import CodexModal from "../ui/CodexModal";
import ContactModal from "../ui/ContactModal";
import FastTravel from "../ui/FastTravel";
import HelpOverlay from "../ui/HelpOverlay";
import PauseOverlay from "../ui/PauseOverlay";
import Joystick from "../ui/Joystick";
import ControlsHint from "../ui/ControlsHint";
import Minimap from "../ui/Minimap";
import Toasts from "../ui/Toasts";
import AudioManager from "../audio/AudioManager";

/**
 * Composition root for a world-family mode: the 3D <World> canvas plus the DOM
 * overlay layer. Owns keyboard handling and routes UI by store mode. The canvas
 * sits underneath; all UI is DOM (never drawn in WebGL).
 */
export default function GameRoot() {
  const mode = useGameStore((s) => s.mode);
  const activeGate = useGameStore((s) => s.activeGate);
  const touch = useMemo(() => isTouchDevice(), []);

  // Stable handlers — read fresh state via getState so the effect never re-binds.
  const keyOpts = useMemo(
    () => ({
      onInteract: () => {
        const s = useGameStore.getState();
        if (s.mode === "playing") s.triggerInteract();
      },
      onToggleMap: () => {
        const s = useGameStore.getState();
        if (s.mode === "playing") s.setMode("fasttravel");
        else if (s.mode === "fasttravel") s.closeOverlay();
      },
      onToggleHelp: () => useGameStore.getState().toggleHelp(),
      onPause: () => {
        const s = useGameStore.getState();
        switch (s.mode) {
          case "codex":
          case "dialog":
          case "fasttravel":
            s.closeOverlay();
            break;
          case "help":
            s.toggleHelp();
            break;
          case "playing":
          case "paused":
            s.togglePause();
            break;
        }
      },
      onAttack: () => {
        if (!FEATURES.combat) return;
        // combat handled in M2
      },
    }),
    [],
  );

  useKeyboardControls(keyOpts);

  const overlayUp = mode === "codex" || mode === "dialog" || mode === "fasttravel" || mode === "help" || mode === "paused";

  return (
    <div className="relative h-full w-full overflow-hidden bg-realm-bg">
      <div className="absolute inset-0">
        <World />
      </div>

      {/* persistent UI */}
      <TopBar />
      <HUD />
      {FEATURES.minimap && <Minimap />}
      {FEATURES.audio && <AudioManager />}
      <Toasts />

      {/* contextual */}
      {mode === "playing" && <InteractPrompt />}
      {touch && !overlayUp && <Joystick />}
      <ControlsHint touch={touch} />

      {/* overlays */}
      {mode === "codex" && (activeGate ? <ContactModal /> : <CodexModal />)}
      {mode === "fasttravel" && <FastTravel />}
      {mode === "help" && <HelpOverlay touch={touch} />}
      {mode === "paused" && <PauseOverlay />}
    </div>
  );
}
