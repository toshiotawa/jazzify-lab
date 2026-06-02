-- 開発者テストコース「耳コピバトルチュートリアル（全分岐）」に
-- チュートリアルではない耳コピバトル課題（アドリブ / ペアアドリブ / 複合フレーズ）を追加。

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) アドリブ（mode = adlib）
-- ---------------------------------------------------------------------------
DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.ear_training_phrases
  WHERE stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-battle-adlib-stage'
  )
);

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-battle-adlib-stage'
);

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-battle-adlib-stage'
);

INSERT INTO public.ear_training_stages (
  id,
  slug,
  title,
  title_en,
  description,
  description_en,
  bpm,
  beats_per_measure,
  beat_type,
  loop_measures,
  max_loops_per_phrase,
  count_in_beats,
  time_limit_sec,
  player_hp,
  enemy_hp,
  per_correct_note_damage,
  good_completion_damage,
  great_completion_damage,
  perfect_completion_damage,
  miss_damage,
  fail_damage,
  perfect_max_misses,
  great_max_misses,
  background_theme,
  is_active,
  is_demo,
  mode,
  show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-stage'),
  'dev-ear-battle-adlib',
  '耳コピ・アドリブ（開発）',
  'Ear training adlib (dev)',
  '4 小節ループ。2 小節目は聴くだけ（input_disabled）。',
  '4-bar loop. Measure 2 is listen-only.',
  100,
  4,
  4,
  4,
  16,
  4,
  300,
  100,
  8000,
  50,
  12,
  18,
  24,
  8,
  12,
  4,
  8,
  'blue_club',
  true,
  true,
  'adlib',
  true
)
ON CONFLICT (id) DO UPDATE SET
  mode = EXCLUDED.mode,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id,
  stage_id,
  order_index,
  title,
  title_en,
  music_xml_url,
  audio_url,
  loop_duration_sec,
  audio_duration_sec,
  note_count,
  key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-stage'),
  0,
  'アドリブループ',
  'Adlib loop',
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
  4,
  4,
  0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  updated_at = now();

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-battle-adlib-phrase'
);

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
  voicing_staves,
  input_disabled
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-phrase'),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    1,
    ARRAY['D3', 'F3', 'A3', 'C4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-phrase'),
    1,
    '—',
    2,
    1,
    4,
    1,
    2,
    ARRAY[]::text[],
    ARRAY[]::smallint[],
    true
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-phrase'),
    2,
    'G7',
    3,
    1,
    4,
    2,
    3,
    ARRAY['G3', 'B3', 'D4', 'F4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[],
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-phrase'),
    3,
    'CM7',
    4,
    1,
    4,
    3,
    4,
    ARRAY['C3', 'E3', 'G3', 'B3']::text[],
    ARRAY[2, 2, 2, 2]::smallint[],
    false
  );

-- ---------------------------------------------------------------------------
-- 2) ペアアドリブ（mode = phrase_pair_adlib）
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-cm7-group');
  v_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-stage');
  v_cfg uuid;
BEGIN
  INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
  VALUES (v_group, 'CM7', 'CM7 phrase pairs', 0)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

  DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_group;

  INSERT INTO public.ear_training_adlib_patterns (group_id, label, pcs, family_id, carry_tail_length, priority, sort_order) VALUES
    (v_group, 'A', ARRAY[0, 2]::smallint[], 'CM7-A', 0, 0, 0),
    (v_group, 'B', ARRAY[4, 7]::smallint[], 'CM7-B', 0, 0, 1);

  INSERT INTO public.ear_training_stages (
    id, slug, title, title_en, description, description_en,
    bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
    count_in_beats, time_limit_sec, player_hp, enemy_hp,
    per_correct_note_damage, good_completion_damage, great_completion_damage,
    perfect_completion_damage, miss_damage, fail_damage,
    perfect_max_misses, great_max_misses, background_theme,
    is_active, is_demo, mode, show_keyboard_hints_in_battle
  ) VALUES (
    v_stage,
    'dev-ear-battle-pair-adlib',
    '耳コピ・ペアアドリブ（開発）',
    'Ear training phrase-pair adlib (dev)',
    'Dm7-G7-CM7。2 小節目は聴くだけ。',
    'Dm7-G7-CM7. Measure 2 is listen-only.',
    100, 4, 4, 4, 16, 0, 300, 100, 8000,
    50, 12, 18, 24, 8, 12, 4, 8, 'blue_club',
    true, true, 'phrase_pair_adlib', true
  )
  ON CONFLICT (id) DO UPDATE SET
    mode = EXCLUDED.mode,
    title = EXCLUDED.title,
    show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
    updated_at = now();

  INSERT INTO public.ear_training_phrases (
    id, stage_id, order_index, title, title_en,
    music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
  ) VALUES (
    uuid_generate_v5(v_ns, 'dev-ear-battle-pair-adlib-phrase'),
    v_stage, 0, 'ドラムループ', 'Drum loop',
    NULL, '', 4, 4, 0, 0
  )
  ON CONFLICT (id) DO UPDATE SET loop_duration_sec = EXCLUDED.loop_duration_sec;

  DELETE FROM public.ear_training_phrase_pair_adlib_steps WHERE config_id IN (
    SELECT id FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage
  );
  DELETE FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage;

  INSERT INTO public.ear_training_phrase_pair_adlib_config (
    stage_id, bgm_url, key_fifths, loop_duration_sec
  ) VALUES (
    v_stage,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    0,
    4
  )
  RETURNING id INTO v_cfg;

  INSERT INTO public.ear_training_phrase_pair_adlib_steps (
    config_id, order_index, chord_name, pattern_group_id,
    measure_number, start_time_sec, end_time_sec, input_disabled
  ) VALUES
    (v_cfg, 0, 'Dm7', v_group, 1, 0, 1, false),
    (v_cfg, 1, '—', v_group, 2, 1, 2, true),
    (v_cfg, 2, 'G7', v_group, 3, 2, 3, false),
    (v_cfg, 3, 'CM7', v_group, 4, 3, 4, false);
