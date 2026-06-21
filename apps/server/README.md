# Agent Town — simulation engine

Smallville-style autonomous agents for Devhalla. The seven town NPCs get a
cognitive loop (memory stream → reflection → daily planning), wander the 3D
town, use buildings, **act under a resource economy**, and converse. This server
is **never** bundled into the web app; its only product the frontend consumes is
a baked event log.

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

## Resource economy (deterministic, baked)

Agents have **needs** (`hunger`, `energy`), **coin**, and **inventory**, and
buildings have economic roles. This turns "agents wander and chat" into "agents
act under resource constraints," with visible emergent behavior (a smith forging
and selling tools, prices drifting with demand, wealth diverging by role). It all
runs **at bake time** and serializes into the same event log — **$0 runtime,
no new dependency.**

### Deterministic vs LLM split (the cost-safe part)

| Deterministic — pure math, no LLM | LLM — high-level choice only |
|-----------------------------------|------------------------------|
| needs decay each tick | the **daily plan**: given needs/coin/inventory, the LLM picks an *intent* per slot (`work` / `buy_food` / `sell` / `rest`) |
| production (forge: ore → tools), consumption (tavern: food/ale → restore) | |
| inventory + coin bookkeeping, trade settlement | |
| **prices** from clamped supply/demand | |
| **urgent-need override** (resolve the real blocker) | |

**No per-transaction LLM calls.** The LLM sets goals once per day; deterministic
code executes every transaction. Added cost over the base bake: only the 7
planning prompts grow (~+2–5k tokens total).

### Anti-degeneracy guards (closed loops collapse quietly)

- **Price clamps** `[floor, ceil]` per item — supply/demand can't run to 0 or ∞.
- **Wage floor** — work always pays, so no agent can get stuck broke.
- **Override resolves the real blocker** — hungry *and* broke → **work** (earn),
  not pace to a market it can't afford. Picks the *most* critical need so hunger
  and energy don't starve each other.
- **Bake summary** prints final coin/needs/inventory per agent + price ranges +
  warnings (bankruptcy, stuck-critical needs, prices pinned to a clamp). Eyeball
  it after every bake to see whether the economy equilibrated or collapsed.

### Event-log schema (additive, v2)

`meta.version` is bumped to `2`. New event types — `trade`, `produce`,
`consume`, `price`, `stat` (a periodic per-agent snapshot powering the
inspector) — are **purely additive**. A **version-1 log still replays**
unchanged; the frontend treats unknown event types as no-ops and shows empty
economy panels. `stat` events are emitted **on change** (after any transaction)
plus a low-frequency heartbeat, so the inspector tracks the action without
ballooning the log.

The frontend replays these as: a market-prices readout, brief coin/▲ flashes on
trades, and an **Agent Inspector** economy panel (coin, need bars, inventory,
recent transactions).

## Graceful degradation

If the log is missing/malformed, or live mode fails, the frontend silently falls
back to static NPCs / baked replay — no error wall. The six project relics and
Recruiter Mode never touch this server.
