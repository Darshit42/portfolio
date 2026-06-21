/**
 * Agent Town replay/live runtime — a plain controller (no React) that owns the
 * sim clock and drives each agent's position + RigCtrl every frame. Mounted and
 * ticked by AgentTown.tsx inside useFrame, so motion is frame-rate-independent
 * and never triggers a React render (same discipline as the mob sim).
 *
 * Low-frequency, DOM-facing state (speech bubbles, inspector feed) is pushed to
 * useAgentStore only when it actually changes.
 */
import { makeRigCtrl, type RigCtrl } from "../game/CharacterRig";
import { WORLD_CENTER, WORLD_RADIUS } from "../data/buildings";
import { useAgentStore, type Bubble, type Flash } from "./agentStore";
import type {
  EconSnapshot,
  MemoryLine,
  SimDocument,
  SimMeta,
  TradeEvent,
  TxnLine,
  WorldEvent,
} from "./types";

const CAMERA_HEADING = Math.atan2(15, 18);
const ARRIVE_EPS = 0.5;
const BUBBLE_MS = 4000; // 4s on screen (R11.4)
const FLASH_MS = 1600; // economy pop dwell

interface LiveAgent {
  id: string;
  name: string;
  ctrl: RigCtrl;
  x: number;
  z: number;
  tx: number; // move target
  tz: number;
  moving: boolean;
  activity: string;
}

function clampDisc(x: number, z: number): [number, number] {
  const ox = x - WORLD_CENTER[0];
  const oz = z - WORLD_CENTER[1];
  const d = Math.hypot(ox, oz);
  if (d > WORLD_RADIUS) {
    return [WORLD_CENTER[0] + (ox / d) * WORLD_RADIUS, WORLD_CENTER[1] + (oz / d) * WORLD_RADIUS];
  }
  return [x, z];
}

class AgentTownRuntime {
  meta: SimMeta | null = null;
  private events: WorldEvent[] = [];
  private agents = new Map<string, LiveAgent>();
  private cursor = 0;
  private clockMs = 0;
  private firstTs = 0;
  private walkSpeed = 3;
  private playbackRate = 60;
  private liveEvents: WorldEvent[] = []; // appended by live mode, drained in order
  private bubbles: { b: Bubble; expiry: number }[] = [];
  private bubblesDirty = false;
  private bubbleKey = 0;
  private flashes: { f: Flash; expiry: number }[] = [];
  private flashesDirty = false;
  private flashKey = 0;
  private liveMode = false; // when true, freeze baked replay and only play streamed events

  setLiveMode(on: boolean): void {
    this.liveMode = on;
  }

  load(doc: SimDocument): void {
    this.meta = doc.meta;
    this.events = doc.events.slice().sort((a, b) => a.ts - b.ts);
    this.walkSpeed = doc.meta.walkSpeed || 3;
    this.playbackRate = doc.meta.playbackRate || 60;
    this.firstTs = this.events.length ? this.events[0].ts : 0;
    this.clockMs = this.firstTs;
    this.cursor = 0;
    this.agents.clear();
    for (const a of doc.meta.agents) {
      this.agents.set(a.id, {
        id: a.id,
        name: a.name,
        ctrl: makeRigCtrl(CAMERA_HEADING),
        x: a.position[0],
        z: a.position[1],
        tx: a.position[0],
        tz: a.position[1],
        moving: false,
        activity: a.activity,
      });
    }
    useAgentStore.getState().setReady(true);
  }

  agentList(): LiveAgent[] {
    return [...this.agents.values()];
  }

  ctrlOf(id: string): RigCtrl | undefined {
    return this.agents.get(id)?.ctrl;
  }

  posOf(id: string): [number, number] | undefined {
    const a = this.agents.get(id);
    return a ? [a.x, a.z] : undefined;
  }

  /** Append a live event (from SSE) into the replay timeline. */
  pushLive(ev: WorldEvent): void {
    this.liveEvents.push(ev);
  }

