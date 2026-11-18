#!/usr/bin/env python3
"""Write lick JSON definitions for MusicXML phrase set."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.licks import CHROMATIC_SPELLINGS
from jazzlicks.spellings import generate_transpose_spellings, parse_note_name_to_midi


def intervals_from_names(names: list[str]) -> list[int]:
    midis = [parse_note_name_to_midi(n) for n in names]
    return [midis[i + 1] - midis[i] for i in range(len(midis) - 1)]


def pattern_str(intervals: list[int]) -> str:
    return " ".join(str(n) if n < 0 else str(n) for n in intervals)


def make_payload(
    *,
    id: str,
    label: str,
    base_note_names: list[str],
    combine: bool = False,
    shared_audio_lick_id: str | None = None,
    spelling: str | None = None,
) -> dict:
    midis = [parse_note_name_to_midi(n) for n in base_note_names]
    iv = intervals_from_names(base_note_names)
    rows = generate_transpose_spellings(base_note_names)
    return {
        "id": id,
        "label": label,
        "intervals": iv,
        "reference_pc": midis[0] % 12,
        "canonical_midi": midis,
        "base_note_names": base_note_names,
        "chromatic_spellings": list(CHROMATIC_SPELLINGS),
        "transpose_spellings": rows,
        "notes_per_motif": len(base_note_names),
        "dig_that_lick_pattern": pattern_str(iv),
        "combine_adjacent_motifs": combine,
        **(
            {"shared_audio_lick_id": shared_audio_lick_id}
            if shared_audio_lick_id
            else {}
        ),
        **({"spelling": spelling} if spelling else {}),
    }


PHRASES: list[dict] = [
    make_payload(
        id="essential_2_1",
        label="Essential 2-1",
        base_note_names=[
            "E4",
            "F4",
            "G4",
            "G#4",
            "B4",
            "E5",
            "B4",
            "D5",
            "C5",
        ],
    ),
    make_payload(
        id="essential_2_2",
        label="Essential 2-2",
        base_note_names=[
            "E4",
            "F4",
            "G4",
            "Ab4",
            "B4",
            "E5",
            "B4",
            "D5",
            "C5",
        ],
        shared_audio_lick_id="essential_2_1",
    ),
    make_payload(
        id="essential_3",
        label="Essential 3",
        base_note_names=["D4", "C4", "B3", "C4", "E4", "G4"],
    ),
    make_payload(
        id="essential_4_1",
        label="Essential 4-1",
        base_note_names=["C4", "D4", "D#4", "E4", "G4", "A4", "C5"],
    ),
    make_payload(
        id="essential_4_2",
        label="Essential 4-2",
        base_note_names=["C4", "D#4", "E4", "G4", "A4", "C5"],
    ),
    make_payload(
        id="jesse_van_6",
        label="Jesse van Ruller (6)",
        base_note_names=["G4", "Gb4", "F4", "A4", "C5", "E5"],
    ),
    make_payload(
        id="iiv_dm7_1",
        label="II-V Dm7 #1",
        base_note_names=[
            "E4",
            "C#4",
            "D4",
            "E4",
            "F4",
            "G4",
            "A4",
            "C5",
        ],
        spelling="transpose",
    ),
    make_payload(
        id="iiv_dm7_2",
        label="II-V Dm7 #2",
        base_note_names=["E5", "D5", "A4", "F4", "E4", "D4"],
    ),
    make_payload(
        id="iiv_dm7_3",
        label="II-V Dm7 #3",
        base_note_names=[
            "F4",
            "G4",
            "F4",
            "E4",
            "F4",
            "D4",
            "E4",
            "F4",
            "G4",
        ],
    ),
    make_payload(
        id="iiv_dm7_4",
        label="II-V Dm7 #4",
        base_note_names=["E5", "C5", "A4", "F4", "A4", "C5", "E5"],
    ),
    make_payload(
        id="iiv_dm7_5",
        label="II-V Dm7 #5",
        base_note_names=[
            "G5",
            "F5",
            "A4",
            "C5",
            "E5",
            "C#5",
            "D5",
            "E5",
        ],
    ),
    make_payload(
        id="iiv_full_1",
        label="II-V full #1",
        base_note_names=[
            "E4",
            "C#4",
            "D4",
            "E4",
            "F4",
            "G4",
            "A4",
            "C5",
            "E5",
            "G5",
            "F5",
            "A4",
            "C5",
            "E5",
            "D5",
        ],
    ),
    make_payload(
        id="iiv_full_2",
        label="II-V full #2",
        base_note_names=[
            "E5",
            "D5",
            "A4",
            "F4",
            "E4",
            "D4",
            "Bb5",
            "Ab5",
            "Eb5",
            "Cb5",
            "Bb4",
            "Ab4",
        ],
    ),
    make_payload(
        id="iiv_full_3",
        label="II-V full #3",
        base_note_names=[
            "F4",
            "G4",
            "F4",
            "E4",
            "F4",
            "D4",
            "E4",
            "F4",
            "G4",
            "Ab4",
            "Bb4",
            "Ab4",
            "G4",
            "Ab4",
            "F4",
            "G4",
            "Ab4",
            "Bb4",
        ],
    ),
    make_payload(
        id="iiv_full_4",
        label="II-V full #4",
        base_note_names=[
            "E5",
            "C5",
            "A4",
            "F4",
            "A4",
            "C5",
            "E5",
            "G5",
            "F5",
            "A4",
            "C5",
            "E5",
            "D5",
        ],
    ),
    make_payload(
        id="iiv_full_5",
        label="II-V full #5",
        base_note_names=[
            "G5",
            "F5",
            "A4",
            "C5",
            "E5",
            "C#5",
            "D5",
            "E5",
            "F5",
            "G5",
            "Ab5",
            "Bb5",
            "G5",
            "F5",
        ],
    ),
]


def main() -> int:
    out = ROOT / "licks"
    out.mkdir(parents=True, exist_ok=True)
    for payload in PHRASES:
        path = out / f"{payload['id']}.json"
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print("wrote", path.name, payload["dig_that_lick_pattern"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
