/**
 * Minimal procedural audio engine (F20) — no asset files. A soft ambient drone
 * plus a few synthesized SFX, all routed through a master gain that the mute
 * toggle controls. Everything is wrapped/guarded so audio can never break the
 * world (PRD §5). Default-muted: nothing is audible until the visitor opts in.
 */

type AC = AudioContext;

let ctx: AC | null = null;
let master: GainNode | null = null;
let ambientStarted = false;
let currentlyMuted = true;

function ensure(): AC | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

export function resumeAudio(): void {
  const c = ensure();
  try {
    if (c && c.state === "suspended") void c.resume();
  } catch {
    /* ignore */
  }
}

export function setMuted(muted: boolean): void {
  currentlyMuted = muted;
  const c = ensure();
  if (!c || !master) return;
  if (!muted) resumeAudio();
  try {
    const now = c.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : 0.5, now + 0.35);
  } catch {
    /* ignore */
  }
}

/** Soft evolving drone. Started once; muting just rides the master gain. */
export function startAmbient(): void {
  const c = ensure();
  if (!c || !master || ambientStarted) return;
  ambientStarted = true;
  try {
    const voices = [110, 164.81, 220]; // A2, E3, A3
    voices.forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = i === 2 ? "triangle" : "sine";
      osc.frequency.value = f;

      const g = c.createGain();
      g.gain.value = 0.045;

      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 620;

      // slow detune wander for life
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.027;
      const lfoGain = c.createGain();
      lfoGain.gain.value = 2.5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);

      osc.connect(g);
      g.connect(lp);
      lp.connect(master!);
      osc.start();
      lfo.start();
    });
  } catch {
    /* ignore */
  }
}

function tone(freq: number, dur: number, type: OscillatorType, when = 0, vol = 0.25): void {
  const c = ensure();
  if (!c || !master || currentlyMuted) return;
  try {
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch {
    /* ignore */
  }
}

export function sfxRelic(): void {
  tone(880, 0.18, "sine", 0, 0.22);
  tone(1318.51, 0.32, "sine", 0.08, 0.18);
}

export function sfxGate(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, "triangle", i * 0.12, 0.16));
}

export function sfxBlip(): void {
  tone(523.25, 0.08, "square", 0, 0.1);
}
