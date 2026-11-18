#!/usr/bin/env python3
"""Lick DNA: write a lick JSON from the user's spelled notes.

Example (P02, G7, all descending):
  python3 scripts/lickdna_make_lick.py --id user_p02 --label "G7 ソ ファ ミ レ レb ドb シb ラb" \
      --chord G7 --notes G5 F5 E5 D5 Db5 Cb5 Bb4 Ab4

- Note names keep the user's spelling (Cb stays Cb). Octaves follow the stated
  contour; when none is given use the nearest step.
- Writes spelling="transpose" plus transpose_spelling_candidates so every clip is
  spelled by strict letter-preserving transposition (see SKILL.md).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "src"))

from emit_mxl_lick_json import make_payload  # noqa: E402
from jazzlicks.licks import LICKS_DIR  # noqa: E402
from jazzlicks.spellings import transpose_spelling_candidates  # noqa: E402


def parse_chord(chord: str) -> tuple[str, str]:
    m = re.match(r"^([A-G][b#]?)(.*)$", chord.strip())
    if not m:
        raise SystemExit(f"bad chord: {chord}")
    root, rest = m.group(1), m.group(2)
    if re.match(r"^(m(?!aj)|-|min)", rest):
        return root, "min"
    if re.match(r"^(M7|maj|j7|6|$)", rest):
        return root, "maj"
    return root, "dom"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--label", required=True)
    ap.add_argument("--chord", required=True, help="reference chord, e.g. G7, Dm7, CM7, C")
    ap.add_argument("--notes", nargs="+", required=True)
    args = ap.parse_args()

    root, quality = parse_chord(args.chord)
    payload = make_payload(id=args.id, label=args.label, base_note_names=args.notes)
    cands = transpose_spelling_candidates(args.notes, root, quality)
    payload["spelling"] = "transpose"
    payload["transpose_spellings"] = [
        min(c, key=lambda x: abs(x["root_fifths"]))["row"] for c in cands
    ]
    payload["transpose_spelling_candidates"] = cands
    payload["reference_chord"] = args.chord
    dest = LICKS_DIR / f"{args.id}.json"
    dest.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", dest, payload["dig_that_lick_pattern"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
