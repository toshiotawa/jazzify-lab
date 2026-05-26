-- 開発者テストコース: 耳コピ chord_voicing 複合フレーズ。
-- ソースはサバイバル phrases マップ stage_number 1〜5（Dm7・6音）を ear_training へミラーし、
-- 同一の CDN 音源 URL を使用（supabase/migrations/20260530130000_survival_phrases_dm7_stages_1_5.sql）。

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-composite-sp15-lsong'
);

DELETE FROM public.lessons
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-composite-sp15-lesson'
);

DELETE FROM public.ear_training_composite_phrase_sources
WHERE config_id IN (
  SELECT id FROM public.ear_training_composite_phrase_config
  WHERE stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-stage'
  )
);

DELETE FROM public.ear_training_composite_phrase_config
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-composite-sp15-stage'
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.ear_training_phrases
  WHERE stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-stage'
  )
);

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-composite-sp15-stage'
);

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-composite-sp15-stage'
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
  chord_voicing_self_paced,
  chord_voicing_composite_phrase
) VALUES (
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-stage'
  ),
  'dev-chord-voicing-composite-survival-phrases-1-5',
  'コード複合（サバイバル phrases 1〜5）',
  'Composite chord voicing (survival phrases 1–5)',
  'サバイバル Phrases ステージ 1〜5 の Dm7 フレーズ（各6音）を複合出題。複合 BGM はドラム160ループ。',
  'Five Dm7 survival phrase stages (six notes each). Composite BGM: 160 BPM drum loop.',
  160,
  4,
  4,
  4,
  16,
  0,
  999,
  100,
  8000,
  2,
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
  'chord_voicing',
  true,
  true
);

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
) VALUES
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-1'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-stage'
    ),
    0,
    'Phrases I',
    'Phrases I',
    NULL,
    'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-01.mp3',
    6,
    6,
    6,
    0
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-2'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-stage'
    ),
    1,
    'Phrases II',
    'Phrases II',
    NULL,
    'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-02.mp3',
    6,
    6,
    6,
    0
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-3'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-stage'
    ),
    2,
    'Phrases III',
    'Phrases III',
    NULL,
    'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-03.mp3',
    6,
    6,
    6,
    0
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-4'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-stage'
    ),
    3,
    'Phrases IV',
    'Phrases IV',
    NULL,
    'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-04.mp3',
    6,
    6,
    6,
    0
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-5'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-stage'
    ),
    4,
    'Phrases V',
    'Phrases V',
    NULL,
    'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-05.mp3',
    6,
    6,
    6,
    0
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
  voicing_staves
) VALUES
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-c1'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-1'
    ),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    6,
    ARRAY['E5', 'D5', 'A4', 'F4', 'E4', 'D4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-c2'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-2'
    ),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    6,
    ARRAY['E4', 'F4', 'A4', 'C5', 'E5', 'D5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-c3'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-3'
    ),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    6,
    ARRAY['D5', 'E5', 'F5', 'G5', 'E5', 'D5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-c4'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-4'
    ),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    6,
    ARRAY['E4', 'C#4', 'D4', 'E4', 'F4', 'G4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-c5'
    ),
    uuid_generate_v5(
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'dev-ear-composite-sp15-ph-5'
    ),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    6,
    ARRAY['A4', 'F4', 'E4', 'D4', 'G4', 'F4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  );

DO $$
DECLARE
  v_stage uuid := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-stage'
  );
  v_cfg uuid;
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
BEGIN
  INSERT INTO public.ear_training_composite_phrase_config (stage_id, bgm_url, key_fifths)
  VALUES (
    v_stage,
    'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
    0
  )
  RETURNING id INTO v_cfg;

  INSERT INTO public.ear_training_composite_phrase_sources (
    config_id,
    source_phrase_id,
    sort_order
  ) VALUES
    (v_cfg, uuid_generate_v5(v_ns, 'dev-ear-composite-sp15-ph-1'), 0),
    (v_cfg, uuid_generate_v5(v_ns, 'dev-ear-composite-sp15-ph-2'), 1),
    (v_cfg, uuid_generate_v5(v_ns, 'dev-ear-composite-sp15-ph-3'), 2),
    (v_cfg, uuid_generate_v5(v_ns, 'dev-ear-composite-sp15-ph-4'), 3),
    (v_cfg, uuid_generate_v5(v_ns, 'dev-ear-composite-sp15-ph-5'), 4);
END $$;

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description,
  assignment_description_en
)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-lesson'
  ),
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'course-developer-test'
  ),
  'コード複合フレーズ（サバイバル 1〜5・テスト）',
  'Composite chord phrases (survival 1–5, test)',
  'サバイバル phrases マップ stage 1〜5 と同じ6音Dm7進行を、耳コピ chord_voicing の複合フレーズでプレイ。',
  'Same six-note Dm7 survival phrase stages 1–5 as composite chord voicing.',
  false,
  COALESCE(mx.max_o, -1) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'コード複合フレーズ（サバイバル1〜5）でランクB以上を1回クリアしてください。',
  'Clear the composite chord voicing survival phrases 1–5 once at rank B or better.'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons
      WHERE course_id = uuid_generate_v5(
        'a0000000-0000-4000-8000-000000000001'::uuid,
        'course-developer-test'
      )) mx;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  order_index,
  clear_conditions,
  is_fantasy,
  fantasy_stage_id,
  is_survival,
  survival_stage_number,
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en
) VALUES (
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-lsong'
  ),
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-lesson'
  ),
  NULL,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-ear-composite-sp15-stage'
  ),
  '課題（複合・サバイバル phrases 1〜5）',
  'Assignment (composite survival phrases 1–5)'
);
