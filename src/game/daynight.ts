import { Color } from "three";
import { DAY_NIGHT } from "../data/config";

/**
 * Day/night model. `phase` is 0..1 across one in-world day (0 = midnight,
 * 0.25 = sunrise, 0.5 = noon, 0.75 = sunset). The render values are keyframed
 * and interpolated allocation-free into shared scratch — DayNightController
 * advances + samples once per frame and writes the public `daynight` snapshot
 * that Sky (and mobs, via the store segment) read.
 */

export type Segment = "night" | "dawn" | "day" | "dusk";

export interface DayNightSample {
  sky: Color;
  fog: Color;
  fogDensity: number;
  ambient: Color;
  ambientI: number;
  sunColor: Color;
  sunI: number;
  fillI: number;
  starOpacity: number;
  exposure: number;
  sunDir: [number, number, number];
  sunDiscOpacity: number;
  moonDiscOpacity: number;
}

interface KF {
  p: number;
  sky: Color;
  fog: Color;
  fogD: number;
  ambC: Color;
  ambI: number;
  sunC: Color;
  sunI: number;
  fillI: number;
  star: number;
  exp: number;
}

const c = (hex: string) => new Color(hex);

// Keyframes ascending by phase; the gap from the last back to the first wraps
// across midnight. Tuned so night matches the established torchlit look.
const KEYS: KF[] = [
  // night is moody but must stay clearly READABLE — lifted ambient + fill so
  // the open ground and the player never fall into near-black.
  { p: 0.0, sky: c("#151a30"), fog: c("#141829"), fogD: 0.013, ambC: c("#525b74"), ambI: 2.3, sunC: c("#a2b3df"), sunI: 2.9, fillI: 1.55, star: 1.0, exp: 1.7 },
  { p: 0.2, sky: c("#191d36"), fog: c("#161b2d"), fogD: 0.014, ambC: c("#4c4c68"), ambI: 2.1, sunC: c("#878bae"), sunI: 2.4, fillI: 1.35, star: 0.85, exp: 1.7 },
  { p: 0.27, sky: c("#b88a5e"), fog: c("#946a4e"), fogD: 0.0095, ambC: c("#7a6860"), ambI: 1.8, sunC: c("#ffbf72"), sunI: 3.0, fillI: 0.6, star: 0.05, exp: 1.4 },
  { p: 0.5, sky: c("#86abdc"), fog: c("#a3bcdc"), fogD: 0.005, ambC: c("#b6c6da"), ambI: 2.9, sunC: c("#fff4dc"), sunI: 4.6, fillI: 1.0, star: 0.0, exp: 1.12 },
  { p: 0.73, sky: c("#88a4d2"), fog: c("#9eb6d6"), fogD: 0.006, ambC: c("#aebfd6"), ambI: 2.6, sunC: c("#ffeccb"), sunI: 4.1, fillI: 0.95, star: 0.0, exp: 1.2 },
  { p: 0.79, sky: c("#c2764a"), fog: c("#9c5c3e"), fogD: 0.011, ambC: c("#7c5a50"), ambI: 1.25, sunC: c("#ff8442"), sunI: 2.2, fillI: 0.5, star: 0.08, exp: 1.42 },
  { p: 0.85, sky: c("#2a2442"), fog: c("#221e38"), fogD: 0.013, ambC: c("#544d6c"), ambI: 2.1, sunC: c("#8d7eaa"), sunI: 2.4, fillI: 1.45, star: 0.7, exp: 1.7 },
];

const MOON_DIR: [number, number, number] = [-0.55, 0.72, -0.4];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// reusable scratch so sampling never allocates
const scratch: DayNightSample = {
  sky: new Color(),
  fog: new Color(),
  fogDensity: 0.016,
  ambient: new Color(),
  ambientI: 1,
  sunColor: new Color(),
  sunI: 1,
  fillI: 0.7,
  starOpacity: 1,
  exposure: 1.6,
  sunDir: [...MOON_DIR],
  sunDiscOpacity: 0,
  moonDiscOpacity: 1,
};

