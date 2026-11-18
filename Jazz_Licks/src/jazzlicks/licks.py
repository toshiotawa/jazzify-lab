"""Lick definitions (JSON) and paths."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from jazzlicks.db import PROJECT_ROOT

LICKS_DIR = PROJECT_ROOT / "licks"


@dataclass
class LickDef:
    id: str
    label: str
    intervals: tuple[int, ...]
    reference_pc: int
    canonical_midi: tuple[int, ...]
    base_note_names: tuple[str, ...]
    chromatic_spellings: tuple[str, ...]
    transpose_spellings: tuple[tuple[str, ...], ...]
    notes_per_motif: int
    dig_that_lick_pattern: str
    combine_adjacent_motifs: bool = True
    shared_audio_lick_id: str | None = None
    exclude_performers: tuple[str, ...] = ()
    spelling: str = "chord"
    transpose_spelling_candidates: tuple = ()

    @property
    def audio_dir(self) -> Path:
        sid = self.shared_audio_lick_id or self.id
        return PROJECT_ROOT / "data" / "audio" / "dig_that_lick" / sid

    @property
    def out_video_prefix(self) -> str:
        return self.id


def load_lick(lick_id: str) -> LickDef:
    path = LICKS_DIR / f"{lick_id}.json"
    if not path.is_file():
        raise FileNotFoundError(f"lick definition not found: {path}")
    raw: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return LickDef(
        id=str(raw["id"]),
        label=str(raw.get("label", raw["id"])),
        intervals=tuple(int(x) for x in raw["intervals"]),
        reference_pc=int(raw["reference_pc"]),
        canonical_midi=tuple(int(x) for x in raw["canonical_midi"]),
        base_note_names=tuple(str(x) for x in raw["base_note_names"]),
        chromatic_spellings=tuple(str(x) for x in raw["chromatic_spellings"]),
        transpose_spellings=tuple(
            tuple(str(n) for n in row) for row in raw["transpose_spellings"]
        ),
        notes_per_motif=int(raw["notes_per_motif"]),
        dig_that_lick_pattern=str(raw["dig_that_lick_pattern"]),
        combine_adjacent_motifs=bool(raw.get("combine_adjacent_motifs", True)),
        shared_audio_lick_id=(
            str(raw["shared_audio_lick_id"])
            if raw.get("shared_audio_lick_id")
            else None
        ),
        exclude_performers=tuple(str(n) for n in raw.get("exclude_performers", [])),
        spelling=str(raw.get("spelling", "chord")),
        transpose_spelling_candidates=tuple(
            tuple(
                (tuple(str(n) for n in c["row"]), int(c.get("root_fifths", 0)))
                for c in cands
            )
            for cands in raw.get("transpose_spelling_candidates", [])
        ),
    )


CHROMATIC_SPELLINGS = (
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
)
