"""Transpose ordering and MusicXML for the somisira lick."""

from __future__ import annotations

import re
import sqlite3
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from jazzlicks.db import DEFAULT_DB_PATH, PROJECT_ROOT
from jazzlicks.licks import LickDef, load_lick
from jazzlicks.patterns import load_notes
from jazzlicks.spellings import (
    octave_for_spelled_pitch,
    parse_note_name_to_midi,
    spell_midi_for_chord,
)

REFERENCE_PC = 7  # G
CANONICAL_MIDI = (67, 64, 59, 55, 57)  # G4 E4 B3 G3 A3

AUDIO_DIR = PROJECT_ROOT / "data" / "audio" / "dig_that_lick" / "somisira"
MUSICXML_DIR = PROJECT_ROOT / "data" / "musicxml" / "somisira"

STEP_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


@dataclass
class SomisiraEntry:
    lick_id: str
    entry_id: str
    melid: int
    start_idx: int
    performer: str
    title: str
    recording_year: str
    transpose_semitones: int
    audio_files: list[Path]
    combined: bool = False
    note_count: int = 5
    key_label: str = ""
    time_signature: str = "4/4"
    track_mbzid: str = ""
    record_title: str = ""
    record_mbzid: str = ""
    chords: list[tuple[float, str]] = field(default_factory=list)
    concert_midi: list[int] = field(default_factory=list)

    @property
    def sort_key(self) -> tuple[int, str, int]:
        return (self.transpose_semitones, self.performer.lower(), self.start_idx)


def transpose_number(pitch_class: int, reference_pc: int = REFERENCE_PC) -> int:
    return (int(pitch_class) - int(reference_pc)) % 12


def canonical_midi_for_lick(
    lick: LickDef, motif_transpose: int, note_index: int
) -> int:
    return lick.canonical_midi[note_index] + motif_transpose


FIFTHS_KEY_SPECS: dict[int, tuple[str, str]] = {
    -7: ("Cb", "Abm"),
    -6: ("Gb", "Ebm"),
    -5: ("Db", "Bbm"),
    -4: ("Ab", "Fm"),
    -3: ("Eb", "Cm"),
    -2: ("Bb", "Gm"),
    -1: ("F", "Dm"),
    0: ("C", "Am"),
    1: ("G", "Em"),
    2: ("D", "Bm"),
    3: ("A", "F#m"),
    4: ("E", "C#m"),
    5: ("B", "G#m"),
    6: ("F#", "D#m"),
}


def fifths_mode_to_key_spec(fifths: int | None, mode: str | None) -> str | None:
    if fifths is None or mode is None:
        return None
    pair = FIFTHS_KEY_SPECS.get(fifths)
    if not pair:
        return None
    return pair[1] if mode == "minor" else pair[0]


def parse_key_to_fifths_mode(key_label: str | None) -> tuple[int | None, str | None]:
    if not key_label or key_label.strip() in ("", "B-chrom"):
        return None, None
    m = re.match(r"^([A-G])(?:b|#)?-(maj|min)$", key_label.strip())
    if not m:
        return None, None
    root_letter = m.group(1)
    mode = "major" if m.group(2) == "maj" else "minor"
    # Map WJazzD spelling to circle-of-fifths (concert)
    table: dict[str, tuple[int, str]] = {
        "C-maj": (0, "major"),
        "G-maj": (1, "major"),
        "D-maj": (2, "major"),
        "A-maj": (3, "major"),
        "E-maj": (4, "major"),
        "B-maj": (5, "major"),
        "F#-maj": (6, "major"),
        "F-maj": (-1, "major"),
        "Bb-maj": (-2, "major"),
        "Eb-maj": (-3, "major"),
        "Ab-maj": (-4, "major"),
        "Db-maj": (-5, "major"),
        "Gb-maj": (-6, "major"),
        "A-min": (0, "minor"),
        "E-min": (1, "minor"),
        "B-min": (2, "minor"),
        "F#-min": (3, "minor"),
        "C#-min": (4, "minor"),
        "G#-min": (5, "minor"),
        "D-min": (-1, "minor"),
        "G-min": (-2, "minor"),
        "C-min": (-3, "minor"),
        "F-min": (-4, "minor"),
        "Bb-min": (-5, "minor"),
        "Eb-min": (-6, "minor"),
    }
    return table.get(key_label.strip(), (None, None))


