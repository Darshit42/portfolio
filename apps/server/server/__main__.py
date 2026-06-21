"""``python -m server <command>`` dispatch."""
from __future__ import annotations

import sys


def main() -> int:
    args = sys.argv[1:]
    cmd = args[0] if args else "bake"
    if cmd == "bake":
        from .bake import main as bake_main

        return bake_main(args[1:])
    if cmd == "serve":
        from .app import serve

        return serve(args[1:])
    print(f"unknown command: {cmd!r}. Use 'bake' or 'serve'.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
