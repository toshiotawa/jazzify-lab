"""Enrich hits with metadata and write CSV exports."""

from __future__ import annotations

import csv
import sqlite3
from pathlib import Path
from typing import Any

from jazzlicks.patterns import (
    NoteEvent,
    load_notes,
    mine_phrase_start_ngrams,
    find_interval_pattern,
    SOMISIRA_INTERVALS,
    midi_to_name,
)
from jazzlicks.schema_check import parse_solotime_start
from jazzlicks.audio import (
    audio_status_for_melid,
    load_youtube_links,
    PAD_SEC,
)


def _fetch_solo_metadata(conn: sqlite3.Connection, melid: int) -> dict[str, Any]:
    row = conn.execute(
        """
        SELECT
            si.performer, si.title, si.instrument, si.style, si.key,
            ti.solostart_sec, ti.solotime, ti.filename_sv,
            tr.filename_track, tr.mbzid AS track_mbzid, tr.recordingdate,
            ri.artist AS record_artist, ri.recordtitle, ri.label,
            ri.mbzid AS record_mbzid, ri.releasedate,
            ci.title AS composition_title, ci.composer
        FROM solo_info si
        JOIN transcription_info ti ON ti.melid = si.melid
        JOIN track_info tr ON tr.trackid = si.trackid
        JOIN record_info ri ON ri.recordid = si.recordid
        LEFT JOIN composition_info ci ON ci.compid = si.compid
        WHERE si.melid = ?
        """,
        (melid,),
    ).fetchone()
    if row is None:
        return {}
    keys = [
        "performer",
        "title",
        "instrument",
        "style",
        "key",
        "solostart_sec",
        "solotime",
        "filename_sv",
        "filename_track",
        "track_mbzid",
        "recordingdate",
        "record_artist",
        "recordtitle",
        "label",
        "record_mbzid",
        "releasedate",
        "composition_title",
        "composer",
    ]
    return dict(zip(keys, row))


def _nearest_chord(conn: sqlite3.Connection, melid: int, onset: float) -> str:
    rows = conn.execute(
        "SELECT onset, chord FROM beats WHERE melid = ? ORDER BY ABS(onset - ?) LIMIT 1",
        (melid, onset),
    ).fetchone()
    return rows[1] if rows and rows[1] else ""


def _time_warning(solostart_sec: float | None, solotime: str | None) -> bool:
    if solostart_sec is None:
        return True
    parsed = parse_solotime_start(solotime)
    if parsed is None:
        return True
    return abs(parsed - float(solostart_sec)) >= 1.0


def _phrase_extension(
    notes: list[NoteEvent], start_idx: int, phrase_end_idx: int | None
) -> tuple[str, str, float, float]:
    if phrase_end_idx is None or phrase_end_idx >= len(notes):
        end_idx = start_idx
    else:
        end_idx = phrase_end_idx
    names = [midi_to_name(n.pitch) for n in notes[start_idx : end_idx + 1]]
    mids = [str(int(round(n.pitch))) for n in notes[start_idx : end_idx + 1]]
    t0 = notes[start_idx].onset
    t1 = notes[end_idx].onset + notes[end_idx].duration
    return " ".join(names), " ".join(mids), t0, t1


def enrich_instance(
    conn: sqlite3.Connection,
    base: dict[str, Any],
    youtube: dict[int, list[str]],
    *,
    include_phrase_extension: bool = False,
) -> dict[str, Any]:
    melid = base["melid"]
    meta = _fetch_solo_metadata(conn, melid)
    notes = load_notes(conn, melid)
    start_idx = base["start_idx"]
    n_notes = base["n_notes"]
    onset_solo = base["onset_solo_sec"]
    end_solo = base["end_solo_sec"]
    solostart = meta.get("solostart_sec")
    track_start = float(solostart) + float(onset_solo) if solostart is not None else None
    track_end = float(solostart) + float(end_solo) if solostart is not None else None
    pad_start = track_start - PAD_SEC if track_start is not None else None
    pad_end = track_end + PAD_SEC if track_end is not None else None
    tw = _time_warning(
        float(solostart) if solostart is not None else None,
        meta.get("solotime"),
    )
    bar_beat = notes[start_idx]
    chord = _nearest_chord(conn, melid, onset_solo)
    yt_ids = youtube.get(melid, [])
    yt_urls = [f"https://www.youtube.com/watch?v={yid}" for yid in yt_ids]
    status = audio_status_for_melid(
        melid,
        meta.get("track_mbzid"),
        meta.get("filename_track"),
        time_warning=tw,
        track_start_pad=pad_start,
        track_end_pad=pad_end,
    )
    row: dict[str, Any] = {
        **base,
        **meta,
        "intervals_str": " ".join(str(i) for i in base.get("intervals", ())),
        "track_start_sec": track_start,
        "track_end_sec": track_end,
        "track_pad_start_sec": pad_start,
        "track_pad_end_sec": pad_end,
        "time_warning": tw,
        "bar": bar_beat.bar,
        "beat": bar_beat.beat,
        "chord_at_start": chord,
        "youtube_ids": ";".join(yt_ids),
        "youtube_urls": ";".join(yt_urls),
        "audio_status": status,
    }
    if include_phrase_extension:
        ext_names, ext_midi, ext_t0, ext_t1 = _phrase_extension(
            notes, start_idx, base.get("phrase_end_idx")
        )
        row["phrase_extended_pitch_names"] = ext_names
        row["phrase_extended_midi"] = ext_midi
        row["phrase_extended_solo_start_sec"] = ext_t0
        row["phrase_extended_solo_end_sec"] = ext_t1
        if solostart is not None:
            row["phrase_extended_track_start_sec"] = float(solostart) + ext_t0
            row["phrase_extended_track_end_sec"] = float(solostart) + ext_t1
    if "pitches_midi" in base and "pitch_names" not in base:
        row["pitch_names"] = " ".join(midi_to_name(p) for p in base["pitches_midi"])
    return row