def _midi_to_step_octave(midi: int) -> tuple[str, str, int, int | None]:
    """Return (step, alter, octave, display_octave_shift) for written pitch at canonical height."""
    names = ["C", "C", "D", "D", "E", "F", "F", "G", "G", "A", "A", "B"]
    alters = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]
    pc = midi % 12
    octave = midi // 12 - 1
    return names[pc], str(alters[pc]), octave, None


def canonical_midi_for_transpose(t: int, index: int) -> int:
    return CANONICAL_MIDI[index] + t


def octave_shift_written(concert: int, written: int) -> int | None:
    diff = concert - written
    if diff == 12:
        return -1  # 8vb: sound octave below written
    if diff == -12:
        return 1  # 8va
    if diff == 24:
        return -2
    if diff == -24:
        return 2
    return None


def chords_during_lick(
    conn: sqlite3.Connection, melid: int, start_idx: int, note_count: int
) -> list[tuple[float, str]]:
    notes = load_notes(conn, melid)
    t0 = notes[start_idx].onset
    t1 = notes[start_idx + note_count - 1].onset + notes[start_idx + note_count - 1].duration
    rows = conn.execute(
        """
        SELECT onset, chord FROM beats
        WHERE melid = ? AND chord IS NOT NULL AND chord != ''
        ORDER BY onset
        """,
        (melid,),
    ).fetchall()
    out: list[tuple[float, str]] = []
    last = ""
    for onset, chord in rows:
        if onset < t0 - 0.5:
            continue
        if onset > t1:
            break
        if chord != last:
            out.append((float(onset), str(chord)))
            last = chord
    return out


def fetch_metadata(conn: sqlite3.Connection, melid: int) -> dict[str, Any]:
    row = conn.execute(
        """
        SELECT si.performer, si.title, si.key, si.signature, si.instrument,
               tr.mbzid, ri.recordtitle, tr.filename_track, ri.mbzid
        FROM solo_info si
        JOIN track_info tr ON tr.trackid = si.trackid
        JOIN record_info ri ON ri.recordid = si.recordid
        WHERE si.melid = ?
        """,
        (melid,),
    ).fetchone()
    if not row:
        return {}
    return {
        "performer": row[0],
        "title": row[1],
        "key": row[2] or "",
        "signature": row[3] or "4/4",
        "instrument": row[4],
        "track_mbzid": row[5] or "",
        "recordtitle": row[6] or "",
        "record_mbzid": row[7] or "",
    }


def _audio_index_for_lick(audio_dir: Path) -> dict[tuple[int, int], Path]:
    import csv

    dtl_path = audio_dir / "dig_that_lick_results.csv"
    rows = list(csv.DictReader(dtl_path.read_text(encoding="utf-8").splitlines(), delimiter=";"))
    by_key: dict[tuple[int, int], dict] = {}
    for r in rows:
        by_key[(int(r["Melid"]), int(r["Start position"]))] = r

    audio_by_key: dict[tuple[int, int], Path] = {}
    manifest = audio_dir / "manifest.csv"
    if not manifest.is_file():
        return audio_by_key
    for m in csv.DictReader(manifest.open(encoding="utf-8")):
        pos = int(m["start_position"])
        for (melid, sp), r in by_key.items():
            if sp == pos and r["Performer"] == m["performer"] and r["Title"] == m["title"]:
                audio_by_key[(melid, sp)] = audio_dir / m["file"]
                break
    return audio_by_key


