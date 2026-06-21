"""Bake CLI (R16): run one simulated day and write the replay log.

    python -m server bake            # real LLM bake (needs GEMINI_API_KEY)
    python -m server bake --offline  # deterministic, zero API calls

Writes ``public/sim-logs/default.json``. Uses a ``.lock`` to prevent concurrent
runs and writes a ``.partial`` on interruption rather than clobbering a good log.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

from .config import CONFIG, SIM_LOG_DIR
from .events import EventLog
from .llm import LLM
from .sim import Simulation
from .world import AGENT_SEEDS

OUT = SIM_LOG_DIR / "default.json"
LOCK = OUT.with_suffix(".lock")
PARTIAL = OUT.with_suffix(".partial")


def main(argv: list[str] | None = None) -> int:
    # The summary prints a few non-cp1252 glyphs; force UTF-8 so a Windows
    # console doesn't crash on them after a successful bake.
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    except Exception:
        pass
    ap = argparse.ArgumentParser(prog="server bake", description="Bake the Agent Town replay log.")
    ap.add_argument("--offline", action="store_true",
                    help="deterministic templated bake, zero API calls")
    args = ap.parse_args(argv)

    offline = args.offline
    if not offline and not CONFIG.has_key:
        # R16.1: a real bake requires the key. Be explicit rather than silently
        # producing template content the user thinks is LLM-authored.
        print("error: GEMINI_API_KEY is not set.\n"
              "  • set it in the repo-root .env for a real bake, or\n"
              "  • run `python -m server bake --offline` for a free deterministic bake.",
              file=sys.stderr)
        return 2

    if LOCK.exists():
        print(f"error: {LOCK} exists — another bake may be running. Remove it to override.",
              file=sys.stderr)
        return 3

    SIM_LOG_DIR.mkdir(parents=True, exist_ok=True)
    LOCK.write_text(str(os.getpid()), encoding="utf-8")
    started = time.time()
    llm = LLM()  # offline flag is derived from CONFIG.has_key; force it if asked
    if offline:
        llm.offline = True

    log = EventLog(meta={})
    sim = Simulation(llm, log, AGENT_SEEDS)
    try:
        sim.run_day()
    except KeyboardInterrupt:
        log.meta = sim.meta(started)
        log.write(PARTIAL)
        print(f"\ninterrupted — wrote {len(log.events)} events to {PARTIAL}", file=sys.stderr)
        return 130
    finally:
        LOCK.unlink(missing_ok=True)

    log.meta = sim.meta(started)
    log.write(OUT)

    mode = "OFFLINE (0 tokens)" if llm.offline else f"Gemini {CONFIG.model}"
    print(
        f"baked {len(log.events)} events  ·  {mode}\n"
        f"  tokens spent : {llm.meter.spent}\n"
        f"  cache        : {log_cache_stats()}\n"
        f"  skipped(bad) : {log.skipped}\n"
        f"  wall time    : {round(time.time() - started, 1)}s\n"
        f"  -> {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}"
    )
    _print_economy_summary(sim.economy_summary())
    return 0


def _print_economy_summary(s: dict) -> None:
    """Eyeball whether the economy reached a sensible equilibrium (R: reviewer)."""
    print("\neconomy — end of day")
    print(f"  {'agent':<20}{'coin':>7}{'hunger':>8}{'energy':>8}  inventory")
    for a in s["agents"]:
        inv = ", ".join(f"{k}:{v}" for k, v in a["inventory"].items()) or "—"
        print(f"  {a['name']:<20}{a['coin']:>7.0f}{a['hunger']:>8.0f}{a['energy']:>8.0f}  {inv}")
    print("  prices (low..high, final):")
    for item, p in s["prices"].items():
        print(f"    {item:<8} {p['low']:>5.1f} .. {p['high']:>5.1f}   now {p['final']:>5.1f}"
              f"   [{p['floor']}..{p['ceil']}]")
    if s["warnings"]:
        print("  ⚠ warnings:")
        for w in dict.fromkeys(s["warnings"]):  # de-dup, preserve order
            print(f"    - {w}")
    else:
        print("  ✓ no degenerate conditions detected")


def log_cache_stats() -> str:
    from .cache import CACHE

    s = CACHE.stats()
    return f"{s['hits']} hits / {s['misses']} misses"


if __name__ == "__main__":
    raise SystemExit(main())
