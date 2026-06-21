"""The runtime agent object (R1): identity + cognitive state.

An ``Agent`` binds a static seed to a live memory stream, position, plan and
current activity. The sim mutates these each tick; the inspector reads snapshots
of them out of the event log.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .economy import Econ, starting_econ
from .llm import LLM
from .memory import MemoryStream
from .world import BUILDING_BY_ID, AgentSeed


@dataclass
class PlanSlot:
    time: int  # simulated hour 0..23
    building: str
    description: str
    intent: str = "visit"  # economic intent (work/buy_food/sell/rest/trade/visit)

    def as_dict(self) -> dict:
        return {"time": self.time, "building": self.building,
                "description": self.description, "intent": self.intent}


class Agent:
    def __init__(self, seed: AgentSeed, llm: LLM):
        self.id = seed.id
        self.name = seed.name
        self.home = seed.home
        self.bio = seed.bio
        self.relationships = dict(seed.relationships)
        self.memory = MemoryStream(llm)
        self.plan: list[PlanSlot] = []
        self.econ: Econ = starting_econ(seed.home)  # coin / needs / inventory
        self.activity = "arriving in town"
        # Start at the home building's standing point.
        home = BUILDING_BY_ID[seed.home]
        self.position: tuple[float, float] = (float(home.approach[0]), float(home.approach[1]))
        self.at_building: Optional[str] = seed.home
        self.activity_emitted_for: Optional[str] = None  # last building we emitted an activity at
        self.in_conversation = False

    # --- plan helpers ---
    def slot_for_hour(self, hour: int) -> Optional[PlanSlot]:
        """The active plan slot for ``hour`` (latest slot whose time <= hour)."""
        active: Optional[PlanSlot] = None
        for s in sorted(self.plan, key=lambda s: s.time):
            if s.time <= hour:
                active = s
        # Before the first slot of the day, fall back to the earliest slot.
        if active is None and self.plan:
            active = min(self.plan, key=lambda s: s.time)
        return active

    def snapshot(self) -> dict:
        """Self-contained state for the event-log meta header + inspector."""
        return {
            "id": self.id,
            "name": self.name,
            "bio": self.bio,
            "home": self.home,
            "relationships": self.relationships,
            "plan": [s.as_dict() for s in self.plan],
            "position": [self.position[0], self.position[1]],
            "activity": self.activity,
            "econ": self.econ.snapshot(),  # initial coin/needs/inventory baseline
        }


def build_agents(seeds: list[AgentSeed], llm: LLM) -> dict[str, Agent]:
    return {s.id: Agent(s, llm) for s in seeds}
