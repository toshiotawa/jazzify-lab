"""WJazzD database paths, download cache, and connection helpers."""

from __future__ import annotations

import sqlite3
import urllib.request
from pathlib import Path
from typing import Any

WJAZZD_URL = "https://jazzomat.hfm-weimar.de/download/downloads/wjazzd.db"
JAZZTUBE_YT_CSV_URL = (
    "http://mir.audiolabs.uni-erlangen.de/jazztube/static/csv_youtube.csv"
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = PROJECT_ROOT / "data" / "cache" / "wjazzd.db"
DEFAULT_YT_CSV_PATH = PROJECT_ROOT / "data" / "cache" / "csv_youtube.csv"
OUT_DIR = PROJECT_ROOT / "out"
AUDIO_DIR = PROJECT_ROOT / "data" / "audio"
WAV_DIR = PROJECT_ROOT / "data" / "wav"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def download_file(url: str, dest: Path, force: bool = False) -> Path:
    ensure_parent(dest)
    if dest.exists() and not force:
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "jazzlicks/0.1"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    dest.write_bytes(data)
    return dest


def ensure_wjazzd(db_path: Path | None = None, force: bool = False) -> Path:
    path = db_path or DEFAULT_DB_PATH
    return download_file(WJAZZD_URL, path, force=force)


def ensure_youtube_csv(csv_path: Path | None = None, force: bool = False) -> Path:
    path = csv_path or DEFAULT_YT_CSV_PATH
    return download_file(JAZZTUBE_YT_CSV_URL, path, force=force)


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    path = db_path or DEFAULT_DB_PATH
    if not path.exists():
        raise FileNotFoundError(f"Database not found: {path}. Run ensure_wjazzd() first.")
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_db_info(conn: sqlite3.Connection) -> dict[str, Any]:
    cur = conn.execute(
        "SELECT name, creator, major, minor, release, created, license, status FROM db_info"
    )
    row = cur.fetchone()
    if row is None:
        return {}
    return dict(row)
