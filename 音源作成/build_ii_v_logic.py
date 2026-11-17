"""II-V MusicXML -> guitar MIDI, 2-feel bass MIDI, and phrase brush WAV.

Guitar: octave down, swing 0.45, 10 ms gap, downbeat quarters shortened to
eighths, eighth pairs velocity 50/79, legato only on beats that contain a 16th.
Bass: straight root/fifth, MIDI 41-59 when the line stays in that register.
Drums: 4-bar clips. The first clip of each user phrase is a Crash file.
The remaining clips cycle Brushes 1-6.
"""

from __future__ import annotations

import argparse
import re
import wave
from pathlib import Path

import numpy as np
from mido import Message, MetaMessage, MidiFile, MidiTrack, bpm2tempo

from musicxml_to_swing_midi import swing_map_ticks

ROOT = Path(__file__).resolve().parent
XML = Path("/Users/apple/Downloads/II-V 1-5 2barずつ_12keys.musicxml")
VELOCITY_MID = Path("/Users/apple/Downloads/test.mid")
BRUSH_DIR = ROOT / "Brushes 120bpm"
GUITAR_MID = ROOT / "out/II-V_guitar_jazzsolo_octdown_bpm120.mid"
BASS_MID = ROOT / "out/II-V_bass_2feel_bpm120.mid"
COMP_MID = ROOT / "out/II-V_guitar_comp_bpm120.mid"

BPM = 120.0
SWING = 0.45
TPQ = 480
BARS = 120
CLIP_BARS = 4
SR = 48000
DRUM_GAIN = 0.4
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
# MIDI note a 32nd occupies at 480 TPQ. Comping arpeggios stay straight.
THIRTY_SECOND = TPQ // 8
COMP_VELOCITY = 72
COMP_LOW = 52
COMP_HIGH = 76
MIDDLE_C = 60
TONIC_BY_FIFTHS = {0: 0, 1: 7, 2: 2, 3: 9, 4: 4, 5: 11, 6: 6, -1: 5, -2: 10, -3: 3, -4: 8, -5: 1, -6: 6}


def ticks_for_ms(ms: float) -> int:
    return max(1, int(round(ms / 1000.0 * (BPM / 60.0) * TPQ)))


def to_tick(div: float) -> int:
    return int(round(swing_map_ticks(div * (TPQ / 4.0), SWING)))


def parse_score(path: Path) -> tuple[list[dict[str, int | str]], list[int]]:
    text = path.read_text(encoding="utf-8")
    measures = re.findall(r"<measure\b[^>]*>(.*?)</measure>", text, re.DOTALL)
    notes: list[dict[str, int | str]] = []
    chords: list[int] = []
    cur = 0
    for measure in measures:
        hm = re.search(
            r"<root-step>\s*([A-G])\s*</root-step>(?:\s*<root-alter>\s*(-?\d+)\s*</root-alter>)?",
            measure,
        )
        if hm is None:
            raise RuntimeError("measure is missing a chord symbol")
        chords.append((STEPS[hm.group(1)] + int(hm.group(2) or 0)) % 12)
        for body in re.findall(r"<note\b[^>]*>(.*?)</note>", measure, re.DOTALL):
            dm = re.search(r"<duration>\s*(\d+)\s*</duration>", body)
            if not dm:
                continue
            dur = int(dm.group(1))
            if "<rest" in body:
                cur += dur
                continue
            typ_m = re.search(r"<type>\s*([^<]+)\s*</type>", body)
            step_m = re.search(r"<step>\s*([A-G])\s*</step>", body)
            oct_m = re.search(r"<octave>\s*(\d+)\s*</octave>", body)
            if typ_m is None or step_m is None or oct_m is None:
                raise RuntimeError("note is missing type or pitch")
            alter_m = re.search(r"<alter>\s*(-?\d+)\s*</alter>", body)
            alter = int(alter_m.group(1)) if alter_m else 0
            midi = (int(oct_m.group(1)) + 1) * 12 + STEPS[step_m.group(1)] + alter
            notes.append({"div": cur, "dur": dur, "type": typ_m.group(1), "pitch": midi})
            cur += dur
    return notes, chords


