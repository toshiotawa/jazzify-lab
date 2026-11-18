"""Interval patterns, phrase positions, and lick mining on WJazzD melodies."""

from __future__ import annotations

import sqlite3
from collections import defaultdict
from dataclasses import dataclass
from typing import Iterator

# Target seed lick: ソミシソラ → semitone intervals (descending with +2 at end)
SOMISIRA_INTERVALS = (-3, -5, -4, 2)

ARPEGGIO_ABS_SET = {3, 4, 5, 7, 8, 9, 12}
MINOR_THIRD = 3


@dataclass(frozen=True)
class NoteEvent:
    eventid: int
    onset: float
    pitch: float
    duration: float
    bar: int | None
    beat: int | None


@dataclass
class PhraseSpan:
    phrase_id: str
    start_idx: int
    end_idx: int


def midi_to_name(pitch: float) -> str:
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    p = int(round(pitch))
    octave = p // 12 - 1
    return f"{names[p % 12]}{octave}"


def load_notes(conn: sqlite3.Connection, melid: int) -> list[NoteEvent]:
    cur = conn.execute(
        """
        SELECT eventid, onset, pitch, duration, bar, beat
        FROM melody WHERE melid = ?
        ORDER BY onset, eventid
        """,
        (melid,),
    )
    return [
        NoteEvent(
            eventid=r[0],
            onset=float(r[1]),
            pitch=float(r[2]),
            duration=float(r[3]),
            bar=r[4],
            beat=r[5],
        )
        for r in cur.fetchall()
    ]


def load_phrases(conn: sqlite3.Connection, melid: int, note_count: int) -> list[PhraseSpan]:
    cur = conn.execute(
        """
        SELECT value, start, end FROM sections
        WHERE melid = ? AND type = 'PHRASE'
        ORDER BY start
        """,
        (melid,),
    )
    out: list[PhraseSpan] = []
    for val, start, end in cur.fetchall():
        if start is None or end is None:
            continue
        if 0 <= start <= end < note_count:
            out.append(PhraseSpan(str(val), int(start), int(end)))
    return out


def intervals_between(notes: list[NoteEvent], start: int, length: int) -> tuple[int, ...]:
    seg = notes[start : start + length]
    if len(seg) < 2:
        return ()
    return tuple(
        int(round(seg[i + 1].pitch - seg[i].pitch)) for i in range(len(seg) - 1)
    )


def pitches_rounded(notes: list[NoteEvent], start: int, length: int) -> tuple[int, ...]:
    seg = notes[start : start + length]
    return tuple(int(round(n.pitch)) for n in seg)


def phrase_for_index(phrases: list[PhraseSpan], idx: int) -> PhraseSpan | None:
    for p in phrases:
        if p.start_idx <= idx <= p.end_idx:
            return p
    return None


def is_phrase_start(phrases: list[PhraseSpan], idx: int) -> bool:
    return any(p.start_idx == idx for p in phrases)


def has_leap_ge(intervals: tuple[int, ...], semitones: int = MINOR_THIRD) -> bool:
    return any(abs(x) >= semitones for x in intervals)


def pattern_flags(intervals: tuple[int, ...]) -> dict[str, bool]:
    if not intervals:
        return {"scale_like": False, "arpeggio_like": False, "repetitive": False}
    uniq = set(intervals)
    abs_vals = {abs(x) for x in intervals}
    scale_like = all(abs(x) <= 2 for x in intervals) and len(uniq) <= 2
    arpeggio_like = abs_vals and abs_vals.issubset(ARPEGGIO_ABS_SET)
    repetitive = len(uniq) == 1 and intervals[0] == 0
    return {
        "scale_like": scale_like,
        "arpeggio_like": arpeggio_like,
        "repetitive": repetitive,
    }


def iter_wjd_melids(conn: sqlite3.Connection) -> Iterator[int]:
    cur = conn.execute(
        """
        SELECT t.melid FROM transcription_info t
        INNER JOIN melody_type mt ON mt.melid = t.melid
        WHERE mt.type IN ('SOLO', 'SV')
        ORDER BY t.melid
        """
    )
    for (melid,) in cur:
        yield int(melid)