  // -------------------------------------------------------------- frame tick
  advance(dtReal: number): void {
    if (!this.meta) return;
    const dt = Math.min(dtReal, 0.1);

    if (!this.liveMode) {
      this.clockMs += dt * this.playbackRate * 1000;
      // Dispatch any baked events whose timestamp has arrived.
      while (this.cursor < this.events.length && this.events[this.cursor].ts <= this.clockMs) {
        this.dispatch(this.events[this.cursor]);
        this.cursor++;
      }
      // Loop the baked log without snapping positions mid-stride (R8.6).
      if (this.cursor >= this.events.length && this.events.length) {
        this.clockMs = this.firstTs;
        this.cursor = 0;
      }
    }
    // Drain streamed live events immediately (they arrive in order).
    if (this.liveEvents.length) {
      for (const ev of this.liveEvents) this.dispatch(ev);
      this.liveEvents.length = 0;
    }

    this.integrate(dt);
    this.expireBubbles();
    this.expireFlashes();
    if (this.bubblesDirty) {
      useAgentStore.getState().setBubbles(this.bubbles.map((x) => x.b));
      this.bubblesDirty = false;
    }
    if (this.flashesDirty) {
      useAgentStore.getState().setFlashes(this.flashes.map((x) => x.f));
      this.flashesDirty = false;
    }
  }

  private dispatch(ev: WorldEvent): void {
    // Economy events are mostly derived by scanning (inspector + market
    // readout); here we only fire transient visuals. price/stat carry no live
    // action. Unknown future types simply fall through as no-ops (forward-safe).
    switch (ev.type) {
      case "price":
      case "stat":
      case "consume":
        return;
      case "trade":
        this.addFlash(ev);
        return;
      case "produce":
        this.addFlash2(ev.agentId, `+${ev.made.qty} ${ev.made.item}`, "make");
        return;
    }
    const a = this.agents.get(ev.agentId);
    if (!a) return;
    switch (ev.type) {
      case "move":
        [a.tx, a.tz] = clampDisc(ev.targetPos[0], ev.targetPos[1]);
        a.moving = true;
        break;
      case "arrive":
        // Snap to the authored arrival point and settle (R8.4).
        [a.x, a.z] = clampDisc(ev.pos[0], ev.pos[1]);
        a.tx = a.x;
        a.tz = a.z;
        a.moving = false;
        a.ctrl.move = "idle";
        break;
      case "speak":
        this.addBubble(a, ev.text);
        break;
      case "activity":
        a.activity = ev.description;
        break;
      case "reflect":
        a.activity = `reflecting: ${ev.summary}`;
        break;
    }
  }

