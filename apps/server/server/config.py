"""Central configuration + cost knobs, all overridable via environment / .env.

Every tunable that affects spend lives here so the cost surface is auditable in
one place. Loaded once at import from the repo-root ``.env`` (R14.1).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# apps/server/server/config.py -> repo root is three parents up.
SERVER_DIR = Path(__file__).resolve().parent.parent  # apps/server
REPO_ROOT = SERVER_DIR.parent.parent  # portfolio/
CACHE_DIR = SERVER_DIR / ".cache"
SIM_LOG_DIR = REPO_ROOT / "public" / "sim-logs"
STATE_DIR = SERVER_DIR / ".state"


def _load_dotenv() -> None:
    """Load the repo-root .env without requiring python-dotenv at import time."""
    try:
        from dotenv import load_dotenv  # type: ignore

        load_dotenv(REPO_ROOT / ".env")
        return
    except Exception:
        pass
    # Minimal fallback parser so the engine still picks up the key offline.
    env = REPO_ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "").strip() or default)
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    # --- provider ---
    api_key: str = os.environ.get("GEMINI_API_KEY", "").strip()
    model: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite").strip()
    embed_model: str = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001").strip()
    # Embeddings default to a free deterministic local hash — the embedding API
    # is the rate-limit bottleneck in a bake and real vectors are only a marginal
    # retrieval gain for a 7-agent day. Opt in with GEMINI_REMOTE_EMBED=1.
    remote_embeddings: bool = os.environ.get("GEMINI_REMOTE_EMBED", "").strip() in ("1", "true", "yes")

    # --- live-mode hard caps (R9) ---
    live_max_agents: int = _int("LIVE_MAX_AGENTS", 6)
    live_token_budget: int = _int("LIVE_TOKEN_BUDGET", 50_000)
    live_timeout_seconds: int = _int("LIVE_TIMEOUT_SECONDS", 600)

    # --- in-character NPC/traveler Q&A ---
    # One guarded endpoint answers a player's typed question in the voice of the
    # NPC they're talking to, grounded in the KB. LIVE whenever a Gemini key is
    # present (default on); set TAVERN_QA_ENABLED=0 to force it off. The key is
    # read here, server-side only — it never reaches the browser bundle.
    tavern_qa_enabled: bool = os.environ.get("TAVERN_QA_ENABLED", "1").strip() not in ("0", "false", "no")
    tavern_answer_max_tokens: int = _int("TAVERN_ANSWER_MAX_TOKENS", 260)
    tavern_answer_timeout: float = float(_int("TAVERN_ANSWER_TIMEOUT", 9))
    tavern_question_max_chars: int = _int("TAVERN_QUESTION_MAX_CHARS", 280)
    tavern_rate_per_min: int = _int("TAVERN_RATE_PER_MIN", 5)
    tavern_rate_per_hour: int = _int("TAVERN_RATE_PER_HOUR", 40)
    # Per-request token backstop (input + output). A single grounded answer over
    # the compact KB is well under this; exceeding it trips the kill switch.
    tavern_request_token_cap: int = _int("TAVERN_REQUEST_TOKEN_CAP", 8_000)
    # Comma-separated allowed origins for the public endpoint. Empty → "*" (dev).
    allowed_origins_raw: str = os.environ.get("TAVERN_ALLOWED_ORIGINS", "").strip()

    # --- per-call output caps (cost) ---
    max_tokens_action: int = 120
    max_tokens_conversation: int = 256
    max_tokens_reflection: int = 256
    max_tokens_planning: int = 512

    # --- per-call timeouts, seconds (R3/R4/R5) ---
    timeout_action: float = 8.0
    timeout_reflection: float = 10.0
    timeout_planning: float = 15.0

    # --- simulation shape ---
    sim_minutes_per_tick: int = 10  # simulated minutes advanced per tick
    reflection_threshold: int = 20  # new memories since last reflection (R3.1)
    retrieval_k: int = 5  # top-k memories returned (R2.5)
    embed_dim: int = 768  # text-embedding-004 dimensionality (offline stub matches)

    @property
    def has_key(self) -> bool:
        return bool(self.api_key)

    @property
    def allowed_origins(self) -> list[str]:
        origins = [o.strip() for o in self.allowed_origins_raw.split(",") if o.strip()]
        return origins or ["*"]

    @property
    def tavern_qa_live(self) -> bool:
        """Live traveler Q&A is only truly on when explicitly enabled AND a key
        exists — otherwise the endpoint reports itself off and the frontend
        falls back to baked chatter."""
        return self.tavern_qa_enabled and self.has_key


CONFIG = Config()
