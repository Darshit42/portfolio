/**
 * Frontend economy display data — labels/icons only. The simulation itself runs
 * server-side at bake time (apps/server/server/economy.py); this is purely for
 * rendering the replayed economy events (inspector + market readout).
 */

export interface ItemMeta {
  label: string;
  icon: string; // emoji glyph, cheap + no assets
  color: string;
}

export const ITEM_META: Record<string, ItemMeta> = {
  food: { label: "Food", icon: "🍞", color: "#e8c66a" },
  ore: { label: "Ore", icon: "⛏️", color: "#9aa6bf" },
  tools: { label: "Tools", icon: "🔨", color: "#ff9a4c" },
  ale: { label: "Ale", icon: "🍺", color: "#f2b94c" },
};

export const itemMeta = (id: string): ItemMeta =>
  ITEM_META[id] ?? { label: id, icon: "•", color: "#8b97b0" };

export const NEED_META: Record<string, { label: string; color: string }> = {
  hunger: { label: "Hunger", color: "#ff9a4c" },
  energy: { label: "Energy", color: "#6ad0ff" },
};

export const needMeta = (id: string) =>
  NEED_META[id] ?? { label: id, color: "#8b97b0" };

export const INTENT_LABEL: Record<string, string> = {
  work: "work",
  buy_food: "eat",
  sell: "sell",
  rest: "rest",
  trade: "trade",
  visit: "visit",
};