  private integrate(dt: number): void {
    for (const a of this.agents.values()) {
      if (!a.moving) {
        a.ctrl.move = "idle";
        continue;
      }
      const dx = a.tx - a.x;
      const dz = a.tz - a.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= ARRIVE_EPS) {
        a.ctrl.move = "idle"; // reached; the arrive event will finalize
        continue;
      }
      const step = Math.min(dist, this.walkSpeed * dt);
      a.x += (dx / dist) * step;
      a.z += (dz / dist) * step;
      [a.x, a.z] = clampDisc(a.x, a.z);
      a.ctrl.heading = Math.atan2(dx, dz); // face travel direction
      a.ctrl.move = "walk";
    }
  }

  // ----------------------------------------------------------------- bubbles
  private addBubble(a: LiveAgent, text: string): void {
    const b: Bubble = { agentId: a.id, name: a.name, text, key: ++this.bubbleKey };
    // One bubble per agent at a time; newest wins.
    this.bubbles = this.bubbles.filter((x) => x.b.agentId !== a.id);
    this.bubbles.push({ b, expiry: performance.now() + BUBBLE_MS });
    this.bubblesDirty = true;
  }

  private expireBubbles(): void {
    const now = performance.now();
    const before = this.bubbles.length;
    this.bubbles = this.bubbles.filter((x) => x.expiry > now);
    if (this.bubbles.length !== before) this.bubblesDirty = true;
  }

  // ----------------------------------------------------------------- flashes
  private addFlash(ev: TradeEvent): void {
    // Show the coin side of the trade, signed by whether the agent gained it.
    const gainsCoin = "coin" in ev.get;
    const amt = "coin" in ev.get ? ev.get.coin : "coin" in ev.give ? ev.give.coin : 0;
    this.addFlash2(ev.agentId, `${gainsCoin ? "+" : "-"}${Math.round(amt)}c`, gainsCoin ? "gain" : "spend");
  }

  private addFlash2(agentId: string, text: string, tone: Flash["tone"]): void {
    const f: Flash = { agentId, text, tone, key: ++this.flashKey };
    this.flashes = this.flashes.filter((x) => x.f.agentId !== agentId);
    this.flashes.push({ f, expiry: performance.now() + FLASH_MS });
    this.flashesDirty = true;
  }

  private expireFlashes(): void {
    const now = performance.now();
    const before = this.flashes.length;
    this.flashes = this.flashes.filter((x) => x.expiry > now);
    if (this.flashes.length !== before) this.flashesDirty = true;
  }

  // -------------------------------------------------------------- inspector
  /** Derive the inspector view for an agent from the snapshot + replayed events
   *  up to the current clock (time-accurate memory feed, R12.1). */
  inspector(id: string): {
    snapshot: SimMeta["agents"][number];
    activity: string;
    memories: MemoryLine[];
    econ: EconSnapshot;
    transactions: TxnLine[];
  } | null {
    if (!this.meta) return null;
    const snap = this.meta.agents.find((x) => x.id === id);
    const a = this.agents.get(id);
    if (!snap || !a) return null;
    const lines: MemoryLine[] = [];
    const txns: TxnLine[] = [];
    // Latest stat snapshot ≤ clock (fallback to the meta baseline).
    let econ: EconSnapshot = snap.econ ?? { coin: 0, needs: {}, inventory: {} };
    for (const ev of this.events) {
      if (ev.ts > this.clockMs) break;
      if (ev.agentId !== id) continue;
      switch (ev.type) {
        case "speak":
          lines.push({ ts: ev.ts, kind: "said", text: ev.text });
          break;
        case "activity":
          lines.push({ ts: ev.ts, kind: "did", text: ev.description });
          break;
        case "arrive":
          lines.push({ ts: ev.ts, kind: "moved", text: `arrived at ${labelOf(ev.building)}` });
          break;
        case "reflect":
          lines.push({ ts: ev.ts, kind: "reflected", text: ev.summary });
          break;
        case "stat":
          econ = { coin: ev.coin, needs: ev.needs, inventory: ev.inventory };
          break;
        case "trade":
          txns.push({ ts: ev.ts, kind: "trade", text: tradeText(ev) });
          break;
        case "produce":
          txns.push({ ts: ev.ts, kind: "produce", text: `forged ${ev.made.qty} ${ev.made.item}` });
          break;
        case "consume":
          txns.push({
            ts: ev.ts,
            kind: "consume",
            text: `used ${ev.qty} ${ev.item} (+${Math.round(ev.restored)} ${ev.need})`,
          });
          break;
      }
    }
    return {
      snapshot: snap,
      activity: a.activity,
      memories: lines.slice(-10).reverse(),
      econ,
      transactions: txns.slice(-8).reverse(),
    };
  }

  /** Latest market price per item ≤ clock (for the prices readout). */
  marketPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    for (const ev of this.events) {
      if (ev.ts > this.clockMs) break;
      if (ev.type === "price") prices[ev.item] = ev.price;
    }
    return prices;
  }
}

function tradeText(ev: TradeEvent): string {
  const side = (s: TradeEvent["give"]) =>
    "coin" in s ? `${Math.round(s.coin)}c` : `${s.qty} ${s.item}`;
  return `${side(ev.give)} → ${side(ev.get)}`;
}

function labelOf(buildingId: string): string {
  return buildingId.replace(/-/g, " ");
}

export const runtime = new AgentTownRuntime();
