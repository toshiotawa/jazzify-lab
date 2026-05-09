-- iOS デモプレイ用のコード演奏バトル（chord_voicing）ステージ。
-- 開発者ステージ `dev-chord-voicing-bpm100-test` の現在のデータを INSERT で複製し、
-- 以後は開発者ステージとは独立に編集できるようにする（ミラーリングではない）。
-- - `ear_training_stages` に `is_demo` フラグを追加し、一般ステージ一覧から除外する。
-- - 既存 SELECT ポリシー（is_active=true で anon 可）に乗るので追加ポリシーは不要。

BEGIN;

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.is_demo IS
  'iOS デモプレイ用ステージ。一般のステージ一覧からは除外し、未認証のデモ起動時のみ slug 直指定で参照する。';

DO $$
DECLARE
  src_stage_id uuid := uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage');
  demo_ns      uuid := 'a0000000-0000-4000-8000-000000000002'::uuid;
  new_stage_id uuid := uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'demo-ios-chord-stage');
BEGIN
  -- 既存のデモ行を一掃（再適用許容）
  DELETE FROM public.ear_training_phrase_demo_loops
  WHERE phrase_id IN (SELECT id FROM public.ear_training_phrases WHERE stage_id = new_stage_id);

  DELETE FROM public.ear_training_phrase_chords
  WHERE phrase_id IN (SELECT id FROM public.ear_training_phrases WHERE stage_id = new_stage_id);

  DELETE FROM public.ear_training_phrase_notes
  WHERE phrase_id IN (SELECT id FROM public.ear_training_phrases WHERE stage_id = new_stage_id);

  DELETE FROM public.ear_training_phrases WHERE stage_id = new_stage_id;
  DELETE FROM public.ear_training_stages WHERE id = new_stage_id;

  -- ステージ複製
  INSERT INTO public.ear_training_stages (
    id, slug, title, title_en, description, description_en,
    bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
    count_in_beats, time_limit_sec, player_hp, enemy_hp,
    per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
    miss_damage, fail_damage, perfect_max_misses, great_max_misses,
    background_theme, is_active, mode, key_fifths, is_demo
  )
  SELECT
    new_stage_id,
    'demo-ios-chord-voicing-bpm100',
    'コード演奏バトル（デモプレイ）',
    'Chord voicing battle (demo)',
    'iOS デモプレイ用。' || COALESCE(s.description, ''),
    'iOS demo play. ' || COALESCE(s.description_en, ''),
    s.bpm, s.beats_per_measure, s.beat_type, s.loop_measures, s.max_loops_per_phrase,
    s.count_in_beats, s.time_limit_sec, s.player_hp, s.enemy_hp,
    s.per_correct_note_damage, s.good_completion_damage, s.great_completion_damage, s.perfect_completion_damage,
    s.miss_damage, s.fail_damage, s.perfect_max_misses, s.great_max_misses,
    s.background_theme, true, s.mode, s.key_fifths, true
  FROM public.ear_training_stages s
  WHERE s.id = src_stage_id;

  -- フレーズ複製（id は demo 名前空間で派生）
  INSERT INTO public.ear_training_phrases (
    id, stage_id, order_index, title, title_en,
    music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
  )
  SELECT
    uuid_generate_v5(demo_ns, p.id::text),
    new_stage_id,
    p.order_index, p.title, p.title_en,
    p.music_xml_url, p.audio_url, p.loop_duration_sec, p.audio_duration_sec, p.note_count, p.key_fifths
  FROM public.ear_training_phrases p
  WHERE p.stage_id = src_stage_id;

  -- コード進行（chord_voicing 用 voicing 含む）複製
  INSERT INTO public.ear_training_phrase_chords (
    id, phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats,
    start_time_sec, end_time_sec, voicing, voicing_staves
  )
  SELECT
    uuid_generate_v5(demo_ns, c.id::text),
    uuid_generate_v5(demo_ns, c.phrase_id::text),
    c.order_index, c.chord_name, c.measure_number, c.beat_offset, c.duration_beats,
    c.start_time_sec, c.end_time_sec, c.voicing, c.voicing_staves
  FROM public.ear_training_phrase_chords c
  JOIN public.ear_training_phrases p ON p.id = c.phrase_id
  WHERE p.stage_id = src_stage_id;

  -- 単音ノート（chord_voicing では通常空だが念のため）複製
  INSERT INTO public.ear_training_phrase_notes (
    id, phrase_id, note_index, pitch_midi, pitch_class, note_name, octave,
    measure_number, beat_offset, tied_from_previous
  )
  SELECT
    uuid_generate_v5(demo_ns, n.id::text),
    uuid_generate_v5(demo_ns, n.phrase_id::text),
    n.note_index, n.pitch_midi, n.pitch_class, n.note_name, n.octave,
    n.measure_number, n.beat_offset, n.tied_from_previous
  FROM public.ear_training_phrase_notes n
  JOIN public.ear_training_phrases p ON p.id = n.phrase_id
  WHERE p.stage_id = src_stage_id;

  -- お手本ループ複製
  INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number)
  SELECT
    uuid_generate_v5(demo_ns, dl.phrase_id::text),
    dl.loop_number
  FROM public.ear_training_phrase_demo_loops dl
  JOIN public.ear_training_phrases p ON p.id = dl.phrase_id
  WHERE p.stage_id = src_stage_id;
END $$;

COMMIT;
