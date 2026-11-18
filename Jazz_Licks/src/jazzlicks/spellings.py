"""Generate per-transpose note spellings from a canonical phrase."""

from __future__ import annotations

import re

NOTE_NAME_RE = re.compile(r"^([A-G])([#b]{1,2})?(\d+)$")
STEP_TO_SEMI = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

STEPS = "CDEFGAB"
# Ascending spelled interval for each semitone offset (somisira table).
# 6 is a diminished fifth (letter +4), not an augmented fourth.
LETTER_DELTA = (0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6)
ALTER_MARK = {0: "", 1: "#", 2: "##", -1: "b", -2: "bb"}
SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
TONIC_BY_FIFTHS = {
    -7: "Cb",
    -6: "Gb",
    -5: "Db",
    -4: "Ab",
    -3: "Eb",
    -2: "Bb",
    -1: "F",
    0: "C",
    1: "G",
    2: "D",
    3: "A",
    4: "E",
    5: "B",
    6: "F#",
    7: "C#",
}
ROOT_FIFTHS = {name: fifths for fifths, name in TONIC_BY_FIFTHS.items()}
SCALE_STEPS = (0, 2, 4, 5, 7, 9, 11)


PITCH_CLASS_RE = re.compile(r"^([A-G])([#b]{0,2})$")


def octave_for_spelled_pitch(root: str, midi: int) -> int:
    """Octave digit so that `root` + octave sounds as `midi`.

    MIDI octave (`midi // 12 - 1`) is C-based and is wrong when an accidental
    crosses C: B#4 sounds as C5, Cb5 sounds as B4, Bbb4 sounds as A4.
    """
    m = PITCH_CLASS_RE.match(root)
    if not m:
        raise ValueError(f"invalid pitch spelling: {root}")
    step, acc = m.group(1), m.group(2) or ""
    semi = STEP_TO_SEMI[step] + acc.count("#") - acc.count("b")
    return (int(midi) - semi) // 12 - 1


def parse_note_name_to_midi(name: str) -> int:
    m = NOTE_NAME_RE.match(name.strip())
    if not m:
        raise ValueError(f"invalid note name: {name}")
    step, acc, oct_s = m.group(1), m.group(2) or "", m.group(3)
    semi = STEP_TO_SEMI[step]
    if acc == "#":
        semi += 1
    elif acc == "b":
        semi -= 1
    elif acc == "##":
        semi += 2
    elif acc == "bb":
        semi -= 2
    elif acc:
        raise ValueError(f"unsupported accidental in {name}")
    octave = int(oct_s)
    return (octave + 1) * 12 + semi


def _split_spelled(name: str) -> tuple[str, int, int]:
    m = NOTE_NAME_RE.match(name.strip())
    if not m:
        raise ValueError(f"invalid note name: {name}")
    step, acc, oct_s = m.group(1), m.group(2) or "", int(m.group(3))
    alter = {"#": 1, "b": -1, "##": 2, "bb": -2}.get(acc, 0)
    return step, alter, oct_s


def transpose_spelled_pc(name: str, semitones: int) -> str:
    """Pitch-class spelling after an ascending spelled interval. No octave."""
    step, alter, octave = _split_spelled(name)
    t = semitones % 12
    letter_delta = LETTER_DELTA[t]
    step_index = STEPS.index(step)
    new_index = step_index + letter_delta
    new_step = STEPS[new_index % 7]
    new_octave = octave + new_index // 7
    natural = STEP_TO_SEMI[new_step] + (new_octave + 1) * 12
    target = parse_note_name_to_midi(name) + t
    new_alter = target - natural
    if new_alter not in ALTER_MARK:
        raise ValueError(f"unspellable transpose {name} +{t}: alter {new_alter}")
    return f"{new_step}{ALTER_MARK[new_alter]}"


def generate_transpose_spellings(
    base_note_names: tuple[str, ...] | list[str],
) -> list[list[str]]:
    return [
        [transpose_spelled_pc(name, t) for name in base_note_names]
        for t in range(12)
    ]


def _pitch_class(name: str) -> int:
    step, alter, _octave = _split_spelled(name + "4")
    return (STEP_TO_SEMI[step] + alter) % 12


def major_scale_spellings(fifths: int) -> dict[int, str]:
    """Pitch class to spelling for the major scale with this key signature."""
    fifths = max(-7, min(7, int(fifths)))
    tonic = TONIC_BY_FIFTHS[fifths]
    tonic_pc = _pitch_class(tonic)
    start = STEPS.index(tonic[0])
    out: dict[int, str] = {}
    for degree, interval in enumerate(SCALE_STEPS):
        letter = STEPS[(start + degree) % 7]
        pc = (tonic_pc + interval) % 12
        alter = (pc - STEP_TO_SEMI[letter] + 6) % 12 - 6
        if alter not in ALTER_MARK:
            raise ValueError(f"unspellable scale tone {letter} alter {alter}")
        out[pc] = f"{letter}{ALTER_MARK[alter]}"
    return out


def chord_scale_fifths(chord: str) -> int | None:
    """Key signature whose scale spelling matches this chord.

    Dominant is mixolydian (one flat more than the root's major).
    Minor 7 is dorian. m7b5 is locrian. Major 7 and 6 stay in the root's major.
    """
    text = (chord or "").strip().replace("j", "M")
    if not text:
        return None
    match = re.match(r"^([A-G])(bb|#|b)?(.*)$", text)
    if not match:
        return None
    root = match.group(1) + (match.group(2) or "")
    rest = match.group(3)
    base = ROOT_FIFTHS.get(root)
    if base is None:
        return None
    minor = bool(re.match(r"^(-|m(?!aj)|min)", rest))
    if minor and "b5" in rest:
        return base - 5
    if rest.startswith("dim") or "o" in rest[:2]:
        return base - 5
    if minor:
        return base - 2
    if re.search(r"(M7|maj|△|Δ)", rest) or re.match(r"^6", rest) or rest == "":
        return base
    return base - 1


def spell_midi_for_chord(midi: int, chord: str, key_fifths: int = 0) -> str:
    """Spell one sounding pitch in the chord's scale, then the key's accidental side."""
    fifths = chord_scale_fifths(chord)
    if fifths is None:
        fifths = key_fifths
    fifths = max(-7, min(7, int(fifths)))
    scale = major_scale_spellings(fifths)
    pc = int(midi) % 12
    if pc in scale:
        root = scale[pc]
    elif fifths < 0:
        root = FLAT_NAMES[pc]
    elif fifths > 0:
        root = SHARP_NAMES[pc]
    else:
        root = FLAT_NAMES[pc]
    return f"{root}{octave_for_spelled_pitch(root, int(midi))}"
