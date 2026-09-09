-- ディフェンスモードをレッスン課題として起動できるようにする（課題専用）
-- 1) lesson_songs に is_defense / defense_stage_id を追加し content_check を再構築
-- 2) サバイバルモード Phrases I〜IV の音源・譜面を流用したディフェンス開発テストステージを作成
-- 3) 開発者テストコースにディフェンス課題レッスンを追加
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number BETWEEN 1 AND 4) < 4 THEN
    RAISE EXCEPTION 'survival_phrases (phrases 1-4) が未定義です。survival_phrases 系 migration を先に適用してください。';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1) lesson_songs 拡張
-- ---------------------------------------------------------------------------
ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_defense boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS defense_stage_id uuid REFERENCES public.defense_stages(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_defense_stage_id
  ON public.lesson_songs(defense_stage_id)
  WHERE defense_stage_id IS NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_defense IS 'レッスン実習: ディフェンス課題';
COMMENT ON COLUMN public.lesson_songs.defense_stage_id IS 'defense_stages の参照（is_defense=true 時）';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    -- song
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- fantasy
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- survival (stage ref)
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- survival (inline composite)
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- ear training
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- balloon rush
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- survival tutorial
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- ear training tutorial
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
    )
    -- video lesson
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = true
      AND COALESCE(is_defense, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NOT NULL
      AND defense_stage_id IS NULL
    )
    -- defense
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------------
-- 2) 開発テストステージ: サバイバル Phrases I〜IV（Dm7 / 1小節 / 160BPM 4小節ループ音源）
-- ---------------------------------------------------------------------------
INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  staff_layout, key_fifths, required_completion_count, difficulty_level,
  survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
  is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4'),
  'defense-dev-survival-phrases-1-4',
  900,
  'ディフェンス（テスト / Phrases I〜IV）',
  'Defense (test / Phrases I-IV)',
  160,
  4,
  1,
  'treble',
  0,
  2,
  3,
  120,
  5,
  'fade_15s',
  'fade_15s',
  true,
  900
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  beats_per_bar = EXCLUDED.beats_per_bar,
  phrase_bars = EXCLUDED.phrase_bars,
  staff_layout = EXCLUDED.staff_layout,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- フレーズ配下を作り直す（べき等）
DELETE FROM public.defense_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4');

INSERT INTO public.defense_phrases (id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-sp-phrase-' || sp.stage_number::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4'),
  sp.stage_number - 1,
  sp.title,
  sp.bgm_url,
  NULL,
  NULL
FROM public.survival_phrases sp
WHERE sp.map_category = 'phrases' AND sp.stage_number BETWEEN 1 AND 4;

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-sp-chord-' || sp.stage_number::text || '-' || sc.order_index::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-sp-phrase-' || sp.stage_number::text),
  sc.order_index,
  sc.chord_name,
  sc.measure_number
FROM public.survival_phrase_chords sc
JOIN public.survival_phrases sp ON sp.id = sc.phrase_id
WHERE sp.map_category = 'phrases' AND sp.stage_number BETWEEN 1 AND 4;

INSERT INTO public.defense_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-sp-chord-' || sp.stage_number::text || '-' || sc.order_index::text),
  sn.order_index,
  sn.pitch_midi,
  ((sn.pitch_midi % 12) + 12) % 12,
  sn.note_name,
  sn.staff,
  sn.step_index
FROM public.survival_phrase_chord_notes sn
JOIN public.survival_phrase_chords sc ON sc.id = sn.chord_id
JOIN public.survival_phrases sp ON sp.id = sc.phrase_id
WHERE sp.map_category = 'phrases' AND sp.stage_number BETWEEN 1 AND 4;

-- ---------------------------------------------------------------------------
-- 3) 開発者テストコースにレッスン + 課題
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-lab-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'ディフェンス（テスト / Phrases I〜IV）',
  'Defense (test / Phrases I-IV)',
  'サバイバル Phrases I〜IV の音源・譜面を使い、各フレーズ2回完成で小節頭切替。120秒生存でクリア。',
  'Uses Survival Phrases I-IV audio/notation; switches at the bar line after 2 completions. Survive 120s to clear.',
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
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense,
  defense_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-lab-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-lab-lesson'),
  NULL,
  0,
  true,
  '{"count": 1, "rank": "S"}'::jsonb,
  false, false, false, false,
  false, false, false, true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4'),
  'ディフェンス Phrases I〜IV',
  'Defense Phrases I-IV'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_defense = EXCLUDED.is_defense,
  defense_stage_id = EXCLUDED.defense_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
