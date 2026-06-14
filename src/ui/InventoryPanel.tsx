import { useState } from "react";
import { itemDef } from "../data/items";
import { useGameStore } from "../store/useGameStore";
import Modal from "./Modal";

const SLOTS = 20;

/** Inventory management (F: inventory). Grid of stacks; click a consumable to
 *  use it. Coins are shown as currency, not a slot. Opens with I / the bag. */
export default function InventoryPanel() {
  const coins = useGameStore((s) => s.coins);
  const inventory = useGameStore((s) => s.inventory);
  const useItem = useGameStore((s) => s.useItem);
  const close = () => useGameStore.getState().setMode("playing");

  const entries = Object.entries(inventory).filter(([, n]) => n > 0);
  const [sel, setSel] = useState<string | null>(entries[0]?.[0] ?? null);
  const selDef = sel ? itemDef(sel) : null;
  const count = sel ? inventory[sel] ?? 0 : 0;

  return (
    <Modal title="Inventory" subtitle={`🪙 ${coins.toLocaleString()} coins`} accent="#e8c66a" onClose={close} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: Math.max(SLOTS, entries.length) }).map((_, i) => {
            const e = entries[i];
            if (!e) return <div key={i} className="aspect-square rounded-lg border border-realm-edge bg-realm-panelHi/20" />;
            const [id, n] = e;
            const def = itemDef(id);
            const active = sel === id;
            return (
              <button
                key={i}
                onClick={() => setSel(id)}
                onDoubleClick={() => def.kind === "consumable" && useItem(id)}
                title={`${def.name} — ${def.desc}`}
                className={`relative grid aspect-square place-items-center rounded-lg border bg-realm-panelHi/50 transition ${
                  active ? "border-realm-gold" : "border-realm-edge hover:border-realm-gold/50"
                }`}
              >
                <span className="text-2xl leading-none">{def.icon}</span>
                <span className="absolute bottom-0.5 right-1 font-mono text-[11px] font-bold text-realm-text">{n}</span>
              </button>
            );
          })}
        </div>

        {/* detail / actions */}
        <div className="min-h-[3.5rem] rounded-xl border border-realm-edge bg-realm-panel/60 px-4 py-3">
          {selDef ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-sm font-semibold text-realm-text">
                  {selDef.icon} {selDef.name} <span className="text-realm-muted">×{count}</span>
                </div>
                <div className="text-xs text-realm-muted">{selDef.desc}</div>
              </div>
              {selDef.kind === "consumable" && (
                <button onClick={() => useItem(selDef.id)} className="btn-primary shrink-0 text-sm">
                  Use
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-realm-muted">
              Empty — defeat roaming mobs to gather loot. Coins, draughts and crafting materials drop here.
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-realm-muted/70">Click to inspect · double-click or “Use” to consume · I to close</p>
      </div>
    </Modal>
  );
}
