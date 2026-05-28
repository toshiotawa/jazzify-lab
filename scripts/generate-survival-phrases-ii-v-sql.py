#!/usr/bin/env python3
"""Survival Phrases II-V (stages 7-438): MusicXML + MP3 CDN から Supabase マイグレーション SQL を生成する。"""
from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHRASES_DIR = ROOT / "public" / "attack_icons" / "survival_phrases"
CDN_BASE = "https://jazzify-cdn.com/fantasy-bgm"
R2_PREFIX = "survival-phrases-ii-v"
COMPOSITE_BGM = f"{CDN_BASE}/survival-composite-phrases-drums160-loop.mp3"
BOSS_TYPES = ("A", "B", "C")
BLOCK_RANGES = ((1, 5), (6, 10), (11, 15), (16, 20), (21, 25), (26, 30))
BASE_STAGE = 7
FIRST_NEW_BLOCK_SORT = 1
MUSICXML_MEASURES_PER_PHRASE = 4
MEASURES_PER_PHRASE = 2

STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


@dataclass(frozen=True)
class KeyConfig:
    label: str
    key_fifths: int
    musicxml: str
    mp3_dir: str
    block_slug: str
    r2_slug: str


KEYS: tuple[KeyConfig, ...] = (
    KeyConfig("C", 0, "251譜面_C.musicxml", "C", "c", "c"),
    KeyConfig("F", -1, "251譜面_+5st_F.musicxml.xml", "F", "f", "f"),
    KeyConfig("Bb", -2, "251譜面_-2st_Bb.musicxml.xml", "Bb", "bb", "bb"),
    KeyConfig("Eb", -3, "251譜面_+3st_Eb.musicxml.xml", "Eb", "eb", "eb"),
    KeyConfig("Ab", -4, "251譜面_-4st_Ab.musicxml.xml", "Ab", "ab", "ab"),
    KeyConfig("Db", -5, "251譜面_+1st_Db.musicxml.xml", "Db", "db", "db"),
    KeyConfig("Gb", -6, "251譜面_+6st_Gb.musicxml.xml", "Gb", "gb", "gb"),
    KeyConfig("B", 5, "251譜面_-1st_B.musicxml.xml", "B", "b", "b"),
    KeyConfig("E", 4, "251譜面_+4st_E.musicxml.xml", "E", "e", "e"),
    KeyConfig("A", 3, "251譜面_-3st_A.musicxml.xml", "A", "a", "a"),
    KeyConfig("D", 2, "251譜面_+2st_D.musicxml.xml", "D", "d", "d"),
    KeyConfig("G", 1, "251譜面_-5st_G.musicxml.xml", "G", "g", "g"),
)


@dataclass(frozen=True)
class MeasureData:
    chord_name: str
    notes: tuple[tuple[str, int, int], ...]


@dataclass(frozen=True)
class PhraseData:
    phrase_index: int
    measures: tuple[MeasureData, ...]


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


def parse_measure(measure: ET.Element) -> MeasureData:
    harmony = measure.find("harmony")
    chord = harmony_name(harmony) if harmony is not None else "?"
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
    return MeasureData(chord, tuple(notes))


def parse_musicxml(path: Path) -> tuple[int, tuple[PhraseData, ...]]:
    tree = ET.parse(path)
    part = tree.getroot().find("part")
    if part is None:
        raise ValueError(f"no part in {path}")

    measures = list(part.findall("measure"))
    if len(measures) != 120:
        raise ValueError(f"{path}: expected 120 measures, got {len(measures)}")

    first = measures[0]
    attrs = first.find("attributes")
    key_fifths = 0
    if attrs is not None:
        fifths = attrs.find("key/fifths")
        if fifths is not None and fifths.text:
            key_fifths = int(fifths.text)

    phrases: list[PhraseData] = []
    for phrase_idx in range(30):
        start = phrase_idx * MUSICXML_MEASURES_PER_PHRASE
        chunk = measures[start : start + MUSICXML_MEASURES_PER_PHRASE]
        phrase_measures = tuple(parse_measure(m) for m in chunk[:MEASURES_PER_PHRASE])
        phrases.append(PhraseData(phrase_idx + 1, phrase_measures))

    return key_fifths, tuple(phrases)


