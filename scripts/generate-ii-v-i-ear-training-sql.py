#!/usr/bin/env python3
"""II-V-I 01-05 C MusicXML から耳コピ用 SQL 断片を標準出力へ（補助スクリプト）。"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_XML = ROOT / "public" / "II-V-I_1-50" / "II-V 50 - 01-05_C.musicxml"

STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

BPM = 160
BEATS_PER_MEASURE = 4
BEAT_SEC = 60 / BPM


def midi_for_pitch(step: str, alter: int, octave: int) -> int:
    pc = STEP_PC[step] + alter
    return (octave + 1) * 12 + pc


def pitch_class(m: int) -> int:
    return ((m % 12) + 12) % 12


def round3(x: float) -> float:
    return round(x * 1000) / 1000


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


def iter_measures(part: ET.Element) -> list[ET.Element]:
    return list(part.findall("measure"))


def parse_phrase(
    measures: list[ET.Element],
    bpm: float,
) -> tuple[list[dict], list[dict]]:
    """Parse 4 measures: notes and harmony with times in seconds from phrase start."""

    div_pq = 12
    abs_div_phrase = 0
    raw_notes: list[tuple[float, int, str, int]] = []
    harmony_events: list[tuple[float, str]] = []

    for measure in measures:
        beats = BEATS_PER_MEASURE
        beat_type = 4
        measure_div = int(beats * 4 / beat_type * div_pq)

        attrs = measure.find("attributes")
        if attrs is not None:
            d = attrs.find("divisions")
            if d is not None and d.text:
                v = int(d.text)
                if v > 0:
                    div_pq = v
                measure_div = int(beats * 4 / beat_type * div_pq)
            te = attrs.find("time")
            if te is not None:
                b = te.find("beats")
                bt = te.find("beat-type")
                if b is not None and b.text:
                    beats = int(b.text)
                if bt is not None and bt.text:
                    beat_type = int(bt.text)
                measure_div = int(beats * 4 / beat_type * div_pq)

        pos = 0
        for child in measure:
            if child.tag == "sound":
                continue
            if child.tag == "harmony":
                beat_sec = 60 / bpm
                time_sec = (abs_div_phrase + pos) / div_pq * beat_sec
                harmony_events.append((time_sec, harmony_name(child)))
                continue
            if child.tag == "forward":
                pos += int(child.find("duration").text or 0)
                continue
            if child.tag != "note":
                continue

            is_chord = child.find("chord") is not None
            dur_el = child.find("duration")
            duration = int(dur_el.text) if dur_el is not None and dur_el.text else 0

            if child.find("rest") is not None:
                if not is_chord:
                    pos += duration
                continue

            pel = child.find("pitch")
            if pel is None:
                if not is_chord:
                    pos += duration
                continue

            step = pel.find("step")
            st = step.text if step is not None and step.text else "C"
            alt_el = pel.find("alter")
            alt = int(alt_el.text) if alt_el is not None and alt_el.text else 0
            oc_el = pel.find("octave")
            octv = int(oc_el.text) if oc_el is not None and oc_el.text else 4

            m = midi_for_pitch(st, alt, octv)
            nm = note_display_name(st, alt, octv)
            t_sec = (abs_div_phrase + pos) / div_pq * (60 / bpm)
            raw_notes.append((t_sec, m, nm, octv))

            if not is_chord:
                pos += duration

        abs_div_phrase += measure_div

    raw_notes.sort(key=lambda x: (x[0], x[1]))

    note_rows: list[dict] = []
    for i, (t_sec, m, nm, octv) in enumerate(raw_notes):
        total_beats = t_sec / BEAT_SEC
        measure_number = int(total_beats // BEATS_PER_MEASURE) + 1
        beat_offset = round3((total_beats % BEATS_PER_MEASURE) + 1)
        note_rows.append(
            {
                "note_index": i,
                "pitch_midi": m,
                "pitch_class": pitch_class(m),
                "note_name": nm,
                "octave": octv,
                "measure_number": measure_number,
                "beat_offset": beat_offset,
            }
        )

    # chords: map harmony to measure/beat like TS (first harmony per measure wins onset)
    chord_rows: list[dict] = []
    if harmony_events:
        harmony_events.sort(key=lambda x: x[0])
        beat_duration = BEAT_SEC
        for i, (t_sec, cname) in enumerate(harmony_events):
            total_beats = t_sec / beat_duration
            measure_number = int(total_beats // BEATS_PER_MEASURE) + 1
            beat_offset = round3((total_beats % BEATS_PER_MEASURE) + 1)
            next_t = harmony_events[i + 1][0] if i + 1 < len(harmony_events) else len(measures) * BEATS_PER_MEASURE * beat_duration
            end_sec = round3(next_t)
            chord_rows.append(
                {
                    "order_index": i,
                    "chord_name": cname,
                    "measure_number": measure_number,
                    "beat_offset": beat_offset,
                    "duration_beats": round3((next_t - t_sec) / beat_duration),
                    "start_time_sec": round3(t_sec),
                    "end_time_sec": end_sec,
                }
            )

    # trim chord end_time to loop end (6s)
    for ch in chord_rows:
        if ch["end_time_sec"] > 6:
            ch["end_time_sec"] = 6.0

    return note_rows, chord_rows


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def emit_migration_sql() -> None:
    import uuid

    ns = uuid.UUID("a0000000-0000-4000-8000-000000000001")
    stage_id = uuid.uuid5(ns, "ear-stage-ii-v-i-ear-battle-1-5-c")
    phrase_ids = [uuid.uuid5(ns, f"ear-ph-ii-v-i-1-5-c-{i:02d}") for i in range(1, 6)]
    existing_lesson_id = uuid.uuid5(ns, "lsn-c-1-5")
    attach_lesson_song_id = uuid.uuid5(ns, "lsg-c-1-5-ear")

    phrase_meta: list[tuple[list[dict], list[dict], int]] = []

    tree = ET.parse(_XML)
    root_el = tree.getroot()
    part = root_el.find(".//part[@id='P1']")
    if part is None:
        part = root_el.find("part")
    if part is None:
        raise SystemExit("no part")
    all_m = iter_measures(part)
    m_by_num = {int(m.get("number", "0")): m for m in all_m}
    total_notes = 0

    for p in range(5):
        start_m = p * 8 + 1
        slice_m = [m_by_num[start_m + k] for k in range(4)]
        notes, chords = parse_phrase(slice_m, BPM)
        phrase_meta.append((notes, chords, len(notes)))
        total_notes += len(notes)

    good_d, great_d, perfect_d = 24, 41, 75

    def dmg_rounds(comp: int, r: int) -> int:
        return r * (total_notes + 5 * comp)

    print("BEGIN;")
    print()
    print("ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS assignment_description_en text;")
    print()
    print("-- II-V-I phrases 1-5 (C) ear training battle")
    print(f"-- N={total_notes} completion damage: good={good_d} great={great_d} perfect={perfect_d}")
    print(f"-- rounds check: 3*great={dmg_rounds(great_d,3)} 2*perf={dmg_rounds(perfect_d,2)} 4*good={dmg_rounds(good_d,4)}")
    print()

    print(
        f"""DELETE FROM public.lesson_songs
