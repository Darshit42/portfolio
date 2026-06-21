"""The simulation engine: tick loop + reflection + planning (R5).

Drives agents through one simulated day and emits world events. Action
*selection* is deterministic and rule-based (move > speak > activity, R5.3);
only the creative text (conversation, reflection, plan, activity line) spends
tokens, all cached. Movement legs emit a ``move`` now and an ``arrive`` at a
future timestamp computed from the frontend's 3 u/s walk speed, so the player
sees the walk play out before the agent snaps to idle.
"""
from __future__ import annotations

import math
import time
from typing import Optional

from . import cognition, economy
from .agents import Agent
from .config import CONFIG
from .agents import build_agents
from .economy import Market
from .events import EventLog, make_event
from .llm import LLM
from .world import BUILDING_BY_ID, WORLD_CENTER, WORLD_RADIUS, AgentSeed

HEARTBEAT_TICKS = 12  # emit a stat snapshot at least this often (≈2 sim-hours)

WALK_SPEED = 3.0  # world units / real second — must match the frontend (R10.1)
PLAYBACK = 60.0  # 60x: 1 real second = 60 simulated seconds (R8.2)
HOUR_MS = 3600 * 1000
TALK_GAP_MS = 4 * PLAYBACK * 1000  # 4s of bubble time, in simulated ms
TALK_COOLDOWN_MS = 2 * HOUR_MS  # a given pair won't re-converse for ~2 sim hours
SPEAK_RADIUS = 5.0

START_HOUR = 6  # the simulated day runs 06:00 -> 06:00 next day


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _stand_offset(agent_id: str) -> tuple[float, float]:
    """A small deterministic offset so agents that share a building's approach
    point stand beside each other instead of stacking on the exact same spot
    (which made co-located pairs re-converse forever)."""
    ang = (hash(agent_id) % 360) * math.pi / 180.0
    r = 1.6
    return (math.cos(ang) * r, math.sin(ang) * r)


def _econ_memory(name: str, ev: dict) -> str:
    """A short first-person memory line for an economy event (feeds reflection
    + planning, so the economy influences future LLM choices)."""
    if ev["type"] == "trade":
        give, get = ev["give"], ev["get"]
        g = f"{give.get('qty', '')} {give['item']}" if "item" in give else f"{give['coin']:.0f}c"
        r = f"{get.get('qty', '')} {get['item']}" if "item" in get else f"{get['coin']:.0f}c"
        return f"Traded {g} for {r}."
    if ev["type"] == "produce":
        return f"Forged {ev['made']['qty']} {ev['made']['item']}."
    if ev["type"] == "consume":
        return f"Consumed {ev['qty']} {ev['item']} (+{ev['restored']:.0f} {ev['need']})."
    return "Did some business."


def _clamp_disc(p: tuple[float, float]) -> tuple[float, float]:
    ox, oz = p[0] - WORLD_CENTER[0], p[1] - WORLD_CENTER[1]
    d = math.hypot(ox, oz)
    if d > WORLD_RADIUS:
        return (WORLD_CENTER[0] + ox / d * WORLD_RADIUS, WORLD_CENTER[1] + oz / d * WORLD_RADIUS)
    return p