def _group_consecutive_motifs(
    hits: list[tuple[int, int]],
    *,
    notes_per: int,
    enabled: bool,
) -> list[list[tuple[int, int]]]:
    if not enabled:
        return [[h] for h in hits]
    by_melid: dict[int, list[int]] = {}
    for melid, start in hits:
        by_melid.setdefault(melid, []).append(start)
    groups: list[list[tuple[int, int]]] = []
    for melid, starts in by_melid.items():
        starts.sort()
        run: list[int] = []
        for start in starts:
            if not run:
                run = [start]
                continue
            if start == run[-1] + notes_per:
                run.append(start)
            else:
                groups.append([(melid, s) for s in run])
                run = [start]
        if run:
            groups.append([(melid, s) for s in run])
    return groups


def build_lick_entries(
    conn: sqlite3.Connection, lick_id: str = "somisira"
) -> list[SomisiraEntry]:
    from jazzlicks.licks import load_lick

    lick = load_lick(lick_id)
    audio_dir = lick.audio_dir
    audio_by_key = _audio_index_for_lick(audio_dir)

    dtl_path = audio_dir / "dig_that_lick_results.csv"
    import csv

    rows = list(csv.DictReader(dtl_path.read_text(encoding="utf-8").splitlines(), delimiter=";"))
    hits = [(int(r["Melid"]), int(r["Start position"])) for r in rows]
    groups = _group_consecutive_motifs(
        hits, notes_per=lick.notes_per_motif, enabled=lick.combine_adjacent_motifs
    )

    row_by_key = {(int(r["Melid"]), int(r["Start position"])): r for r in rows}

    raw: list[SomisiraEntry] = []
    for group in groups:
        melid = group[0][0]
        starts = [s for _, s in group]
        notes = load_notes(conn, melid)
        combined = len(group) > 1
        note_count = lick.notes_per_motif * len(group)
        end = starts[-1] + lick.notes_per_motif
        if end > len(notes):
            continue
        midis = [int(round(notes[i].pitch)) for i in range(starts[0], end)]
        t = transpose_number(midis[0] % 12, lick.reference_pc)
        meta = fetch_metadata(conn, melid)
        r0 = row_by_key[(melid, starts[0])]
        if r0["Performer"] in lick.exclude_performers:
            continue
        audio_files = [audio_by_key[(melid, s)] for _, s in group if (melid, s) in audio_by_key]
        if len(audio_files) != len(group):
            continue
        raw.append(
            SomisiraEntry(
                lick_id=lick.id,
                entry_id=f"melid{melid}_pos{starts[0]}",
                melid=melid,
                start_idx=starts[0],
                performer=r0["Performer"],
                title=r0["Title"],
                recording_year=str(r0.get("Recording year", "")),
                transpose_semitones=t,
                audio_files=audio_files,
                combined=combined,
                note_count=note_count,
                key_label=meta.get("key", ""),
                time_signature=meta.get("signature", "4/4"),
                track_mbzid=meta.get("track_mbzid", ""),
                record_title=meta.get("recordtitle", ""),
                record_mbzid=meta.get("record_mbzid", ""),
                chords=chords_during_lick(conn, melid, starts[0], note_count),
                concert_midi=midis,
            )
        )

    raw.sort(key=lambda e: e.sort_key)
    return raw


def build_somisira_entries(conn: sqlite3.Connection) -> list[SomisiraEntry]:
    return build_lick_entries(conn, "somisira")


def _xml_note(
    parent: ET.Element, written_midi: int, duration: int, is_chord: bool = False
) -> None:
    note = ET.SubElement(parent, "note")
    if is_chord:
        ET.SubElement(note, "chord")
    pitch = ET.SubElement(note, "pitch")
    step, alter_s, octave, _ = _midi_to_step_octave(written_midi)
    ET.SubElement(pitch, "step").text = step
    if alter_s != "0":
        ET.SubElement(pitch, "alter").text = alter_s
    ET.SubElement(pitch, "octave").text = str(octave)
    ET.SubElement(note, "duration").text = str(duration)
    ET.SubElement(note, "type").text = "eighth" if duration == 1 else "quarter"