WHERE id = '{attach_lesson_song_id}'::uuid
   OR id = '573f6350-d425-57bc-b66d-95381c5a6079'::uuid
   OR (lesson_id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid AND ear_training_stage_id = '{stage_id}'::uuid);

DELETE FROM public.lessons WHERE id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid;

DELETE FROM public.ear_training_phrase_demo_loops WHERE phrase_id = ANY (ARRAY[{", ".join(f"'{pid}'::uuid" for pid in phrase_ids)}]);
DELETE FROM public.ear_training_phrase_notes WHERE phrase_id = ANY (ARRAY[{", ".join(f"'{pid}'::uuid" for pid in phrase_ids)}]);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = ANY (ARRAY[{", ".join(f"'{pid}'::uuid" for pid in phrase_ids)}]);
DELETE FROM public.ear_training_phrases WHERE id = ANY (ARRAY[{", ".join(f"'{pid}'::uuid" for pid in phrase_ids)}]);
DELETE FROM public.ear_training_stages WHERE id = '{stage_id}'::uuid;
"""
    )

    print(
        f"""
INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase, count_in_beats,
  time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active
) VALUES (
  '{stage_id}'::uuid,
  'ii-v-i-ear-battle-1-5-c',
  'II-V-I フレーズ1-5（C）耳コピバトル',
  'II-V-I phrases 1-5 (C) ear-copy battle',
  'II-V-I進行のフレーズ1-5を、模範演奏とクリックの6ループで聴き取り、同じメロディを入力します。BPM 160。',
  'Practice phrases 1-5 over II-V-I in C: six alternating demo and click loops per phrase at 160 BPM.',
  160, 4, 4, 4, 6, 4,
  510, 100, 1000,
  1, {good_d}, {great_d}, {perfect_d},
  2, 10, 0, 2,
  'blue_club', true
);
"""
    )

    for p in range(5):
        pid = phrase_ids[p]
        notes, chords, nc = phrase_meta[p]
        title = f"フレーズ {p + 1}"
        title_en = f"Phrase {p + 1}"
        url = f"https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-{p + 1:02d}.mp3"
        print(
            f"""
INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  '{pid}'::uuid,
  '{stage_id}'::uuid,
  {p},
  '{sql_escape(title)}',
  '{sql_escape(title_en)}',
  null,
  '{url}',
  6,
  36,
  {nc}
);
"""
        )

        note_vals = []
        for r in notes:
            note_vals.append(
                f"('{pid}'::uuid, {r['note_index']}, {r['pitch_midi']}, {r['pitch_class']}, "
                f"'{sql_escape(r['note_name'])}', {r['octave']}, {r['measure_number']}, {r['beat_offset']})"
            )
        print(
            "INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES\n  "
            + ",\n  ".join(note_vals)
            + ";\n"
        )

        ch_vals = []
        for ch in chords:
            ch_vals.append(
                f"('{pid}'::uuid, {ch['order_index']}, '{sql_escape(ch['chord_name'])}', "
                f"{ch['measure_number']}, {ch['beat_offset']}, {ch['duration_beats']}, "
                f"{ch['start_time_sec']}, {ch['end_time_sec']})"
            )
        print(
            "INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES\n  "
            + ",\n  ".join(ch_vals)
            + ";\n"
        )

        print(
            f"INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES "
            f"('{pid}'::uuid, 1), ('{pid}'::uuid, 3), ('{pid}'::uuid, 5);\n"
        )

    print(
        f"""
UPDATE public.lessons SET
  description =
    '実習: (1) リンク先のファンタジーステージをクリア（ランクC以上・1回）。(2) 耳コピバトルステージを1回クリア（ランクB以上）してください。',
  description_en =
    'Practice: (1) Clear the linked Fantasy stage once (rank C or better). (2) Clear the ear-copy battle stage once (rank B or better).',
  assignment_description = '制限時間内にステージクリアを目指してください。',
  assignment_description_en = 'Aim to clear the stage within the time limit.'
WHERE id = '{existing_lesson_id}'::uuid;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_ear_training, ear_training_stage_id, title, title_en
) VALUES (
  '{attach_lesson_song_id}'::uuid,
  '{existing_lesson_id}'::uuid,
  null,
  1,
  '{{"count":1,"rank":"B"}}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  '{stage_id}'::uuid,
  '課題（耳コピバトル）',
  'Assignment (ear-copy battle)'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
  fantasy_stage_id = EXCLUDED.fantasy_stage_id,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;
"""
    )

    print("COMMIT;")


def main() -> None:
    if "--emit-migration" in sys.argv:
        emit_migration_sql()
        return

    tree = ET.parse(_XML)
    root_el = tree.getroot()
    part = root_el.find(".//part[@id='P1']")
    if part is None:
        part = root_el.find("part")

    if part is None:
        print("No part", file=sys.stderr)
        sys.exit(1)

    all_m = iter_measures(part)
    m_by_num = {}
    for m in all_m:
        num = int(m.get("number", "0"))
        m_by_num[num] = m

    print("-- phrase note counts (expected from MusicXML parser)")
    total_notes = 0
    for p in range(5):
        start_m = p * 8 + 1
        slice_m = [m_by_num[start_m + k] for k in range(4)]
        notes, chords = parse_phrase(slice_m, BPM)
        total_notes += len(notes)
        print(f"-- phrase {p+1}: {len(notes)} notes, {len(chords)} chord rows")
        for r in notes[:3]:
            print(f"   sample {r}")
    print(f"-- TOTAL N = {total_notes}")
    good_d, great_d, perfect_d = 24, 41, 75

    def dmg_rounds(comp: int, r: int) -> int:
        return r * (total_notes + 5 * comp)

    print(
        f"-- completion damage: good={good_d} great={great_d} perfect={perfect_d} | "
        f"3*great={dmg_rounds(great_d,3)} 2*perf={dmg_rounds(perfect_d,2)} 4*good={dmg_rounds(good_d,4)}"
    )


if __name__ == "__main__":
    main()
