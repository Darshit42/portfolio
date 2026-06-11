import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { joystickVector } from "../game/useControls";

const RADIUS = 46; // px of knob travel

/** On-screen virtual joystick (F3). Feeds the same movement vector as keyboard. */
export default function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  // Safety: zero the vector if this unmounts (e.g., an overlay opens).
  useEffect(() => {
    return () => {
      joystickVector.x = 0;
      joystickVector.z = 0;
    };
  }, []);

  const update = (e: RPointerEvent) => {
    if (!active.current || !baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    joystickVector.x = dx / RADIUS;
    joystickVector.z = dy / RADIUS;
  };

  const start = (e: RPointerEvent) => {
    active.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e);
  };

  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    joystickVector.x = 0;
    joystickVector.z = 0;
  };

  return (
    <div className="absolute bottom-8 left-7 z-20 touch-none select-none">
      <div
        ref={baseRef}
        onPointerDown={start}
        onPointerMove={update}
        onPointerUp={end}
        onPointerCancel={end}
        className="relative h-28 w-28 rounded-full border border-realm-edge bg-realm-panel/40 backdrop-blur"
        style={{ touchAction: "none" }}
      >
        <div className="absolute inset-0 m-auto h-1 w-1 rounded-full bg-realm-muted/40" />
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-realm-gold/60 bg-realm-gold/20"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>
    </div>
  );
}
