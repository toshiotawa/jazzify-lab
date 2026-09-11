-- Code run play map: blocks/nodes from beginner+intermediate courses, Songs progressions, record migration.
BEGIN;

-- Namespace for stable play_map block/node UUIDs
-- uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, '...')

-- ---------------------------------------------------------------------------
-- 1) Hide legacy chord-run courses (non-destructive)
-- ---------------------------------------------------------------------------
UPDATE public.courses
SET is_visible = false, updated_at = now()
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
);

-- Ensure code_run stages use auto maps only
UPDATE public.survival_stages
SET auto_run_map_id = COALESCE(NULLIF(trim(auto_run_map_id), ''), 'auto_run_01'),
    updated_at = now()
WHERE play_mode = 'code_run'
  AND map_category = 'basic'
  AND stage_number BETWEEN 122 AND 175;

-- ---------------------------------------------------------------------------
-- 2) Copy Songs progressions → code_run stages (basic 300–399)
--    NOTE: basic 200–211 / 9901+ are already used by existing code_run stages.
-- ---------------------------------------------------------------------------
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, run_map_id, auto_run_map_id, run_time_limit_sec,
  production_staff_hint_mode, production_keyboard_hint_mode
)
SELECT
  'basic',
  300 + ss.stage_number - 1,
  'progression',
  'code_run',
  ss.name,
  ss.name_en,
  ss.difficulty,
  ss.chord_suffix,
  ss.chord_display_name,
  ss.chord_display_name_en,
  ss.root_pattern,
  ss.root_pattern_name,
  ss.root_pattern_name_en,
  ss.block_key,
  false,
  NULL,
  ss.chord_progression,
  true,
  COALESCE(ss.run_map_id, 'auto_run_01'),
  COALESCE(ss.auto_run_map_id, 'auto_run_01'),
  COALESCE(ss.run_time_limit_sec, 195),
  ss.production_staff_hint_mode,
  ss.production_keyboard_hint_mode
FROM public.survival_stages AS ss
WHERE ss.map_category = 'songs'
  AND COALESCE(ss.lesson_only, false) = false
  AND ss.chord_progression IS NOT NULL
  AND ss.stage_number BETWEEN 1 AND 99
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  auto_run_map_id = EXCLUDED.auto_run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Basic blocks (6) + nodes (122–139)
-- ---------------------------------------------------------------------------
INSERT INTO public.play_map_blocks (id, mode, tier, block_key, label, label_en, sort_order)
VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-major-triad'),
   'code_run', 'basic', 'major_triad', 'メジャートライアド', 'Major Triad', 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-minor-triad'),
   'code_run', 'basic', 'minor_triad', 'マイナートライアド', 'Minor Triad', 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-major7'),
   'code_run', 'basic', 'major7', 'メジャーセブンス', 'Major 7th', 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-minor7'),
   'code_run', 'basic', 'minor7', 'マイナーセブンス', 'Minor 7th', 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-dominant7'),
   'code_run', 'basic', 'dominant7', 'セブンス', 'Dominant 7th', 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-m7b5'),
   'code_run', 'basic', 'm7b5', 'マイナーセブンスフラットファイブ', 'Minor 7 flat 5', 5)
ON CONFLICT (mode, tier, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- Basic nodes from survival_stages 122-139 grouped by block_key
INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind,
  survival_map_category, survival_stage_number,
  title, title_en, required_rank
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-node-' || ss.stage_number::text),
  b.id,
  ss.stage_number - CASE ss.block_key
    WHEN 'major' THEN 122
    WHEN 'minor' THEN 125
    WHEN 'M7' THEN 128
    WHEN 'm7' THEN 131
    WHEN '7' THEN 134
    WHEN 'm7b5' THEN 137
    ELSE 122
  END,
  'stage',
  'basic',
  ss.stage_number,
  ss.name,
  ss.name_en,
  'C'
FROM public.survival_stages AS ss
JOIN public.play_map_blocks AS b
  ON b.mode = 'code_run' AND b.tier = 'basic'
  AND b.block_key = CASE ss.block_key
    WHEN 'major' THEN 'major_triad'
    WHEN 'minor' THEN 'minor_triad'
    WHEN 'M7' THEN 'major7'
    WHEN 'm7' THEN 'minor7'
    WHEN '7' THEN 'dominant7'
    WHEN 'm7b5' THEN 'm7b5'
    ELSE 'major_triad'
  END
WHERE ss.map_category = 'basic'
  AND ss.play_mode = 'code_run'
  AND ss.stage_number BETWEEN 122 AND 139
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4) Advanced blocks (4 intermediate + 8 songs) + nodes
-- ---------------------------------------------------------------------------
INSERT INTO public.play_map_blocks (id, mode, tier, block_key, label, label_en, sort_order)
VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-adv-ii-v-i'),
   'code_run', 'advanced', 'ii_v_i', 'II-V-I', 'II-V-I', 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-adv-i-vi-ii-v'),
   'code_run', 'advanced', 'i_vi_ii_v', 'I-VI-II-V', 'I-VI-II-V', 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-adv-ii-v7-alt'),
   'code_run', 'advanced', 'ii_v7_alt', 'II-V7(alt)-I', 'II-V7(alt)-I', 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-adv-minor-ii-v-i'),
   'code_run', 'advanced', 'minor_ii_v_i', 'マイナー II-V-I', 'Minor II-V-I', 3)
