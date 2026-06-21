"""LLM-backed cognition: planning, conversation, reflection, activity lines.

Every function here is cost-aware: it tries the cached/Gemini path and, on
timeout/parse-failure/offline, falls back to a deterministic template so the
simulation never stalls (R3.4, R4.4, R5.6, R6). Action *selection* is rule-based
(see sim.py) — only the genuinely creative outputs spend tokens.
"""
from __future__ import annotations

import json
import re
from typing import Optional

from .agents import Agent, PlanSlot
from .config import CONFIG
from .economy import INTENTS
from .llm import LLM
from .world import BUILDING_BY_ID, VALID_BUILDING_IDS, Building

_HOME_NEIGHBOURS = {  # cheap default-plan targets when the LLM is unavailable
    "null-pointer-tavern": ["finddder-market", "gate-of-contact", "the-arena"],
    "guild-hall": ["spire-of-training", "the-arena", "agent-forge"],
    "oracles-booth": ["finddder-market", "spire-of-training", "skill-shrine"],
    "agent-forge": ["guild-hall", "the-arena", "skill-shrine"],
    "finddder-market": ["null-pointer-tavern", "oracles-booth", "the-arena"],
    "gate-of-contact": ["null-pointer-tavern", "the-arena", "finddder-market"],
}


def _extract_json(text: str):
    """Pull the first JSON array/object out of a model response."""
    for opener, closer in (("[", "]"), ("{", "}")):
        i = text.find(opener)
        j = text.rfind(closer)
        if i != -1 and j != -1 and j > i:
            try:
                return json.loads(text[i : j + 1])
            except json.JSONDecodeError:
                continue
    return None


def _clamp_building(bid: str, home: str) -> str:
    return bid if bid in VALID_BUILDING_IDS else home


# --------------------------------------------------------------------- planning
def plan_day(llm: LLM, agent: Agent, now_ms: int) -> list[PlanSlot]:
    mems = agent.memory.retrieve(f"{agent.name}'s goals and routine", now_ms)
    mem_text = "; ".join(m.text for m in mems) or "no strong memories yet"
    buildings = ", ".join(f"{b.id} ({b.label})" for b in BUILDING_BY_ID.values())
    e = agent.econ
    inv = ", ".join(f"{k}:{v}" for k, v in e.inventory.items()) or "empty"
    # Economic status is the LLM's decision context (the only LLM-driven choice):
    # given needs + coin, it picks an INTENT per slot; deterministic code executes.
    prompt = (
        f"You are {agent.name}. {agent.bio}\n"
        f"Recent memories: {mem_text}\n"
        f"Your status — coin: {e.coin:.0f}, hunger: {e.hunger:.0f}/100, "
        f"energy: {e.energy:.0f}/100, inventory: {inv}.\n"
        f"Town buildings: {buildings}\n"
        "Economy: work at agent-forge/finddder-market/null-pointer-tavern or your post "
        "earns coin; buy_food and rest at null-pointer-tavern restore hunger/energy; "
        "sell surplus goods at finddder-market.\n\n"
        "Plan today as a JSON array of 4-8 objects, each "
        '{"time": <hour 0-23>, "building": "<id>", "intent": '
        '"work"|"buy_food"|"sell"|"rest"|"trade"|"visit", "description": "<short>"}. '
        "Balance earning against hunger/energy. Times strictly increasing. "
        "Use only the building ids listed. JSON only."
    )
    try:
        raw = llm.complete(
            prompt, max_output_tokens=CONFIG.max_tokens_planning, timeout=CONFIG.timeout_planning,
            temperature=0.8,
        )
        data = _extract_json(raw)
        slots: list[PlanSlot] = []
        if isinstance(data, list):
            for item in data:
                if not isinstance(item, dict):
                    continue
                t = int(item.get("time", 8))
                b = _clamp_building(str(item.get("building", agent.home)), agent.home)
                intent = str(item.get("intent", "visit")).lower()
                if intent not in INTENTS:
                    intent = "visit"
                d = str(item.get("description", "tending to business"))[:80]
                slots.append(PlanSlot(max(0, min(23, t)), b, d, intent))
        slots = [s for s in slots if s.building]
        if 4 <= len(slots) <= 8:
            slots.sort(key=lambda s: s.time)
            return slots
    except Exception as e2:  # noqa: BLE001
        print(f"[plan] {agent.id} fell back: {e2}")
    return _default_plan(agent)