def stage_number(key_index: int, block_index: int, slot_index: int) -> int:
    return BASE_STAGE + key_index * 36 + block_index * 6 + slot_index


def global_block_index(key_index: int, block_index: int) -> int:
    return FIRST_NEW_BLOCK_SORT + key_index * 6 + block_index


def boss_type_for_block(key_index: int, block_index: int) -> str:
    idx = global_block_index(key_index, block_index)
    return BOSS_TYPES[idx % 3]


def block_key(key: KeyConfig, block_index: int) -> str:
    return f"phrases_ii_v_{key.block_slug}_{block_index + 1}"


def block_label(key: KeyConfig, block_index: int) -> str:
    lo, hi = BLOCK_RANGES[block_index]
    return f"II-V in {key.label} {lo}-{hi}"


def bgm_url(key: KeyConfig, phrase_index: int) -> str:
    return f"{CDN_BASE}/{R2_PREFIX}-{key.r2_slug}-{phrase_index:02d}.mp3"


def emit_key_migration(key_index: int, key: KeyConfig, phrases: tuple[PhraseData, ...]) -> str:
    first_stage = stage_number(key_index, 0, 0)
    last_stage = stage_number(key_index, 5, 5)
    lines: list[str] = [
        "BEGIN;",
        "",
        f"-- Survival Phrases II-V key {key.label}: stages {first_stage}-{last_stage}",
        f"-- MusicXML: {key.musicxml} (30 phrases x {MEASURES_PER_PHRASE} measures; first half of 4-measure source)",
        "",
    ]

    lines.append(
        f"""DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN {first_stage} AND {last_stage}
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN {first_stage} AND {last_stage};

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN {first_stage} AND {last_stage}
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN {first_stage} AND {last_stage}
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN {first_stage} AND {last_stage};

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN {first_stage} AND {last_stage};
"""
    )

    for block_index in range(6):
        bk = block_key(key, block_index)
        label = block_label(key, block_index)
        sort_order = global_block_index(key_index, block_index)
        lines.append(
            f"""INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', '{bk}', '{sql_escape(label)}', '{sql_escape(label)}', {sort_order})
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
"""
        )

    regular_stages: list[tuple[int, int, int, int]] = []
    composite_stages: list[tuple[int, int, int, list[int]]] = []

    for block_index in range(6):
        bk = block_key(key, block_index)
        label = block_label(key, block_index)
        source_stages: list[int] = []

        for slot_index in range(5):
            stage_num = stage_number(key_index, block_index, slot_index)
            phrase_idx = block_index * 5 + slot_index
            phrase = phrases[phrase_idx]
            phrase_num = phrase_idx + 1
            name_ja = f"II-V in {key.label} · {phrase_num}"
            name_en = f"II-V in {key.label} · {phrase_num}"
            regular_stages.append((stage_num, phrase_idx, block_index, slot_index))

            lines.append(
                f"""INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  {stage_num},
  'progression',
  '{sql_escape(name_ja)}',
  '{sql_escape(name_en)}',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  '{bk}',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;
"""
            )

            lines.append(
                f"""INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  {stage_num},
  '{sql_escape(name_en)}',
  '{bgm_url(key, phrase_num)}',
  {key.key_fifths}
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();
"""
            )
            source_stages.append(stage_num)

        composite_stage = stage_number(key_index, block_index, 5)
        boss_type = boss_type_for_block(key_index, block_index)
        comp_name_ja = f"複合フレーズ · {label}"
        comp_name_en = f"Composite · {label}"
        composite_stages.append((composite_stage, block_index, boss_type, source_stages))

        lines.append(
            f"""INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  {composite_stage},
  'progression',
  '{sql_escape(comp_name_ja)}',
  '{sql_escape(comp_name_en)}',
  'easy',
  '',
  '{sql_escape(label)}',
  '{sql_escape(label)}',
  NULL,
  NULL,
  NULL,
  '{bk}',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', {composite_stage}, '{boss_type}', {key.key_fifths}, '{COMPOSITE_BGM}')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();
"""
        )

    lines.append("DO $$")
    lines.append("DECLARE")
    for stage_num, _, _, _ in regular_stages:
        lines.append(f"  v_phrase_{stage_num} uuid;")
        for mi in range(MEASURES_PER_PHRASE):
            lines.append(f"  v_chord_{stage_num}_{mi} uuid;")
    for composite_stage, _, _, _ in composite_stages:
        lines.append(f"  v_comp_{composite_stage} uuid;")
    lines.append("BEGIN")

    for stage_num, phrase_idx, _, _ in regular_stages:
        lines.append(
            f"  SELECT id INTO v_phrase_{stage_num} FROM public.survival_phrases "
            f"WHERE map_category = 'phrases' AND stage_number = {stage_num};"
        )
        phrase = phrases[phrase_idx]
        for mi, measure in enumerate(phrase.measures):
            lines.append(
                f"  INSERT INTO public.survival_phrase_chords "
                f"(phrase_id, order_index, chord_name, measure_number)\n"
                f"  VALUES (v_phrase_{stage_num}, {mi}, '{sql_escape(measure.chord_name)}', {mi + 1})\n"
                f"  RETURNING id INTO v_chord_{stage_num}_{mi};"
            )
            if measure.notes:
                vals = [
                    f"    (v_chord_{stage_num}_{mi}, {oi}, {midi}, {pc}, '{sql_escape(nm)}', 1)"
                    for oi, (nm, midi, pc) in enumerate(measure.notes)
                ]
                lines.append(
                    "  INSERT INTO public.survival_phrase_chord_notes "
                    "(chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES\n"
                    + ",\n".join(vals)
                    + ";"
                )

    for composite_stage, _, _, source_stages in composite_stages:
        lines.append(
            f"  SELECT id INTO v_comp_{composite_stage} FROM public.survival_composite_phrase_stages "
            f"WHERE map_category = 'phrases' AND stage_number = {composite_stage};"
        )
        lines.append(
            f"  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_{composite_stage};"
        )
        for sort_order, src in enumerate(source_stages):
            lines.append(
                f"  INSERT INTO public.survival_composite_phrase_sources "
                f"(composite_id, source_stage_number, sort_order) "
                f"VALUES (v_comp_{composite_stage}, {src}, {sort_order});"
            )

    lines.append("END $$;")
    lines.append("")
    lines.append("COMMIT;")
    return "\n".join(lines)