ON CONFLICT (mode, tier, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- Advanced intermediate nodes (140-175)
INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind,
  survival_map_category, survival_stage_number,
  title, title_en, required_rank
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-node-' || ss.stage_number::text),
  b.id,
  ss.stage_number - CASE
    WHEN ss.stage_number BETWEEN 140 AND 145 THEN 140
    WHEN ss.stage_number BETWEEN 146 AND 157 THEN 146
    WHEN ss.stage_number BETWEEN 158 AND 163 THEN 158
    ELSE 164
  END,
  'stage',
  'basic',
  ss.stage_number,
  ss.name,
  ss.name_en,
  'C'
FROM public.survival_stages AS ss
JOIN public.play_map_blocks AS b
  ON b.mode = 'code_run' AND b.tier = 'advanced'
  AND b.block_key = CASE
    WHEN ss.stage_number BETWEEN 140 AND 145 THEN 'ii_v_i'
    WHEN ss.stage_number BETWEEN 146 AND 157 THEN 'i_vi_ii_v'
    WHEN ss.stage_number BETWEEN 158 AND 163 THEN 'ii_v7_alt'
    ELSE 'minor_ii_v_i'
  END
WHERE ss.map_category = 'basic'
  AND ss.play_mode = 'code_run'
  AND ss.stage_number BETWEEN 140 AND 175
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- Songs-derived advanced blocks (from survival_stage_blocks songs)
INSERT INTO public.play_map_blocks (id, mode, tier, block_key, label, label_en, sort_order)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-adv-songs-' || ssb.block_key),
  'code_run',
  'advanced',
  'songs_' || ssb.block_key,
  ssb.label,
  ssb.label_en,
  4 + ssb.sort_order
FROM public.survival_stage_blocks AS ssb
WHERE ssb.map_category = 'songs'
ON CONFLICT (mode, tier, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- Songs-derived nodes (300–399 stages)
INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind,
  survival_map_category, survival_stage_number,
  title, title_en, required_rank
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-node-' || ss.stage_number::text),
  b.id,
  ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY ss.stage_number) - 1,
  'stage',
  'basic',
  ss.stage_number,
  ss.name,
  ss.name_en,
  'C'
FROM public.survival_stages AS ss
JOIN public.play_map_blocks AS b
  ON b.mode = 'code_run'
  AND b.tier = 'advanced'
  AND b.block_key = 'songs_' || ss.block_key
WHERE ss.map_category = 'basic'
  AND ss.play_mode = 'code_run'
  AND ss.stage_number BETWEEN 300 AND 399
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5) Migrate completed chord-run lesson progress → play_map_node_clears
-- ---------------------------------------------------------------------------
INSERT INTO public.play_map_node_clears (
  user_id, node_id, best_rank, clear_count, first_cleared_at, cleared_at
)
SELECT DISTINCT ON (urp.user_id, n.id)
  urp.user_id,
  n.id,
  'C',
  GREATEST(COALESCE(urp.clear_count, 1), 1),
  COALESCE(urp.last_cleared_at, urp.updated_at, now()),
  COALESCE(urp.last_cleared_at, urp.updated_at, now())
FROM public.user_lesson_requirements_progress AS urp
JOIN public.lesson_songs AS ls ON ls.id = urp.lesson_song_id
JOIN public.lessons AS l ON l.id = ls.lesson_id
JOIN public.courses AS c ON c.id = l.course_id
JOIN public.play_map_nodes AS n
  ON n.node_kind = 'stage'
  AND n.survival_map_category = COALESCE(ls.survival_map_category, 'basic')
  AND n.survival_stage_number = ls.survival_stage_number
JOIN public.play_map_blocks AS b ON b.id = n.block_id AND b.mode = 'code_run'
WHERE urp.is_completed IS TRUE
  AND ls.is_survival IS TRUE
  AND c.id IN (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
  )
ORDER BY urp.user_id, n.id, urp.last_cleared_at DESC NULLS LAST
ON CONFLICT (user_id, node_id) DO NOTHING;

COMMIT;
