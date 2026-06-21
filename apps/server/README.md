# Agent Town — simulation engine

Smallville-style autonomous agents for Devhalla. The seven town NPCs get a
cognitive loop (memory stream → reflection → daily planning), wander the 3D
town, use buildings, and converse. This server is **never** bundled into the web
app; its only product the frontend consumes is a baked event log.

## Two modes (cost-safe by design)

| Mode | When | LLM cost |
|------|------|----------|
| **Baked replay** (default) | always — ships in `public/sim-logs/default.json`, plays in the browser | **$0 at runtime** |
| **Live** (optional, gated) | only when a visitor clicks "Run live tick" (needs `FEATURES.liveAgentWs`) | hard-capped per session |

The portfolio is fully alive with the backend **off**. Live mode is a bonus.

## Setup

```bash
cd apps/server
python -m venv .venv && . .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The Gemini key is read from the **repo-root `.env`** (`GEMINI_API_KEY`). Vite only
exposes `VITE_`-prefixed vars to the browser, so the key never reaches the
frontend bundle. Copy `.env.example` → `.env` and fill it in.

## Bake a replay log

```bash
python -m server bake            # real LLM bake (needs GEMINI_API_KEY)
python -m server bake --offline  # deterministic, ZERO API calls (dev/testing)
```

Writes `public/sim-logs/default.json` and prints events, tokens spent, and cache
hit/miss. A `.lock` guards against concurrent runs; an interrupt writes a
`.partial` instead of clobbering a good log.

## Run live mode (optional)

```bash
python -m server serve --host 127.0.0.1 --port 8000
```

Then set `FEATURES.liveAgentWs = true` in `src/data/config.ts`. The frontend's
"Run live tick" control streams events over SSE. Point it at a non-default host
with `VITE_AGENT_SERVER`.

## Cost controls (the knobs)

All in the root `.env` / `server/config.py`:

| Knob | Default | Effect |
|------|---------|--------|
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | cheapest capable tier |
| `GEMINI_EMBED_MODEL` | `gemini-embedding-001` | memory embeddings (768-dim) |
| `LIVE_TOKEN_BUDGET` | `50000` | per-session hard cap → kill switch |
| `LIVE_TIMEOUT_SECONDS` | `600` | per-session wall-clock cap |
| `LIVE_MAX_AGENTS` | `6` | concurrent live agents |

Additional savers, always on:

- **Persistent disk cache** (`apps/server/.cache/llm.db`) keyed on
  `(model, prompt)` — re-bakes after a small edit are almost all cache hits.
- **Embedding cache** — every memory is embedded once, reused forever.
- **Offline mode** — no key (or `--offline`) → deterministic templated content,
  zero API calls. Action *selection* is rule-based; only creative text
  (conversation / reflection / plan / activity) ever spends tokens.

A full real bake is ~100 unique calls on flash-lite (~40k tokens ≈ a couple of
cents). Live mode caps itself at 50k tokens / 10 min and then ends the session.

> Note: a cold real bake can be slow in wall-clock time on the free Gemini tier
> due to rate-limit backoff; the cost stays tiny and re-bakes are fast (cached).

## Graceful degradation

If the log is missing/malformed, or live mode fails, the frontend silently falls
back to static NPCs / baked replay — no error wall. The six project relics and
Recruiter Mode never touch this server.
