"""Memory stream + cosine retrieval (R2).

Each agent owns an append-only ``MemoryStream``. Entries carry an embedding so
the Stanford-Smallville retrieval score — recency · importance · relevance — can
rank them without scanning raw text. The index is fully in-process (R2.6): no
external vector DB.
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Literal, Optional

from .config import CONFIG
from .llm import LLM

MemoryType = Literal["observation", "action", "reflection", "plan", "injected"]


@dataclass
class Memory:
    t: int  # simulated millisecond timestamp
    type: MemoryType
    text: str
    importance: int = 5  # 1..10
    embedding: list[float] = field(default_factory=list)

    def as_dict(self) -> dict:
        # Embeddings are intentionally omitted from the event log (large + not
        # needed by the frontend inspector).
        return {"t": self.t, "type": self.type, "text": self.text, "importance": self.importance}


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class MemoryStream:
    """Append-only stream with cosine top-k retrieval."""

    # Recency half-life in simulated ms (~one simulated hour). Tunable; only
    # affects ranking, never correctness.
    RECENCY_HALFLIFE_MS = 60 * 60 * 1000

    def __init__(self, llm: LLM):
        self._llm = llm
        self.entries: list[Memory] = []
        self._since_reflection = 0

    def add(
        self,
        t: int,
        type: MemoryType,
        text: str,
        importance: int = 5,
        embed: Optional[bool] = None,
    ) -> Memory:
        m = Memory(t=t, type=type, text=text, importance=max(1, min(10, importance)))
        # Embedding is the most rate-limited call in a bake, so only embed
        # memories likely to be *retrieved* by relevance: observations,
        # reflections, plans, and anything important. Low-value action chatter
        # (arrivals, routine trades) is still rankable by recency + importance
        # and feeds reflection via recent(), so it never needs a vector.
        if embed is None:
            embed = type != "action" or m.importance >= 5
        if embed:
            m.embedding = self._llm.embed(text)
        self.entries.append(m)
        self._since_reflection += 1
        return m

    def recent(self, n: int) -> list[Memory]:
        return self.entries[-n:]

    def needs_reflection(self) -> bool:
        return self._since_reflection >= CONFIG.reflection_threshold

    def mark_reflected(self) -> None:
        self._since_reflection = 0

    def retrieve(self, query: str, now_ms: int, k: Optional[int] = None) -> list[Memory]:
        """Top-k by α·recency + β·importance + γ·relevance (R2.5). Always returns
        at most ``k`` (default CONFIG.retrieval_k) entries."""
        k = k or CONFIG.retrieval_k
        if not self.entries:
            return []
        q = self._llm.embed(query)
        scored: list[tuple[float, Memory]] = []
        for m in self.entries:
            age = max(0, now_ms - m.t)
            recency = 0.5 ** (age / self.RECENCY_HALFLIFE_MS)
            importance = m.importance / 10.0
            relevance = _cosine(q, m.embedding)
            score = 0.5 * recency + 0.3 * importance + 1.0 * relevance
            scored.append((score, m))
        scored.sort(key=lambda s: s[0], reverse=True)
        return [m for _, m in scored[:k]]
