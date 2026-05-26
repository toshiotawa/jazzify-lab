#!/usr/bin/env python3
"""Survival Phrases 1-5 (Dm7) MusicXML から Supabase マイグレーション SQL を生成する。"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_XML = ROOT / "public" / "Survival_Phrases" / "1-5,1フレーズ1小節.musicxml.xml"
CDN_BASE = "https://jazzify-cdn.com/fantasy-bgm"
R2_PREFIX = "survival-phrases-dm7-1-5-stage"

STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
ROMAN = ("I", "II", "III", "IV", "V")


def midi_for_pitch(step: str, alter: int, octave: int) -> int:
    pc = STEP_PC[step] + alter
    return (octave + 1) * 12 + pc


def pitch_class(m: int) -> int:
    return ((m % 12) + 12) % 12


def note_display_name(step: str, alter: int, octave: int) -> str:
    acc = ""
    if alter > 0:
        acc = "#" * min(alter, 2)
    elif alter < 0:
        acc = "b" * min(-alter, 2)
    return f"{step}{acc}{octave}"


def harmony_name(h: ET.Element) -> str:
    r = h.find("root/root-step")
    step = r.text if r is not None and r.text else "C"
    ra = h.find("root/root-alter")
    alter = int(ra.text) if ra is not None and ra.text and ra.text.strip() else 0
    root = step
    if alter > 0:
        root += "#" * alter
    elif alter < 0:
        root += "b" * (-alter)
    kind = h.find("kind")
    txt = ""
    if kind is not None:
        txt = kind.get("text") or (kind.text or "")
    return f"{root}{txt}".strip()


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def parse_stage_measure(measure: ET.Element) -> tuple[str, list[tuple[str, int, int]]]:
    harmony = measure.find("harmony")
    chord = harmony_name(harmony) if harmony is not None else "Dm7"
    notes: list[tuple[str, int, int]] = []
    for child in measure:
        if child.tag != "note":
            continue
        if child.find("rest") is not None:
            continue
        pel = child.find("pitch")
        if pel is None:
            continue
        st = pel.find("step")
        step = st.text if st is not None and st.text else "C"
        alt_el = pel.find("alter")
        alter = int(alt_el.text) if alt_el is not None and alt_el.text else 0
        oc_el = pel.find("octave")
        octv = int(oc_el.text) if oc_el is not None and oc_el.text else 4
        midi = midi_for_pitch(step, alter, octv)
        notes.append((note_display_name(step, alter, octv), midi, pitch_class(midi)))
    return chord, notes


def key_fifths_from_xml() -> int:
    tree = ET.parse(_XML)
    part = tree.getroot().find("part")
    if part is None:
        return 0
    first = part.find("measure")
    if first is None:
        return 0
    attrs = first.find("attributes")
    if attrs is None:
        return 0
    fifths = attrs.find("key/fifths")
    if fifths is None or not fifths.text:
        return 0
    return int(fifths.text)


def emit_migration_sql() -> None:
    tree = ET.parse(_XML)
    part = tree.getroot().find("part")
    if part is None:
        raise SystemExit("no part in MusicXML")

    measures = list(part.findall("measure"))
    if len(measures) != 5:
        raise SystemExit(f"expected 5 measures, got {len(measures)}")

    key_fifths = key_fifths_from_xml()
    stages: list[tuple[str, list[tuple[str, int, int]]]] = [
        parse_stage_measure(m) for m in measures
    ]

    print("BEGIN;")
    print()
    print("-- Survival Phrases stages 1-5 (Dm7): replace placeholder stage 1 and add 2-5")
    print("-- MusicXML: 1 measure per stage. BGM: 4 measures @160 BPM per stage (6s each).")
    print()

    print(
        """DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 1 AND 5
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 1 AND 5
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 1 AND 5;
"""
    )

    for i, (roman) in enumerate(ROMAN, start=1):
        name_ja = f"フレーズ {roman}"
        name_en = f"Phrases {roman}"
        print(
            f"""INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  {i},
  'progression',
  '{sql_escape(name_ja)}',
  '{sql_escape(name_en)}',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;
"""
        )

    for i, (roman) in enumerate(ROMAN, start=1):
        bgm_url = f"{CDN_BASE}/{R2_PREFIX}-{i:02d}.mp3"
        title = f"Phrases {roman}"
        print(
            f"""INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  {i},
  '{sql_escape(title)}',
  '{bgm_url}',
  {key_fifths}
);
"""
        )

    print("DO $$")
    print("DECLARE")
    for i in range(1, 6):
        print(f"  v_phrase_{i} uuid;")
        print(f"  v_chord_{i} uuid;")
    print("BEGIN")

    for i in range(1, 6):
        print(
            f"  SELECT id INTO v_phrase_{i} FROM public.survival_phrases "
            f"WHERE map_category = 'phrases' AND stage_number = {i};"
        )

    for i, (chord_name, notes) in enumerate(stages, start=1):
        print(
            f"  INSERT INTO public.survival_phrase_chords "
            f"(phrase_id, order_index, chord_name, measure_number)\n"
            f"  VALUES (v_phrase_{i}, 0, '{sql_escape(chord_name)}', 1)\n"
            f"  RETURNING id INTO v_chord_{i};"
        )
        if notes:
            vals = []
            for oi, (nm, midi, pc) in enumerate(notes):
                vals.append(
                    f"    (v_chord_{i}, {oi}, {midi}, {pc}, '{sql_escape(nm)}', 1)"
                )
            print(
                "  INSERT INTO public.survival_phrase_chord_notes "
                "(chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES\n"
                + ",\n".join(vals)
                + ";"
            )

    print("END $$;")
    print()
    print("COMMIT;")


def main() -> None:
    if "--emit-migration" not in sys.argv:
        print("Usage: python3 scripts/generate-survival-phrases-1-5-sql.py --emit-migration", file=sys.stderr)
        sys.exit(1)
    emit_migration_sql()


if __name__ == "__main__":
    main()
