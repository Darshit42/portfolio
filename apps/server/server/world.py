"""Static world + agent seed data, mirrored from the frontend.

Kept deliberately in sync with ``src/data/buildings.ts`` and ``src/data/npcs.ts``
so the sim reasons about the same town the player walks. Building ids and
approach points are the contract between sim and frontend; if a building moves in
buildings.ts, update its ``approach`` here and re-bake.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Building:
    id: str
    label: str
    position: tuple[float, float]
    approach: tuple[float, float]  # where an agent stands at this building
    half: tuple[float, float]
    solid: bool = True


# Mirror of BUILDINGS in src/data/buildings.ts (approach = NPC standing point).
BUILDINGS: list[Building] = [
    Building("spire-of-training", "Spire of Training", (-19, -24), (-19, -16), (4, 4)),
    Building("guild-hall", "Open Source Guild Hall", (19, -24), (19, -16), (6, 5)),
    Building("oracles-booth", "Oracle's Booth", (-31, -2), (-23, -2), (4, 4)),
    Building("agent-forge", "The Agent Forge", (31, -2), (23, -2), (6, 6)),
    Building("finddder-market", "Finddder Market", (-19, 17), (-19, 9), (5, 4)),
    Building("the-arena", "The Arena", (19, 17), (19, 9), (6, 6), solid=False),
    Building("skill-shrine", "Shrine of Mastery", (0, -30), (0, -22), (3.5, 3.5)),
    Building("null-pointer-tavern", "Null Pointer Tavern", (0, 32), (0, 26), (6, 5)),
    Building("gate-of-contact", "Gate of Contact", (0, 41), (0, 36), (5, 2)),
]

BUILDING_BY_ID = {b.id: b for b in BUILDINGS}
VALID_BUILDING_IDS = set(BUILDING_BY_ID)

WORLD_CENTER = (0.0, 1.0)
WORLD_RADIUS = 48.0


@dataclass
class AgentSeed:
    id: str
    name: str
    home: str  # building id the agent is anchored to
    bio: str
    relationships: dict[str, str] = field(default_factory=dict)


# The seven NPCs (R1.2). Bios are distilled from each NPC's existing dialog so
# the autonomous behaviour stays in-character with the scripted lines.
AGENT_SEEDS: list[AgentSeed] = [
    AgentSeed(
        "barkeep", "The Barkeep", "null-pointer-tavern",
        "A wry, watchful tavern-keeper at the Null Pointer. Knows every regular, "
        "trades gossip for coin, and quietly steers lost travellers toward what "
        "they're really looking for. Fond of dangling-reference jokes.",
        {"merchant": "an old drinking acquaintance", "guard": "respects his vigil"},
    ),
    AgentSeed(
        "guildmaster", "The Guildmaster", "guild-hall",
        "Keeper of the Open Source Guild Hall, where every plaque is a merged pull "
        "request. Proud, meritocratic, allergic to credit not earned in the open. "
        "Mentors newcomers but expects proof of work.",
        {"automaton": "admires its relentless self-improvement", "oracle": "wary of its riddles"},
    ),
    AgentSeed(
        "oracle", "The Oracle", "oracles-booth",
        "A voice in the wire who answers the calls no human has hours for. Speaks "
        "of consent, handshakes and trust as if they were sacred rites. Cryptic, "
        "calm, never hurried.",
        {"guildmaster": "trades cautious courtesies", "automaton": "kindred machine-spirit"},
    ),
    AgentSeed(
        "automaton", "The Automaton", "agent-forge",
        "A self-healing machine forged to mend what makers abandon. Reads the "
        "trace, shapes the patch, learns from every verified fix. Earnest, literal, "
        "quietly determined to be better tomorrow than today.",
        {"blacksmith": "shares the forge", "oracle": "kindred machine-spirit"},
    ),
    AgentSeed(
        "merchant", "Wandering Merchant", "finddder-market",
        "A scavenger of bargains who finds what others overlook. Restless, "
        "opportunistic, always angling for the next deal. Pays in coin for slain "
        "bugs and tall tales alike.",
        {"barkeep": "an old drinking acquaintance", "blacksmith": "haggles over scrap"},
    ),
    AgentSeed(
        "blacksmith", "The Blacksmith", "agent-forge",
        "Hammers scrap and ember into things worth swinging. Believes everything "
        "in town was beaten into shape, people included. Gruff, generous, proud of "
        "honest labour.",
        {"automaton": "shares the forge", "merchant": "haggles over scrap"},
    ),
    AgentSeed(
        "guard", "Gate Sentinel", "gate-of-contact",
        "Stands the southern Gate of Contact, which opens only to those who have "
        "gathered every relic. Dutiful, terse, faintly weary of repeating the "
        "rules. Secretly likes the company of passers-by.",
        {"barkeep": "shares late-watch drinks", "guildmaster": "respects earned merit"},
    ),
]
