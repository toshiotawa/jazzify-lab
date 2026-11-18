#!/usr/bin/env python3
"""Lick DNA: local WJazzD search by interval sequence (chord ignored).

  python3 scripts/lickdna_search.py --notes G4 F4 Bb4 Ab4 Db5 Cb5 E5 D5 [--chord G7]

Prints every full match. If none, prints the longest contiguous sub-range of
the pattern that has matches (partial-match fallback). --chord only adds an
informational "chord function matches" flag; it never filters.
Dig That Lick (fetch_dig_that_lick.py) merges overlapping hits, so its count
can be lower than this script's.
"""

from __future__ import annotations

import argparse
import bisect
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.db import connect, ensure_wjazzd  # noqa: E402
from jazzlicks.spellings import parse_note_name_to_midi  # noqa: E402

PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def chord_kind(ch: str) -> tuple[int | None, str]:
    m = re.match(r"^([A-G])([b#]?)(.*)$", ch or "")
    if not m:
        return None, ""
    r = (PC[m[1]] + {"b": -1, "#": 1, "": 0}[m[2]]) % 12
    q = m[3].split("/")[0]
    if q.startswith("m7b5") or q.startswith("o"):
        return r, "dim"
    if q.startswith("-") or (q.startswith("m") and not q.startswith("maj")):
        return r, "min"
    if q.startswith(("j7", "M7", "maj", "6", "69")) or q == "":
        return r, "maj"
    return r, "dom"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--notes", nargs="+", required=True)
    ap.add_argument("--chord", default="")
    ap.add_argument("--min-len", type=int, default=5)
    args = ap.parse_args()

    ensure_wjazzd()
    conn = connect()
    meta = {r[0]: (r[1], r[2]) for r in conn.execute("SELECT melid, performer, title FROM solo_info")}
    mel: dict[int, list[tuple[float, int]]] = {}
    for melid, on, p in conn.execute("SELECT melid, onset, pitch FROM melody ORDER BY melid, onset, eventid"):
        mel.setdefault(melid, []).append((on, int(round(p))))
    beats: dict[int, list[tuple[float, str]]] = {}
    for melid, on, ch in conn.execute(
        "SELECT melid, onset, chord FROM beats WHERE chord IS NOT NULL AND chord != '' ORDER BY melid, onset"
    ):
        beats.setdefault(melid, []).append((on, ch))

    def chord_at(melid: int, t: float) -> str:
        b = beats.get(melid, [])
        i = bisect.bisect_right([x[0] for x in b], t + 0.05) - 1
        return b[i][1] if i >= 0 else ""

    ref_root, ref_kind = chord_kind(args.chord) if args.chord else (None, "")
    midis = [parse_note_name_to_midi(n) for n in args.notes]

    def search(sub: list[int]):
        iv = [sub[i + 1] - sub[i] for i in range(len(sub) - 1)]
        hits = []
        for melid, ns in mel.items():
            ps = [x[1] for x in ns]
            d = [ps[i + 1] - ps[i] for i in range(len(ps) - 1)]
            for i in range(len(d) - len(iv) + 1):
                if d[i : i + len(iv)] == iv:
                    ch = chord_at(melid, ns[i][0])
                    r, k = chord_kind(ch)
                    ok = (
                        ref_root is not None and r is not None and k == ref_kind
                        and (ps[i] - r) % 12 == (sub[0] - ref_root) % 12
                    )
                    hits.append((melid, i, meta[melid][0], meta[melid][1], ch, ok))
        return iv, hits

    n = len(midis)
    for length in range(n, args.min_len - 1, -1):
        found = False
        for s in range(0, n - length + 1):
            iv, hits = search(midis[s : s + length])
            if not hits:
                continue
            found = True
            kind = "FULL" if length == n else f"PARTIAL notes {s + 1}-{s + length}"
            print(f"{kind}: {' '.join(args.notes[s:s + length])} intervals {iv} -> {len(hits)} hits")
            for h in hits:
                print(f"  melid {h[0]} pos {h[1]}  {h[2]} - {h[3]}  chord {h[4]}{'  (chord fn match)' if h[5] else ''}")
        if found:
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