def source_velocities(count: int) -> list[int]:
    vels: list[int] = []
    for msg in MidiFile(str(VELOCITY_MID)).tracks[0]:
        if msg.type == "note_on" and msg.velocity > 0:
            vels.append(msg.velocity)
    if len(vels) != count:
        raise RuntimeError(f"velocity count {len(vels)} != {count}")
    return vels


def build_guitar(notes: list[dict[str, int | str]], vels: list[int]) -> list[tuple[int, int, int, int]]:
    by_beat: dict[int, list[int]] = {}
    for i, note in enumerate(notes):
        by_beat.setdefault(int(note["div"]) // 4, []).append(i)
    legato: set[int] = set()
    pair: dict[int, int] = {}
    shortened: set[int] = set()
    for idxs in by_beat.values():
        group = [notes[i] for i in idxs]
        if any(n["type"] == "16th" for n in group):
            legato.update(idxs)
        offs = {int(n["div"]) % 4 for n in group}
        if len(group) == 2 and all(n["type"] == "eighth" for n in group) and offs == {0, 2}:
            pair[idxs[0]] = 50
            pair[idxs[1]] = 79
        for i in idxs:
            if notes[i]["type"] == "quarter" and int(notes[i]["div"]) % 4 == 0:
                shortened.add(i)
    gap = ticks_for_ms(10)
    overlap = ticks_for_ms(20)
    built: list[list[int]] = []
    for i, note in enumerate(notes):
        start = to_tick(int(note["div"]))
        dur = 2 if i in shortened else int(note["dur"])
        end = to_tick(int(note["div"]) + dur)
        if end <= start:
            end = start + 1
        built.append([start, end, int(note["pitch"]) - 12, pair.get(i, vels[i])])
        built[-1].append(1 if i in legato else 0)
    built.sort(key=lambda n: (n[0], n[2]))
    for i, note in enumerate(built):
        if i + 1 >= len(built):
            continue
        nxt = built[i + 1]
        if note[4] == 1 and nxt[0] <= note[1] + 2:
            note[1] = max(note[0] + 1, nxt[0] - 1) if note[2] == nxt[2] else nxt[0] + overlap
        elif note[1] > nxt[0] - gap:
            note[1] = max(note[0] + 1, nxt[0] - gap)
    next_on: dict[int, int] = {}
    for note in reversed(built):
        nxt = next_on.get(note[2])
        if nxt is not None and note[1] >= nxt:
            note[1] = max(note[0] + 1, nxt - 1)
        next_on[note[2]] = note[0]
    if (len(built), len(shortened), len(legato), len(pair)) != (864, 24, 72, 768):
        raise RuntimeError(
            f"unexpected guitar counts notes={len(built)} short={len(shortened)} "
            f"legato={len(legato)} pairs={len(pair)}"
        )
    return [(n[0], n[1], n[2], n[3]) for n in built]


def nearest_bass(pc: int, prev: int) -> int:
    cands = [pc + 12 * octv for octv in range(2, 6) if 43 <= pc + 12 * octv <= 57]
    return min(cands, key=lambda n: (abs(n - prev), abs(n - 52)))


def build_bass(chords: list[int]) -> list[tuple[int, int, int, int]]:
    gap = ticks_for_ms(10)
    half = 960
    prev = 50
    notes: list[tuple[int, int, int, int]] = []
    for bar, pc in enumerate(chords):
        root = nearest_bass(pc, prev)
        hi, lo = root + 7, root - 5
        nxt = nearest_bass(chords[bar + 1], root) if bar + 1 < len(chords) else root
        prefer_hi = bar % 2 == 0
        options = [n for n in (hi, lo) if 40 <= n <= 67]

        def cost(n: int) -> tuple[int, int, int]:
            leap = abs(n - nxt)
            return (0 if leap <= 10 else 20, 0 if (n == hi) == prefer_hi else 3, leap)

        fifth = min(options, key=cost)
        start = bar * 1920
        notes.append((start, start + half - gap, root, 90))
        notes.append((start + half, start + 2 * half - gap, fifth, 78))
        prev = fifth
    pitches = [n[2] for n in notes]
    if min(pitches) < 41 or max(pitches) > 59:
        raise RuntimeError(f"bass left MIDI 41-59: {min(pitches)}-{max(pitches)}")
    return notes


def write_midi(path: Path, notes: list[tuple[int, int, int, int]]) -> None:
    mid = MidiFile(ticks_per_beat=TPQ)
    track = MidiTrack()
    mid.tracks.append(track)
    events: list[tuple[int, int, Message | MetaMessage]] = [
        (0, 0, MetaMessage("set_tempo", tempo=bpm2tempo(BPM), time=0)),
        (0, 0, MetaMessage("time_signature", numerator=4, denominator=4, time=0)),
    ]
    for start, end, pitch, vel in notes:
        events.append((start, 1, Message("note_on", note=pitch, velocity=vel, time=0)))
        events.append((end, 0, Message("note_off", note=pitch, velocity=0, time=0)))
    events.sort(key=lambda item: (item[0], item[1]))
    last = 0
    for tick, _, msg in events:
        msg.time = tick - last
        track.append(msg)
        last = tick
    track.append(MetaMessage("end_of_track", time=0))
    path.parent.mkdir(parents=True, exist_ok=True)
    mid.save(str(path))


def read_notes(path: Path) -> list[tuple[int, int, int, int]]:
    mid = MidiFile(str(path))
    notes: list[tuple[int, int, int, int]] = []
    tick = 0
    pending: dict[int, list[tuple[int, int]]] = {}
    for msg in mid.tracks[0]:
        tick += msg.time
        if msg.type == "note_on" and msg.velocity > 0:
            pending.setdefault(msg.note, []).append((tick, msg.velocity))
        elif msg.type == "note_off" or (msg.type == "note_on" and msg.velocity == 0):
            stack = pending.get(msg.note) or []
            if not stack:
                continue
            start, vel = stack.pop(0)
            notes.append((start, tick, msg.note, vel))
    notes.sort()
    return notes


def read_i24(path: Path) -> np.ndarray:
    with wave.open(str(path)) as handle:
        if handle.getframerate() != SR or handle.getnchannels() != 2 or handle.getsampwidth() != 3:
            raise RuntimeError(f"unexpected wav format: {path.name}")
        raw = handle.readframes(handle.getnframes())
    packed = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3)
    values = (
        packed[:, 0].astype(np.int32)
        | (packed[:, 1].astype(np.int32) << 8)
        | (packed[:, 2].astype(np.int32) << 16)
    )
    values = np.where(values >= (1 << 23), values - (1 << 24), values)
    return values.reshape(-1, 2)


