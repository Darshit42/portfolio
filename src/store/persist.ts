import { FEATURES } from "../data/config";

/** Local-only save of found relics + settings (F22). No server, no sync. */

const KEY = "devhalla:v1";

export interface Saved {
  foundRelics: string[];
  muted: boolean;
  reducedMotion: boolean;
  coins: number;
  inventory: Record<string, number>;
}

const available = () => FEATURES.localSave && typeof localStorage !== "undefined";

export function loadSaved(): Partial<Saved> {
  if (!available()) return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

let last = "";

export function persist(snapshot: Saved): void {
  if (!available()) return;
  const serialized = JSON.stringify(snapshot);
  if (serialized === last) return; // only touch storage when it actually changed
  last = serialized;
  try {
    localStorage.setItem(KEY, serialized);
  } catch {
    /* quota / private mode — ignore, the world still works */
  }
}
