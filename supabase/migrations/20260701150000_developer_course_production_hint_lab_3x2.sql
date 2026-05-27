-- 開発者用テストコース: 本番ヒント設定 3×2（譜面 A × 鍵盤 B）検証課題 6 件
-- ベース: survival lesson random (map_category=lesson, stage_number=1)
-- 鍵盤列: fade_15s / always — 譜面行: fade_15s / always / hidden_until_pressed
BEGIN;

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
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  '本番ヒント設定テスト（3×2）',
  'Production Hint Mode Lab (3×2)',
  '同一サバイバルステージ（レッスン Random CDE）に、譜面ヒント A と鍵盤 HINT B の override を 6 通り割り当てた検証課題です。',
  'Six survival tasks on the same lesson random stage, each with a distinct staff (A) × keyboard (B) production hint override.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  '本番モードで起動し、譜面未正解音符（A）と鍵盤 HINT（B）の表示差を確認してください。'
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description;

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
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-a15-b15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'fade_15s', 'fade_15s',
    '{"count": 1, "rank": "S"}'::jsonb, 0,
    'A:15秒 / B:15秒', 'Staff 15s / Keyboard 15s'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-a15-bal'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'fade_15s', 'always',
    '{"count": 1, "rank": "S"}'::jsonb, 1,
    'A:15秒 / B:常時', 'Staff 15s / Keyboard always'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-aal-b15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'always', 'fade_15s',
    '{"count": 1, "rank": "S"}'::jsonb, 2,
    'A:常時 / B:15秒', 'Staff always / Keyboard 15s'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-aal-bal'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'always', 'always',
    '{"count": 1, "rank": "S"}'::jsonb, 3,
    'A:常時 / B:常時', 'Staff always / Keyboard always'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-ahid-b15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'hidden_until_pressed', 'fade_15s',
    '{"count": 1, "rank": "S"}'::jsonb, 4,
    'A:正解のみ / B:15秒', 'Staff on correct / Keyboard 15s'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lsong-ahid-bal'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-production-hint-lab-lesson'),
    NULL, NULL, false, true, false,
    1, 'lesson', NULL, NULL, false, NULL, false, NULL, false, NULL,
    'hidden_until_pressed', 'always',
    '{"count": 1, "rank": "S"}'::jsonb, 5,
    'A:正解のみ / B:常時', 'Staff on correct / Keyboard always'
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  override_production_staff_hint_mode = EXCLUDED.override_production_staff_hint_mode,
  override_production_keyboard_hint_mode = EXCLUDED.override_production_keyboard_hint_mode,
  clear_conditions = EXCLUDED.clear_conditions,
  order_index = EXCLUDED.order_index,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
