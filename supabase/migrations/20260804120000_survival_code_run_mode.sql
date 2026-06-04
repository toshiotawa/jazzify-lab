-- Survival CodeRun mode: DB-backed run map + developer test assignment.
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_run_maps (
  id text PRIMARY KEY,
  name text NOT NULL,
  map_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.survival_run_maps IS
  'Survival CodeRun map definitions. survival_stages.run_map_id selects the map.';

ALTER TABLE public.survival_run_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_run_maps_select_all ON public.survival_run_maps;
CREATE POLICY survival_run_maps_select_all ON public.survival_run_maps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS survival_run_maps_insert_admin ON public.survival_run_maps;
CREATE POLICY survival_run_maps_insert_admin ON public.survival_run_maps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_run_maps_update_admin ON public.survival_run_maps;
CREATE POLICY survival_run_maps_update_admin ON public.survival_run_maps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_run_maps_delete_admin ON public.survival_run_maps;
CREATE POLICY survival_run_maps_delete_admin ON public.survival_run_maps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.set_survival_run_maps_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_run_maps_updated_at ON public.survival_run_maps;
CREATE TRIGGER trg_survival_run_maps_updated_at
  BEFORE UPDATE ON public.survival_run_maps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_run_maps_updated_at();

GRANT SELECT ON public.survival_run_maps TO anon, authenticated;

ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS play_mode text NOT NULL DEFAULT 'survival'
    CHECK (play_mode IN ('survival', 'code_run')),
  ADD COLUMN IF NOT EXISTS run_map_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS run_time_limit_sec integer DEFAULT NULL CHECK (run_time_limit_sec IS NULL OR run_time_limit_sec > 0),
  ADD COLUMN IF NOT EXISTS run_dialogue_script jsonb DEFAULT NULL;

COMMENT ON COLUMN public.survival_stages.play_mode IS
  'survival=existing Survival battle, code_run=side-scrolling CodeRun fork.';
COMMENT ON COLUMN public.survival_stages.run_map_id IS
  'CodeRun map id in survival_run_maps.';
COMMENT ON COLUMN public.survival_stages.run_time_limit_sec IS
  'CodeRun time limit in seconds. NULL falls back to the survival stage limit.';
COMMENT ON COLUMN public.survival_stages.run_dialogue_script IS
  'CodeRun timed speech lines: {lines:[{at_seconds,speaker,text,text_en,duration_seconds}]}. duration defaults to 4s.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'survival_stages_run_map_id_fkey'
      AND conrelid = 'public.survival_stages'::regclass
  ) THEN
    ALTER TABLE public.survival_stages
      ADD CONSTRAINT survival_stages_run_map_id_fkey
      FOREIGN KEY (run_map_id) REFERENCES public.survival_run_maps(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'night_city_run_01',
  'Night City Run 01',
  '{
    "source": "public/RUN/remixed-6e07a45d.html",
    "variant": "night_city",
    "viewWidth": 960,
    "viewHeight": 528,
    "tileSize": 48,
    "worldTilesWide": 168,
    "worldTilesHigh": 11,
    "goalColumn": 160,
    "assets": {
      "background": "/RUN/%E8%83%8C%E6%99%AF.png",
      "player": [
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png",
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png",
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png"
      ],
      "slime": [
        "/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png",
        "/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"
      ]
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  map_data = EXCLUDED.map_data,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (
  map_category, block_key, label, label_en, sort_order, player_max_hp, kill_quota, boss_max_hp
) VALUES (
  'basic', 'code_run', 'CodeRun', 'CodeRun', 999, 800, NULL, 7000
)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  player_max_hp = EXCLUDED.player_max_hp,
  kill_quota = EXCLUDED.kill_quota,
  boss_max_hp = EXCLUDED.boss_max_hp;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, run_map_id, run_time_limit_sec, run_dialogue_script,
  production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'basic',
  111,
  'progression',
  'code_run',
  '開発: コードラン',
  'Dev: Code Run',
  'easy',
  '',
  'コードラン',
  'Code Run',
  NULL,
  '',
  '',
  'code_run',
  false,
  NULL,
  '[
    {"name":"Dm7(9)","voicing":[53,60,64,69],"voicing_names":["F3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1]},
    {"name":"G7(9.13)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":0,"voicing_staves":[2,2,2,1]},
    {"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0,"voicing_staves":[2,2,2,2]}
  ]'::jsonb,
  false,
  'night_city_run_01',
  90,
  '{
    "lines": [
      {"at_seconds": 2, "speaker": "fai", "text": "コードを完成させるとジャンプするよ。", "text_en": "Complete the chord to jump."},
      {"at_seconds": 8, "speaker": "jajii", "text": "2段ジャンプ中は、着地まで次のコードは伏せられるぞ。", "text_en": "During a double jump, the next chord stays hidden until landing."},
      {"at_seconds": 18, "speaker": "fai", "text": "制限時間内にゴールへ進もう。", "text_en": "Reach the goal before time runs out."}
    ]
  }'::jsonb,
  'fade_15s',
  'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン（テスト）',
  'Survival: Code Run (test)',
  'コード完成ジャンプで横スクロールのゴールを目指す開発者向けテスト課題です。',
  'Developer test assignment for the side-scrolling CodeRun fork.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内にゴールしてください。コード完成でジャンプします。',
  'Reach the goal before the time limit. Completing each chord triggers a jump.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  111,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン）',
  'Assignment (Code Run)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