def find_interval_pattern(
    conn: sqlite3.Connection,
    target_intervals: tuple[int, ...],
    *,
    phrase_start_only: bool,
) -> tuple[list[dict], list[dict]]:
    """Return (phrase_start_hits, other_hits) as plain dicts without metadata."""
    n_notes = len(target_intervals) + 1
    phrase_hits: list[dict] = []
    other_hits: list[dict] = []

    for melid in iter_wjd_melids(conn):
        notes = load_notes(conn, melid)
        if len(notes) < n_notes:
            continue
        phrases = load_phrases(conn, melid, len(notes))
        for start in range(len(notes) - n_notes + 1):
            iv = intervals_between(notes, start, n_notes)
            if iv != target_intervals:
                continue
            at_start = is_phrase_start(phrases, start)
            ph = phrase_for_index(phrases, start)
            rec = {
                "melid": melid,
                "start_idx": start,
                "n_notes": n_notes,
                "intervals": iv,
                "pitches_midi": pitches_rounded(notes, start, n_notes),
                "pitch_names": [midi_to_name(p) for p in pitches_rounded(notes, start, n_notes)],
                "onset_solo_sec": notes[start].onset,
                "end_solo_sec": notes[start + n_notes - 1].onset
                + notes[start + n_notes - 1].duration,
                "phrase_value": ph.phrase_id if ph else "",
                "phrase_start_idx": ph.start_idx if ph else None,
                "phrase_end_idx": ph.end_idx if ph else None,
            }
            if phrase_start_only and at_start:
                phrase_hits.append(rec)
            elif phrase_start_only and not at_start:
                other_hits.append(rec)
            elif not phrase_start_only:
                (phrase_hits if at_start else other_hits).append(rec)

    return phrase_hits, other_hits


@dataclass
class PatternAggregate:
    intervals: tuple[int, ...]
    occurrences: int
    solo_count: int
    instances: list[dict]


def mine_phrase_start_ngrams(
    conn: sqlite3.Connection,
    *,
    min_len: int = 8,
    max_len: int = 12,
    min_occurrences: int = 5,
    min_solos: int = 3,
    require_leap: bool = True,
) -> list[PatternAggregate]:
    """Mine transposition-invariant interval patterns at PHRASE starts."""
    pattern_instances: dict[tuple[int, ...], list[dict]] = defaultdict(list)

    for melid in iter_wjd_melids(conn):
        notes = load_notes(conn, melid)
        phrases = load_phrases(conn, melid, len(notes))
        starts = {p.start_idx for p in phrases}
        for start in starts:
            for length in range(min_len, max_len + 1):
                if start + length > len(notes):
                    continue
                iv = intervals_between(notes, start, length)
                if len(iv) != length - 1:
                    continue
                if require_leap and not has_leap_ge(iv):
                    continue
                flags = pattern_flags(iv)
                if flags["repetitive"]:
                    continue
                ph = phrase_for_index(phrases, start)
                pattern_instances[iv].append(
                    {
                        "melid": melid,
                        "start_idx": start,
                        "n_notes": length,
                        "intervals": iv,
                        "onset_solo_sec": notes[start].onset,
                        "end_solo_sec": notes[start + length - 1].onset
                        + notes[start + length - 1].duration,
                        "phrase_value": ph.phrase_id if ph else "",
                        **flags,
                    }
                )

    aggregates: list[PatternAggregate] = []
    for iv, inst in pattern_instances.items():
        melids = {x["melid"] for x in inst}
        if len(inst) < min_occurrences or len(melids) < min_solos:
            continue
        aggregates.append(
            PatternAggregate(
                intervals=iv,
                occurrences=len(inst),
                solo_count=len(melids),
                instances=inst,
            )
        )

    aggregates.sort(
        key=lambda a: (a.solo_count, a.occurrences, has_leap_ge(a.intervals)),
        reverse=True,
    )
    return aggregates