def _default_plan(agent: Agent) -> list[PlanSlot]:
    """Deterministic fallback: a sensible work/eat/sell/rest loop by role."""
    home = agent.home
    neigh = _HOME_NEIGHBOURS.get(home, [home])
    return [
        PlanSlot(7, home, "open the day's work", "work"),
        PlanSlot(11, "null-pointer-tavern", "midday meal", "buy_food"),
        PlanSlot(15, _clamp_building(neigh[0] if neigh else home, home), "afternoon trade", "sell"),
        PlanSlot(20, "null-pointer-tavern", "rest for the evening", "rest"),
    ]


# ----------------------------------------------------------------- conversation
def generate_conversation(llm: LLM, a: Agent, b: Agent, now_ms: int) -> list[tuple[str, str]]:
    """Return [(speaker_id, text), ...], 2-4 turns alternating a/b (R6)."""
    rel = a.relationships.get(b.id, "an acquaintance")
    am = "; ".join(m.text for m in a.memory.retrieve(f"talking to {b.name}", now_ms)) or "—"
    prompt = (
        f"Two townsfolk meet. A = {a.name}: {a.bio} A sees B as {rel}. "
        f"A's recent memories: {am}. B = {b.name}: {b.bio}\n"
        "Write a brief exchange of 2-4 turns as a JSON array of "
        '{"speaker": "A"|"B", "text": "<=110 chars, in character"}, starting with A. JSON only.'
    )
    try:
        raw = llm.complete(
            prompt, max_output_tokens=CONFIG.max_tokens_conversation,
            timeout=CONFIG.timeout_action, temperature=0.95,
        )
        data = _extract_json(raw)
        turns: list[tuple[str, str]] = []
        if isinstance(data, list):
            for item in data[:4]:
                if not isinstance(item, dict):
                    continue
                spk = a.id if str(item.get("speaker", "A")).upper().startswith("A") else b.id
                txt = str(item.get("text", "")).strip()[:118]
                if txt:
                    turns.append((spk, txt))
        if len(turns) >= 2:
            return turns
    except Exception as e:  # noqa: BLE001
        print(f"[talk] {a.id}/{b.id} fell back: {e}")
    return [
        (a.id, f"Well met, {b.name}. Quiet watch tonight?"),
        (b.id, f"Quiet enough, {a.name}. Long may it last."),
    ]


# ------------------------------------------------------------------- reflection
def reflect(llm: LLM, agent: Agent, now_ms: int) -> list[str]:
    recent = agent.memory.recent(CONFIG.reflection_threshold)
    text = "\n".join(f"- {m.text}" for m in recent) or "- a quiet day"
    prompt = (
        f"You are {agent.name}. {agent.bio}\nRecent experiences:\n{text}\n\n"
        "In a JSON array of 3-5 short strings, state higher-level insights about "
        "what these experiences mean to you and how you feel. JSON only."
    )
    try:
        raw = llm.complete(
            prompt, max_output_tokens=CONFIG.max_tokens_reflection,
            timeout=CONFIG.timeout_reflection, temperature=0.7,
        )
        data = _extract_json(raw)
        if isinstance(data, list):
            out = [str(x).strip()[:120] for x in data if str(x).strip()][:5]
            if len(out) >= 3:
                return out
    except Exception as e:  # noqa: BLE001
        print(f"[reflect] {agent.id} fell back: {e}")
    return [
        f"The days in town blur together, yet {agent.name} keeps a steady course.",
        "The faces I meet are becoming familiar.",
        "There is comfort in honest, repeated work.",
    ]


# --------------------------------------------------------------------- activity
def activity_line(llm: LLM, agent: Agent, building: Building) -> str:
    """One short present-tense activity description (R5.5). Cached by
    (agent, building) so a stationary agent never re-spends."""
    prompt = (
        f"You are {agent.name}. {agent.bio}\n"
        f"You are at {building.label}. In ONE short present-tense clause "
        "(<=60 chars), describe what you are doing. No quotes."
    )
    try:
        raw = llm.complete(
            prompt, max_output_tokens=CONFIG.max_tokens_action,
            timeout=CONFIG.timeout_action, temperature=0.8,
        )
        line = re.sub(r"\s+", " ", raw).strip().strip('"')[:70]
        if line and "{" not in line:
            return line
    except Exception as e:  # noqa: BLE001
        print(f"[activity] {agent.id} fell back: {e}")
    return f"tending to matters at {building.label}"