END $$;

-- ---------------------------------------------------------------------------
-- 3) 複合フレーズ（chord_voicing + composite）
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_stage uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-stage');
  v_phrase_a uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-a');
  v_phrase_b uuid := uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-ph-b');
  v_cfg uuid;
BEGIN
  DELETE FROM public.ear_training_composite_phrase_sources
  WHERE config_id IN (
    SELECT id FROM public.ear_training_composite_phrase_config WHERE stage_id = v_stage
  );
  DELETE FROM public.ear_training_composite_phrase_config WHERE stage_id = v_stage;
  DELETE FROM public.ear_training_phrase_chords
  WHERE phrase_id IN (v_phrase_a, v_phrase_b);
  DELETE FROM public.ear_training_phrases WHERE stage_id = v_stage;
  DELETE FROM public.ear_training_stages WHERE id = v_stage;

  INSERT INTO public.ear_training_stages (
    id, slug, title, title_en, description, description_en,
    bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
    count_in_beats, time_limit_sec, player_hp, enemy_hp,
    per_correct_note_damage, good_completion_damage, great_completion_damage,
    perfect_completion_damage, miss_damage, fail_damage,
    perfect_max_misses, great_max_misses, background_theme,
    is_active, is_demo, mode,
    chord_voicing_self_paced, chord_voicing_composite_phrase,
    show_keyboard_hints_in_battle
  ) VALUES (
    v_stage,
    'dev-ear-battle-composite-lite',
    '耳コピ・複合フレーズ（開発・2ソース）',
    'Ear training composite phrase (dev, 2 sources)',
    '2 フレーズ複合。ドラム BGM ループ。',
    'Two-phrase composite. Drum loop BGM.',
    120, 4, 4, 2, 16, 0, 300, 100, 8000,
    50, 12, 18, 24, 8, 12, 4, 8, 'blue_club',
    true, true, 'chord_voicing', true, true, true
  );

  INSERT INTO public.ear_training_phrases (
    id, stage_id, order_index, title, title_en,
    music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
  ) VALUES
    (v_phrase_a, v_stage, 0, 'フレーズ A', 'Phrase A', NULL, '', 4, 4, 4, 0),
    (v_phrase_b, v_stage, 1, 'フレーズ B', 'Phrase B', NULL, '', 4, 4, 4, 0);

  INSERT INTO public.ear_training_phrase_chords (
    id, phrase_id, order_index, chord_name,
    measure_number, beat_offset, duration_beats,
    start_time_sec, end_time_sec, voicing, voicing_staves
  ) VALUES
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c-a0'),
      v_phrase_a, 0, 'Dm7', 1, 1, 4, 0, 2,
      ARRAY['D3', 'F3', 'A3', 'C4']::text[], ARRAY[2, 2, 2, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c-a1'),
      v_phrase_a, 1, 'G7', 2, 1, 4, 2, 4,
      ARRAY['G3', 'B3', 'D4', 'F4']::text[], ARRAY[2, 2, 1, 1]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c-b0'),
      v_phrase_b, 0, 'CM7', 1, 1, 4, 0, 2,
      ARRAY['C3', 'E3', 'G3', 'B3']::text[], ARRAY[2, 2, 2, 2]::smallint[]
    ),
    (
      uuid_generate_v5(v_ns, 'dev-ear-battle-composite-lite-c-b1'),
      v_phrase_b, 1, 'Am7', 2, 1, 4, 2, 4,
      ARRAY['A3', 'C4', 'E4', 'G4']::text[], ARRAY[2, 1, 1, 1]::smallint[]
    );

  INSERT INTO public.ear_training_composite_phrase_config (stage_id, bgm_url, key_fifths)
  VALUES (
    v_stage,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    0
  )
  RETURNING id INTO v_cfg;

  INSERT INTO public.ear_training_composite_phrase_sources (config_id, source_phrase_id, sort_order) VALUES
    (v_cfg, v_phrase_a, 0),
    (v_cfg, v_phrase_b, 1);
END $$;

-- ---------------------------------------------------------------------------
-- lesson_songs（耳コピバトル・非チュートリアル）
-- ---------------------------------------------------------------------------
INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  ear_training_stage_id,
  clear_conditions,
  order_index,
  title,
  title_en,
  is_clear_required
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
    NULL,
    NULL,
    false,
    false,
    true,
    false,
    NULL,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-adlib-stage'),
    '{"count": 1, "rank": "B"}'::jsonb,
    (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
    '耳コピ・アドリブ',
    'Ear training adlib',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-pair-adlib-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
    NULL,
    NULL,
    false,
    false,
    true,
    false,
    NULL,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-pair-adlib-stage'),
    '{"count": 1, "rank": "B"}'::jsonb,
    (SELECT COALESCE(MAX(order_index), 0) + 2 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
    '耳コピ・ペアアドリブ',
    'Ear training phrase-pair adlib',
    false
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-composite-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson'),
    NULL,
    NULL,
    false,
    false,
    true,
    false,
    NULL,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-battle-composite-lite-stage'),
    '{"count": 1, "rank": "B"}'::jsonb,
    (SELECT COALESCE(MAX(order_index), 0) + 3 FROM public.lesson_songs WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-ear-training-tutorial-lesson')),
    '耳コピ・複合フレーズ',
    'Ear training composite phrase',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  clear_conditions = EXCLUDED.clear_conditions,
  order_index = EXCLUDED.order_index;

COMMIT;
