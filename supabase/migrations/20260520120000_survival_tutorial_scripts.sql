-- サバイバルチュートリアル課題: 台本テーブル + lesson_songs 拡張 + onboarding-v1 seed + 開発者レッスン
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_tutorial_scripts (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_en text NOT NULL,
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.survival_tutorial_scripts IS 'サバイバルチュートリアル（オンボーディング式）の台本 JSON';
COMMENT ON COLUMN public.survival_tutorial_scripts.script IS 'DSL v1: audioTracks, builtinRunner, scenes[].steps[]';

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_survival_tutorial boolean NOT NULL DEFAULT false;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_tutorial_script_id text NULL
  REFERENCES public.survival_tutorial_scripts (id) ON DELETE RESTRICT;

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_survival_tutorial_exclusive_check;
ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_survival_tutorial_exclusive_check
  CHECK (NOT (is_survival_tutorial AND is_survival));

COMMENT ON COLUMN public.lesson_songs.is_survival_tutorial IS 'サバイバルチュートリアル課題（台本駆動・最後まで視聴でクリア）';
COMMENT ON COLUMN public.lesson_songs.survival_tutorial_script_id IS 'survival_tutorial_scripts.id';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
    )
  );

INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script)
VALUES (
  'onboarding-v1',
  'サバイバルチュートリアル（II-V-I）',
  'Survival Tutorial (II-V-I)',
  jsonb_build_object(
    'version', 1,
    'audioTracks', jsonb_build_object(
      'main_bgm', jsonb_build_object(
        'resolveFrom', 'progression',
        'defaultLoop', true,
        'defaultVolume', 0.45
      ),
      'drum_loop', jsonb_build_object(
        'url', 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
        'defaultLoop', true,
        'defaultVolume', 0.35
      )
    ),
    'builtinRunner', 'onboarding-v1'
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  script = EXCLUDED.script,
  updated_at = now();

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
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル（LPデモ同等）',
  'Survival Tutorial (same as LP demo)',
  'オンボーディング式の II-V-I チュートリアルです。最後まで進めると課題クリアになります。',
  'Onboarding-style II-V-I tutorial. Complete the full experience to clear this task.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_survival_tutorial,
  survival_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'onboarding-v1',
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  'サバイバルチュートリアル',
  'Survival Tutorial'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
