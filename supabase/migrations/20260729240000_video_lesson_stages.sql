-- 動画視聴課題（レッスン専用）ステージ + lesson_songs 統合
BEGIN;

CREATE TABLE IF NOT EXISTS public.video_lesson_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  video_url text NOT NULL,
  video_url_en text,
  duration_sec numeric CHECK (duration_sec IS NULL OR duration_sec > 0),
  duration_en_sec numeric CHECK (duration_en_sec IS NULL OR duration_en_sec > 0),
  thumbnail_url text,
  thumbnail_url_en text,
  required_watch_ratio numeric NOT NULL DEFAULT 0.9
    CHECK (required_watch_ratio >= 0.5 AND required_watch_ratio <= 1),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.video_lesson_stages IS 'レッスン課題「動画視聴」用ステージ定義（同一行に ja/en の R2 mp4 URL）';
COMMENT ON COLUMN public.video_lesson_stages.video_url IS '日本語 UI 用の R2 mp4 公開 URL（必須）';
COMMENT ON COLUMN public.video_lesson_stages.video_url_en IS '英語 UI 用の R2 mp4 公開 URL。NULL/空のとき video_url にフォールバック';
COMMENT ON COLUMN public.video_lesson_stages.duration_sec IS 'カード表示用の尺ヒント（秒）。視聴ゲートの分母は再生時の実 duration を使用';
COMMENT ON COLUMN public.video_lesson_stages.required_watch_ratio IS '完了ボタン開放に必要な累積視聴率（0.5〜1.0、既定 0.9）';

ALTER TABLE public.video_lesson_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_lesson_stages_select_all ON public.video_lesson_stages;
CREATE POLICY video_lesson_stages_select_all ON public.video_lesson_stages
  FOR SELECT USING (
    COALESCE(is_active, true)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS video_lesson_stages_insert_admin ON public.video_lesson_stages;
CREATE POLICY video_lesson_stages_insert_admin ON public.video_lesson_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS video_lesson_stages_update_admin ON public.video_lesson_stages;
CREATE POLICY video_lesson_stages_update_admin ON public.video_lesson_stages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS video_lesson_stages_delete_admin ON public.video_lesson_stages;
CREATE POLICY video_lesson_stages_delete_admin ON public.video_lesson_stages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

GRANT SELECT ON public.video_lesson_stages TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_video_lesson_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_lesson_stages_updated_at ON public.video_lesson_stages;
CREATE TRIGGER trg_video_lesson_stages_updated_at
  BEFORE UPDATE ON public.video_lesson_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_video_lesson_updated_at();

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_video_lesson boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_lesson_stage_id uuid REFERENCES public.video_lesson_stages(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_video_lesson_stage_id
  ON public.lesson_songs(video_lesson_stage_id)
  WHERE video_lesson_stage_id IS NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_video_lesson IS 'レッスン実習: 動画視聴課題';
COMMENT ON COLUMN public.lesson_songs.video_lesson_stage_id IS 'video_lesson_stages の参照（is_video_lesson=true 時）';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND COALESCE(is_video_lesson, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
      AND video_lesson_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NOT NULL
    )
  );

-- Seed: LP promo video for developer test course
INSERT INTO public.video_lesson_stages (
  id, slug, title, title_en, description, description_en,
  video_url, video_url_en, required_watch_ratio, is_active
) VALUES (
  'c1000000-0000-4000-8000-000000000001',
  'video-lesson-dev-promo-01',
  '動画視聴テスト（LPプロモ）',
  'Video lesson test (LP promo)',
  'LP プロモ動画を使った動画視聴課題の動作確認用。',
  'Smoke-test video lesson using the LP promo assets.',
  'https://jazzify-cdn.com/promo/jazzify-promo-ja-720.mp4',
  'https://jazzify-cdn.com/promo/jazzify-promo-en-720.mp4',
  0.9,
  true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en, nav_links, premium_only
) VALUES (
  'c1000000-0000-4000-8000-000000000002',
  '81f0e385-e015-5fba-9ac1-cac1b6b483b0',
  '動画視聴課題（テスト）',
  'Video lesson assignment (test)',
  '動画視聴課題の再生・視聴率ゲート・クリア連続フローを確認するテストレッスン。',
  'Test lesson for video watch assignment playback, watch-ratio gate, and clear continuation.',
  9164,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  false
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson,
  video_lesson_stage_id, title, title_en
) VALUES (
  'c1000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000002',
  NULL,
  0,
  true,
  '{"count":1,"rank":"S"}'::jsonb,
  false, false, false, false, false, false, true,
  'c1000000-0000-4000-8000-000000000001',
  '動画を視聴する',
  'Watch the video'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson,
  ear_training_stage_id, title, title_en
) VALUES (
  'c1000000-0000-4000-8000-000000000004',
  'c1000000-0000-4000-8000-000000000002',
  NULL,
  1,
  true,
  '{"count":1,"rank":"C"}'::jsonb,
  false, false, true, false, false, false, false,
  '23e26ef8-2731-5777-8818-f796e0e877f3',
  '課題（OSMD リズムバトル）',
  'Task (OSMD rhythm battle)'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
