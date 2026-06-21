"""World event schema, validation, and the log writer (R7, R17).

Events are the only coupling between sim and frontend. Each is a small JSON
object with a ``type``, an ``agentId`` and a simulated-ms ``ts``, plus
type-specific fields. The writer validates every event against its required
fields and skips (logging) anything malformed rather than corrupting the log.

On-disk format: the baked log is a single JSON document
``{ "meta": {...}, "events": [ ... ] }`` (R17.2 — parseable by JSON.parse with
no custom parser). The live SSE stream sends the same event objects one per
message.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

# Core events (log version 1) + economy events (version 2, additive). Old
# version-1 logs replay unchanged; frontends treat unknown types as no-ops.
EVENT_TYPES = {
    "move", "speak", "arrive", "reflect", "activity",
    "trade", "produce", "consume", "price", "stat",
}

# Required fields per type, beyond the common (type, agentId, ts).
_REQUIRED: dict[str, tuple[str, ...]] = {
    "move": ("targetBuilding", "targetPos"),
    "speak": ("text", "targetAgentId"),
    "arrive": ("building", "pos"),
    "activity": ("building", "description"),
    "reflect": ("summary",),
    # --- economy (v2) ---
    "trade": ("withId", "give", "get"),
    "produce": ("building", "made"),
    "consume": ("item", "qty", "need", "restored"),
    "price": ("item", "price"),
    "stat": ("coin", "needs", "inventory"),
}


def make_event(type: str, agent_id: str, ts: int, **fields: Any) -> dict:
    ev = {"type": type, "agentId": agent_id, "ts": int(ts)}
    ev.update(fields)
    return ev


def validate(ev: dict) -> bool:
    """True if ``ev`` has the common + type-specific required fields (R17.4)."""
    if ev.get("type") not in EVENT_TYPES:
        return False
    if not isinstance(ev.get("agentId"), str) or not ev["agentId"]:
        return False
    if not isinstance(ev.get("ts"), int):
        return False
    for f in _REQUIRED[ev["type"]]:
        if f not in ev:
            return False
    # text length guard (R7.3 / R6.3)
    if ev["type"] == "speak" and len(ev.get("text", "")) > 120:
        ev["text"] = ev["text"][:117] + "..."
    return True


class EventLog:
    """Accumulates validated events; serialises to the baked-log JSON document."""

    def __init__(self, meta: dict[str, Any], on_emit=None):
        self.meta = meta
        self.events: list[dict] = []
        self.skipped = 0
        # Optional callback invoked with each validated event — used by the live
        # SSE server to stream events as they are produced.
        self._on_emit = on_emit

    def emit(self, ev: dict) -> bool:
        if not validate(ev):
            self.skipped += 1
            print(f"[events] skipping malformed event: {ev}")
            return False
        self.events.append(ev)
        if self._on_emit is not None:
            self._on_emit(ev)
        return True

    def extend(self, evs: Iterable[dict]) -> None:
        for ev in evs:
            self.emit(ev)

    def to_document(self) -> dict:
        # Stable-sort by ts so the baked log replays in timestamp order even
        # though move/arrive and spaced conversation turns are emitted with
        # future timestamps (R7.7). Equal-ts events keep emission order.
        events = sorted(self.events, key=lambda e: e["ts"])
        return {"meta": self.meta, "events": events}

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_document(), separators=(",", ":")), encoding="utf-8")
