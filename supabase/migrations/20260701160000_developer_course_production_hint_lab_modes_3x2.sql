-- 開発者用テストコース: 本番ヒント 3×2 を追加モード 4 種 × 6 課題
--   1. サバイバル Progression（lesson / stage 2）
--   2. サバイバル Phrases（phrases / stage 1）
--   3. 風船ラッシュ Progression（balloon-rush-prog-iivi-01）
--   4. 風船ラッシュ Random CDE（balloon-rush-random-cde-01）
BEGIN;

-- 風船ラッシュ: プログレッション検証用ステージ
INSERT INTO public.balloon_rush_stages (
  slug,
  title,
  title_en,
  description,
  description_en,
  stage_type,
  chord_suffix,
  root_pattern,
  chord_progression,
  time_limit_sec,
  pop_quota,
  balloon_lifetime_sec,
  max_concurrent,
  respawn_delay_sec,
  bgm_url,
  key_fifths,
  lesson_only,
  is_active
)
VALUES (
  'balloon-rush-prog-iivi-01',
  '風船ラッシュ II-V-I（検証）',
  'Balloon Rush II-V-I (lab)',
  '10秒ごとに風船が消えます。II-V-I プログレッション。B列で〇個割ってクリア。',
  'Balloons expire every 10s. II-V-I progression. Pop ○ with melee (B slot) to clear.',
  'progression',
  'm7',
  NULL,
  '[
    {"name":"Dm7","voicing":[50,53,57,60,64,69],"voicing_names":["D3","F3","A3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,2,2,2,1,1]},
    {"name":"G7","voicing":[55,59,62,65,67,71],"voicing_names":["G3","B3","D4","F4","G4","C5"],"key_fifths":0,"voicing_staves":[2,2,2,2,1,1]},
    {"name":"CM7","voicing":[48,52,55,59,60,64],"voicing_names":["C3","E3","G3","B3","C4","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2,1,1]}
  ]'::jsonb,
  90,
  20,
  10,
  5,
  5,
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
  0,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  stage_type = EXCLUDED.stage_type,
  chord_suffix = EXCLUDED.chord_suffix,
  root_pattern = EXCLUDED.root_pattern,
  chord_progression = EXCLUDED.chord_progression,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  balloon_lifetime_sec = EXCLUDED.balloon_lifetime_sec,
  max_concurrent = EXCLUDED.max_concurrent,
  respawn_delay_sec = EXCLUDED.respawn_delay_sec,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  lesson_only = EXCLUDED.lesson_only,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 風船ラッシュ: ランダム CDE 検証用ステージ（本番ヒント lab 専用）
INSERT INTO public.balloon_rush_stages (
  slug,
  title,
  title_en,
  description,
  description_en,
  stage_type,
  chord_suffix,
  root_pattern,
  allowed_chords,
  chord_progression,
  time_limit_sec,
  pop_quota,
  balloon_lifetime_sec,
  max_concurrent,
  respawn_delay_sec,
  bgm_url,
  key_fifths,
  lesson_only,
  is_active
)
VALUES (
  'balloon-rush-random-cde-01',
  '風船ラッシュ C D E（検証）',
  'Balloon Rush C D E (lab)',
  '10秒ごとに風船が消えます。C・D・E（中央C付近）の単音をランダム出題。B列で〇個割ってクリア。',
  'Balloons expire every 10s. Random single notes C, D, E (around middle C). Pop ○ with melee (B slot) to clear.',
  'random',
  '_note',
  'cde',
  NULL,
  NULL,
  90,
  20,
  10,
  5,
  5,
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
  0,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  stage_type = EXCLUDED.stage_type,
  chord_suffix = EXCLUDED.chord_suffix,
  root_pattern = EXCLUDED.root_pattern,
  allowed_chords = EXCLUDED.allowed_chords,
  chord_progression = EXCLUDED.chord_progression,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  balloon_lifetime_sec = EXCLUDED.balloon_lifetime_sec,
  max_concurrent = EXCLUDED.max_concurrent,
  respawn_delay_sec = EXCLUDED.respawn_delay_sec,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  lesson_only = EXCLUDED.lesson_only,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- レッスン 4 件
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
  assignment_description
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, lesson_key),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  title_ja,
  title_en,
  description_ja,
  description_en,
  false,
  (SELECT COALESCE(MAX(order_index), 0) FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'))
    + row_number() OVER (ORDER BY sort_order),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  assignment_description
FROM (VALUES
  (
    1,
    'developer-production-hint-lab-prog-lesson',
    '本番ヒント設定テスト・Progression（3×2）',
    'Production Hint Lab · Progression (3×2)',
    'レッスン Progression（II-V-I）で譜面ヒント A と鍵盤 HINT B の override を 6 通り検証します。',
    'Six tasks on lesson progression stage II-V-I with distinct staff (A) × keyboard (B) overrides.',
    '本番モードで Progression を起動し、譜面未正解音符（A）と鍵盤 HINT（B）を確認してください。'
  ),
  (
    2,
    'developer-production-hint-lab-phrases-lesson',
    '本番ヒント設定テスト・Phrases（3×2）',
    'Production Hint Lab · Phrases (3×2)',
    'Phrases マップ stage 1 で譜面ヒント A と鍵盤 HINT B の override を 6 通り検証します。',
    'Six tasks on phrases map stage 1 with distinct staff (A) × keyboard (B) overrides.',
    '本番モードで Phrases を起動し、譜面未正解音符（A）と鍵盤 HINT（B）を確認してください。'
  ),
  (
    3,
    'developer-production-hint-lab-br-prog-lesson',
    '本番ヒント設定テスト・風船 Progression（3×2）',
    'Production Hint Lab · Balloon Progression (3×2)',
    '風船ラッシュ II-V-I で譜面ヒント A と鍵盤 HINT B の override を 6 通り検証します。',
    'Six balloon rush progression tasks with distinct staff (A) × keyboard (B) overrides.',
    '本番モードで風船 Progression を起動し、譜面未正解音符（A）と鍵盤 HINT（B）を確認してください。'
  ),
  (
    4,
    'developer-production-hint-lab-br-random-lesson',
    '本番ヒント設定テスト・風船 Random（3×2）',
    'Production Hint Lab · Balloon Random (3×2)',
    '風船ラッシュ Random CDE で譜面ヒント A と鍵盤 HINT B の override を 6 通り検証します。',
    'Six balloon rush random C/D/E tasks with distinct staff (A) × keyboard (B) overrides.',
    '本番モードで風船 Random を起動し、譜面未正解音符（A）と鍵盤 HINT（B）を確認してください。'
  )
) AS v(sort_order, lesson_key, title_ja, title_en, description_ja, description_en, assignment_description)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description;

-- 3×2 組み合わせ
WITH combos AS (
  SELECT *
  FROM (VALUES
    (0, 'fade_15s'::text, 'fade_15s'::text, 'a15-b15', 'A:15秒 / B:15秒', 'Staff 15s / Keyboard 15s'),
    (1, 'fade_15s', 'always', 'a15-bal', 'A:15秒 / B:常時', 'Staff 15s / Keyboard always'),
    (2, 'always', 'fade_15s', 'aal-b15', 'A:常時 / B:15秒', 'Staff always / Keyboard 15s'),
    (3, 'always', 'always', 'aal-bal', 'A:常時 / B:常時', 'Staff always / Keyboard always'),
    (4, 'hidden_until_pressed', 'fade_15s', 'ahid-b15', 'A:正解のみ / B:15秒', 'Staff on correct / Keyboard 15s'),
    (5, 'hidden_until_pressed', 'always', 'ahid-bal', 'A:正解のみ / B:常時', 'Staff on correct / Keyboard always')
  ) AS t(order_index, staff_mode, keyboard_mode, suffix, title_ja, title_en)
),
modes AS (
  SELECT *
  FROM (VALUES
    (
      'developer-production-hint-lab-prog-lesson',
      'developer-production-hint-lsong-prog-',
      true,
      false,
      2,
      'lesson'::text,
      NULL::uuid
    ),
    (
      'developer-production-hint-lab-phrases-lesson',
      'developer-production-hint-lsong-phrases-',
      true,
      false,
      1,
      'phrases',
      NULL::uuid
    ),
    (
      'developer-production-hint-lab-br-prog-lesson',
      'developer-production-hint-lsong-br-prog-',
      false,
      true,
      NULL::integer,
      NULL::text,
      (SELECT id FROM public.balloon_rush_stages WHERE slug = 'balloon-rush-prog-iivi-01')
    ),
    (
      'developer-production-hint-lab-br-random-lesson',
      'developer-production-hint-lsong-br-random-',
      false,
      true,
      NULL::integer,
      NULL::text,
      (SELECT id FROM public.balloon_rush_stages WHERE slug = 'balloon-rush-random-cde-01')
    )
  ) AS m(lesson_key, lsong_prefix, is_survival, is_balloon_rush, survival_stage_number, survival_map_category, balloon_rush_stage_id)
)
INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  survival_stage_number,
  survival_map_category,
  survival_composite_config,
  ear_training_stage_id,
  is_balloon_rush,
  balloon_rush_stage_id,
  is_survival_tutorial,
  survival_tutorial_script_id,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  override_production_staff_hint_mode,
  override_production_keyboard_hint_mode,
  clear_conditions,
  order_index,
  title,
  title_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, m.lsong_prefix || c.suffix),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, m.lesson_key),
  NULL,
  NULL,
  false,
  m.is_survival,
  false,
  m.survival_stage_number,
  m.survival_map_category,
  NULL,
  NULL,
  m.is_balloon_rush,
  m.balloon_rush_stage_id,
  false,
  NULL,
  false,
  NULL,
  c.staff_mode,
  c.keyboard_mode,
  '{"count": 1, "rank": "S"}'::jsonb,
  c.order_index,
  c.title_ja,
  c.title_en
FROM modes m
CROSS JOIN combos c
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_survival = EXCLUDED.is_survival,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  override_production_staff_hint_mode = EXCLUDED.override_production_staff_hint_mode,
  override_production_keyboard_hint_mode = EXCLUDED.override_production_keyboard_hint_mode,
  clear_conditions = EXCLUDED.clear_conditions,
  order_index = EXCLUDED.order_index,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
