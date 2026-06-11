/** Detect whether a WebGL context can actually be created. */
export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

/** Coarse pointer (touch) detection for choosing control hints + joystick. */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(pointer: coarse)").matches === true ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
}
