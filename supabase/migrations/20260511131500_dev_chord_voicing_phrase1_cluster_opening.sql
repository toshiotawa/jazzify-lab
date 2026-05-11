-- 開発テスト chord voicing: フレーズ1 小節1–2 は低音譜クラスター（Dm7: D3–E3–F3、G7: D4–E4–F4）。
-- Dm7: 低音譜 staff 2・D3–E3–F3。G7: 同 staff・1オクターブ上げ D4–E4–F4（加線確認用）。小節3–4 は従来どおり CM7。

BEGIN;

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1')
  AND measure_number IN (1, 2);

INSERT INTO public.ear_training_phrase_chords (
  id,
  phrase_id,
  order_index,
  chord_name,
  measure_number,
  beat_offset,
  duration_beats,
  start_time_sec,
  end_time_sec,
  voicing,
  voicing_staves
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m1-cluster'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    2.4,
    ARRAY['D3', 'E3', 'F3']::text[],
    ARRAY[2, 2, 2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m2-cluster'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    1,
    'G7',
    2,
    1,
    4,
    2.4,
    4.8,
    ARRAY['D4', 'E4', 'F4']::text[],
    ARRAY[2, 2, 2]::smallint[]
  );

UPDATE public.ear_training_phrase_chords
SET order_index = order_index - 6
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1')
  AND measure_number >= 3;

UPDATE public.ear_training_stages
SET
  description = 'BPM100・4小節×6ループのクリックのみ。フレーズ1: 小節1 Dm7 は低音譜で D–E–F（オク3）、小節2 G7 は同 staff で 1オクターブ上の D–E–F（加線確認）、続けて CM7 / CM7（転回）。フレーズ2: 各コードを八分で R 3 5 7 を2周。',
  description_en = 'Click-only at 100 BPM, 4 bars × 6 loops. Phrase 1: m1 Dm7 D–E–F cluster octave 3 on bass staff; m2 G7 same staff, cluster octave 4 (ledger check); then CM7 / CM7 (inv.). Phrase 2: eighth notes R 3 5 7 ×2 per chord.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage');

COMMIT;
