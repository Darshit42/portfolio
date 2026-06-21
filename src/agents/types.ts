/**
 * Agent Town — frontend event-log types. These mirror the server's event schema
 * (apps/server/server/events.py). The baked log is a single JSON document
 * `{ meta, events }`; the live SSE stream sends the same WorldEvent objects.
 */

export type WorldEventType =
  | "move"
  | "speak"
  | "arrive"
  | "reflect"
  | "activity"
  // economy (log v2 — additive; v1 logs simply omit these)
  | "trade"
  | "produce"
  | "consume"
  | "price"
  | "stat";

interface BaseEvent {
  type: WorldEventType;
  agentId: string;
  ts: number; // simulated milliseconds
}

export interface MoveEvent extends BaseEvent {
  type: "move";
  targetBuilding: string;
  targetPos: [number, number];
}
export interface SpeakEvent extends BaseEvent {
  type: "speak";
  text: string;
  targetAgentId: string;
}
export interface ArriveEvent extends BaseEvent {
  type: "arrive";
  building: string;
  pos: [number, number];
}
export interface ActivityEvent extends BaseEvent {
  type: "activity";
  building: string;
  description: string;
}
export interface ReflectEvent extends BaseEvent {
  type: "reflect";
  summary: string;
}

// --- economy events (v2) ---
/** A trade leg: each side is either an item+qty or coin. */
export type TradeSide = { item: string; qty: number } | { coin: number };
export interface TradeEvent extends BaseEvent {
  type: "trade";
  withId: string;
  give: TradeSide;
  get: TradeSide;
}
export interface ProduceEvent extends BaseEvent {
  type: "produce";
  building: string;
  made: { item: string; qty: number };
  used?: { item: string; qty: number };
}
export interface ConsumeEvent extends BaseEvent {
  type: "consume";
  item: string;
  qty: number;
  need: string;
  restored: number;
}
export interface PriceEvent extends BaseEvent {
  type: "price"; // agentId is the pseudo-agent "market"
  item: string;
  price: number;
}
export interface StatEvent extends BaseEvent {
  type: "stat";
  coin: number;
  needs: Record<string, number>;
  inventory: Record<string, number>;
}

export type WorldEvent =
  | MoveEvent
  | SpeakEvent
  | ArriveEvent
  | ActivityEvent
  | ReflectEvent
  | TradeEvent
  | ProduceEvent
  | ConsumeEvent
  | PriceEvent
  | StatEvent;

export interface PlanSlot {
  time: number;
  building: string;
  description: string;
  intent?: string; // v2: work | buy_food | sell | rest | trade | visit
}

export interface EconSnapshot {
  coin: number;
  needs: Record<string, number>;
  inventory: Record<string, number>;
}

export interface AgentSnapshot {
  id: string;
  name: string;
  bio: string;
  home: string;
  relationships: Record<string, string>;
  plan: PlanSlot[];
  position: [number, number];
  activity: string;
  econ?: EconSnapshot; // v2 initial baseline
}

/** A derived transaction line for the inspector. */
export interface TxnLine {
  ts: number;
  kind: "trade" | "produce" | "consume";
  text: string;
}

export interface SimMeta {
  version: number;
  playbackRate: number; // simulated seconds per real second (60 = 60x)
  walkSpeed: number; // world units / real second
  dayHours: number;
  startHour: number;
  agents: AgentSnapshot[];
  items?: string[]; // v2: tradable items
  bakedAt: number;
  bakeSeconds: number;
}

export interface SimDocument {
  meta: SimMeta;
  events: WorldEvent[];
}

/** One line in an agent's derived memory feed (shown in the inspector). */
export interface MemoryLine {
  ts: number;
  kind: "said" | "did" | "moved" | "reflected";
  text: string;
}
