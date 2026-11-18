"""Validate WJazzD schema and PHRASE indexing against live data."""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass, field
from typing import Any


REQUIRED_TABLES = (
    "beats",
    "composition_info",
    "db_info",
    "melody",
    "melody_type",
    "record_info",
    "sections",
    "solo_info",
    "track_info",
    "transcription_info",
)

REQUIRED_COLUMNS: dict[str, tuple[str, ...]] = {
    "melody": ("eventid", "melid", "onset", "pitch", "duration"),
    "sections": ("melid", "type", "start", "end", "value"),
    "transcription_info": (
        "melid",
        "solostart_sec",
        "solotime",
        "filename_sv",
        "filename_solo",
    ),
    "solo_info": (
        "melid",
        "performer",
        "title",
        "instrument",
        "trackid",
        "recordid",
    ),
    "track_info": ("trackid", "filename_track", "mbzid", "recordid"),
    "record_info": ("recordid", "artist", "recordtitle", "label", "mbzid"),
}


def _table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def parse_solotime_start(solotime: str | None) -> float | None:
    if not solotime:
        return None
    solotime = solotime.strip()
    patterns = (
        r"^(\d+):(\d+(?:\.\d+)?)-",
        r"^(\d+)\.(\d+(?:\.\d+)?)-",
        r"^(\d+):(\d+)-",
    )
    for pat in patterns:
        m = re.match(pat, solotime)
        if m:
            return int(m.group(1)) * 60 + float(m.group(2))
    return None


@dataclass
class SchemaReport:
    missing_tables: list[str] = field(default_factory=list)
    missing_columns: dict[str, list[str]] = field(default_factory=dict)
    phrase_indexing: str = "unknown"
    phrase_invalid_ranges: int = 0
    phrase_total: int = 0
    phrase_overlap_count: int = 0
    solotime_parse_fail: int = 0
    solotime_diff_ge_1s: int = 0
    solotime_total: int = 0
    solotime_median_abs_diff: float | None = None
    solotime_max_abs_diff: float | None = None
    melid_count: int = 0
    melody_event_count: int = 0
    db_info: dict[str, Any] = field(default_factory=dict)

    def to_markdown(self) -> str:
        lines = [
            "# WJazzD schema report",
            "",
            "## db_info",
        ]
        for k, v in self.db_info.items():
            lines.append(f"- **{k}**: {v}")
        lines.extend(
            [
                "",
                "## Table / column checks",
                f"- Missing tables: {self.missing_tables or '(none)'}",
                f"- Missing columns: {self.missing_columns or '(none)'}",
                "",
                "## PHRASE sections (`sections.start` / `end`)",
                f"- Conclusion: **{self.phrase_indexing}** (0 = first note by onset in solo)",
                f"- PHRASE rows checked: {self.phrase_total}",
                f"- Invalid ranges (out of note count or start > end): {self.phrase_invalid_ranges}",
                f"- Overlapping phrase pairs (same melid): {self.phrase_overlap_count}",
                "",
                "## `solotime` vs `transcription_info.solostart_sec`",
                f"- Rows: {self.solotime_total}",
                f"- `solotime` parse failures: {self.solotime_parse_fail}",
                f"- Absolute diff ≥ 1.0 s: {self.solotime_diff_ge_1s}",
                f"- Median abs diff (parsed): {self.solotime_median_abs_diff}",
                f"- Max abs diff (parsed): {self.solotime_max_abs_diff}",
                "",
                "### Notes",
                "- Track timing for exports uses **`solostart_sec + melody.onset`** (high-resolution field).",
                "- `solotime` is often coarser or misaligned vs `solostart_sec`; rows with diff ≥ 1 s get `time_warning` and are skipped for FFmpeg clipping per project rules.",
                "",
                "## Corpus size",
                f"- Solos (`transcription_info` rows): {self.melid_count}",
                f"- Melody events: {self.melody_event_count}",
            ]
        )
        return "\n".join(lines) + "\n"


def _score_indexing(
    conn: sqlite3.Connection, melid: int, note_count: int
) -> tuple[int, int]:
    """Return (zero_based_valid, one_based_valid) counts for all PHRASE rows."""
    cur = conn.execute(
        """
        SELECT start, end FROM sections
        WHERE melid = ? AND type = 'PHRASE'
        """,
        (melid,),
    )
    z_ok = o_ok = 0
    for start, end in cur.fetchall():
        if start is None or end is None:
            continue
        if 0 <= start <= end < note_count:
            z_ok += 1
        if 1 <= start <= end <= note_count:
            o_ok += 1
    return z_ok, o_ok


