"""The worldly traveler's guarded Q&A (POST /ask).

Guardrails, all converging on the ONE existing LLM choke point (``llm.LLM``):
  * kill switch      — CONFIG.tavern_qa_live (env TAVERN_QA_ENABLED + a key)
  * rate limit       — per-IP token bucket (per-minute + per-hour), in-process
  * per-request cap  — a TokenMeter budget (BudgetExceeded → kill switch)
  * output cap       — max_output_tokens on the call
  * input cap        — question hard-trimmed before it reaches the model
  * timeout          — passed to LLM.complete AND enforced by the async caller
  * cache            — free, via LLM.complete's persistent (model, prompt) cache

Any failure returns ``{"ok": False, "reason": ...}`` so the frontend degrades to
baked chatter. It never raises to the route. There is no second cache and no new
dependency: grounding is a compact prompt, not a vector DB.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Deque

from . import kb
from .config import CONFIG
from .llm import LLM, BudgetExceeded, TokenMeter


class _RateLimiter:
    """In-process per-key sliding-window limiter. Memory is bounded: each key
    keeps at most one hour of timestamps, pruned on every check."""

    def __init__(self, per_min: int, per_hour: int):
        self.per_min = per_min
        self.per_hour = per_hour
        self._hits: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            q = self._hits[key]
            cutoff = now - 3600
            while q and q[0] < cutoff:
                q.popleft()
            last_min = sum(1 for t in q if t >= now - 60)
            if last_min >= self.per_min or len(q) >= self.per_hour:
                return False
            q.append(now)
            # Drop empty keys occasionally so the dict can't grow unbounded.
            if len(self._hits) > 4096:
                for k in [k for k, v in self._hits.items() if not v]:
                    self._hits.pop(k, None)
            return True


_LIMITER = _RateLimiter(CONFIG.tavern_rate_per_min, CONFIG.tavern_rate_per_hour)


def answer_question(ip: str, question: str) -> dict:
    """Blocking; run under a thread + wall-clock timeout by the async route."""
    if not CONFIG.tavern_qa_enabled:
        return {"ok": False, "reason": "disabled"}
    if not CONFIG.has_key:
        return {"ok": False, "reason": "offline"}
    if not kb.available():
        return {"ok": False, "reason": "no_kb"}

    q = (question or "").strip()[: CONFIG.tavern_question_max_chars]
    if not q:
        return {"ok": False, "reason": "empty"}

    if not _LIMITER.allow(ip or "anon"):
        return {"ok": False, "reason": "rate"}

    meter = TokenMeter(budget=CONFIG.tavern_request_token_cap)  # per-request kill switch
    llm = LLM(meter)
    if llm.offline:  # key present but SDK/init failed → degrade
        return {"ok": False, "reason": "offline"}

    prompt = kb.build_prompt(q)
    try:
        text = llm.complete(
            prompt,
            max_output_tokens=CONFIG.tavern_answer_max_tokens,
            timeout=CONFIG.tavern_answer_timeout,
            temperature=0.4,
        )
    except BudgetExceeded:
        return {"ok": False, "reason": "budget"}
    except Exception:  # noqa: BLE001 — provider raises many types; never leak it
        return {"ok": False, "reason": "error"}

    text = (text or "").strip()
    if not text:
        return {"ok": False, "reason": "empty_answer"}
    return {"ok": True, "answer": text}
