"""Agent Town simulation engine.

Smallville-style generative agents for Devhalla. This package runs entirely
server-side; it is never imported by or bundled into the Vite frontend. Its only
output that the frontend consumes is a baked, append-only event log written to
``public/sim-logs/default.json``.

Cost is bounded by design:
  * Visitors only ever replay the baked log — zero LLM calls at runtime.
  * Every LLM call is cached on disk (``apps/server/.cache``), so re-bakes are
    almost entirely cache hits.
  * Without ``GEMINI_API_KEY`` the engine runs in deterministic OFFLINE mode —
    plausible templated content, zero API calls.
  * Live mode is hard-capped by a token budget + timeout kill switch.
"""

__version__ = "0.1.0"