def verify_phrase_indexing(conn: sqlite3.Connection) -> tuple[str, int, int, int]:
    cur = conn.execute("SELECT DISTINCT melid FROM sections WHERE type = 'PHRASE'")
    melids = [r[0] for r in cur.fetchall()]
    z_total = o_total = invalid = 0
    overlaps = 0

    for melid in melids:
        n = conn.execute(
            "SELECT COUNT(*) FROM melody WHERE melid = ?", (melid,)
        ).fetchone()[0]
        phrases = conn.execute(
            """
            SELECT start, end FROM sections
            WHERE melid = ? AND type = 'PHRASE'
            ORDER BY start
            """,
            (melid,),
        ).fetchall()
        for start, end in phrases:
            if start is None or end is None or start > end:
                invalid += 1
                continue
            if not (0 <= start <= end < n):
                invalid += 1
            else:
                z_total += 1
            if not (1 <= start <= end <= n):
                pass
            else:
                o_total += 1
        for i in range(len(phrases) - 1):
            s1, e1 = phrases[i]
            s2, e2 = phrases[i + 1]
            if s1 is None or e1 is None or s2 is None or e2 is None:
                continue
            if not (0 <= s1 <= e1 < n and 0 <= s2 <= e2 < n):
                continue
            if s2 <= e1:
                overlaps += 1

    if z_total >= o_total:
        conclusion = "zero_based"
    else:
        conclusion = "one_based"
    phrase_rows = sum(len(p) for p in [melids])  # wrong

    cur = conn.execute("SELECT COUNT(*) FROM sections WHERE type = 'PHRASE'")
    phrase_total = cur.fetchone()[0]
    return conclusion, invalid, phrase_total, overlaps


def analyze_solotime(conn: sqlite3.Connection) -> tuple[int, int, int, float | None, float | None]:
    diffs: list[float] = []
    parse_fail = diff_ge_1 = 0
    total = 0
    for row in conn.execute(
        "SELECT solostart_sec, solotime FROM transcription_info"
    ):
        total += 1
        ss, st = row[0], row[1]
        parsed = parse_solotime_start(st)
        if parsed is None or ss is None:
            parse_fail += 1
            continue
        d = abs(parsed - float(ss))
        diffs.append(d)
        if d >= 1.0:
            diff_ge_1 += 1
    if not diffs:
        return parse_fail, diff_ge_1, total, None, None
    sdiff = sorted(diffs)
    median = sdiff[len(sdiff) // 2]
    return parse_fail, diff_ge_1, total, median, max(diffs)


def run_schema_check(conn: sqlite3.Connection) -> SchemaReport:
    report = SchemaReport()
    cur = conn.execute(
        "SELECT name, creator, major, minor, release, created, license, status FROM db_info"
    )
    row = cur.fetchone()
    if row:
        report.db_info = {
            "name": row[0],
            "creator": row[1],
            "schema_major_minor": f"{row[2]}.{row[3]}",
            "release": row[4],
            "created": row[5],
            "status": row[7],
        }

    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )}
    for t in REQUIRED_TABLES:
        if t not in tables:
            report.missing_tables.append(t)
    for table, cols in REQUIRED_COLUMNS.items():
        if table not in tables:
            continue
        present = _table_columns(conn, table)
        missing = [c for c in cols if c not in present]
        if missing:
            report.missing_columns[table] = missing

    conclusion, invalid, phrase_total, overlaps = verify_phrase_indexing(conn)
    report.phrase_indexing = conclusion
    report.phrase_invalid_ranges = invalid
    report.phrase_total = phrase_total
    report.phrase_overlap_count = overlaps

    pf, d1, st_total, med, mx = analyze_solotime(conn)
    report.solotime_parse_fail = pf
    report.solotime_diff_ge_1s = d1
    report.solotime_total = st_total
    report.solotime_median_abs_diff = med
    report.solotime_max_abs_diff = mx

    report.melid_count = conn.execute(
        "SELECT COUNT(*) FROM transcription_info"
    ).fetchone()[0]
    report.melody_event_count = conn.execute(
        "SELECT COUNT(*) FROM melody"
    ).fetchone()[0]

    return report