def write_i24(path: Path, audio: np.ndarray) -> None:
    clipped = np.clip(np.rint(audio), -8388608, 8388607).astype(np.int32)
    unsigned = np.where(clipped < 0, clipped + (1 << 24), clipped).astype(np.uint32).reshape(-1)
    packed = np.empty((unsigned.size, 3), dtype=np.uint8)
    packed[:, 0] = unsigned & 0xFF
    packed[:, 1] = (unsigned >> 8) & 0xFF
    packed[:, 2] = (unsigned >> 16) & 0xFF
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(3)
        handle.setframerate(SR)
        handle.writeframes(packed.tobytes())


def build_drums(phrase_bars: int) -> tuple[np.ndarray, list[str]]:
    if phrase_bars < CLIP_BARS or phrase_bars % CLIP_BARS != 0:
        raise RuntimeError("phrase bars must be a multiple of 4 and at least 4")
    if BARS % phrase_bars != 0:
        raise RuntimeError(f"{BARS} bars is not divisible by phrase length {phrase_bars}")
    frames = CLIP_BARS * 2 * SR
    crashes = [read_i24(BRUSH_DIR / f"Crash{i}_Brushes_120.wav") for i in range(1, 10)]
    brushes = [read_i24(BRUSH_DIR / f"{i}_Brushes_120.wav") for i in range(1, 7)]
    for clip in crashes + brushes:
        if clip.shape[0] != frames:
            raise RuntimeError(f"clip is not {CLIP_BARS} bars: {clip.shape[0]} frames")
    names: list[str] = []
    parts: list[np.ndarray] = []
    crash_i = 0
    brush_i = 0
    clips_per_phrase = phrase_bars // CLIP_BARS
    phrases = BARS // phrase_bars
    for _ in range(phrases):
        for slot in range(clips_per_phrase):
            if slot == 0:
                clip = crashes[crash_i % len(crashes)]
                names.append(f"Crash{(crash_i % len(crashes)) + 1}")
                crash_i += 1
            else:
                clip = brushes[brush_i % len(brushes)]
                names.append(str((brush_i % len(brushes)) + 1))
                brush_i += 1
            parts.append(clip)
    audio = np.concatenate(parts, axis=0) * DRUM_GAIN
    return audio, names


