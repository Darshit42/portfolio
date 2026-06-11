import { useEffect, useRef } from "react";
import { TOTAL_RELICS } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import { resumeAudio, setMuted, sfxGate, sfxRelic, startAmbient } from "./audio";

/**
 * Bridges store state to the audio engine (F20). Renders nothing. Resumes the
 * audio context on the first user gesture (autoplay policy), keeps the master
 * gain in sync with the mute toggle, and plays SFX when relics are claimed.
 */
export default function AudioManager() {
  const muted = useGameStore((s) => s.muted);
  const found = useGameStore((s) => s.foundRelics);
  const prevCount = useRef(found.size);
  const ambientStarted = useRef(false);

  // Resume on first gesture so unmuting later is instant + policy-compliant.
  useEffect(() => {
    const onGesture = () => resumeAudio();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  useEffect(() => {
    setMuted(muted);
    if (!muted && !ambientStarted.current) {
      resumeAudio();
      startAmbient();
      ambientStarted.current = true;
    }
  }, [muted]);

  useEffect(() => {
    if (found.size > prevCount.current) {
      if (found.size >= TOTAL_RELICS) sfxGate();
      else sfxRelic();
    }
    prevCount.current = found.size;
  }, [found]);

  return null;
}
