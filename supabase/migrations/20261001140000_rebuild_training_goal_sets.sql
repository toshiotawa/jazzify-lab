-- Rebuild training goal sets: 12 tracks x 3 levels = 36 sets
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Seed spec (track x level)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _goal_spec (
  sort_order integer NOT NULL,
  slug text NOT NULL PRIMARY KEY,
  title_ja text NOT NULL,
  title_en text NOT NULL,
  target_instrument text NOT NULL,
  target_level text NOT NULL,
  target_rank text NOT NULL,
  category_slug text NOT NULL,
  training_filter text NOT NULL
) ON COMMIT DROP;

INSERT INTO _goal_spec (
  sort_order, slug, title_ja, title_en, target_instrument, target_level, target_rank, category_slug, training_filter
) VALUES
  (1,  'goal-note-reading-beginner',              '音符の読み方 ビギナー',                    'Note Reading Beginner',              'all',   'beginner',     'E', 'intro',                    'treble_only'),
  (2,  'goal-note-reading-trainer',               '音符の読み方 トレーナー',                  'Note Reading Trainer',               'all',   'intermediate', 'C', 'intro',                    'treble_only'),
  (3,  'goal-note-reading-master',                '音符の読み方 マスター',                    'Note Reading Master',                'all',   'advanced',     'B', 'intro',                    'treble_only'),
  (4,  'goal-interval-up-beginner',               '音程上 ビギナー',                          'Intervals Up Beginner',              'all',   'beginner',     'E', 'interval',                 'interval_up'),
  (5,  'goal-interval-up-trainer',                '音程上 トレーナー',                        'Intervals Up Trainer',               'all',   'intermediate', 'C', 'interval',                 'interval_up'),
  (6,  'goal-interval-up-master',                 '音程上 マスター',                          'Intervals Up Master',                'all',   'advanced',     'B', 'interval',                 'interval_up'),
  (7,  'goal-interval-down-beginner',             '音程下 ビギナー',                          'Intervals Down Beginner',            'all',   'beginner',     'E', 'interval',                 'interval_down'),
  (8,  'goal-interval-down-trainer',              '音程下 トレーナー',                        'Intervals Down Trainer',             'all',   'intermediate', 'C', 'interval',                 'interval_down'),
  (9,  'goal-interval-down-master',               '音程下 マスター',                          'Intervals Down Master',              'all',   'advanced',     'B', 'interval',                 'interval_down'),
  (10, 'goal-scale-basic-beginner',               '初級スケール ビギナー',                    'Basic Scales Beginner',              'all',   'beginner',     'D', 'scale_basic',              'all_in_category'),
  (11, 'goal-scale-basic-trainer',                '初級スケール トレーナー',                  'Basic Scales Trainer',               'all',   'intermediate', 'C', 'scale_basic',              'all_in_category'),
  (12, 'goal-scale-basic-master',                 '初級スケール マスター',                    'Basic Scales Master',                'all',   'advanced',     'B', 'scale_basic',              'all_in_category'),
  (13, 'goal-scale-intermediate-beginner',        '中級スケール ビギナー',                    'Intermediate Scales Beginner',     'all',   'beginner',     'D', 'scale_intermediate',       'all_in_category'),
  (14, 'goal-scale-intermediate-trainer',         '中級スケール トレーナー',                  'Intermediate Scales Trainer',        'all',   'intermediate', 'C', 'scale_intermediate',       'all_in_category'),
  (15, 'goal-scale-intermediate-master',          '中級スケール マスター',                    'Intermediate Scales Master',         'all',   'advanced',     'B', 'scale_intermediate',       'all_in_category'),
  (16, 'goal-scale-advanced-beginner',            '上級スケール ビギナー',                    'Advanced Scales Beginner',           'all',   'beginner',     'D', 'scale_advanced',           'all_in_category'),
  (17, 'goal-scale-advanced-trainer',             '上級スケール トレーナー',                  'Advanced Scales Trainer',            'all',   'intermediate', 'C', 'scale_advanced',           'all_in_category'),
  (18, 'goal-scale-advanced-master',              '上級スケール マスター',                    'Advanced Scales Master',             'all',   'advanced',     'B', 'scale_advanced',           'all_in_category'),
  (19, 'goal-triad-inversion-beginner',           '3和音(転回形) ビギナー',                   'Triad Inversions Beginner',          'all',   'beginner',     'C', 'triad_inversion',          'all_in_category'),
  (20, 'goal-triad-inversion-trainer',            '3和音(転回形) トレーナー',                 'Triad Inversions Trainer',           'all',   'intermediate', 'B', 'triad_inversion',          'all_in_category'),
  (21, 'goal-triad-inversion-master',             '3和音(転回形) マスター',                   'Triad Inversions Master',            'all',   'advanced',     'A', 'triad_inversion',          'all_in_category'),
  (22, 'goal-seventh-inversion-beginner',         '4和音(転回形) ビギナー',                   'Seventh Inversions Beginner',        'all',   'beginner',     'C', 'seventh_inversion',        'all_in_category'),
  (23, 'goal-seventh-inversion-trainer',          '4和音(転回形) トレーナー',                 'Seventh Inversions Trainer',         'all',   'intermediate', 'B', 'seventh_inversion',        'all_in_category'),
  (24, 'goal-seventh-inversion-master',           '4和音(転回形) マスター',                   'Seventh Inversions Master',          'all',   'advanced',     'A', 'seventh_inversion',        'all_in_category'),
  (25, 'goal-tension-voicing-ab-beginner',        'テンションヴォイシングA/Bフォーム ビギナー', 'Tension Voicing A/B Beginner',     'piano', 'beginner',     'C', 'tension_voicing_ab',       'all_in_category'),
  (26, 'goal-tension-voicing-ab-trainer',         'テンションヴォイシングA/Bフォーム トレーナー', 'Tension Voicing A/B Trainer',      'piano', 'intermediate', 'B', 'tension_voicing_ab',       'all_in_category'),
  (27, 'goal-tension-voicing-ab-master',          'テンションヴォイシングA/Bフォーム マスター', 'Tension Voicing A/B Master',       'piano', 'advanced',     'A', 'tension_voicing_ab',       'all_in_category'),
  (28, 'goal-two-hand-voicing-beginner',          '両手ヴォイシング ビギナー',                'Two-Hand Voicing Beginner',          'piano', 'beginner',     'C', 'two_hand_voicing',         'all_in_category'),
  (29, 'goal-two-hand-voicing-trainer',           '両手ヴォイシング トレーナー',              'Two-Hand Voicing Trainer',           'piano', 'intermediate', 'B', 'two_hand_voicing',         'all_in_category'),
  (30, 'goal-two-hand-voicing-master',            '両手ヴォイシング マスター',                'Two-Hand Voicing Master',            'piano', 'advanced',     'A', 'two_hand_voicing',         'all_in_category'),
  (31, 'goal-lh-voicing-progression-beginner',    '左手ヴォイシング・コード進行 ビギナー',    'LH Voicing Progressions Beginner',   'piano', 'beginner',     'C', 'lh_voicing_progression',   'all_in_category'),
  (32, 'goal-lh-voicing-progression-trainer',     '左手ヴォイシング・コード進行 トレーナー',  'LH Voicing Progressions Trainer',    'piano', 'intermediate', 'B', 'lh_voicing_progression',   'all_in_category'),
  (33, 'goal-lh-voicing-progression-master',      '左手ヴォイシング・コード進行 マスター',    'LH Voicing Progressions Master',     'piano', 'advanced',     'A', 'lh_voicing_progression',   'all_in_category'),
  (34, 'goal-two-hand-voicing-progression-beginner', '両手ヴォイシング・コード進行 ビギナー', 'Two-Hand Voicing Progressions Beginner', 'piano', 'beginner', 'C', 'two_hand_voicing_progression', 'all_in_category'),
  (35, 'goal-two-hand-voicing-progression-trainer',  '両手ヴォイシング・コード進行 トレーナー', 'Two-Hand Voicing Progressions Trainer', 'piano', 'intermediate', 'B', 'two_hand_voicing_progression', 'all_in_category'),
  (36, 'goal-two-hand-voicing-progression-master',   '両手ヴォイシング・コード進行 マスター', 'Two-Hand Voicing Progressions Master', 'piano', 'advanced', 'A', 'two_hand_voicing_progression', 'all_in_category');

