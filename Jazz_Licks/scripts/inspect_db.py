#!/usr/bin/env python3
"""Download (if needed) WJazzD and write schema verification report."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.db import DEFAULT_DB_PATH, OUT_DIR, connect, ensure_wjazzd, fetch_db_info
from jazzlicks.schema_check import run_schema_check


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect WJazzD SQLite schema")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--force-download", action="store_true")
    parser.add_argument("--out", type=Path, default=OUT_DIR / "schema_report.md")
    args = parser.parse_args()

    ensure_wjazzd(args.db, force=args.force_download)
    conn = connect(args.db)
    info = fetch_db_info(conn)
    print("db_info:", info)

    report = run_schema_check(conn)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(report.to_markdown(), encoding="utf-8")
    print(f"Wrote {args.out}")
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
