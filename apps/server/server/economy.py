"""Resource economy — the deterministic half of Agent Town (no LLM).

Agents have needs that decay, coin, and inventory. Buildings have economic
roles. The LLM only chooses high-level intent during daily planning ("I'm low
on coin, go work" / "I'm hungry, buy food"); EVERYTHING in this module is pure
math: decay, production, consumption, pricing, and trade settlement. No
per-transaction LLM calls.

Design choice (deliberate, to avoid degenerate equilibria the reviewer flagged):
this is a light OPEN economy, not a closed conservation system —
  * work always pays a positive wage (no bankruptcy deadlock),
  * the urgent-need override resolves the real blocker (broke + hungry → WORK,
    not pace to a market you can't afford),
  * prices are clamped to [floor, ceil] so supply/demand can't run to 0 or ∞.
The bake summary reports final state + warnings so collapse is visible, not
silent.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# --- items + needs -----------------------------------------------------------
FOOD, ORE, TOOLS, ALE = "food", "ore", "tools", "ale"
NEEDS = ("hunger", "energy")  # 0..100, higher = more satisfied; decays over time

# --- building economic roles (data-driven; mirrors building ids) -------------
ECON_ROLE: dict[str, str] = {
    "agent-forge": "forge",  # consume ore -> make tools, sell for coin
    "finddder-market": "market",  # trade hub: buy food/ore, sell goods, sets prices
    "null-pointer-tavern": "tavern",  # buy food/ale -> restore hunger/energy
    # everything else is "service": flat wage for showing up to your post
}


def role_of(building_id: str) -> str:
    return ECON_ROLE.get(building_id, "service")


# Where an agent of each home building earns / eats / rests.
WORKPLACE = {  # home building -> where its agent works (defaults to home)
}
FOOD_SOURCE = "null-pointer-tavern"
REST_SOURCE = "null-pointer-tavern"
MARKET = "finddder-market"
FORGE = "agent-forge"

# --- tunables (per tick / per transaction) -----------------------------------
HUNGER_DECAY = 0.55
ENERGY_DECAY = 0.45
HUNGER_CRIT = 35.0
ENERGY_CRIT = 30.0
EAT_RESTORE = 45.0
REST_RESTORE = 42.0

SERVICE_WAGE = 7.0
TAVERN_WAGE = 6.0
MARKET_WAGE = 8.0

# base price, [floor, ceil], step per unit traded
PRICE_TABLE: dict[str, tuple[float, list[float], float]] = {
    FOOD: (5.0, [2.0, 10.0], 0.4),
    ORE: (3.0, [1.0, 7.0], 0.3),
    TOOLS: (18.0, [8.0, 36.0], 1.0),
    ALE: (4.0, [2.0, 9.0], 0.3),
}

INTENTS = {"work", "buy_food", "sell", "rest", "trade", "visit"}


def _clamp(v: float, lo: float, hi: float) -> float:
    return lo if v < lo else hi if v > hi else v


class Market:
    """Clamped supply/demand pricing. Buying pushes a price up, selling pushes it
    down, both bounded so the loop can never spiral to 0 or ∞."""

    def __init__(self) -> None:
        self.base: dict[str, float] = {k: base for k, (base, _, _) in PRICE_TABLE.items()}
        self.price: dict[str, float] = dict(self.base)
        self.lo: dict[str, float] = {k: rng[0] for k, (_, rng, _) in PRICE_TABLE.items()}
        self.hi: dict[str, float] = {k: rng[1] for k, (_, rng, _) in PRICE_TABLE.items()}
        self.step: dict[str, float] = {k: s for k, (_, _, s) in PRICE_TABLE.items()}
        self.lo_seen: dict[str, float] = dict(self.price)
        self.hi_seen: dict[str, float] = dict(self.price)

    def relax(self, rate: float = 0.04) -> None:
        """Gentle mean-reversion toward the base price each tick. Stops a glut or
        shortage from pinning a price at a clamp forever — idle prices ease home,
        keeping the market lively without any LLM or trade."""
        for item in self.price:
            self.price[item] += (self.base[item] - self.price[item]) * rate

    def quote(self, item: str) -> float:
        return round(self.price[item], 2)

    def _bump(self, item: str, delta: float) -> None:
        self.price[item] = _clamp(self.price[item] + delta, self.lo[item], self.hi[item])
        self.lo_seen[item] = min(self.lo_seen[item], self.price[item])
        self.hi_seen[item] = max(self.hi_seen[item], self.price[item])

    def buy(self, item: str, qty: int = 1) -> float:
        cost = self.quote(item) * qty
        self._bump(item, self.step[item] * qty)  # demand raises price
        return round(cost, 2)

    def sell(self, item: str, qty: int = 1) -> float:
        gain = self.quote(item) * qty
        self._bump(item, -self.step[item] * qty)  # supply lowers price
        return round(gain, 2)


# --- agent economic state ----------------------------------------------------
@dataclass
class Econ:
    coin: float = 25.0
    hunger: float = 80.0
    energy: float = 80.0
    inventory: dict[str, int] = field(default_factory=dict)

    def need(self, name: str) -> float:
        return getattr(self, name)

    def add_item(self, item: str, qty: int) -> None:
        self.inventory[item] = max(0, self.inventory.get(item, 0) + qty)
        if self.inventory[item] == 0:
            self.inventory.pop(item, None)

    def has(self, item: str, qty: int = 1) -> bool:
        return self.inventory.get(item, 0) >= qty

    def needs_dict(self) -> dict[str, float]:
        return {"hunger": round(self.hunger, 1), "energy": round(self.energy, 1)}

    def snapshot(self) -> dict:
        return {"coin": round(self.coin, 2), "needs": self.needs_dict(), "inventory": dict(self.inventory)}


def starting_econ(home: str) -> Econ:
    """Light role-based starting capital so the day opens with some inequality."""
    role = role_of(home)
    if role == "market":
        return Econ(coin=60.0, inventory={})
    if role == "forge":
        return Econ(coin=30.0, inventory={ORE: 2})
    if role == "tavern":
        return Econ(coin=40.0, inventory={FOOD: 4, ALE: 3})
    return Econ(coin=25.0)


def decay(e: Econ) -> None:
    e.hunger = _clamp(e.hunger - HUNGER_DECAY, 0.0, 100.0)
    e.energy = _clamp(e.energy - ENERGY_DECAY, 0.0, 100.0)


def is_critical(e: Econ) -> bool:
    return e.hunger < HUNGER_CRIT or e.energy < ENERGY_CRIT


def urgent_override(e: Econ, market: Market) -> tuple[str, str] | None:
    """Resolve the *real* blocker, deterministically, no LLM (returns
    (intent, building_id) or None to follow the plan).

    Picks whichever need is *most* critical (largest deficit below its
    threshold) so neither hunger nor energy gets perpetually starved by the
    other. Anti-deadlock rule: if hungry but too broke to buy food, the answer
    is WORK, not a pointless detour to a market you can't afford.
    """
    hunger_def = HUNGER_CRIT - e.hunger
    energy_def = ENERGY_CRIT - e.energy
    if hunger_def <= 0 and energy_def <= 0:
        return None
    if hunger_def >= energy_def:  # hunger is the worse problem
        if e.coin >= market.quote(FOOD):
            return ("buy_food", FOOD_SOURCE)
        return ("work", None)  # earn first; None = use the agent's workplace
    return ("rest", REST_SOURCE)


# --- transactions ------------------------------------------------------------
def resolve(
    agent_id: str, home: str, e: Econ, building_id: str, intent: str, market: Market
) -> list[dict]:
    """Execute one economic action at ``building_id``. Mutates ``e`` and
    ``market`` and returns a list of partial event dicts (the sim stamps
    agentId + ts). Pure, deterministic, bounded."""
    role = role_of(building_id)
    out: list[dict] = []

    def trade(give, get, with_id="market"):
        out.append({"type": "trade", "withId": with_id, "give": give, "get": get})

    def price_marks():
        # Emit the items whose price the market just touched, for the readout.
        for item in (FOOD, ORE, TOOLS, ALE):
            out.append({"type": "price", "_market": True, "item": item, "price": market.quote(item)})

    # ---- consumption: eat / rest at the tavern ----
    # Auto-eat only for explicit buy_food, or a casual tavern visit/trade — NOT
    # when the agent came to rest or work (that hijacked the rest intent).
    if intent == "buy_food" or (role == "tavern" and intent in ("visit", "trade") and e.hunger < 100):
        cost = market.buy(FOOD, 1)
        if e.coin >= cost:
            e.coin -= cost
            e.hunger = _clamp(e.hunger + EAT_RESTORE, 0, 100)
            trade(give={"coin": cost}, get={"item": FOOD, "qty": 1})
            out.append({"type": "consume", "item": FOOD, "qty": 1, "need": "hunger",
                        "restored": round(EAT_RESTORE, 1)})
            out.append({"type": "price", "_market": True, "item": FOOD, "price": market.quote(FOOD)})
        return out

    if intent == "rest":
        # A mug of ale if affordable, else a free sit-down — energy always recovers.
        cost = market.quote(ALE)
        if e.coin >= cost:
            e.coin -= market.buy(ALE, 1)
            trade(give={"coin": round(cost, 2)}, get={"item": ALE, "qty": 1})
        e.energy = _clamp(e.energy + REST_RESTORE, 0, 100)
        out.append({"type": "consume", "item": ALE, "qty": 1, "need": "energy",
                    "restored": round(REST_RESTORE, 1)})
        return out

    # ---- production / earning: work ----
    if role == "forge":
        # Consume ore (buy if none) -> make a tool -> sell it for coin.
        if not e.has(ORE):
            ore_cost = market.buy(ORE, 1)
            if e.coin >= ore_cost:
                e.coin -= ore_cost
                e.add_item(ORE, 1)
                trade(give={"coin": ore_cost}, get={"item": ORE, "qty": 1})
        if e.has(ORE):
            e.add_item(ORE, -1)
            e.add_item(TOOLS, 1)
            out.append({"type": "produce", "building": building_id,
                        "made": {"item": TOOLS, "qty": 1}, "used": {"item": ORE, "qty": 1}})
        # Sell a tool if we hold one.
        if e.has(TOOLS):
            gain = market.sell(TOOLS, 1)
            e.add_item(TOOLS, -1)
            e.coin += gain
            trade(give={"item": TOOLS, "qty": 1}, get={"coin": gain})
            out.append({"type": "price", "_market": True, "item": TOOLS, "price": market.quote(TOOLS)})
        else:
            e.coin += SERVICE_WAGE  # nothing to sell — fall back to a wage
        return out

    if role == "market":
        e.coin += MARKET_WAGE  # the merchant's cut from running the stalls
        return out

    if role == "tavern":
        e.coin += TAVERN_WAGE  # the barkeep's takings
        market.sell(FOOD, 1)  # the kitchen supplies food → eases the food price
        out.append({"type": "price", "_market": True, "item": FOOD, "price": market.quote(FOOD)})
        return out

    # ---- sell surplus at the market ----
    if intent == "sell" and building_id == MARKET:
        sold = False
        for item in (TOOLS, ORE):
            if e.has(item):
                gain = market.sell(item, 1)
                e.add_item(item, -1)
                e.coin += gain
                trade(give={"item": item, "qty": 1}, get={"coin": gain})
                out.append({"type": "price", "_market": True, "item": item, "price": market.quote(item)})
                sold = True
                break
        if not sold:
            e.coin += SERVICE_WAGE
        return out

    # ---- default: service wage for showing up ----
    e.coin += SERVICE_WAGE
    return out