def classify_chord(kind_text: str, kind: str) -> str:
    text = kind_text.lower().replace(" ", "")
    if text in {"m7b5", "min7b5", "ø7"} or kind == "half-diminished":
        return "m7b5"
    if text in {"m6", "min6", "m6th"} or kind == "minor-sixth":
        return "m6"
    if text in {"6", "maj6", "6th"} or kind == "major-sixth":
        return "sixth"
    if text in {"7", "dom7"} or kind == "dominant":
        return "dominant"
    if text in {"m7", "min7", "mi7"} or kind == "minor-seventh":
        return "minor"
    if text.startswith("m") or "minor" in kind:
        return "minor"
    return "major"


def degree_offsets(family: str) -> dict[int, int]:
    """Semitones above the root for chord degrees 3, 5, 6, 7 and 9."""
    if family == "dominant":
        return {3: 4, 5: 7, 6: 9, 7: 10, 9: 14}
    if family == "m7b5":
        return {3: 3, 5: 6, 6: 9, 7: 10, 9: 14}
    if family == "m6":
        return {3: 3, 5: 7, 6: 9, 7: 9, 9: 14}
    if family in {"minor"}:
        return {3: 3, 5: 7, 6: 9, 7: 10, 9: 14}
    if family == "sixth":
        return {3: 4, 5: 7, 6: 9, 7: 9, 9: 14}
    return {3: 4, 5: 7, 6: 9, 7: 11, 9: 14}


def comp_patterns(family: str, is_iii: bool) -> tuple[str, str]:
    if family == "dominant" or (family == "minor" and is_iii):
        return ("37", "73")
    if family == "m7b5":
        return ("735", "573")
    if family in {"sixth", "m6"}:
        return ("369", "639")
    return ("379", "739")


