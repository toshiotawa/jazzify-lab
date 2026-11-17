#!/usr/bin/env python3
"""MusicXML (partwise) -> MIDI with 2:1 eighth-note swing (triplet feel)."""

from __future__ import annotations

import argparse
import re
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent

STEP_SEMITONE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

# MIDI timing
TPQ = 480
DEFAULT_TEMPO_BPM = 160.0
# 0=straight, 1=full 2:1 triplet (320/160 ticks per beat half)
DEFAULT_SWING_RATIO = 1.0


@dataclass
class NoteEvent:
    start_div: float
    dur_div: float
    midi: int
    velocity: int = 96


def _strip_tag(name: str) -> str:
    if "}" in name:
        return name.rsplit("}", 1)[-1]
    return name


def iter_tokens(xml_text: str) -> Iterable[tuple[str, dict[str, str]]]:
    """Minimal XML tokenizer without expat."""
    for m in re.finditer(r"<(/?)([\w:.-]+)([^>]*?)(/?)>", xml_text, re.DOTALL):
        closing, raw_name, attr_blob, self_close = m.groups()
        name = _strip_tag(raw_name)
        attrs: dict[str, str] = {}
        for am in re.finditer(r'([\w:.-]+)\s*=\s*"([^"]*)"', attr_blob):
            attrs[_strip_tag(am.group(1))] = am.group(2)
        if closing:
            yield ("end", name, attrs)
        elif self_close:
            yield ("start", name, attrs)
            yield ("end", name, attrs)
        else:
            yield ("start", name, attrs)


def _pitch_to_midi(step: str, octave: int, alter: int = 0) -> int:
    return (octave + 1) * 12 + STEP_SEMITONE[step.upper()] + alter


def parse_musicxml(path: Path) -> tuple[list[NoteEvent], float]:
    text = path.read_text(encoding="utf-8")
    divisions = 4
    tempo_bpm = DEFAULT_TEMPO_BPM
    cur_div = 0.0
    voice_time: dict[int, float] = {}
    events: list[NoteEvent] = []

    stack: list[str] = []
    in_note = False
    is_rest = False
    is_chord = False
    duration: float | None = None
    step: str | None = None
    octave: int | None = None
    alter = 0

    for kind, tag, attrs in iter_tokens(text):
        if kind == "start":
            stack.append(tag)
            if tag == "attributes":
                pass
            elif tag == "motion" or tag == "metronome":
                pass
            elif tag == "per-minute" and stack and stack[-1] == "metronome":
                pass
            elif tag == "sound" and "tempo" in attrs:
                tempo_bpm = float(attrs["tempo"])
            elif tag == "divisions" and stack:
                pass
            elif tag == "note":
                in_note = True
                is_rest = False
                is_chord = False
                duration = None
                step = None
                octave = None
                alter = 0
            elif tag == "rest" and in_note:
                is_rest = True
            elif tag == "chord" and in_note:
                is_chord = True
            elif tag == "duration" and in_note:
                pass
            elif tag == "step" and in_note:
                pass
            elif tag == "octave" and in_note:
                pass
            elif tag == "alter" and in_note:
                pass
        else:
            if tag == "divisions" and stack and stack[-2:] == ["divisions", "attributes"]:
                # handled on end - actually divisions is leaf text
                pass
            if kind == "end":
                if stack and stack[-1] == tag:
                    stack.pop()
                else:
                    continue

            if tag == "divisions":
                # Leaf captured via regex on raw text is awkward; read from following pattern
                pass

        # Text content for leaf nodes via regex pass is simpler; second pass for divisions:
    # Re-parse divisions from first attributes block
    m_div = re.search(r"<divisions>\s*(\d+)\s*</divisions>", text)
    if m_div:
        divisions = int(m_div.group(1))
    m_tmp = re.search(r'<sound[^>]*tempo="([^"]+)"', text)
    if m_tmp:
        tempo_bpm = float(m_tmp.group(1))

    # Note-level parse with regex blocks inside measures (more reliable for leaf text)
    measure_pat = re.compile(r"<measure\b[^>]*>(.*?)</measure>", re.DOTALL)
    note_pat = re.compile(r"<note\b[^>]*>(.*?)</note>", re.DOTALL)

    for mm in measure_pat.finditer(text):
        measure_body = mm.group(1)
        cur_voice = 1
        for nm in note_pat.finditer(measure_body):
            body = nm.group(0)
            is_rest = "<rest" in body
            is_chord = "<chord" in body or "<chord/>" in body
            dm = re.search(r"<duration>\s*(\d+)\s*</duration>", body)
            if not dm:
                continue
            dur = float(dm.group(1))
            voice_m = re.search(r"<voice>\s*(\d+)\s*</voice>", body)
            if voice_m:
                cur_voice = int(voice_m.group(1))
            if cur_voice not in voice_time:
                voice_time[cur_voice] = 0.0

            if not is_chord:
                start = voice_time[cur_voice]
                voice_time[cur_voice] += dur
            else:
                start = voice_time[cur_voice] - dur

            if is_rest:
                continue

            sm = re.search(r"<step>\s*([A-Ga-g])\s*</step>", body)
            om = re.search(r"<octave>\s*(\d+)\s*</octave>", body)
            if not sm or not om:
                continue
            step = sm.group(1).upper()
            octave = int(om.group(1))
            alter = 0
            am = re.search(r"<alter>\s*(-?\d+)\s*</alter>", body)
            if am:
                alter = int(am.group(1))
            midi = _pitch_to_midi(step, octave, alter)
            events.append(NoteEvent(start_div=start, dur_div=dur, midi=midi))

    events.sort(key=lambda e: (e.start_div, e.midi))
    return events, tempo_bpm


