/**
 * Items, their icons, and per-mob drop tables. Pickups spawned on mob death
 * (loot) flow into the inventory; currency goes to the coin counter; using a
 * consumable applies its effect.
 */

export type ItemKind = "currency" | "consumable" | "material";

export interface ItemDef {
  id: string;
  name: string;
  /** Emoji used in the DOM inventory + the coin counter. */
  icon: string;
  /** World-pickup glow colour. */
  color: string;
  kind: ItemKind;
  stack: number;
  desc: string;
  /** Consumable effect. */
  effect?: { heal?: number };
}

export const ITEMS: Record<string, ItemDef> = {
  coin: { id: "coin", name: "Coin", icon: "🪙", color: "#f2c14c", kind: "currency", stack: 9999, desc: "Glittering currency of the realm." },
  heart: { id: "heart", name: "Heart Draught", icon: "❤️", color: "#ff5470", kind: "consumable", stack: 20, desc: "Restores 2 health.", effect: { heal: 2 } },
  scrap: { id: "scrap", name: "Scrap Metal", icon: "⚙️", color: "#9aa6bf", kind: "material", stack: 99, desc: "Salvage. Useful to a smith." },
  crystal: { id: "crystal", name: "Crystal Shard", icon: "💎", color: "#6ad0ff", kind: "material", stack: 99, desc: "A humming shard of arcane glass." },
  ember: { id: "ember", name: "Ember Core", icon: "🔥", color: "#ff7a3c", kind: "material", stack: 99, desc: "Still warm from the forge." },
  bone: { id: "bone", name: "Bone Fragment", icon: "🦴", color: "#e8e4d4", kind: "material", stack: 99, desc: "Rattling remains." },
  rune: { id: "rune", name: "Rune Stone", icon: "🔮", color: "#b06cff", kind: "material", stack: 99, desc: "Etched with forgotten glyphs." },
};

export const itemDef = (id: string): ItemDef => ITEMS[id] ?? ITEMS.coin;

interface DropEntry {
  item: string;
  chance: number; // 0..1, rolled independently
  min?: number;
  max?: number;
}

const DROPS: Record<string, DropEntry[]> = {
  bug: [
    { item: "coin", chance: 0.6, min: 1, max: 2 },
    { item: "scrap", chance: 0.22 },
    { item: "heart", chance: 0.07 },
  ],
  wisp: [
    { item: "crystal", chance: 0.4 },
    { item: "coin", chance: 0.4 },
    { item: "rune", chance: 0.1 },
  ],
  slime: [
    { item: "scrap", chance: 0.5, min: 1, max: 2 },
    { item: "coin", chance: 0.3 },
    { item: "heart", chance: 0.14 },
  ],
  critter: [
    { item: "coin", chance: 0.55, min: 1, max: 2 },
    { item: "bone", chance: 0.22 },
    { item: "ember", chance: 0.08 },
  ],
  bat: [
    { item: "coin", chance: 0.45 },
    { item: "crystal", chance: 0.2 },
    { item: "heart", chance: 0.06 },
  ],
  skeleton: [
    { item: "bone", chance: 0.6, min: 1, max: 2 },
    { item: "coin", chance: 0.45, min: 1, max: 2 },
    { item: "rune", chance: 0.12 },
  ],
  zombie: [
    { item: "bone", chance: 0.35 },
    { item: "coin", chance: 0.5, min: 1, max: 2 },
    { item: "scrap", chance: 0.2 },
  ],
  goblin: [
    { item: "coin", chance: 0.7, min: 1, max: 3 },
    { item: "scrap", chance: 0.25 },
    { item: "ember", chance: 0.1 },
  ],
  spider: [
    { item: "scrap", chance: 0.4 },
    { item: "coin", chance: 0.45 },
    { item: "heart", chance: 0.08 },
  ],
  mushroom: [
    { item: "heart", chance: 0.18 },
    { item: "ember", chance: 0.3 },
    { item: "coin", chance: 0.4 },
  ],
};

/** Roll a mob's drop table → a flat list of item ids (each unit is one pickup). */
export function rollDrops(mobId: string): string[] {
  const table = DROPS[mobId] ?? DROPS.bug;
  const out: string[] = [];
  for (const d of table) {
    if (Math.random() < d.chance) {
      const n = d.min ? d.min + Math.floor(Math.random() * (1 + (d.max ?? d.min) - d.min)) : 1;
      for (let i = 0; i < n; i++) out.push(d.item);
    }
  }
  return out.slice(0, 4); // cap clutter
}