-- ---------------------------------------------------------------------------
-- 2) Insert / update goal sets
-- ---------------------------------------------------------------------------
INSERT INTO public.training_goal_sets (
  id, slug, title_ja, title_en, description_ja, description_en,
  sort_order, is_active, target_instrument, target_level
)
SELECT
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-' || gs.slug),
  gs.slug,
  gs.title_ja,
  gs.title_en,
  tc.description_ja,
  tc.description_en,
  gs.sort_order,
  true,
  gs.target_instrument,
  gs.target_level
FROM _goal_spec AS gs
JOIN public.training_categories AS tc ON tc.slug = gs.category_slug
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  target_instrument = EXCLUDED.target_instrument,
  target_level = EXCLUDED.target_level,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Insert goal set items
-- ---------------------------------------------------------------------------
INSERT INTO public.training_goal_set_items (goal_set_id, training_id, target_rank, sort_order)
SELECT
  tgs.id,
  t.id,
  gs.target_rank,
  t.sort_order
FROM _goal_spec AS gs
JOIN public.training_goal_sets AS tgs ON tgs.slug = gs.slug
JOIN public.training_categories AS tc ON tc.slug = gs.category_slug
JOIN public.trainings AS t ON t.category_id = tc.id
WHERE t.is_active IS NOT FALSE
  AND COALESCE(t.lesson_only, false) IS NOT TRUE
  AND (
    (gs.training_filter = 'treble_only' AND t.slug IN ('note-reading-treble', 'note-reading-treble-accidentals'))
    OR (gs.training_filter = 'interval_up' AND (t.slug LIKE '%-up' OR t.slug = 'interval-mixed-up'))
    OR (gs.training_filter = 'interval_down' AND (t.slug LIKE '%-down' OR t.slug = 'interval-mixed-down'))
    OR (gs.training_filter = 'all_in_category')
  )
