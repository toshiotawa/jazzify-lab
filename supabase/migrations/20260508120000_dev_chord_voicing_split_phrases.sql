-- 開発者コース chord voicing テスト: フレーズ1は各コードを4拍で R/3/5/7 に分割、フレーズ2は各コードを八分×8（R 3 5 7 ×2）に分割。
-- BPM100・小節 2.4s・harmony 終端は従来どおり（同一 chord_name + 同一 end_time_sec でグループ化）。

BEGIN;

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2')
);

UPDATE public.ear_training_stages
SET
  description = 'BPM100・4小節×6ループのクリックのみ。フレーズ1: 各コードを4拍でルート・3rd・5th・7th。フレーズ2: 各コードを八分で R 3 5 7 を2周。',
  description_en = 'Click-only at 100 BPM, 4 bars × 6 loops. Phrase 1: each chord split per beat R–3rd–5th–7th. Phrase 2: eighth notes R 3 5 7 ×2 per chord.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage');

-- フレーズ1: Dm7 / G7 / CM7 / CM7（転回）— 各小節4行、拍頭 start・小節末 end 2.4
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
  -- m1 Dm7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m1-q1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 0, 'Dm7', 1, 1, 1, 0, 2.4, ARRAY['D3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m1-q2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 1, 'Dm7', 1, 2, 1, 0.6, 2.4, ARRAY['F3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m1-q3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 2, 'Dm7', 1, 3, 1, 1.2, 2.4, ARRAY['A3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m1-q4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 3, 'Dm7', 1, 4, 1, 1.8, 2.4, ARRAY['C4']::text[], ARRAY[1]::smallint[]),
  -- m2 G7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m2-q1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 4, 'G7', 2, 1, 1, 2.4, 4.8, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m2-q2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 5, 'G7', 2, 2, 1, 3.0, 4.8, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m2-q3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 6, 'G7', 2, 3, 1, 3.6, 4.8, ARRAY['D4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m2-q4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 7, 'G7', 2, 4, 1, 4.2, 4.8, ARRAY['F4']::text[], ARRAY[1]::smallint[]),
  -- m3 CM7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m3-q1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 8, 'CM7', 3, 1, 1, 4.8, 7.2, ARRAY['C3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m3-q2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 9, 'CM7', 3, 2, 1, 5.4, 7.2, ARRAY['E3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m3-q3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 10, 'CM7', 3, 3, 1, 6.0, 7.2, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m3-q4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 11, 'CM7', 3, 4, 1, 6.6, 7.2, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  -- m4 CM7（第3転回形）
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m4-q1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 12, 'CM7', 4, 1, 1, 7.2, 9.6, ARRAY['E3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m4-q2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 13, 'CM7', 4, 2, 1, 7.8, 9.6, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m4-q3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 14, 'CM7', 4, 3, 1, 8.4, 9.6, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-m4-q4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 15, 'CM7', 4, 4, 1, 9.0, 9.6, ARRAY['D4']::text[], ARRAY[1]::smallint[]);

-- フレーズ2: Em7 / A7 / Dm7 / G7 — 各小節8行（八分）、同一小節末 end_time_sec
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
  -- m1 Em7 R 3 5 7 ×2
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 0, 'Em7', 1, 1, 0.5, 0, 2.4, ARRAY['E3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 1, 'Em7', 1, 1.5, 0.5, 0.3, 2.4, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 2, 'Em7', 1, 2, 0.5, 0.6, 2.4, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 3, 'Em7', 1, 2.5, 0.5, 0.9, 2.4, ARRAY['D4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e5'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 4, 'Em7', 1, 3, 0.5, 1.2, 2.4, ARRAY['E3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e6'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 5, 'Em7', 1, 3.5, 0.5, 1.5, 2.4, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e7'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 6, 'Em7', 1, 4, 0.5, 1.8, 2.4, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m1-e8'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 7, 'Em7', 1, 4.5, 0.5, 2.1, 2.4, ARRAY['D4']::text[], ARRAY[1]::smallint[]),
  -- m2 A7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 8, 'A7', 2, 1, 0.5, 2.4, 4.8, ARRAY['A2']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 9, 'A7', 2, 1.5, 0.5, 2.7, 4.8, ARRAY['C#4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 10, 'A7', 2, 2, 0.5, 3.0, 4.8, ARRAY['E4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 11, 'A7', 2, 2.5, 0.5, 3.3, 4.8, ARRAY['G4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e5'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 12, 'A7', 2, 3, 0.5, 3.6, 4.8, ARRAY['A2']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e6'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 13, 'A7', 2, 3.5, 0.5, 3.9, 4.8, ARRAY['C#4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e7'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 14, 'A7', 2, 4, 0.5, 4.2, 4.8, ARRAY['E4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m2-e8'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 15, 'A7', 2, 4.5, 0.5, 4.5, 4.8, ARRAY['G4']::text[], ARRAY[1]::smallint[]),
  -- m3 Dm7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 16, 'Dm7', 3, 1, 0.5, 4.8, 7.2, ARRAY['D3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 17, 'Dm7', 3, 1.5, 0.5, 5.1, 7.2, ARRAY['F3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 18, 'Dm7', 3, 2, 0.5, 5.4, 7.2, ARRAY['A3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 19, 'Dm7', 3, 2.5, 0.5, 5.7, 7.2, ARRAY['C4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e5'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 20, 'Dm7', 3, 3, 0.5, 6.0, 7.2, ARRAY['D3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e6'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 21, 'Dm7', 3, 3.5, 0.5, 6.3, 7.2, ARRAY['F3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e7'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 22, 'Dm7', 3, 4, 0.5, 6.6, 7.2, ARRAY['A3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m3-e8'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 23, 'Dm7', 3, 4.5, 0.5, 6.9, 7.2, ARRAY['C4']::text[], ARRAY[1]::smallint[]),
  -- m4 G7
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e1'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 24, 'G7', 4, 1, 0.5, 7.2, 9.6, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 25, 'G7', 4, 1.5, 0.5, 7.5, 9.6, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 26, 'G7', 4, 2, 0.5, 7.8, 9.6, ARRAY['D4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e4'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 27, 'G7', 4, 2.5, 0.5, 8.1, 9.6, ARRAY['F4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e5'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 28, 'G7', 4, 3, 0.5, 8.4, 9.6, ARRAY['G3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e6'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 29, 'G7', 4, 3.5, 0.5, 8.7, 9.6, ARRAY['B3']::text[], ARRAY[2]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e7'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 30, 'G7', 4, 4, 0.5, 9.0, 9.6, ARRAY['D4']::text[], ARRAY[1]::smallint[]),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-m4-e8'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 31, 'G7', 4, 4.5, 0.5, 9.3, 9.6, ARRAY['F4']::text[], ARRAY[1]::smallint[]);

COMMIT;
