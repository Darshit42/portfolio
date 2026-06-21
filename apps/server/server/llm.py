"""Gemini wrapper: the single choke point for all spend.

Responsibilities:
  * Serve from the persistent cache before ever hitting the network.
  * Account every token against a budget and refuse to exceed it (live mode).
  * Retry once on error, then surface failure so callers apply their fallback.
  * In OFFLINE mode (no key) do everything deterministically with zero calls,
    including embeddings (a stable hash-projection) so the cosine memory index
    still works for local dev and tests.
"""
from __future__ import annotations

import math
import random
import re
import time
from typing import Optional

from .cache import CACHE
from .config import CONFIG


class BudgetExceeded(RuntimeError):
    """Raised when a live session's token budget is exhausted (kill switch)."""


class TokenMeter:
    """Tracks cumulative token spend; a budget of 0 means unlimited (bake mode)."""

    def __init__(self, budget: int = 0):
        self.budget = budget
        self.spent = 0

    def charge(self, tokens: int) -> None:
        self.spent += tokens
        if self.budget and self.spent > self.budget:
            raise BudgetExceeded(f"token budget {self.budget} exhausted (spent {self.spent})")

    @property
    def remaining(self) -> Optional[int]:
        return None if not self.budget else max(0, self.budget - self.spent)


def _approx_tokens(text: str) -> int:
    # ~4 chars/token heuristic; only used when the API omits usage metadata.
    return max(1, len(text) // 4)


class LLM:
    def __init__(self, meter: Optional[TokenMeter] = None):
        self.meter = meter or TokenMeter(budget=0)
        self.offline = not CONFIG.has_key
        self._genai = None
        if not self.offline:
            try:
                import google.generativeai as genai  # type: ignore

                genai.configure(api_key=CONFIG.api_key)
                self._genai = genai
            except Exception:
                # Missing package or bad key → degrade to offline, never crash.
                self.offline = True

    # ------------------------------------------------------------------ text
    def complete(
        self,
        prompt: str,
        *,
        max_output_tokens: int,
        timeout: float,
        temperature: float = 0.9,
    ) -> str:
        """Return model text for ``prompt``. Cached by (model, prompt). Charges
        the meter on a cache hit too, so the budget reflects intended work."""
        cached = CACHE.get_completion(CONFIG.model, prompt)
        if cached is not None:
            text, tokens = cached
            self.meter.charge(tokens)
            return text

        if self.offline:
            # Deterministic + cheap to recompute, so never cache it — caching an
            # offline stub would poison a later real bake that reuses the key.
            return _offline_completion(prompt)

        text, tokens = self._call_with_retry(prompt, max_output_tokens, timeout, temperature)
        self.meter.charge(tokens)
        CACHE.put_completion(CONFIG.model, prompt, text, tokens)
        return text

    def _call_with_retry(
        self, prompt: str, max_output_tokens: int, timeout: float, temperature: float
    ) -> tuple[str, int]:
        model = self._genai.GenerativeModel(CONFIG.model)
        cfg = {"max_output_tokens": max_output_tokens, "temperature": temperature}
        last_err: Optional[Exception] = None
        for attempt in range(2):  # one retry (R14.4)
            try:
                resp = model.generate_content(
                    prompt,
                    generation_config=cfg,
                    request_options={"timeout": timeout},
                )
                text = (resp.text or "").strip()
                tokens = _approx_tokens(prompt) + _approx_tokens(text)
                usage = getattr(resp, "usage_metadata", None)
                if usage is not None:
                    tokens = int(getattr(usage, "total_token_count", tokens) or tokens)
                return text, tokens
            except BudgetExceeded:
                raise
            except Exception as e:  # noqa: BLE001 — provider raises many types
                last_err = e
                if attempt == 0:
                    time.sleep(2)  # R14.4: retry once after 2s
        raise RuntimeError(f"Gemini call failed after retry: {last_err}")

    # ------------------------------------------------------------- embeddings
    def embed(self, text: str) -> list[float]:
        if self.offline or not CONFIG.remote_embeddings:
            # Deterministic local hash (free, no rate limits). Not cached — it's
            # cheap to recompute and caching it would poison a remote-embed run.
            return _offline_embedding(text)
        cached = CACHE.get_embedding(CONFIG.embed_model, text)
        if cached is not None:
            return cached
        try:
            model = CONFIG.embed_model
            if not model.startswith("models/"):
                model = f"models/{model}"
            r = self._genai.embed_content(
                model=model, content=text, output_dimensionality=CONFIG.embed_dim
            )
            vec = list(r["embedding"])
            self.meter.charge(_approx_tokens(text))
            CACHE.put_embedding(CONFIG.embed_model, text, vec)
            return vec
        except Exception:
            # Never block the sim on embeddings; use the stub but don't cache it.
            return _offline_embedding(text)


# --------------------------------------------------------------- offline stubs
def _offline_embedding(text: str) -> list[float]:
    """Deterministic pseudo-embedding: hash tokens into a fixed-dim bag-of-words
    vector, L2-normalised. Semantically weak but stable — lets cosine retrieval
    function with zero API cost for dev/tests."""
    dim = CONFIG.embed_dim
    vec = [0.0] * dim
    for tok in re.findall(r"[a-z0-9]+", text.lower()):
        h = hash(tok) % dim
        vec[h] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


_OFFLINE_LINES = [
    "The night is quiet, but the work is never done.",
    "Another traveller passed through. I wonder what they seek.",
    "I should check on the others before the watch changes.",
    "Trade was fair today. The ledger balances.",
    "Strange omens in the wire. I keep my counsel.",
    "Steel and ember — that is honest labour.",
]


def _offline_completion(prompt: str) -> str:
    """Deterministic stand-in keyed on the prompt so offline bakes are stable.
    Higher layers parse structured output, so for plan/conversation prompts they
    fall back to their own templates; this covers free-text asks."""
    rng = random.Random(hash(prompt) & 0xFFFFFFFF)
    return rng.choice(_OFFLINE_LINES)