CSV_FIELDS = [
    "pattern",
    "intervals_str",
    "melid",
    "performer",
    "title",
    "instrument",
    "style",
    "start_idx",
    "n_notes",
    "pitch_names",
    "pitches_midi",
    "onset_solo_sec",
    "end_solo_sec",
    "track_start_sec",
    "track_end_sec",
    "track_pad_start_sec",
    "track_pad_end_sec",
    "time_warning",
    "phrase_value",
    "phrase_start_idx",
    "phrase_end_idx",
    "phrase_extended_pitch_names",
    "phrase_extended_track_start_sec",
    "phrase_extended_track_end_sec",
    "filename_sv",
    "filename_track",
    "track_mbzid",
    "recordtitle",
    "record_artist",
    "label",
    "recordingdate",
    "releasedate",
    "composition_title",
    "composer",
    "bar",
    "beat",
    "chord_at_start",
    "youtube_ids",
    "youtube_urls",
    "audio_status",
    "scale_like",
    "arpeggio_like",
    "repetitive",
]


def write_csv(path: Path, rows: list[dict[str, Any]], extra_fields: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(CSV_FIELDS)
    if extra_fields:
        for f in extra_fields:
            if f not in fields:
                fields.append(f)
    present = set()
    for r in rows:
        present.update(r.keys())
    fields = [f for f in fields if f in present or f in (extra_fields or [])]
    # keep any additional keys at end
    for k in sorted(present):
        if k not in fields:
            fields.append(k)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            for k, v in list(r.items()):
                if isinstance(v, (list, tuple)):
                    r[k] = " ".join(str(x) for x in v)
            w.writerow(r)


def export_somisira(conn: sqlite3.Connection, out_dir: Path) -> tuple[int, int]:
    youtube = load_youtube_links()
    phrase_hits, other_hits = find_interval_pattern(
        conn, SOMISIRA_INTERVALS, phrase_start_only=False
    )
    phrase_rows = [
        enrich_instance(conn, {**h, "pattern": "somisira"}, youtube, include_phrase_extension=True)
        for h in phrase_hits
    ]
    other_rows = [
        enrich_instance(conn, {**h, "pattern": "somisira"}, youtube, include_phrase_extension=True)
        for h in other_hits
    ]
    write_csv(out_dir / "somisira_phrase_start.csv", phrase_rows)
    write_csv(out_dir / "somisira_other.csv", other_rows)
    return len(phrase_rows), len(other_rows)


def export_mined_licks(conn: sqlite3.Connection, out_dir: Path, top_n: int = 20) -> int:
    youtube = load_youtube_links()
    aggregates = mine_phrase_start_ngrams(conn)
    all_rows: list[dict[str, Any]] = []
    for agg in aggregates:
        iv_key = " ".join(str(i) for i in agg.intervals)
        for inst in agg.instances:
            notes = load_notes(conn, inst["melid"])
            inst = {
                **inst,
                "pattern": iv_key,
                "pitches_midi": " ".join(
                    str(int(round(notes[inst["start_idx"] + j].pitch)))
                    for j in range(inst["n_notes"])
                ),
                "pitch_names": " ".join(
                    midi_to_name(notes[inst["start_idx"] + j].pitch)
                    for j in range(inst["n_notes"])
                ),
            }
            all_rows.append(
                enrich_instance(conn, inst, youtube, include_phrase_extension=False)
            )
    pattern_summary = sorted(
        aggregates,
        key=lambda a: (a.solo_count, a.occurrences),
        reverse=True,
    )
    top20_rows: list[dict[str, Any]] = []
    for agg in pattern_summary[:top_n]:
        inst = agg.instances[0]
        notes = load_notes(conn, inst["melid"])
        enriched = enrich_instance(
            conn,
            {
                **inst,
                "pattern": " ".join(str(i) for i in agg.intervals),
                "pitches_midi": " ".join(
                    str(int(round(notes[inst["start_idx"] + j].pitch)))
                    for j in range(inst["n_notes"])
                ),
                "pitch_names": " ".join(
                    midi_to_name(notes[inst["start_idx"] + j].pitch)
                    for j in range(inst["n_notes"])
                ),
                "pattern_occurrences": agg.occurrences,
                "pattern_solo_count": agg.solo_count,
            },
            youtube,
        )
        top20_rows.append(enriched)
    write_csv(out_dir / "licks_all.csv", all_rows, extra_fields=["pattern_occurrences", "pattern_solo_count"])
    write_csv(
        out_dir / "licks_top20.csv",
        top20_rows,
        extra_fields=["pattern_occurrences", "pattern_solo_count"],
    )
    return len(top20_rows)
