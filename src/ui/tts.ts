import { useEffect, useState } from "react";

/**
 * Tiny Web Speech API wrapper for the Voice Oracle (F21). Fails silently to a
 * no-op everywhere it isn't supported — it must never break the world (PRD §5).
 */
export function useTts() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [speaking, setSpeaking] = useState(false);

  const stop = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setSpeaking(false);
  };

  const speak = (text: string) => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.97;
      u.pitch = 0.9;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
      setSpeaking(true);
    } catch {
      setSpeaking(false);
    }
  };

  // Cancel any speech if the consumer unmounts (e.g., Codex closes).
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return { supported, speaking, speak, stop };
}
