import { useEffect, useRef } from "react";
import { combat } from "../game/combat";

/** Red edge-flash when the player takes a hit. Driven off-React via rAF. */
export default function DamageVignette() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) {
        const since = performance.now() - combat.lastHitAt;
        ref.current.style.opacity = since < 600 ? String(0.55 * (1 - since / 600)) : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-30"
      style={{ opacity: 0, boxShadow: "inset 0 0 130px 36px rgba(255,40,60,0.7)" }}
      aria-hidden
    />
  );
}