export function sample(phase: number): DayNightSample {
  const p = ((phase % 1) + 1) % 1;
  // find bracketing keyframes (with wrap)
  let a = KEYS[KEYS.length - 1];
  let b = KEYS[0];
  for (let i = 0; i < KEYS.length; i++) {
    if (p < KEYS[i].p) {
      b = KEYS[i];
      a = KEYS[i === 0 ? KEYS.length - 1 : i - 1];
      break;
    }
    if (i === KEYS.length - 1) {
      a = KEYS[i];
      b = KEYS[0];
    }
  }
  const span = (b.p - a.p + 1) % 1 || 1;
  const t = (((p - a.p + 1) % 1) / span) || 0;

  scratch.sky.copy(a.sky).lerp(b.sky, t);
  scratch.fog.copy(a.fog).lerp(b.fog, t);
  scratch.fogDensity = lerp(a.fogD, b.fogD, t);
  scratch.ambient.copy(a.ambC).lerp(b.ambC, t);
  scratch.ambientI = lerp(a.ambI, b.ambI, t);
  scratch.sunColor.copy(a.sunC).lerp(b.sunC, t);
  scratch.sunI = lerp(a.sunI, b.sunI, t);
  scratch.fillI = lerp(a.fillI, b.fillI, t);
  scratch.starOpacity = lerp(a.star, b.star, t);
  scratch.exposure = lerp(a.exp, b.exp, t);

  // sun direction: an east→overhead→west arc by day, blending to a fixed
  // moon direction once the sun is below the horizon.
  const angle = (p - 0.25) * Math.PI * 2;
  const elev = Math.sin(angle);
  const up = smoothstep(-0.06, 0.16, elev);
  const sunArc: [number, number, number] = [Math.cos(angle) * 0.62, elev * 0.85 + 0.18, -0.42];
  scratch.sunDir[0] = lerp(MOON_DIR[0], sunArc[0], up);
  scratch.sunDir[1] = lerp(MOON_DIR[1], sunArc[1], up);
  scratch.sunDir[2] = lerp(MOON_DIR[2], sunArc[2], up);
  scratch.sunDiscOpacity = up;
  scratch.moonDiscOpacity = 1 - up;

  return scratch;
}

export function segmentOf(phase: number): Segment {
  const p = ((phase % 1) + 1) % 1;
  if (p >= 0.85 || p < 0.21) return "night";
  if (p < 0.29) return "dawn";
  if (p < 0.75) return "day";
  return "dusk";
}

export function inGameClock(phase: number): string {
  const total = ((phase % 1) + 1) % 1 * 24 * 60;
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function initialPhase(): number {
  if (DAY_NIGHT.useRealTime) {
    const now = new Date();
    return ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) % 1;
  }
  return DAY_NIGHT.startPhase;
}

/** Public live snapshot, written each frame by DayNightController. */
export const daynight = {
  phase: initialPhase(),
  segment: segmentOf(initialPhase()),
  starOpacity: 1,
  sunDiscOpacity: 0,
  moonDiscOpacity: 1,
  /** Warm-light dimmer: 1 at night, ~0.15 at noon — torches fade in daylight. */
  warm: 1,
  /** Brightness tint for unlit sprites so they darken at night (0.55..1). */
  spriteTint: 1,
  sunDir: [...MOON_DIR] as [number, number, number],
};

// Dev-only handle so the screenshot driver can jump to any phase.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __daynight: typeof daynight }).__daynight = daynight;
}

/** Advance the phase (no-op when reduced motion freezes the cycle, or when
 *  synced to the real clock — there we resample from the clock instead). */
export function advancePhase(dt: number, reduced: boolean): number {
  if (!DAY_NIGHT.enabled) return daynight.phase;
  if (DAY_NIGHT.useRealTime) {
    const now = new Date();
    daynight.phase = (now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60) / (24 * 60);
  } else if (!reduced) {
    daynight.phase = (daynight.phase + dt / DAY_NIGHT.periodSeconds) % 1;
  }
  return daynight.phase;
}
