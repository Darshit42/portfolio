import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";

/** Big centered transient message (deaths, arena waves/victory). */
export default function NoticeToast() {
  const text = useGameStore((s) => s.noticeText);
  const key = useGameStore((s) => s.noticeKey);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!text || key === 0) return;
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(id);
  }, [key, text]);

  if (!visible || !text) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-[26%] z-30 -translate-x-1/2 animate-fade-in px-4">
      <div className="panel rounded-full px-6 py-3 text-center font-display text-lg font-semibold text-realm-text shadow-panel">
        {text}
      </div>
    </div>
  );
}