ON CONFLICT (goal_set_id, training_id) DO UPDATE SET
  target_rank = EXCLUDED.target_rank,
  sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 4) Migrate FK references from old goal sets
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _old_goal_migration (
  old_slug text PRIMARY KEY,
  new_slug text NOT NULL
) ON COMMIT DROP;

INSERT INTO _old_goal_migration (old_slug, new_slug) VALUES
  ('goal-intro', 'goal-note-reading-beginner'),
  ('goal-interval', 'goal-interval-up-beginner'),
  ('goal-scale_basic', 'goal-scale-basic-beginner'),
  ('goal-scale_intermediate', 'goal-scale-intermediate-trainer'),
  ('goal-scale_advanced', 'goal-scale-advanced-master'),
  ('goal-triad', 'goal-triad-inversion-beginner'),
  ('goal-triad_inversion', 'goal-triad-inversion-trainer'),
  ('goal-seventh', 'goal-seventh-inversion-trainer'),
  ('goal-seventh_inversion', 'goal-seventh-inversion-trainer'),
  ('goal-tension_voicing', 'goal-tension-voicing-ab-master'),
  ('goal-tension_voicing_ab', 'goal-tension-voicing-ab-master'),
  ('goal-two_hand_voicing', 'goal-two-hand-voicing-master'),
  ('goal-lh_voicing_progression', 'goal-lh-voicing-progression-master'),
  ('goal-two_hand_voicing_progression', 'goal-two-hand-voicing-progression-master');

UPDATE public.user_training_goals AS utg SET
  goal_set_id = new_gs.id,
  updated_at = now()
FROM _old_goal_migration AS m
JOIN public.training_goal_sets AS old_gs ON old_gs.slug = m.old_slug
JOIN public.training_goal_sets AS new_gs ON new_gs.slug = m.new_slug
WHERE utg.goal_set_id = old_gs.id;

UPDATE public.lesson_songs AS ls SET
  training_goal_set_id = new_gs.id
FROM _old_goal_migration AS m
JOIN public.training_goal_sets AS old_gs ON old_gs.slug = m.old_slug
JOIN public.training_goal_sets AS new_gs ON new_gs.slug = m.new_slug
WHERE ls.training_goal_set_id = old_gs.id;

-- Developer test lesson: point to triad inversion beginner
UPDATE public.lesson_songs SET
  training_goal_set_id = uuid_generate_v5(
    'b0000000-0000-4000-8000-000000000001'::uuid,
    'training-goal-goal-triad-inversion-beginner'
  ),
  title = '3和音(転回形) ビギナー',
  title_en = 'Triad Inversions Beginner'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'developer-training-goal-set-lsong'
);

-- ---------------------------------------------------------------------------
-- 5) Remove legacy goal sets (items cascade)
-- ---------------------------------------------------------------------------
DELETE FROM public.training_goal_sets
WHERE slug IN (
  'goal-intro',
  'goal-interval',
  'goal-triad',
  'goal-triad_inversion',
  'goal-seventh',
  'goal-seventh_inversion',
  'goal-scale_basic',
  'goal-scale_intermediate',
  'goal-scale_advanced',
  'goal-tension_voicing',
  'goal-tension_voicing_ab',
  'goal-two_hand_voicing',
  'goal-lh_voicing_progression',
  'goal-two_hand_voicing_progression'
);

-- ---------------------------------------------------------------------------
-- 6) Update page info wording
-- ---------------------------------------------------------------------------
UPDATE public.training_ui_texts SET
  text_ja = replace(
    text_ja,
    'カテゴリごとに目標セットがあります。',
    '各カテゴリにビギナー・トレーナー・マスターの目標セットがあります。'
  ),
  text_en = replace(
    text_en,
    'Each category has a goal set.',
    'Each category has Beginner, Trainer, and Master goal sets.'
  ),
  updated_at = now()
WHERE key = 'page_info';

COMMIT;
