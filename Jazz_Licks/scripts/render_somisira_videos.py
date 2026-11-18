#!/usr/bin/env python3
"""Backward-compatible wrapper for render_lick_videos.py --lick somisira."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    script = ROOT / "scripts" / "render_lick_videos.py"
    return subprocess.call([sys.executable, str(script), "--lick", "somisira"])


if __name__ == "__main__":
    raise SystemExit(main())