def parse_chord_changes(path: Path) -> list[dict[str, int | str | bool]]:
    text = path.read_text(encoding="utf-8")
    measures = re.findall(r"<measure\b[^>]*>(.*?)</measure>", text, re.DOTALL)
    fifths = 0
    changes: list[dict[str, int | str | bool]] = []
    for bar, measure in enumerate(measures):
        fifths_m = re.search(r"<fifths>\s*(-?\d+)\s*</fifths>", measure)
        if fifths_m:
            fifths = int(fifths_m.group(1))
        harmony = re.search(r"<harmony\b[^>]*>(.*?)</harmony>", measure, re.DOTALL)
        if harmony is None:
            if not changes:
                raise RuntimeError(f"bar {bar + 1} has no chord to extend")
            changes[-1]["bars"] = int(changes[-1]["bars"]) + 1
            continue
        body = harmony.group(1)
        root_m = re.search(
            r"<root-step>\s*([A-G])\s*</root-step>(?:\s*<root-alter>\s*(-?\d+)\s*</root-alter>)?",
            body,
        )
        kind_m = re.search(r'<kind\b([^>]*)>([^<]*)</kind>', body)
        if root_m is None or kind_m is None:
            raise RuntimeError(f"bar {bar + 1} has an incomplete chord symbol")
        text_m = re.search(r'text="([^"]*)"', kind_m.group(1))
        kind_text = text_m.group(1) if text_m else kind_m.group(2)
        family = classify_chord(kind_text, kind_m.group(2).strip())
        root = (STEPS[root_m.group(1)] + int(root_m.group(2) or 0)) % 12
        tonic = TONIC_BY_FIFTHS[fifths]
        is_iii = family == "minor" and (root - tonic) % 12 == 4
        label = f"{NOTE_NAMES[root]}{kind_text}"
        previous = changes[-1] if changes else None
        if (
            previous is not None
            and previous["root"] == root
            and previous["family"] == family
            and previous["is_iii"] == is_iii
        ):
            previous["bars"] = int(previous["bars"]) + 1
            continue
        changes.append(
            {
                "bar": bar,
                "bars": 1,
                "root": root,
                "family": family,
                "is_iii": is_iii,
                "label": label,
            }
        )
    return changes


def _ascending(root: int, pattern: str, offsets: dict[int, int], start: int) -> list[int] | None:
    if start % 12 != (root + offsets[int(pattern[0])]) % 12:
        return None
    pitches = [start]
    for degree_text in pattern[1:]:
        pc = (root + offsets[int(degree_text)]) % 12
        nxt = pitches[-1] + 1
        while nxt % 12 != pc:
            nxt += 1
        if nxt - pitches[0] > 16:
            return None
        pitches.append(nxt)
    return pitches


def crosses_middle_c(pitches: list[int]) -> bool:
    low, high = pitches[0], pitches[-1]
    if low < MIDDLE_C < high:
        return True
    return MIDDLE_C in pitches and high - low <= 12


def _voice_cost(pitches: list[int], previous: list[int] | None) -> float:
    if any(pitch < COMP_LOW or pitch > COMP_HIGH for pitch in pitches):
        return 1_000_000.0
    span = pitches[-1] - pitches[0]
    center = sum(pitches) / len(pitches)
    cost = abs(center - 62.0) * 2.0 + span * 0.25
    if not crosses_middle_c(pitches):
        cost += 200.0
    if previous:
        movement = 0.0
        for pitch in pitches:
            movement += min(abs(pitch - old) for old in previous)
        cost += movement / len(pitches)
    return cost


def voice_comp(change: dict[str, int | str | bool], previous: list[int] | None) -> list[int]:
    family = str(change["family"])
    offsets = degree_offsets(family)
    best: list[int] | None = None
    best_cost = 1_000_000.0
    for pattern in comp_patterns(family, bool(change["is_iii"])):
        first_pc = (int(change["root"]) + offsets[int(pattern[0])]) % 12
        for start in range(COMP_LOW, COMP_HIGH + 1):
            if start % 12 != first_pc:
                continue
            pitches = _ascending(int(change["root"]), pattern, offsets, start)
            if pitches is None:
                continue
            cost = _voice_cost(pitches, previous)
            if cost < best_cost:
                best = pitches
                best_cost = cost
    if best is None:
        raise RuntimeError(f"no comping voicing for {change['label']}")
    return best


def build_comp(changes: list[dict[str, int | str | bool]]) -> list[tuple[int, int, int, int]]:
    notes: list[tuple[int, int, int, int]] = []
    previous: list[int] | None = None
    for change in changes:
        pitches = voice_comp(change, previous)
        start = int(change["bar"]) * TPQ * 4
        end = start + int(change["bars"]) * TPQ * 4 - 1
        for index, pitch in enumerate(pitches):
            onset = start + index * THIRTY_SECOND
            if onset >= end:
                raise RuntimeError(f"arpeggio does not fit in {change['label']}")
            notes.append((onset, end, pitch, COMP_VELOCITY))
        previous = pitches
    return notes


