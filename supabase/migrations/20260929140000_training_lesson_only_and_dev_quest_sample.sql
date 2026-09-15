-- Training lesson_only flag + developer test quest-only training sample
BEGIN;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lesson_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.trainings.lesson_only IS
  'Quest-only training. Hidden from training catalog, goals, and ranking list UI. Launchable via lesson_songs.is_training.';

-- Quest-only training (not shown in training catalog)
INSERT INTO public.trainings (
  id, category_id, slug, title_ja, title_en, sort_order, kind,
  clef_mode, use_key_signature, play_root_on_correct, bgm_url, config,
  is_active, lesson_only
) VALUES (
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'dev-quest-only-note-reading-treble'),
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-intro'),
  'dev-quest-only-note-reading-treble',
  'クエスト専用：音符の読み方(ト音記号)',
  'Quest-only: Note Reading (Treble)',
  999,
  'note_reading',
  'instrument',
  false,
  true,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
  '{"clef":"auto","include_accidentals":true}'::jsonb,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  use_key_signature = EXCLUDED.use_key_signature,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  lesson_only = EXCLUDED.lesson_only,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-quest-only-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'トレーニング（テスト / クエスト専用）',
  'Training (test / quest-only)',
  'lesson_only=true のトレーニングが一覧に出ず、クエスト課題からのみ起動できることを確認する。',
  'Verify that lesson_only=true training is hidden from the catalog and launchable only from quest assignments.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense, is_training,
  training_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-quest-only-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-quest-only-lesson'),
  NULL,
  0,
  true,
  '{"count": 1, "rank": "C"}'::jsonb,
  false, false, false, false,
  false, false, false, false, true,
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'dev-quest-only-note-reading-treble'),
  'クエスト専用トレーニング',
  'Quest-only training'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_training = EXCLUDED.is_training,
  training_id = EXCLUDED.training_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
