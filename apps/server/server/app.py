"""FastAPI live server (R9, R13) — the optional, gated Live Mode backend.

Endpoints:
  GET  /health           liveness + offline/key status
  GET  /events           SSE stream of world events for one live session
  POST /rumor            inject a memory into the active session's agent

Cost is hard-capped per session: a TokenMeter with LIVE_TOKEN_BUDGET (the LLM
raises BudgetExceeded when exhausted → kill switch), a wall-clock timeout, and
at most LIVE_MAX_AGENTS agents. Every streamed event carries the remaining token
budget so the frontend can show it. Nothing here runs unless the visitor opens
the stream — the baked replay needs none of this.
"""
from __future__ import annotations

import asyncio
import json
import threading
import time
from typing import Optional

from .config import CONFIG
from .events import EventLog
from .llm import LLM, BudgetExceeded, TokenMeter
from .sim import Simulation
from .world import AGENT_SEEDS

LIVE_PACE_SECONDS = 5.0  # ~one tick every 5s (R5.1)

# The single active live session, so /rumor can target it (R13).
_active: Optional[Simulation] = None
_active_lock = threading.Lock()


def _build_app():
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from sse_starlette.sse import EventSourceResponse

    app = FastAPI(title="Agent Town", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # dev only; lock down before any public deploy
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"ok": True, "offline": not CONFIG.has_key, "model": CONFIG.model,
                "maxAgents": CONFIG.live_max_agents, "tokenBudget": CONFIG.live_token_budget}

    @app.get("/events")
    async def events(request: Request):
        return EventSourceResponse(_session_stream(request))

    @app.post("/rumor")
    async def rumor(payload: dict):
        agent_id = str(payload.get("agentId", ""))
        text = str(payload.get("text", ""))[:140]
        with _active_lock:
            sim = _active
        if sim is None or agent_id not in sim.agents:
            return {"ok": False, "reason": "no active session or unknown agent"}
        # R13.3: inject as a high-importance memory the agent will retrieve next.
        sim.agents[agent_id].memory.add(sim.clock_ms, "injected", f"(rumor) {text}", importance=9)
        return {"ok": True}

    return app


async def _session_stream(request):
    global _active
    meter = TokenMeter(budget=CONFIG.live_token_budget)
    llm = LLM(meter)
    loop = asyncio.get_event_loop()
    queue: asyncio.Queue = asyncio.Queue()
    stop = threading.Event()

    def on_emit(ev: dict):
        out = dict(ev)
        out["remaining"] = meter.remaining
        loop.call_soon_threadsafe(queue.put_nowait, out)

    log = EventLog(meta={}, on_emit=on_emit)
    sim = Simulation(llm, log, AGENT_SEEDS[: CONFIG.live_max_agents])
    with _active_lock:
        _active = sim

    def run():
        try:
            sim.run_day(pace=LIVE_PACE_SECONDS, should_stop=stop.is_set)
        except BudgetExceeded:
            pass  # kill switch (R9.4)
        except Exception as e:  # noqa: BLE001
            print(f"[live] sim error: {e}")
        finally:
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"type": "session_end", "reason": "complete", "remaining": meter.remaining},
            )

    threading.Thread(target=run, daemon=True).start()
    deadline = time.time() + CONFIG.live_timeout_seconds
    try:
        while True:
            if await request.is_disconnected():
                break
            remaining = deadline - time.time()
            if remaining <= 0:  # R9.5 timeout kill switch
                yield {"data": json.dumps({"type": "session_end", "reason": "timeout",
                                           "remaining": meter.remaining})}
                break
            try:
                ev = await asyncio.wait_for(queue.get(), timeout=min(1.0, remaining))
            except asyncio.TimeoutError:
                continue
            yield {"data": json.dumps(ev)}
            if ev.get("type") == "session_end":
                break
    finally:
        stop.set()
        with _active_lock:
            if _active is sim:
                _active = None


def serve(argv: list[str] | None = None) -> int:
    import argparse

    import uvicorn

    ap = argparse.ArgumentParser(prog="server serve")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args(argv or [])
    uvicorn.run(_build_app(), host=args.host, port=args.port, log_level="info")
    return 0
