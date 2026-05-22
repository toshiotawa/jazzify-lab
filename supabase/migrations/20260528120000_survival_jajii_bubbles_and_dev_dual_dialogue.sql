-- サバイバル: ステージ単位のタイムドセリフ（話者 fai / jajii）+ 開発者テスト課題
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_stage_play_dialogues (
  map_category text NOT NULL
    CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson')),
  stage_number integer NOT NULL CHECK (stage_number > 0),
  title text NOT NULL,
  title_en text NOT NULL,
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (map_category, stage_number)
);

COMMENT ON TABLE public.survival_stage_play_dialogues IS 'サバイバル任意ステージのゲーム中タイムドセリフ（script: lineDurationSeconds + lines[]、lines[].speaker は fai|jajii、省略時 fai）';

ALTER TABLE public.survival_stage_play_dialogues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_stage_play_dialogues_select_all ON public.survival_stage_play_dialogues;
CREATE POLICY survival_stage_play_dialogues_select_all ON public.survival_stage_play_dialogues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS survival_stage_play_dialogues_insert_admin ON public.survival_stage_play_dialogues;
CREATE POLICY survival_stage_play_dialogues_insert_admin ON public.survival_stage_play_dialogues
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_stage_play_dialogues_update_admin ON public.survival_stage_play_dialogues;
CREATE POLICY survival_stage_play_dialogues_update_admin ON public.survival_stage_play_dialogues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_stage_play_dialogues_delete_admin ON public.survival_stage_play_dialogues;
CREATE POLICY survival_stage_play_dialogues_delete_admin ON public.survival_stage_play_dialogues
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.set_survival_stage_play_dialogues_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_stage_play_dialogues_updated_at ON public.survival_stage_play_dialogues;
CREATE TRIGGER trg_survival_stage_play_dialogues_updated_at
  BEFORE UPDATE ON public.survival_stage_play_dialogues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_stage_play_dialogues_updated_at();

GRANT SELECT ON public.survival_stage_play_dialogues TO anon, authenticated;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression, lesson_only
) VALUES (
  'basic',
  9901,
  'random',
  '開発: 2人セリフ',
  'Dev: dual dialogue',
  'easy',
  '',
  'メジャー',
  'Major',
  'cde',
  'CDE',
  'CDE',
  'major',
  false,
  NULL,
  NULL,
  true
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only;

INSERT INTO public.survival_stage_play_dialogues (map_category, stage_number, title, title_en, script) VALUES
(
  'basic',
  9901,
  '開発: 2人セリフ',
  'Dev: dual dialogue',
  $sj_dev$
{
  "lineDurationSeconds": 4,
  "lines": [
    {
      "atSeconds": 2,
      "speaker": "fai",
      "text": {
        "ja": "やあ、ファイだよ。2人でしゃべるテストだね。",
        "en": "Hey, it's Fai. This is a two-character dialogue test."
      }
    },
    {
      "atSeconds": 6,
      "speaker": "jajii",
      "text": {
        "ja": "わしはジャ爺じゃ。吹き出しは細めで頭の上じゃ。",
        "en": "I'm Old Man Jajii. My bubble is narrower, above my head."
      }
    },
    {
      "atSeconds": 10,
      "speaker": "fai",
      "text": {
        "ja": "ジャ爺が歩き回ると、吹き出しもついてくるよ。",
        "en": "When Jajii drifts around, the bubble follows him."
      }
    },
    {
      "atSeconds": 14,
      "speaker": "jajii",
      "text": {
        "ja": "ほほう、バッチリじゃな。では戦いも続けるかのう。",
        "en": "Ho ho, looks good. Shall we keep fighting, then?"
      }
    }
  ]
}
$sj_dev$::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
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
  assignment_description,
  assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-dual-dialogue-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: 2人セリフ（テスト）',
  'Survival: dual dialogue (test)',
  'ファイとジャ爺の吹き出しを交互に表示するサバイバル本番課題です。90秒生存でクリア。',
  'Survival assignment alternating Fai and Jajii speech bubbles. Survive 90 seconds to clear.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'サバイバルモードで90秒生き残ってください（セリフは自動再生）。',
  'Survive 90 seconds in survival mode (dialogue plays automatically).'
FROM (
  SELECT MAX(order_index) AS max_o
  FROM public.lessons
  WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')
) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

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
  survival_map_category,
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-dual-dialogue-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-dual-dialogue-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  9901,
  'basic',
  FALSE,
  NULL,
  '課題（2人セリフ・サバイバル）',
  'Assignment (dual dialogue survival)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
