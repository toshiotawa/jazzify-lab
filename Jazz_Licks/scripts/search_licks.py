#!/usr/bin/env python3
"""Run Phase 1 lick search (somisira + mined top patterns) and optional local clip export."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.db import DEFAULT_DB_PATH, OUT_DIR, connect, ensure_wjazzd, ensure_youtube_csv
from jazzlicks.export import export_mined_licks, export_somisira
from jazzlicks.audio import clip_from_csv


def main() -> int:
    parser = argparse.ArgumentParser(description="Search WJazzD licks (Phase 1)")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--out", type=Path, default=OUT_DIR)
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--clip", action="store_true", help="FFmpeg clip rows with audio_status=ready")
    args = parser.parse_args()

    ensure_wjazzd(args.db)
    ensure_youtube_csv()
    conn = connect(args.db)

    n_phrase, n_other = export_somisira(conn, args.out)
    print(f"somisira phrase_start: {n_phrase}, other positions: {n_other}")

    n_top = export_mined_licks(conn, args.out, top_n=args.top)
    print(f"licks_top20 patterns: {n_top}")

    conn.close()

    if args.clip:
        for name in ("somisira_phrase_start.csv", "licks_top20.csv"):
            p = args.out / name
            if p.exists():
                n = clip_from_csv(p)
                print(f"clips from {name}: {n}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