def _pc_of(root: int, family: str, degree: int) -> int:
    return (root + degree_offsets(family)[degree]) % 12


def validate_comp(changes: list[dict[str, int | str | bool]], notes: list[tuple[int, int, int, int]]) -> None:
    grouped: list[list[tuple[int, int, int, int]]] = []
    for note in notes:
        if not grouped or note[0] >= grouped[-1][0][1]:
            grouped.append([note])
        else:
            grouped[-1].append(note)
    if len(grouped) != len(changes):
        raise RuntimeError(f"comp attacks {len(grouped)} != chords {len(changes)}")
    for change, group in zip(changes, grouped):
        family = str(change["family"])
        expect = 2 if family == "dominant" or (family == "minor" and change["is_iii"]) else 3
        if len(group) != expect:
            raise RuntimeError(f"{change['label']} has {len(group)} notes, expected {expect}")
        start = int(change["bar"]) * TPQ * 4
        end = start + int(change["bars"]) * TPQ * 4 - 1
        degrees = comp_patterns(family, bool(change["is_iii"]))
        allowed = {int(ch) for pattern in degrees for ch in pattern}
        for index, (onset, note_end, pitch, _vel) in enumerate(group):
            if onset != start + index * THIRTY_SECOND or note_end != end:
                raise RuntimeError(f"{change['label']} timing {onset}-{note_end}")
            if pitch % 12 not in {_pc_of(int(change["root"]), family, degree) for degree in allowed}:
                raise RuntimeError(f"{change['label']} pitch {pitch} is not a chord tone")
            if pitch < COMP_LOW or pitch > COMP_HIGH:
                raise RuntimeError(f"{change['label']} pitch {pitch} left the middle-C range")
        if not crosses_middle_c([note[2] for note in group]):
            raise RuntimeError(f"{change['label']} voicing does not cross middle C")


def peak_db(audio: np.ndarray) -> float:
    peak = float(np.max(np.abs(audio))) / 8388608.0
    if peak <= 0.0:
        return -120.0
    return 20.0 * float(np.log10(peak))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--phrase-bars", type=int)
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--comp-only", action="store_true")
    args = ap.parse_args()

    if args.comp_only:
        changes = parse_chord_changes(XML)
        comp = build_comp(changes)
        validate_comp(changes, comp)
        write_midi(COMP_MID, comp)
        pitches = [note[2] for note in comp]
        print(
            f"comp chords={len(changes)} notes={len(comp)} "
            f"range={min(pitches)}-{max(pitches)} wrote {COMP_MID.name}"
        )
        return

    if args.phrase_bars is None:
        raise SystemExit("phrase-bars is required unless --comp-only")

    notes, chords = parse_score(XML)
    guitar = build_guitar(notes, source_velocities(len(notes)))
    bass = build_bass(chords)
    same_guitar = read_notes(GUITAR_MID) == guitar if GUITAR_MID.exists() else False
    same_bass = read_notes(BASS_MID) == bass if BASS_MID.exists() else False
    print(f"guitar notes={len(guitar)} matches_existing={same_guitar}")
    print(f"bass notes={len(bass)} range={min(n[2] for n in bass)}-{max(n[2] for n in bass)} matches_existing={same_bass}")
    if args.check_only:
        if not (same_guitar and same_bass):
            raise SystemExit(1)
        return

    if not same_guitar:
        write_midi(GUITAR_MID, guitar)
    if not same_bass:
        write_midi(BASS_MID, bass)
    audio, names = build_drums(args.phrase_bars)
    drum_path = ROOT / "out" / f"II-V_brushes120_phrase{args.phrase_bars}.wav"
    write_i24(drum_path, audio)
    print(f"drum {drum_path.name} sec={audio.shape[0] / SR:.3f} peak_db={peak_db(audio):.2f}")
    print("drum_plan", " ".join(names))


if __name__ == "__main__":
    main()
