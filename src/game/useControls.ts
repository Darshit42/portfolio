import { useEffect } from "react";

/**
 * Unified movement input: keyboard (WASD + arrows) and the touch joystick feed
 * the same vectors, read each frame by <Player>. Discrete actions (interact,
 * attack, map, help, pause) are reported via callbacks so the DOM layer and the
 * combat module own their own state.
 */

export const keyboardVector = { x: 0, z: 0 };
export const joystickVector = { x: 0, z: 0 };

/** Combined, length-clamped movement direction in world XZ (camera-relative). */
export function getMoveVector(): { x: number; z: number } {
  let x = keyboardVector.x + joystickVector.x;
  let z = keyboardVector.z + joystickVector.z;
  const len = Math.hypot(x, z);
  if (len > 1) {
    x /= len;
    z /= len;
  }
  return { x, z };
}

const keyState: Record<string, boolean> = {};

function recompute() {
  const up = keyState["w"] || keyState["arrowup"];
  const down = keyState["s"] || keyState["arrowdown"];
  const left = keyState["a"] || keyState["arrowleft"];
  const right = keyState["d"] || keyState["arrowright"];
  // Screen "up" is toward -z (north) in our dimetric world.
  keyboardVector.x = (right ? 1 : 0) - (left ? 1 : 0);
  keyboardVector.z = (down ? 1 : 0) - (up ? 1 : 0);
}

/**
 * Attaches keyboard listeners. UI-mode keys (Esc, M, ?, Space) are reported via
 * callbacks so the DOM layer owns mode changes; movement stays here.
 */
export function useKeyboardControls(opts: {
  onInteract: () => void;
  onToggleMap: () => void;
  onToggleHelp: () => void;
  onPause: () => void;
  onAttack: () => void;
}) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Don't hijack typing in inputs.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        if (k.startsWith("arrow")) e.preventDefault();
        keyState[k] = true;
        recompute();
        return;
      }
      switch (k) {
        case "e":
        case "enter":
          opts.onInteract();
          break;
        case "m":
          opts.onToggleMap();
          break;
        case "?":
        case "/":
          opts.onToggleHelp();
          break;
        case "escape":
          opts.onPause();
          break;
        case " ":
          e.preventDefault();
          opts.onAttack();
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in keyState) {
        keyState[k] = false;
        recompute();
      }
    };
    const blur = () => {
      for (const k of Object.keys(keyState)) keyState[k] = false;
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [opts]);
}
