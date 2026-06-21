/**
 * Agent Town — frontend event-log types. These mirror the server's event schema
 * (apps/server/server/events.py). The baked log is a single JSON document
 * `{ meta, events }`; the live SSE stream sends the same WorldEvent objects.
 */

export type WorldEventType = "move" | "speak" | "arrive" | "reflect" | "activity";

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

export type WorldEvent = MoveEvent | SpeakEvent | ArriveEvent | ActivityEvent | ReflectEvent;

export interface PlanSlot {
  time: number;
  building: string;
  description: string;
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
}

export interface SimMeta {
  version: number;
  playbackRate: number; // simulated seconds per real second (60 = 60x)
  walkSpeed: number; // world units / real second
  dayHours: number;
  startHour: number;
  agents: AgentSnapshot[];
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