def _add_harmony(parent: ET.Element, chord: str) -> None:
    h = ET.SubElement(parent, "harmony")
    ET.SubElement(h, "root").find  # placeholder
    root = ET.SubElement(h, "root")
    ET.SubElement(root, "root-step").text = chord[0] if chord else "C"
    kind = ET.SubElement(h, "kind")
    kind.text = "none"
    # Simplified: store full symbol as words for OSMD
    words = ET.SubElement(h, "offset")
    words  # skip complex jazz parsing — use lyric-style fallback via direction


def write_musicxml(entry: SomisiraEntry, dest: Path) -> Path:
    """Write MusicXML with fixed rhythm and concert pitches at canonical staff heights."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    t = entry.transpose_semitones
    n_motifs = 2 if entry.combined else 1
    notes_per = 5

    score = ET.Element("score-partwise", version="3.1")
    part_list = ET.SubElement(score, "part-list")
    score_part = ET.SubElement(part_list, "score-part", id="P1")
    ET.SubElement(score_part, "part-name").text = entry.performer
    part = ET.SubElement(score, "part", id="P1")

    fifths, mode = parse_key_to_fifths_mode(entry.key_label)
    global_shift: int | None = None
    concert_list = entry.concert_midi

    def motif_canonical(motif_index: int, note_index: int) -> int:
        base = motif_index * notes_per
        pc = concert_list[base] % 12
        motif_t = transpose_number(pc)
        return canonical_midi_for_transpose(motif_t, note_index)

    canonical = [motif_canonical(i // 5, i % 5) for i in range(len(concert_list))]
    diffs = [c - w for c, w in zip(concert_list, canonical)]
    if diffs and len(set(diffs)) == 1 and diffs[0] in (12, -12):
        global_shift = -1 if diffs[0] == -12 else 1

    for measure_no in range(n_motifs):
        measure = ET.SubElement(part, "measure", number=str(measure_no + 1))
        if measure_no == 0:
            attrs = ET.SubElement(measure, "attributes")
            ET.SubElement(attrs, "hdivisions").text = "2"  # quarter=2 -> eighth=1
            if fifths is not None and mode is not None:
                key = ET.SubElement(attrs, "key")
                ET.SubElement(key, "fifths").text = str(fifths)
                ET.SubElement(key, "mode").text = mode
            time = ET.SubElement(attrs, "time")
            ET.SubElement(time, "beats").text = "3"
            ET.SubElement(time, "beat-type").text = "4"
            clef = ET.SubElement(attrs, "clef")
            ET.SubElement(clef, "sign").text = "G"
            ET.SubElement(clef, "line").text = "2"

        base_i = measure_no * notes_per
        motif_midis = concert_list[base_i : base_i + notes_per]
        motif_canon = [motif_canonical(measure_no, i) for i in range(notes_per)]
        motif_diffs = [c - w for c, w in zip(motif_midis, motif_canon)]
        motif_shift = None
        if motif_diffs and len(set(motif_diffs)) == 1 and motif_diffs[0] in (12, -12):
            motif_shift = -1 if motif_diffs[0] == -12 else 1

        # Chord labels at measure start (first motif) or when changed
        chord_at_start = ""
        if entry.chords and measure_no == 0 and entry.chords:
            chord_at_start = entry.chords[0][1]
        elif entry.chords:
            chord_at_start = entry.chords[min(measure_no, len(entry.chords) - 1)][1]
        if chord_at_start:
            direction = ET.SubElement(measure, "direction", placement="above")
            dir_type = ET.SubElement(direction, "direction-type")
            words = ET.SubElement(dir_type, "words")
            words.text = chord_at_start

        shift = motif_shift if motif_shift is not None else global_shift
        if shift is not None:
            direction = ET.SubElement(measure, "direction", placement="above")
            dir_type = ET.SubElement(direction, "direction-type")
            oct = ET.SubElement(
                dir_type, "octave-shift", type="down" if shift < 0 else "up"
            )
            oct.set("size", "8")
            oct.set("number", "1")

        for i, (_concert, written) in enumerate(zip(motif_midis, motif_canon)):
            dur = 1 if i < 4 else 2
            _xml_note(measure, written, dur, is_chord=False)

    tree = ET.ElementTree(score)
    ET.indent(tree, space="  ")
    tree.write(dest, encoding="utf-8", xml_declaration=True)
    return dest


def _entry_octave_shift_label(entry: SomisiraEntry) -> str:
    notes_per = 5
    n_motifs = 2 if entry.combined else 1
    shifts: list[str] = []
    for motif_index in range(n_motifs):
        base_i = motif_index * notes_per
        motif_midis = entry.concert_midi[base_i : base_i + notes_per]
        motif_canon = [
            canonical_midi_for_transpose(
                transpose_number(motif_midis[0] % 12), i
            )
            for i in range(notes_per)
        ]
        diffs = [c - w for c, w in zip(motif_midis, motif_canon)]
        if diffs and len(set(diffs)) == 1 and diffs[0] in (12, -12):
            shifts.append("8vb" if diffs[0] == -12 else "8va")
        else:
            shifts.append("")
    unique = {s for s in shifts if s}
    if len(unique) == 1:
        return next(iter(unique))
    return ";".join(shifts)


def export_ordered_playlist(entries: list[SomisiraEntry], dest: Path) -> None:
    import csv

    dest.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for i, e in enumerate(entries, 1):
        rows.append(
            {
                "order": i,
                "transpose": e.transpose_semitones,
                "performer": e.performer,
                "title": e.title,
                "melid": e.melid,
                "start_idx": e.start_idx,
                "combined": e.combined,
                "octave_shift": _entry_octave_shift_label(e),
                "audio": ";".join(str(p.name) for p in e.audio_files),
                "track_mbzid": e.track_mbzid,
            }
        )
    with dest.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def written_note_name(
    motif_transpose: int,
    note_index: int,
    *,
    lick_id: str = "somisira",
    chord: str = "",
    key_fifths: int = 0,
) -> str:
    """Spell one written pitch. Octave matches the sounding MIDI.

    `spelling=transpose` keeps the reference spelling (II-V 1 is E C# D E F G A C).
    Otherwise the chord scale is used.
    """
    from jazzlicks.licks import load_lick

    lick = load_lick(lick_id)
    midi = lick.canonical_midi[note_index] + int(motif_transpose)
    if lick.spelling == "transpose":
        root = lick.transpose_spellings[int(motif_transpose) % 12][note_index]
        return f"{root}{octave_for_spelled_pitch(root, midi)}"
    return spell_midi_for_chord(midi, chord, key_fifths)


def format_chord_for_display(chord: str) -> str:
    if not chord:
        return ""
    return chord.replace("j", "M")


def validate_entry_spelling(entry: SomisiraEntry, lick: LickDef) -> None:
    notes_per = lick.notes_per_motif
    for global_i, concert in enumerate(entry.concert_midi):
        motif_i = global_i // notes_per
        local_i = global_i % notes_per
        base = motif_i * notes_per
        motif_t = transpose_number(entry.concert_midi[base] % 12, lick.reference_pc)
        written_midi = canonical_midi_for_lick(lick, motif_t, local_i)
        if (concert - written_midi) % 12 != 0 or abs(concert - written_midi) > 36:
            raise ValueError(
                f"spelling: concert {concert} vs written {written_midi} "
                f"({entry.performer} note {global_i})"
            )
        chord = ""
        if entry.chords:
            chord = entry.chords[min(motif_i, len(entry.chords) - 1)][1]
        fifths, _mode = parse_key_to_fifths_mode(entry.key_label)
        spelled = written_note_name(
            motif_t,
            local_i,
            lick_id=lick.id,
            chord=format_chord_for_display(chord),
            key_fifths=fifths or 0,
        )
        sounded = parse_note_name_to_midi(spelled)
        if sounded != written_midi:
            raise ValueError(
                f"spelling octave mismatch {spelled} sounds {sounded}, "
                f"written midi {written_midi} ({entry.performer} note {global_i})"
            )


def staff_right_x_for_note_count(note_count: int) -> int:
    if note_count <= 5:
        return 420
    if note_count <= 10:
        return 696
    return 420 + (note_count - 5) * 52


def entry_to_score_payload(entry: SomisiraEntry, lick: LickDef | None = None) -> dict[str, Any]:
    """Jazzify ChordVoicingStaff payload (single measure, whole-note heads)."""
    if lick is None:
        lick = load_lick(entry.lick_id)
    notes_per = lick.notes_per_motif
    concert_list = entry.concert_midi
    n_motifs = max(1, len(concert_list) // notes_per) if notes_per else 1
    if entry.combined:
        n_motifs = len(concert_list) // notes_per
    note_count = len(concert_list)
    fifths, mode = parse_key_to_fifths_mode(entry.key_label)
    key_fifths = fifths if fifths is not None else 0

    def motif_canonical(motif_index: int, note_index: int) -> int:
        base = motif_index * notes_per
        pc = concert_list[base] % 12
        motif_t = transpose_number(pc, lick.reference_pc)
        return canonical_midi_for_lick(lick, motif_t, note_index)

    def chord_for_motif(motif_index: int) -> str:
        if not entry.chords:
            return ""
        if motif_index == 0:
            return entry.chords[0][1]
        if len(entry.chords) > motif_index:
            return entry.chords[motif_index][1]
        return entry.chords[-1][1]

    octave_shifts: list[str | None] = []
    for motif_index in range(n_motifs):
        base_i = motif_index * notes_per
        motif_midis = concert_list[base_i : base_i + notes_per]
        motif_canon = [motif_canonical(motif_index, i) for i in range(notes_per)]
        motif_diffs = [c - w for c, w in zip(motif_midis, motif_canon)]
        octave_shift = None
        if motif_diffs and len(set(motif_diffs)) == 1 and motif_diffs[0] in (12, -12):
            octave_shift = "8vb" if motif_diffs[0] == -12 else "8va"
        octave_shifts.append(octave_shift)

    global_octave: str | None = None
    unique_shifts = {s for s in octave_shifts if s}
    if len(unique_shifts) == 1:
        global_octave = next(iter(unique_shifts))

    voicing_groups: list[dict[str, Any]] = []
    for global_i in range(note_count):
        motif_i = global_i // notes_per
        local_i = global_i % notes_per
        written = motif_canonical(motif_i, local_i)
        chord_name = format_chord_for_display(
            chord_for_motif(motif_i) if local_i == 0 else ""
        )
        motif_t = transpose_number(
            concert_list[motif_i * notes_per] % 12, lick.reference_pc
        )
        voicing_groups.append(
            {
                "id": f"n{global_i}",
                "chordName": chord_name,
                "voicing": [
                    written_note_name(
                        motif_t,
                        local_i,
                        lick_id=lick.id,
                        chord=format_chord_for_display(chord_for_motif(motif_i)),
                        key_fifths=key_fifths,
                    )
                ],
                "voicingStaves": [1],
                "measureOffset": 0,
            }
        )

    validate_entry_spelling(entry, lick)
    return {
        "keyFifths": key_fifths,
        "staffRightX": staff_right_x_for_note_count(note_count),
        "noteCount": note_count,
        "voicingGroups": voicing_groups,
        "octaveShift": global_octave,
    }


def ensure_musicxml_for_entries(entries: list[SomisiraEntry]) -> list[Path]:
    paths: list[Path] = []
    for i, e in enumerate(entries, 1):
        custom = MUSICXML_DIR / f"{i:02d}_{e.entry_id}.musicxml"
        if custom.exists():
            paths.append(custom)
            continue
        write_musicxml(e, custom)
        paths.append(custom)
    return paths