def div_to_ticks(div_pos: float, divisions: int) -> float:
    return div_pos * (TPQ / divisions)


def swing_halves_ticks(swing_ratio: float) -> tuple[float, float]:
    ratio = max(0.0, min(1.0, swing_ratio))
    first = 240.0 + 80.0 * ratio
    second = 480.0 - first
    return first, second


def swing_beat_position(ticks_in_beat: float, swing_ratio: float) -> float:
    """Map straight sub-beat ticks [0,480) to swung positions."""
    if ticks_in_beat <= 0.0:
        return 0.0
    if ticks_in_beat >= TPQ:
        return float(TPQ)
    half = TPQ / 2.0
    first, second = swing_halves_ticks(swing_ratio)
    if ticks_in_beat <= half:
        return ticks_in_beat * (first / half)
    return first + (ticks_in_beat - half) * (second / half)


def swing_map_ticks(straight_ticks: float, swing_ratio: float) -> float:
    beat_index = int(straight_ticks // TPQ)
    in_beat = straight_ticks - beat_index * TPQ
    return beat_index * TPQ + swing_beat_position(in_beat, swing_ratio)


def overlap_ticks_for_ms(overlap_ms: float, tempo_bpm: float) -> int:
    """Convert milliseconds to ticks at this tempo (480 TPQ)."""
    if overlap_ms <= 0:
        return 0
    ticks = overlap_ms / 1000.0 * (tempo_bpm / 60.0) * TPQ
    return max(1, int(round(ticks)))


def _cap_same_pitch(notes: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    """Keep a note-off from landing on or after the next same-pitch note-on."""
    capped: list[tuple[int, int, int, int]] = []
    next_on: dict[int, int] = {}
    for st, en, p, v in reversed(notes):
        nx = next_on.get(p)
        if nx is not None and en >= nx:
            en = max(st + 1, nx - 1)
        next_on[p] = st
        capped.append((st, en, p, v))
    capped.reverse()
    return capped


def apply_swing(
    events: list[NoteEvent],
    divisions: int,
    swing_ratio: float = DEFAULT_SWING_RATIO,
    overlap_ticks: int = 0,
    gap_ticks: int = 0,
) -> list[tuple[int, int, int, int]]:
    """Return MIDI note tuples (start_tick, end_tick, pitch, velocity)."""
    out: list[tuple[int, int, int, int]] = []
    for ev in events:
        s0 = div_to_ticks(ev.start_div, divisions)
        s1 = div_to_ticks(ev.start_div + ev.dur_div, divisions)
        rs = int(round(swing_map_ticks(s0, swing_ratio)))
        re_ = int(round(swing_map_ticks(s1, swing_ratio)))
        if re_ <= rs:
            re_ = rs + 1
        out.append((rs, re_, ev.midi, ev.velocity))

    out.sort(key=lambda x: (x[0], x[2]))
    if gap_ticks > 0:
        # End each note before the next onset so a legato script does not connect them.
        for i in range(len(out) - 1):
            st, en, p, v = out[i]
            n_st = out[i + 1][0]
            en = min(en, max(st + 1, n_st - gap_ticks))
            out[i] = (st, en, p, v)
        return _cap_same_pitch(out)

    if overlap_ticks > 0:
        # Hold the previous note past the next onset so a legato script can cross-fade.
        # Same pitch stays 1 tick short: a late note-off would silence the retrigger.
        for i in range(len(out) - 1):
            st, en, p, v = out[i]
            n_st, _, n_p, _ = out[i + 1]
            if p == n_p:
                en = max(st + 1, n_st - 1)
            else:
                en = max(en, n_st + overlap_ticks)
            out[i] = (st, en, p, v)
        return _cap_same_pitch(out)

    # Trim overlaps: note-off one tick before the next note-on.
    trimmed = _cap_same_pitch(out)
    for i in range(len(trimmed) - 1):
        st, en, p, v = trimmed[i]
        n_st = trimmed[i + 1][0]
        if en >= n_st:
            trimmed[i] = (st, max(st + 1, n_st - 1), p, v)
    return trimmed


def write_midi(path: Path, notes: list[tuple[int, int, int, int]], tempo_bpm: float) -> None:
    microseconds_per_quarter = int(round(60_000_000 / tempo_bpm))

    track_events: list[tuple[int, bytes]] = []

    def vlq(n: int) -> bytes:
        buffer = n & 0x7F
        out = bytearray([buffer])
        n >>= 7
        while n:
            out.insert(0, (n & 0x7F) | 0x80)
            n >>= 7
        return bytes(out)

    # Set tempo
    tempo_bytes = struct.pack(">I", microseconds_per_quarter)[1:]
    track_events.append((0, b"\xFF\x51\x03" + tempo_bytes))
    track_events.append((0, b"\xFF\x58\x04\x04\x02\x18\x08"))  # 4/4
    track_events.append((0, b"\xC0\x00"))  # program 0

    midi_msgs: list[tuple[int, bytes]] = []
    for st, en, pitch, vel in notes:
        midi_msgs.append((st, bytes([0x90, pitch & 0x7F, vel & 0x7F])))
        midi_msgs.append((en, bytes([0x80, pitch & 0x7F, 0x00])))
    midi_msgs.sort(key=lambda x: (x[0], x[1][0] != 0x80))

    last = 0
    for abs_tick, msg in midi_msgs:
        delta = abs_tick - last
        track_events.append((delta, msg))
        last = abs_tick

    track_events.append((0, b"\xFF\x2F\x00"))

    track_data = bytearray()
    for delta, msg in track_events:
        track_data.extend(vlq(delta))
        track_data.extend(msg)

    header = b"MThd" + struct.pack(">IHHH", 6, 0, 1, TPQ)
    body = b"MTrk" + struct.pack(">I", len(track_data)) + track_data
    path.write_bytes(header + body)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "musicxml",
        type=Path,
        default=Path("/Users/apple/Downloads/II-V 1-5 2barずつ_12keys.musicxml"),
        nargs="?",
    )
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        default=ROOT / "out/II-V_1-5_12keys_swing.mid",
    )
    ap.add_argument(
        "--swing",
        type=float,
        default=DEFAULT_SWING_RATIO,
        help="Swing amount: 0=straight, 1=full 2:1 (default 1.0)",
    )
    ap.add_argument(
        "--overlap-ms",
        type=float,
        default=0.0,
        help="Hold each note this many ms past the next onset (0 = 1-tick gap)",
    )
    ap.add_argument(
        "--gap-ms",
        type=float,
        default=0.0,
        help="Rest between notes, in ms. Overrides overlap. 0 keeps a 1-tick gap.",
    )
    ap.add_argument(
        "--velocity",
        type=int,
        default=96,
        help="Note-on velocity for every note (1-127, default 96)",
    )
    ap.add_argument(
        "--tempo",
        type=float,
        default=None,
        help="Override the MusicXML tempo in BPM",
    )
    args = ap.parse_args()
    if not 1 <= args.velocity <= 127:
        raise SystemExit(f"velocity must be 1-127, got {args.velocity}")

    events, tempo = parse_musicxml(args.musicxml)
    if args.tempo is not None:
        if args.tempo <= 0:
            raise SystemExit(f"tempo must be positive, got {args.tempo}")
        tempo = args.tempo
    for event in events:
        event.velocity = args.velocity
    divisions = 4
    overlap_ms = 0.0 if args.gap_ms > 0 else args.overlap_ms
    overlap_ticks = overlap_ticks_for_ms(overlap_ms, tempo)
    gap_ticks = overlap_ticks_for_ms(args.gap_ms, tempo)
    notes = apply_swing(
        events,
        divisions,
        swing_ratio=args.swing,
        overlap_ticks=overlap_ticks,
        gap_ticks=gap_ticks,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_midi(args.output, notes, tempo)

    first_half, second_half = swing_halves_ticks(args.swing)
    if len(notes) >= 2:
        print(f"notes: {len(notes)} tempo: {tempo} swing: {args.swing} velocity: {args.velocity}")
        print(f"beat_halves_ticks: {int(first_half)}, {int(second_half)}")
        print(f"overlap_ms: {overlap_ms} overlap_ticks: {overlap_ticks}")
        gap_ms_actual = gap_ticks * (60_000.0 / (tempo * TPQ)) if gap_ticks else 0.0
        print(f"gap_ms: {args.gap_ms} gap_ticks: {gap_ticks} gap_ms_actual: {gap_ms_actual:.3f}")
        print(f"first_onsets_ticks: {notes[0][0]}, {notes[1][0]}")
        print(f"first_lengths_ticks: {notes[0][1]-notes[0][0]}, {notes[1][1]-notes[1][0]}")
        held_past = notes[0][1] - notes[1][0]
        print(f"first_note_held_past_next_onset_ticks: {held_past}")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