def migration_filename(key_index: int, key: KeyConfig) -> str:
    return f"20260702{key_index + 1:02d}0000_survival_phrases_ii_v_key_{key.r2_slug}.sql"


def generate_key(key_index: int, key: KeyConfig, out_dir: Path | None) -> Path | None:
    xml_path = PHRASES_DIR / key.musicxml
    if not xml_path.exists():
        raise FileNotFoundError(f"MusicXML not found: {xml_path}")

    _, phrases = parse_musicxml(xml_path)
    sql = emit_key_migration(key_index, key, phrases)

    if out_dir is None:
        print(sql)
        return None

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / migration_filename(key_index, key)
    out_path.write_text(sql, encoding="utf-8")
    print(f"Wrote {out_path} ({len(sql) // 1024} KB)", file=sys.stderr)
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key", choices=[k.label for k in KEYS], help="Generate SQL for one key")
    parser.add_argument("--all-keys", action="store_true", help="Generate migration files for all 12 keys")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=ROOT / "supabase" / "migrations",
        help="Output directory for migration SQL files",
    )
    parser.add_argument("--emit-migration", action="store_true", help="Print SQL to stdout (single key)")
    args = parser.parse_args()

    if args.all_keys:
        for key_index, key in enumerate(KEYS):
            generate_key(key_index, key, args.out_dir)
        return

    if args.key:
        key_index = next(i for i, k in enumerate(KEYS) if k.label == args.key)
        key = KEYS[key_index]
        out_dir = None if args.emit_migration else args.out_dir
        generate_key(key_index, key, out_dir)
        return

    parser.print_help()
    sys.exit(1)


if __name__ == "__main__":
    main()