class Simulation:
    def __init__(self, llm: LLM, log: EventLog, seeds: list[AgentSeed]):
        self.llm = llm
        self.log = log
        self.agents: dict[str, Agent] = build_agents(seeds, llm)
        self.clock_ms = START_HOUR * HOUR_MS
        self._last_talk: dict[frozenset, int] = {}
        self.market = Market()
        self._tick = 0
        self._last_stat: dict[str, str] = {}  # agent id -> last-emitted stat hash
        # Spread agents off their exact home approach point so they don't stack.
        for ag in self.agents.values():
            ox, oz = _stand_offset(ag.id)
            ag.position = _clamp_disc((ag.position[0] + ox, ag.position[1] + oz))

    # --------------------------------------------------------------- lifecycle
    def hour(self) -> int:
        return int((self.clock_ms // HOUR_MS) % 24)

    def run_day(self, pace: float = 0.0, should_stop=None) -> None:
        """Run one simulated day. ``pace`` sleeps that many real seconds after
        each tick (live mode paces ~5s/tick so events stream in near-real-time);
        ``should_stop`` is polled to end early (disconnect / kill switch)."""
        self._spawn()
        self._planning_pass()
        ticks = 24 * 60 // CONFIG.sim_minutes_per_tick
        for _ in range(ticks):
            if should_stop is not None and should_stop():
                return
            self.tick()
            self.clock_ms += CONFIG.sim_minutes_per_tick * 60 * 1000
            if pace > 0:
                time.sleep(pace)

    def _spawn(self) -> None:
        for ag in self.agents.values():
            self.log.emit(
                make_event("arrive", ag.id, self.clock_ms, building=ag.home,
                           pos=[ag.position[0], ag.position[1]])
            )
            self._emit_stat(ag, force=True)  # baseline econ state at t0
        self._emit_prices()

    def _planning_pass(self) -> None:
        for ag in self.agents.values():
            ag.plan = cognition.plan_day(self.llm, ag, self.clock_ms)
            ag.memory.add(self.clock_ms, "plan", f"Today's plan: " +
                          "; ".join(f"{s.time}:00 {s.description}" for s in ag.plan), importance=4)

    # -------------------------------------------------------------------- tick
    def tick(self) -> None:
        self._tick += 1
        # Deterministic needs decay + market mean-reversion every tick (no LLM).
        for ag in self.agents.values():
            economy.decay(ag.econ)
        self.market.relax()
        spoken = self._conversations()
        for ag in self.agents.values():
            if ag.id in spoken:
                continue
            self._act(ag)
        self._reflections()
        # Low-frequency heartbeat so the inspector's numbers never lag far
        # behind a slowly-decaying need even when no trade happened.
        if self._tick % HEARTBEAT_TICKS == 0:
            for ag in self.agents.values():
                self._emit_stat(ag)
            self._emit_prices()  # capture the mean-reversion drift in the readout

    def _conversations(self) -> set[str]:
        """Pair up adjacent, free agents and generate one exchange each (R5.4)."""
        busy: set[str] = set()
        ids = list(self.agents)
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                a, b = self.agents[ids[i]], self.agents[ids[j]]
                if a.id in busy or b.id in busy:
                    continue
                pair = frozenset((a.id, b.id))
                if self.clock_ms - self._last_talk.get(pair, -TALK_COOLDOWN_MS) < TALK_COOLDOWN_MS:
                    continue  # cooldown: don't re-converse the same pair too soon
                if _dist(a.position, b.position) <= SPEAK_RADIUS:
                    self._converse(a, b)
                    self._last_talk[pair] = self.clock_ms
                    busy.add(a.id)
                    busy.add(b.id)
        return busy

    def _converse(self, a: Agent, b: Agent) -> None:
        turns = cognition.generate_conversation(self.llm, a, b, self.clock_ms)
        for k, (speaker_id, text) in enumerate(turns):
            ts = self.clock_ms + int(k * TALK_GAP_MS)
            target = b.id if speaker_id == a.id else a.id
            self.log.emit(make_event("speak", speaker_id, ts, text=text, targetAgentId=target))
            # Both participants remember the utterance (R6.4).
            for ag in (a, b):
                ag.memory.add(ts, "observation", f"{self.agents[speaker_id].name}: {text}",
                              importance=4)
        a.activity = f"talking with {b.name}"
        b.activity = f"talking with {a.name}"

    def _act(self, ag: Agent) -> None:
        intent, target_id, urgent = self._intent_and_target(ag)

        if ag.at_building != target_id:
            self._move(ag, target_id)  # walk to the scheduled / urgent building
        elif urgent or ag.activity_emitted_for != target_id:
            # First arrival → settle with flavor. An *urgent* need lets the agent
            # re-transact at the same spot (eat again / rest again) instead of
            # idling while the need bleeds out — this is self-limiting because
            # resolving the need clears the urgency next tick.
            self._settle(ag, target_id, intent, flavor=ag.activity_emitted_for != target_id)
        # else: already arrived and acted, no urgent need — idle in place.

    def _intent_and_target(self, ag: Agent) -> tuple[str, str, bool]:
        """Deterministic urgent override (resolve the real blocker) else follow
        the LLM-authored plan slot. ``work`` with no explicit building means the
        agent's own post (home). Returns (intent, building, is_urgent)."""
        override = economy.urgent_override(ag.econ, self.market)
        if override is not None:
            intent, building = override
            return intent, (building or ag.home), True
        slot = ag.slot_for_hour(self.hour())
        if slot is None:
            return "work", ag.home, False
        return slot.intent, slot.building, False

    def _settle(self, ag: Agent, building_id: str, intent: str, flavor: bool = True) -> None:
        """Run one economic action at the building, emit its events (+ flavor on
        the first arrival only, so urgent re-transactions don't spam activity)."""
        building = BUILDING_BY_ID[building_id]
        events = economy.resolve(ag.id, ag.home, ag.econ, building_id, intent, self.market)
        for ev in events:
            self._emit_econ(ag, ev)
        if flavor:
            line = cognition.activity_line(self.llm, ag, building)  # LLM, cached
            ag.activity = line
            self.log.emit(make_event("activity", ag.id, self.clock_ms,
                                     building=building_id, description=line))
            ag.memory.add(self.clock_ms, "action", f"At {building.label}: {line}", importance=2)
        ag.activity_emitted_for = building_id
        self._emit_stat(ag, force=True)  # state changed → snapshot now (on-change cadence)

    def _emit_econ(self, ag: Agent, ev: dict) -> None:
        """Stamp + emit one economy event and record a memory of it."""
        kind = ev["type"]
        if kind == "price":
            # Market-wide; attributed to the pseudo-agent "market".
            self.log.emit(make_event("price", "market", self.clock_ms,
                                     item=ev["item"], price=ev["price"]))
            return
        fields = {k: v for k, v in ev.items() if k not in ("type", "_market")}
        self.log.emit(make_event(kind, ag.id, self.clock_ms, **fields))
        ag.memory.add(self.clock_ms, "action", _econ_memory(ag.name, ev), importance=3)

    def _emit_prices(self) -> None:
        for item, price in self.market.price.items():
            self.log.emit(make_event("price", "market", self.clock_ms,
                                     item=item, price=round(price, 2)))

    def _emit_stat(self, ag: Agent, force: bool = False) -> None:
        snap = ag.econ.snapshot()
        key = repr(snap)
        if not force and self._last_stat.get(ag.id) == key:
            return  # unchanged since last emit — skip (keeps the log lean)
        self._last_stat[ag.id] = key
        self.log.emit(make_event("stat", ag.id, self.clock_ms,
                                 coin=snap["coin"], needs=snap["needs"], inventory=snap["inventory"]))

    def _move(self, ag: Agent, target_id: str) -> None:
        target = BUILDING_BY_ID[target_id]
        ox, oz = _stand_offset(ag.id)
        dest = _clamp_disc((float(target.approach[0]) + ox, float(target.approach[1]) + oz))
        leg = _dist(ag.position, dest)
        travel_ms = int((leg / WALK_SPEED) * PLAYBACK * 1000)  # real seconds -> sim ms

        self.log.emit(make_event("move", ag.id, self.clock_ms,
                                 targetBuilding=target_id, targetPos=[dest[0], dest[1]]))
        arrive_ts = self.clock_ms + max(1, travel_ms)
        self.log.emit(make_event("arrive", ag.id, arrive_ts,
                                 building=target_id, pos=[dest[0], dest[1]]))
        ag.position = dest
        ag.at_building = target_id
        ag.activity_emitted_for = None  # let an activity emit once we settle in
        ag.activity = f"heading to {target.label}"
        ag.memory.add(arrive_ts, "action", f"Arrived at {target.label}.", importance=3)

    def _reflections(self) -> None:
        for ag in self.agents.values():
            if not ag.memory.needs_reflection():
                continue
            insights = cognition.reflect(self.llm, ag, self.clock_ms)
            ag.memory.mark_reflected()
            for ins in insights:
                ag.memory.add(self.clock_ms, "reflection", ins, importance=6)
            self.log.emit(make_event("reflect", ag.id, self.clock_ms, summary=insights[0]))

    # ------------------------------------------------------------------- meta
    def meta(self, started: float) -> dict:
        return {
            "version": 2,  # v2 = economy events present (v1 logs still replay)
            "playbackRate": PLAYBACK,
            "walkSpeed": WALK_SPEED,
            "dayHours": 24,
            "startHour": START_HOUR,
            "agents": [ag.snapshot() for ag in self.agents.values()],
            "items": list(economy.PRICE_TABLE.keys()),
            "bakedAt": int(time.time()),
            "bakeSeconds": round(time.time() - started, 1),
        }

    def economy_summary(self) -> dict:
        """End-of-run economy report — eyeball whether the market reached a
        sensible equilibrium or quietly collapsed. Surfaces the degenerate cases
        (bankruptcy, stuck-critical needs, prices pinned to a clamp bound)."""
        m = self.market
        agents = []
        warnings: list[str] = []
        for ag in self.agents.values():
            e = ag.econ
            agents.append({
                "id": ag.id, "name": ag.name, "coin": round(e.coin, 1),
                "hunger": round(e.hunger, 0), "energy": round(e.energy, 0),
                "inventory": dict(e.inventory),
            })
            if e.coin <= 0:
                warnings.append(f"{ag.name} is bankrupt (coin {e.coin:.0f})")
            if e.hunger < economy.HUNGER_CRIT:
                warnings.append(f"{ag.name} ended critically hungry ({e.hunger:.0f})")
            if e.energy < economy.ENERGY_CRIT:
                warnings.append(f"{ag.name} ended critically tired ({e.energy:.0f})")
        prices = {}
        for item in m.price:
            prices[item] = {
                "final": round(m.price[item], 2),
                "low": round(m.lo_seen[item], 2),
                "high": round(m.hi_seen[item], 2),
                "floor": m.lo[item], "ceil": m.hi[item],
            }
            if m.price[item] <= m.lo[item] + 1e-6:
                warnings.append(f"{item} price pinned at floor ({m.lo[item]})")
            if m.price[item] >= m.hi[item] - 1e-6:
                warnings.append(f"{item} price pinned at ceiling ({m.hi[item]})")
        return {"agents": agents, "prices": prices, "warnings": warnings}
