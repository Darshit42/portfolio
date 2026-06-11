import { useEffect, useRef, useState } from "react";
import { TOTAL_RELICS, projectById } from "../data/projects";
import { useGameStore } from "../store/useGameStore";
import { RelicIcon } from "./icons";

interface Toast {
  key: number;
  text: string;
  accent: string;
}

let toastKey = 0;

/** Transient feedback when a relic is claimed or the Gate unlocks. */
export default function Toasts() {
  const found = useGameStore((s) => s.foundRelics);
  const prev = useRef<Set<string>>(new Set(found));
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const added: string[] = [];
    for (const id of found) if (!prev.current.has(id)) added.push(id);
    prev.current = new Set(found);
    if (added.length === 0) return;

    const next: Toast[] = added.map((id) => {
      const p = projectById(id);
      return { key: ++toastKey, text: `Relic claimed — ${p?.name ?? id}`, accent: p?.accent ?? "#e8c66a" };
    });
    if (found.size >= TOTAL_RELICS) {
      next.push({ key: ++toastKey, text: "The Gate of Contact has opened!", accent: "#6ad0ff" });
    }

    setToasts((t) => [...t, ...next]);
    const timers = next.map((toast) =>
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.key !== toast.key)), 3600),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [found]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-5 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.key}
          className="panel flex items-center gap-2.5 rounded-full px-4 py-2 shadow-panel animate-fade-in"
          style={{ boxShadow: `0 0 0 1px ${t.accent}55, 0 8px 24px -8px #000` }}
        >
          <RelicIcon width={18} height={18} style={{ color: t.accent }} />
          <span className="text-sm font-semibold text-realm-text">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
