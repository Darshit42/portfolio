"""Persistent on-disk cache for LLM responses and embeddings.

The single biggest cost lever. Every Gemini call is keyed on a hash of its
inputs and stored in SQLite under ``apps/server/.cache``; identical inputs are
served from disk for free. Because the cache survives across runs, the *first*
bake costs a little and every re-bake after a small edit is almost entirely
cache hits. Embeddings are cached separately and re-used forever (R9.6 upgraded
from session-scoped to persistent).
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import struct
import threading
from pathlib import Path
from typing import Optional

from .config import CACHE_DIR


def _key(*parts: str) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()


class Cache:
    """Thread-safe SQLite cache. One connection guarded by a lock — writes are
    rare and tiny, so a global lock is more than fast enough."""

    def __init__(self, path: Optional[Path] = None):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._path = path or (CACHE_DIR / "llm.db")
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self._path, check_same_thread=False)
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS llm_cache ("
            " key TEXT PRIMARY KEY, response TEXT NOT NULL, tokens INTEGER NOT NULL)"
        )
        self._db.execute(
            "CREATE TABLE IF NOT EXISTS embed_cache (key TEXT PRIMARY KEY, vec BLOB NOT NULL)"
        )
        self._db.commit()
        self.hits = 0
        self.misses = 0

    # --- text completions ---
    def get_completion(self, model: str, prompt: str) -> Optional[tuple[str, int]]:
        k = _key("c", model, prompt)
        with self._lock:
            row = self._db.execute(
                "SELECT response, tokens FROM llm_cache WHERE key = ?", (k,)
            ).fetchone()
        if row is None:
            self.misses += 1
            return None
        self.hits += 1
        return row[0], row[1]

    def put_completion(self, model: str, prompt: str, response: str, tokens: int) -> None:
        k = _key("c", model, prompt)
        with self._lock:
            self._db.execute(
                "INSERT OR REPLACE INTO llm_cache (key, response, tokens) VALUES (?, ?, ?)",
                (k, response, tokens),
            )
            self._db.commit()

    # --- embeddings ---
    def get_embedding(self, model: str, text: str) -> Optional[list[float]]:
        k = _key("e", model, text)
        with self._lock:
            row = self._db.execute(
                "SELECT vec FROM embed_cache WHERE key = ?", (k,)
            ).fetchone()
        if row is None:
            return None
        blob = row[0]
        n = len(blob) // 4
        return list(struct.unpack(f"<{n}f", blob))

    def put_embedding(self, model: str, text: str, vec: list[float]) -> None:
        k = _key("e", model, text)
        blob = struct.pack(f"<{len(vec)}f", *vec)
        with self._lock:
            self._db.execute(
                "INSERT OR REPLACE INTO embed_cache (key, vec) VALUES (?, ?)", (k, blob)
            )
            self._db.commit()

    def stats(self) -> dict:
        return {"hits": self.hits, "misses": self.misses}


CACHE = Cache()


def stable_hash(obj) -> str:
    """Deterministic short hash of any JSON-able value — used for memory-hash
    cache keys in the action/conversation layers (R9.6)."""
    return hashlib.sha256(
        json.dumps(obj, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()[:16]
