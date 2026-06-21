import { useEffect, useState } from "react";
import { useAgentStore } from "../agents/agentStore";
import { runtime } from "../agents/runtime";
import { FEATURES } from "../data/config";
import { itemMeta } from "../data/economy";

/**
 * A tiny live market-prices ticker — the cheap, glanceable proof that prices
 * actually move with the replayed supply/demand. Polls the runtime (which
 * derives prices from the baked log up to the current clock) a couple times a
 * second; no per-frame churn.
 */
export default function MarketReadout() {
  const ready = useAgentStore((s) => s.ready);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!ready) return;
    const pull = () => setPrices(runtime.marketPrices());
    pull();
    const t = setInterval(pull, 500);
    return () => clearInterval(t);
  }, [ready]);

  const items = Object.keys(prices);
  if (!FEATURES.agentTown || !ready || items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-20 z-20 select-none">
      <div className="rounded-lg border border-realm-edge bg-realm-bg/80 px-2.5 py-1.5 backdrop-blur-sm">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-realm-muted/80">Market</div>
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const m = itemMeta(item);
            return (
              <div key={item} className="flex items-center gap-1.5 text-[12px]">
                <span>{m.icon}</span>
                <span className="w-10 text-realm-muted">{m.label}</span>
                <span className="font-mono text-realm-text">{prices[item].toFixed(1)}c</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
